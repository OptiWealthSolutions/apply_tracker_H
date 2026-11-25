"""
Connectors & Batch Importers for Welcome to the Jungle (WTTJ) and JobTeaser EDHEC.
Normalizes incoming postings, validates finance/internship relevance, detects start dates
and Pure Quant/Eng flags, and prevents any expired postings from entering SQLite.
"""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from typing import Any, Dict, List

from sqlalchemy.orm import Session

from .ats_poller import is_pure_quant_or_eng
from .date_extractor import extract_internship_dates
from .deep_page_validator import detect_ats_platform, detect_hard_constraints, is_offer_text_expired
from .models import JobOffer, UserProfile
from .scraper import clean_job_title, clean_tracking_url, infer_desk_and_asset_class, is_finance_job


def normalize_external_offer(raw: Dict[str, Any], default_source: str = "WTTJ") -> Dict[str, Any] | None:
    title = clean_job_title(str(raw.get("title") or "").strip())
    company = str(raw.get("company") or "Institution Financière").strip()
    url = clean_tracking_url(str(raw.get("url") or "").strip())
    if not title or not url:
        return None

    desc = str(raw.get("description") or raw.get("summary") or "").strip()
    if is_offer_text_expired(title, desc):
        return None

    if not is_finance_job(title, company, desc[:600]):
        # Allow explicitly imported items if they have finance/strategy/intern terms
        if not re.search(r"\b(financ|trad|asset|portfolio|m&a|pe\b|vc\b|audit|risk|econ|strat|invest|bank|banque|fonds)\b", f"{title} {company} {desc}", re.I):
            return None

    location = str(raw.get("location") or "Paris").strip()
    desk, asset_class = infer_desk_and_asset_class(title, f"{company} {desc[:400]}")
    start_date, end_date, duration = extract_internship_dates(title, desc[:1500], "Stage 6 mois")

    src_lower = default_source.lower()
    if "jobteaser" in src_lower or "jobteaser" in url.lower():
        ats_plat = "jobteaser_edhec"
        source_label = "JobTeaser EDHEC"
    elif "wttj" in src_lower or "welcometothejungle" in url.lower():
        ats_plat = "wttj"
        source_label = "Welcome to the Jungle"
    else:
        ats_plat = detect_ats_platform(url)
        source_label = default_source

    hard_flags = detect_hard_constraints(title, desc[:1500], "")
    if is_pure_quant_or_eng(title, desc) and "Quant Pur / Ingé" not in hard_flags:
        hard_flags.append("Quant Pur / Ingé")

    loc_lower = location.lower()
    salary = 3800 if ("london" in loc_lower or "londres" in loc_lower) else (
        3400 if ("luxembourg" in loc_lower or "geneva" in loc_lower or "genève" in loc_lower or "zurich" in loc_lower) else 2200
    )

    date_posted = str(raw.get("date_posted") or "")[:10]
    if not re.match(r"^\d{4}-\d{2}-\d{2}$", date_posted):
        date_posted = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    return {
        "title": title,
        "company": company,
        "location": location,
        "desk": desk,
        "asset_class": asset_class,
        "contract_type": str(raw.get("contract_type") or "Stage 6 mois"),
        "description": desc[:1800] if desc else f"Offre {source_label} : {title} chez {company} ({location}).",
        "requirements": "EDHEC / Master Finance, analyse financière, marchés de capitaux.",
        "url": url,
        "url_status": 200,
        "is_verified": True,
        "last_verified_at": datetime.now(timezone.utc),
        "salary_monthly": salary,
        "source": source_label,
        "ats_platform": ats_plat,
        "hard_flags": json.dumps(hard_flags, ensure_ascii=False),
        "date_posted": date_posted,
        "start_date": start_date,
        "end_date": end_date,
        "duration_months": duration,
        "tags": f"{desk}, {asset_class}, {location}, {source_label}",
        "direct_apply_email": None,
    }


def parse_jobteaser_raw_text(raw_text: str) -> List[Dict[str, Any]]:
    """
    Parses pasted text or URLs copied from EDHEC JobTeaser / WTTJ into structured offer dicts.
    Supports:
      - JSON list paste
      - Tab/newline blocks containing URLs (`https://...`) with surrounding title/company lines
    """
    txt = (raw_text or "").strip()
    if not txt:
        return []

    if txt.startswith("["):
        try:
            arr = json.loads(txt)
            if isinstance(arr, list):
                return arr
        except Exception:
            pass

    lines = [l.strip() for l in txt.splitlines() if l.strip()]
    parsed: List[Dict[str, Any]] = []
    url_re = re.compile(r"(https?://[^\s\)\]>]+)")

    for idx, line in enumerate(lines):
        m = url_re.search(line)
        if not m:
            continue
        url = m.group(1)
        before_url = line[: m.start()].strip(" -–|:")
        title = before_url if len(before_url) > 6 else (lines[idx - 1] if idx > 0 else "Stage Finance")
        company = lines[idx - 2] if (idx >= 2 and not url_re.search(lines[idx - 2]) and len(before_url) <= 6) else "Entreprise Partenaire EDHEC"
        # Heuristic split if title has " - " or " chez "
        if " chez " in title.lower():
            parts = re.split(r"\s+chez\s+", title, maxsplit=1, flags=re.I)
            title, company = parts[0].strip(), parts[1].strip()
        elif " | " in title:
            parts = [p.strip() for p in title.split(" | ")]
            title = parts[0]
            if len(parts) > 1:
                company = parts[1]

        parsed.append({
            "title": title,
            "company": company,
            "location": "Paris",
            "url": url,
            "description": f"Offre importée depuis EDHEC JobTeaser / Portail : {title} ({company}).",
        })
    return parsed


def import_batch_to_db(items: List[Dict[str, Any]], source_name: str, db: Session) -> Dict[str, Any]:
    from .embedding_engine import qwen_ridge_engine

    added = 0
    imported_offers: List[JobOffer] = []
    for raw in items:
        norm = normalize_external_offer(raw, default_source=source_name)
        if not norm:
            continue
        existing = db.query(JobOffer).filter(JobOffer.url == norm["url"]).first()
        if existing:
            existing.is_verified = True
            existing.url_status = 200
            existing.last_verified_at = datetime.now(timezone.utc)
            imported_offers.append(existing)
        else:
            offer = JobOffer(**norm)
            db.add(offer)
            added += 1
            imported_offers.append(offer)

    db.commit()
    for o in imported_offers:
        db.refresh(o)

    profile = db.query(UserProfile).first()
    if imported_offers:
        qwen_ridge_engine.score_offers(imported_offers, profile, db, persist_scores=True)

    return {"added": added, "total_processed": len(imported_offers), "offers": imported_offers}
