"""
Smart Website & LinkedIn Contact Scraper for Suggested Boutiques:
- Crawls homepage + internal Contact / Team / Legal / Careers subpages
- Extracts and ranks real emails (recruitment/HR > personal > general), decoding mailto & [at]
- Extracts company LinkedIn pages + direct linkedin.com/in profiles
- Discovers key leaders / PMs / Recruiters via site team sections and targeted DuckDuckGo LinkedIn lookup
- Validates MX records on the target domain and builds labeled inferred email formats ONLY when a real name + domain match exist
"""

from __future__ import annotations

import asyncio
import html
import json
import re
import subprocess
import unicodedata
import urllib.parse
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from bs4 import BeautifulSoup
from curl_cffi.requests import AsyncSession
from sqlalchemy.orm import Session

from .local_llm import is_valid_person_candidate, rank_emails_with_qwen
from .models import BoutiqueContact
from .suggestions_directory import SUGGESTED_BOUTIQUES


RELEVANT_SUBPAGE_TOKENS = (
    "contact",
    "team",
    "equipe",
    "équipe",
    "about",
    "a-propos",
    "apropos",
    "mentions",
    "legal",
    "career",
    "carriere",
    "carrière",
    "recrut",
    "rejoindre",
    "join",
    "people",
    "leadership",
    "management",
    "who-we-are",
    "notre-equipe",
)

EMAIL_BLACKLIST_SUBSTRINGS = (
    "noreply",
    "no-reply",
    "donotreply",
    "do-not-reply",
    "exemple",
    "example.com",
    "sentry",
    "wixpress",
    "wordpress",
    "schema.org",
    "dpo@",
    "privacy@",
    "rgpd@",
    "gdpr@",
    "protectiondesdonnees",
    "dataprotection",
    "reclamation",
    "claims@",
    "john@doe",
    "jane@doe",
    "test@",
    "webfactisp",
    "dlazprd",
    "cookies@",
    "cookie@",
    "press@",
    "media@",
    "communication@",
    "newsletter@",
    "unsubscribe",
    "abuse@",
    "postmaster@",
    "webmaster@",
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
    ".svg",
    ".gif",
    ".css",
    ".js",
)

PRIORITY_HR_PREFIXES = (
    "jobs@",
    "career",
    "recrut",
    "talent",
    "rh@",
    "hr@",
    "stage",
    "intern",
    "graduate",
    "campus",
    "people@",
    "join@",
)

ROLE_KEYWORDS_RE = re.compile(
    r"\b(CEO|Chief Executive|Co-?Founder|Founder|Fondateur|Fondatrice|Managing Partner|Managing Director|"
    r"Gérant|Associé|Partner|President|Président|CIO|Chief Investment Officer|Head of Trading|"
    r"Head of Macro|Head of Research|Head of Portfolio|Portfolio Manager|Directeur des Investissements|"
    r"Human Resources|Head of HR|DRH|Talent Acquisition|Campus Recruiter|Recruiter|Recrutement)\b",
    re.I,
)

PERSON_NAME_RE = re.compile(
    r"\b([A-ZÀ-Ý][a-zà-ÿ'-]{1,20}\s+(?:(?:de|du|des|van|von|le|la)\s+)?[A-ZÀ-Ý][a-zà-ÿ'-]{1,24})\b"
)

STOP_NAME_WORDS = {
    "asset management",
    "wealth management",
    "private banking",
    "private wealth",
    "capital management",
    "investment management",
    "global macro",
    "fixed income",
    "equity research",
    "portfolio management",
    "human resources",
    "legal notice",
    "mentions legales",
    "privacy policy",
    "cookie policy",
    "learn more",
    "read more",
    "join us",
    "contact us",
    "find out",
    "our team",
    "notre equipe",
    "edmond rothschild",
    "lombard odier",
    "julius baer",
    "marshall wace",
    "brevan howard",
    "man group",
    "flow traders",
    "xtx markets",
    "monterra wealth",
}

STOP_PERSON_TOKENS = {
    "market",
    "views",
    "directeur",
    "general",
    "général",
    "transitions",
    "megatrends",
    "including",
    "director",
    "managing",
    "partner",
    "officer",
    "president",
    "président",
    "head",
    "chief",
    "founder",
    "fondateur",
    "portfolio",
    "research",
    "strategy",
    "stratégie",
    "solutions",
    "services",
    "equities",
    "trading",
    "insights",
    "global",
    "career",
    "careers",
    "team",
    "equipe",
    "contact",
    "group",
    "groupe",
    "bank",
    "banque",
    "wealth",
    "asset",
    "capital",
    "finance",
    "management",
    "gestion",
    "monaco",
    "paris",
    "notre",
    "politique",
    "egalite",
    "femmes",
    "alpha",
    "select",
    "talent",
    "acquisition",
}


def _strip_accents(val: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFKD", val or "") if not unicodedata.combining(c)
    )


def _extract_domain(url: str) -> str:
    if not url:
        return ""
    netloc = urllib.parse.urlparse(url).netloc.lower()
    return netloc[4:] if netloc.startswith("www.") else netloc


def _check_mx_domain(domain: str) -> bool:
    if not domain or "." not in domain:
        return False
    try:
        out = subprocess.run(
            ["host", "-t", "mx", domain],
            capture_output=True,
            text=True,
            timeout=3,
        )
        return "mail is handled by" in (out.stdout or "").lower()
    except Exception:
        return False


def _score_email(email: str, target_domain: str) -> Tuple[int, str]:
    low = email.lower()
    if any(low.startswith(p) or p in low.split("@")[0] for p in PRIORITY_HR_PREFIXES):
        return (100, "recruitment")
    local_part = low.split("@")[0]
    email_dom = low.split("@")[1] if "@" in low else ""
    bonus = 20 if (target_domain and target_domain in email_dom) else 0
    if re.match(r"^[a-z]{2,}\.[a-z]{2,}$", local_part) or re.match(r"^[a-z]\.?[a-z]{3,}$", local_part):
        return (80 + bonus, "personal")
    if any(local_part.startswith(g) for g in ("info", "contact", "office", "bonjour", "monaco", "paris")):
        return (55 + bonus, "general")
    return (40 + bonus, "other")


def _extract_emails_from_html(raw_html: str) -> List[str]:
    if not raw_html:
        return []
    decoded = html.unescape(raw_html)
    # Normalize common [at] / (at) obfuscation
    normalized = re.sub(r"\s*(?:\[at\]|\(at\)|\{at\})\s*", "@", decoded, flags=re.I)
    normalized = re.sub(r"\s*(?:\[dot\]|\(dot\))\s*", ".", normalized, flags=re.I)

    candidates = set()
    for m in re.findall(r"mailto:([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})", normalized, re.I):
        candidates.add(m.strip().lower())
    for m in re.findall(r"\b([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})\b", normalized):
        candidates.add(m.strip().lower())

    clean: List[str] = []
    for e in candidates:
        if any(b in e for b in EMAIL_BLACKLIST_SUBSTRINGS):
            continue
        if len(e) > 80:
            continue
        clean.append(e)
    return sorted(set(clean))


def _infer_email_pattern(emails: List[str], target_domain: str) -> str:
    """Detects whether existing domain emails use first.last, flast, or f.last."""
    for e in emails:
        if "@" not in e:
            continue
        local, dom = e.lower().split("@", 1)
        if target_domain and target_domain not in dom:
            continue
        if re.match(r"^[a-z]{2,}\.[a-z]{2,}$", local):
            return "first.last"
        if re.match(r"^[a-z]\.[a-z]{2,}$", local):
            return "f.last"
        if re.match(r"^[a-z][a-z]{3,}$", local) and not any(local.startswith(x) for x in ("info", "jobs", "mail", "team")):
            return "flast"
    return "first.last"


def _build_email_guess(name: str, domain: str, pattern: str) -> Optional[str]:
    if not name or not domain or "." not in domain:
        return None
    parts = [re.sub(r"[^a-z]", "", _strip_accents(p).lower()) for p in name.split() if len(p) > 1]
    if len(parts) < 2:
        return None
    first, last = parts[0], parts[-1]
    if not first or not last:
        return None
    if pattern == "f.last":
        return f"{first[0]}.{last}@{domain}"
    if pattern == "flast":
        return f"{first[0]}{last}@{domain}"
    return f"{first}.{last}@{domain}"


def _extract_people_and_linkedin(
    soup: BeautifulSoup,
    source_url: str,
    company_name: str = "",
) -> Tuple[Optional[str], List[Dict[str, Any]]]:
    company_li: Optional[str] = None
    people: List[Dict[str, Any]] = []
    seen_names: set[str] = set()

    for a in soup.find_all("a", href=True):
        href = (a.get("href") or "").strip()
        low_h = href.lower()
        if "linkedin.com/company/" in low_h and not company_li:
            company_li = href.split("?")[0]
        elif "linkedin.com/in/" in low_h:
            li_url = href.split("?")[0]
            ctx = a.get_text(" ", strip=True) or (a.parent.get_text(" ", strip=True) if a.parent else "")
            m = PERSON_NAME_RE.search(ctx)
            name = m.group(1).strip() if m else ""
            role_m = ROLE_KEYWORDS_RE.search(ctx)
            role = role_m.group(0) if role_m else "Dirigeant / Équipe"
            if name and name.lower() not in seen_names and is_valid_person_candidate(name, role, company_name):
                seen_names.add(name.lower())
                people.append({
                    "name": name,
                    "role": role,
                    "linkedin_url": li_url,
                    "source_url": source_url,
                })

    # Inspect headings / team cards near executive/HR role keywords
    for elem in soup.find_all(["h2", "h3", "h4", "p", "div", "li"]):
        txt = re.sub(r"\s+", " ", elem.get_text(" ", strip=True)).strip()
        if not txt or len(txt) > 140:
            continue
        role_m = ROLE_KEYWORDS_RE.search(txt)
        if not role_m:
            continue
        name_m = PERSON_NAME_RE.search(txt)
        if not name_m:
            continue
        cand_name = name_m.group(1).strip()
        role_val = role_m.group(0)
        if cand_name.lower() in seen_names or not is_valid_person_candidate(cand_name, role_val, company_name):
            continue
        seen_names.add(cand_name.lower())
        people.append({
            "name": cand_name,
            "role": role_val,
            "linkedin_url": None,
            "source_url": source_url,
        })
        if len(people) >= 5:
            break

    return company_li, people


async def _search_duckduckgo_linkedin(
    session: AsyncSession,
    company_name: str,
) -> List[Dict[str, Any]]:
    """Best-effort DuckDuckGo HTML lookup for CEO/CIO/HR LinkedIn profiles of the firm."""
    short_co = company_name.split("(")[0].strip()
    query = f'site:linkedin.com/in "{short_co}" (CEO OR Founder OR CIO OR "Portfolio Manager" OR "Human Resources" OR "Talent" OR "Recruiter")'
    ddg_url = f"https://html.duckduckgo.com/html/?q={urllib.parse.quote(query)}"
    found: List[Dict[str, Any]] = []
    try:
        resp = await session.get(ddg_url, timeout=8.0)
        if resp.status_code != 200:
            return []
        soup = BeautifulSoup(resp.text, "html.parser")
        for a in soup.select("a.result__a")[:6]:
            raw_href = a.get("href") or ""
            title = a.get_text(" ", strip=True)
            if "uddg=" in raw_href:
                qs = urllib.parse.parse_qs(urllib.parse.urlparse(raw_href).query)
                raw_href = (qs.get("uddg") or [raw_href])[0]
            if "linkedin.com/in/" not in raw_href.lower():
                continue
            li_url = raw_href.split("?")[0]
            # Parse LinkedIn result title: "First Last - Role - Company | LinkedIn"
            clean_title = re.sub(r"\s*\|\s*LinkedIn.*$", "", title).strip()
            parts = [p.strip() for p in clean_title.split(" - ") if p.strip()]
            name = parts[0] if parts else ""
            role = parts[1] if len(parts) > 1 else "Décideur / RH"
            if not name or len(name.split()) > 4 or not is_valid_person_candidate(name, role, company_name):
                continue
            found.append({
                "name": name,
                "role": role[:70],
                "linkedin_url": li_url,
                "source_url": "DuckDuckGo / LinkedIn",
            })
    except Exception:
        pass
    return found


async def enrich_single_boutique(
    boutique: Dict[str, Any],
    sem: asyncio.Semaphore,
    ddg_sem: asyncio.Semaphore,
) -> Dict[str, Any]:
    """Crawls a single boutique's website + subpages and builds structured contact intelligence."""
    base_url = boutique["website_url"]
    careers_url = boutique.get("careers_url") or base_url
    target_domain = _extract_domain(base_url)

    # Known ATS domains shouldn't serve as email domain when guessing personal corporate emails
    if any(ats in target_domain for ats in ("greenhouse.io", "smartrecruiters.com", "teamtailor.com", "werecruit.io", "altays-progiciels.com")):
        target_domain = _extract_domain(boutique["website_url"])

    discovered_emails: Dict[str, Tuple[str, str]] = {}
    if boutique.get("spontaneous_email"):
        discovered_emails[boutique["spontaneous_email"].strip()] = ("directory", "Official directory recruitment email")

    company_li: Optional[str] = None
    people: List[Dict[str, Any]] = []
    text_chunks: List[str] = []
    visited: set[str] = set()
    to_visit: List[str] = [base_url]
    if careers_url and careers_url != base_url and _extract_domain(careers_url) == target_domain:
        to_visit.append(careers_url)

    async with sem:
        async with AsyncSession(impersonate="chrome124", timeout=6) as session:
            # Step 1: fetch root & discover high-signal internal subpages
            pages_checked = 0
            idx = 0
            while idx < len(to_visit) and pages_checked < 6:
                u = to_visit[idx]
                idx += 1
                if u in visited:
                    continue
                visited.add(u)
                try:
                    resp = await session.get(u, allow_redirects=True)
                    if resp.status_code != 200 or "text/html" not in (resp.headers.get("content-type") or "text/html").lower():
                        continue
                    pages_checked += 1
                    raw_html = resp.text
                    soup = BeautifulSoup(raw_html, "html.parser")
                    visible_txt = re.sub(r"\s+", " ", soup.get_text(" ", strip=True)).strip()

                    for em in _extract_emails_from_html(raw_html):
                        if em not in discovered_emails:
                            pos = visible_txt.lower().find(em.lower())
                            ctx = visible_txt[max(0, pos - 90):pos + 130] if pos != -1 else visible_txt[:180]
                            discovered_emails[em] = (u, ctx)

                    cli, pg_people = _extract_people_and_linkedin(soup, u, boutique["name"])
                    if cli and not company_li:
                        company_li = cli
                    for p in pg_people:
                        if not any(ep["name"].lower() == p["name"].lower() for ep in people):
                            people.append(p)

                    # Discover internal Contact / Team / Legal / Careers links from homepage
                    if pages_checked == 1:
                        for a in soup.find_all("a", href=True):
                            href = (a.get("href") or "").strip()
                            if not href or href.startswith("#") or href.startswith("mailto:"):
                                continue
                            abs_u = urllib.parse.urljoin(str(resp.url), href).split("#")[0]
                            if _extract_domain(abs_u) != target_domain:
                                continue
                            low_link = f"{abs_u} {a.get_text(' ', strip=True)}".lower()
                            if any(tok in low_link for tok in RELEVANT_SUBPAGE_TOKENS) and abs_u not in to_visit:
                                to_visit.append(abs_u)
                                if len(to_visit) >= 7:
                                    break
                except Exception:
                    continue

            # Step 2: Best-effort DDG lookup for LinkedIn decision-makers only when none discovered on-site
            if not people:
                async with ddg_sem:
                    ddg_people = await _search_duckduckgo_linkedin(session, boutique["name"])
                    for dp in ddg_people:
                        if not any(ep["name"].lower() == dp["name"].lower() for ep in people):
                            people.append(dp)
                    await asyncio.sleep(0.15)

    mx_valid = await asyncio.to_thread(_check_mx_domain, target_domain)

    # Step 3: Semantic scoring via `qwen3-embedding:0.6b` (lightweight, zero chat-LLM overhead)
    ranked_emails: List[Dict[str, Any]] = []
    for em, (src, ctx) in discovered_emails.items():
        prio, kind = _score_email(em, target_domain)
        ranked_emails.append({"email": em, "source": src, "context": ctx, "kind": kind, "priority": prio})

    ranked_emails = await rank_emails_with_qwen(ranked_emails)
    for r in ranked_emails:
        r.pop("context", None)

    # Build inferred email guesses ONLY for real discovered leaders on MX-valid domains
    pattern = _infer_email_pattern([e["email"] for e in ranked_emails], target_domain)
    for p in people:
        p["email_guess"] = _build_email_guess(p["name"], target_domain, pattern) if mx_valid else None

    best_email = ranked_emails[0]["email"] if ranked_emails else None
    confidence = "verified_site" if best_email else "none"
    if not best_email and mx_valid:
        first_guess = next((p.get("email_guess") for p in people if p.get("email_guess")), None)
        if first_guess:
            best_email = first_guess
            confidence = "pattern_inferred"

    short_co = boutique["name"].split("(")[0].strip()
    li_search_q = f'"{short_co}" (CEO OR CIO OR "Portfolio Manager" OR "Talent" OR "HR" OR "Recruiter")'
    linkedin_search_url = f"https://www.linkedin.com/search/results/people/?keywords={urllib.parse.quote(li_search_q)}"

    return {
        "boutique_id": boutique["id"],
        "company_name": boutique["name"],
        "domain": target_domain,
        "best_email": best_email,
        "email_confidence": confidence,
        "emails": ranked_emails[:6],
        "key_people": people[:5],
        "company_linkedin_url": company_li,
        "linkedin_search_url": linkedin_search_url,
        "mx_valid": mx_valid,
        "scraped_pages_count": pages_checked,
    }


async def enrich_all_boutiques(db: Session) -> Dict[str, Any]:
    """Runs smart multi-page contact & LinkedIn enrichment across all 39 boutiques and persists to SQLite."""
    sem = asyncio.Semaphore(14)
    ddg_sem = asyncio.Semaphore(4)
    results = await asyncio.gather(
        *(enrich_single_boutique(b, sem, ddg_sem) for b in SUGGESTED_BOUTIQUES),
        return_exceptions=True,
    )

    updated = 0
    verified_emails = 0
    inferred_emails = 0
    with_people = 0

    for res in results:
        if not isinstance(res, dict):
            continue
        bid = res["boutique_id"]
        row = db.query(BoutiqueContact).filter(BoutiqueContact.boutique_id == bid).first()
        if not row:
            row = BoutiqueContact(boutique_id=bid, company_name=res["company_name"])
            db.add(row)
        row.company_name = res["company_name"]
        row.domain = res["domain"]
        # Preserve already-verified site emails / contacts if a transient crawl missed a subpage
        if res["email_confidence"] == "verified_site" or row.email_confidence != "verified_site" or not row.best_email:
            row.best_email = res["best_email"]
            row.email_confidence = res["email_confidence"]
            if res["emails"]:
                row.emails_json = json.dumps(res["emails"], ensure_ascii=False)
        existing_people = []
        try:
            existing_people = [
                p for p in json.loads(row.key_people_json or "[]")
                if isinstance(p, dict) and is_valid_person_candidate(p.get("name", ""), p.get("role", ""), res["company_name"])
            ]
        except Exception:
            existing_people = []
        merged_people = list(res["key_people"])
        for ep in existing_people:
            if not any(mp["name"].lower() == ep["name"].lower() for mp in merged_people):
                merged_people.append(ep)
        row.key_people_json = json.dumps(merged_people[:5], ensure_ascii=False)
        row.company_linkedin_url = res["company_linkedin_url"] or row.company_linkedin_url
        row.linkedin_search_url = res["linkedin_search_url"]
        row.mx_valid = res["mx_valid"]
        row.scraped_pages_count = max(res["scraped_pages_count"], row.scraped_pages_count or 0)
        row.last_scraped_at = datetime.utcnow()
        updated += 1
        if row.email_confidence == "verified_site":
            verified_emails += 1
        elif row.email_confidence == "pattern_inferred":
            inferred_emails += 1
        if res["key_people"]:
            with_people += 1

    db.commit()
    return {
        "status": "success",
        "total_boutiques": updated,
        "verified_emails_count": verified_emails,
        "inferred_emails_count": inferred_emails,
        "with_key_people_count": with_people,
    }
