"""
Direct ATS Polling Engine (reverse-engineered from zshah101/Automated-List & speedyapply/JobSpy).
Polls live public JSON APIs for Greenhouse and Ashby across Finance, Trading, Asset Management,
Hedge Funds, Market Making, and FinTech employers with circuit-breaker health tracking.
Filters out non-finance software/HR internships while keeping Capital Markets, Trading,
Structuring, AM, Risk, Finance Strategy, and flagging Pure Quant/Engineering roles.
"""

from __future__ import annotations

import asyncio
import html
import re
from datetime import datetime, timezone
from typing import Any, Dict, List
import httpx
from bs4 import BeautifulSoup
from curl_cffi.requests import AsyncSession

from .deep_page_validator import clean_tracking_url, detect_hard_constraints, is_offer_text_expired
from .date_extractor import extract_internship_dates


GREENHOUSE_BOARDS: List[Dict[str, str]] = [
    {"slug": "flowtraders", "company": "Flow Traders", "category": "Market Making"},
    {"slug": "point72", "company": "Point72", "category": "Hedge Fund"},
    {"slug": "imc", "company": "IMC Trading", "category": "Market Making"},
    {"slug": "drweng", "company": "DRW", "category": "Prop Trading"},
    {"slug": "jumptrading", "company": "Jump Trading", "category": "Prop Trading"},
    {"slug": "janestreet", "company": "Jane Street", "category": "Prop Trading"},
    {"slug": "winton", "company": "Winton", "category": "Quant Asset Management"},
    {"slug": "mangroup", "company": "Man Group", "category": "Quantitative Hedge Fund"},
    {"slug": "xtxmarketstechnologies", "company": "XTX Markets", "category": "Algorithmic Market Making"},
    {"slug": "quadraturecapital", "company": "Quadrature Capital", "category": "Quantitative Hedge Fund"},
    {"slug": "hrttalentcommunity", "company": "Hudson River Trading", "category": "Prop Trading"},
    {"slug": "coinbase", "company": "Coinbase", "category": "Digital Assets / FinTech"},
    {"slug": "stripe", "company": "Stripe", "category": "FinTech"},
    {"slug": "adyen", "company": "Adyen", "category": "FinTech"},
    {"slug": "robinhood", "company": "Robinhood", "category": "Brokerage / FinTech"},
    {"slug": "carta", "company": "Carta", "category": "Private Markets / FinTech"},
    {"slug": "affirm", "company": "Affirm", "category": "FinTech"},
    {"slug": "bitpanda", "company": "Bitpanda", "category": "Digital Assets / FinTech"},
    {"slug": "gemini", "company": "Gemini", "category": "Digital Assets / Markets"},
    {"slug": "gocardless", "company": "GoCardless", "category": "FinTech"},
    {"slug": "n26", "company": "N26", "category": "FinTech"},
]

SMARTRECRUITERS_BOARDS: List[Dict[str, str]] = [
    {"slug": "SycomoreAssetManagement", "company": "Sycomore Asset Management", "category": "Asset Management Boutique"},
]

ASHBY_BOARDS: List[Dict[str, str]] = [
    {"slug": "qonto", "company": "Qonto", "category": "FinTech Paris"},
    {"slug": "pennylane", "company": "Pennylane", "category": "FinTech Paris"},
    {"slug": "alan", "company": "Alan", "category": "InsurTech Paris"},
    {"slug": "ledger", "company": "Ledger", "category": "Digital Assets Paris"},
    {"slug": "alma", "company": "Alma", "category": "FinTech Paris"},
    {"slug": "wintermute", "company": "Wintermute", "category": "Digital Assets MM"},
    {"slug": "ramp", "company": "Ramp", "category": "FinTech"},
    {"slug": "kalshi", "company": "Kalshi", "category": "Prediction Markets"},
    {"slug": "polymarket", "company": "Polymarket", "category": "Prediction Markets"},
]

LEVER_BOARDS: List[Dict[str, str]] = [
    {"slug": "qube-rt", "company": "Qube Research & Technologies", "category": "Quant Hedge Fund"},
    {"slug": "squarepoint", "company": "Squarepoint Capital", "category": "Quant Hedge Fund"},
    {"slug": "maven", "company": "Maven Securities", "category": "Market Making"},
]

TEAMTAILOR_FEEDS: List[Dict[str, str]] = [
    {"slug": "keplercheuvreux", "company": "Kepler Cheuvreux", "category": "Brokerage & Structuring", "rss_url": "https://keplercheuvreux.teamtailor.com/jobs.rss"},
]

TALENTSOFT_FEEDS: List[Dict[str, str]] = [
    {"id": "credit_agricole_cib", "company": "Crédit Agricole CIB", "category": "CIB / Capital Markets", "base_url": "https://jobs.ca-cib.com"},
    {"id": "amundi", "company": "Amundi Asset Management", "category": "Asset Management", "base_url": "https://jobs.amundi.com"},
    {"id": "cfm_indosuez", "company": "CFM Indosuez Wealth Management", "category": "Wealth Management Monaco", "base_url": "https://jobs.ca-indosuez.com"},
]

_CIRCUIT_BREAKER: Dict[str, Dict[str, Any]] = {}

INTERN_TITLE_PATTERN = re.compile(
    r"\b(intern|internship|stage|stagiaire|off-?cycle|summer\s+analyst|campus|co-?op|apprentice|graduate)\b",
    re.IGNORECASE,
)

EXCLUDED_NON_FINANCE_INTERN = re.compile(
    r"\b(recruiter|hr\b|human\s+resources|facilities|receptionist|chef|culinary|graphic\s+design|marketing\s+events|frontend|backend|full[\s-]?stack|ios|android|mobile|devops|sre|hardware|asic|fpga|ui/ux|product\s+design|copywriter)\b",
    re.IGNORECASE,
)

FINANCE_OR_BUSINESS_SIGNAL = re.compile(
    r"\b(trad|quant|structur|market|financ|econ|macro|asset|portfolio|risk|credit|rates|fx|sales|invest|m&a|capital|treasury|valuation|pricing|analyst|strategy|ops|operations|corporate|fund|equit|deriv|commodit|crypto|broker|audit|consolidation|ceo|founder\s+associate)\b",
    re.IGNORECASE,
)

PURE_QUANT_INGE_PATTERN = re.compile(
    r"\b(quantitative\s+(developer|researcher|engineer)|quant\s+(dev|researcher)|software\s+engineer|systems\s+engineer|c\+\+|rust|fpga|deep\s+learning|machine\s+learning\s+researcher|applied\s+scientist|phd)\b",
    re.IGNORECASE,
)


def is_pure_quant_or_eng(title: str, description: str = "") -> bool:
    t = (title or "").lower()
    if PURE_QUANT_INGE_PATTERN.search(t):
        return True
    d = (description or "")[:900].lower()
    if re.search(r"\b(c\+\+\s*(17|20|low[- ]latency)|fpga|verilog|phd\s+(required|preferred|in\s+computer|in\s+math))\b", d):
        return True
    return False


def _strip_html(raw_html: str) -> str:
    if not raw_html:
        return ""
    unescaped = html.unescape(raw_html)
    text = re.sub(r"<[^>]+>", " ", unescaped)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _infer_desk(title: str, category: str) -> tuple[str, str]:
    t = title.lower()
    if any(k in t for k in ["sales", "client", "ficc"]):
        return "Sales FICC / Institutional", "Cross-Asset"
    if any(k in t for k in ["structur", "derivatives"]):
        return "Structuring Produits Structurés", "Equity Derivatives"
    if any(k in t for k in ["trading", "trader", "market making", "execution"]):
        return "Trading Assistant / Market Making", "Equity Derivatives & Convexity"
    if any(k in t for k in ["asset", "portfolio", "fund", "invest"]):
        return "Quantitative Asset Management", "Cross-Asset"
    if any(k in t for k in ["risk", "compliance", "cdd", "audit", "consolidation"]):
        return "Risk Management de Marché", "Rates & Fixed Income"
    if any(k in t for k in ["corporate finance", "m&a", "strategy", "founder", "treasury", "business"]):
        return "Corporate Finance & Stratégie", "Cross-Asset"
    if any(k in t for k in ["economist", "macro", "research"]):
        return "Macro Trading & Research", "Rates & Fixed Income"
    if any(k in t for k in ["quant", "engineer", "scientist", "developer"]):
        return "Quantitative Research / Trading", "Cross-Asset"
    return "Analyse Financière & Marchés", "Cross-Asset"


def _estimate_salary(location: str) -> int:
    loc = (location or "").lower()
    if any(k in loc for k in ["new york", "chicago", "boston", "san francisco", "usa", "us"]):
        return 6800
    if any(k in loc for k in ["london", "uk", "londres"]):
        return 4800
    if any(k in loc for k in ["zurich", "geneva", "genève", "zug", "switzerland"]):
        return 5200
    if any(k in loc for k in ["amsterdam", "paris", "luxembourg", "frankfurt", "dublin"]):
        return 3000
    return 2600


def _is_circuit_open(key: str) -> bool:
    state = _CIRCUIT_BREAKER.get(key)
    if not state:
        return False
    if state.get("failures", 0) >= 2:
        elapsed = (datetime.now(timezone.utc) - state["last_fail"]).total_seconds()
        if elapsed < 900:
            return True
        _CIRCUIT_BREAKER[key] = {"failures": 0, "last_fail": None}
    return False


def _record_failure(key: str):
    prev = _CIRCUIT_BREAKER.get(key, {"failures": 0})
    _CIRCUIT_BREAKER[key] = {
        "failures": prev.get("failures", 0) + 1,
        "last_fail": datetime.now(timezone.utc),
    }


def _record_success(key: str):
    _CIRCUIT_BREAKER[key] = {"failures": 0, "last_fail": None}


def _build_flags(title: str, desc: str) -> List[str]:
    flags = detect_hard_constraints(title, desc[:2000], "")
    if is_pure_quant_or_eng(title, desc) and "Quant Pur / Ingé" not in flags:
        flags.append("Quant Pur / Ingé")
    return flags


async def _poll_greenhouse(client: httpx.AsyncClient, board: Dict[str, str]) -> List[Dict[str, Any]]:
    slug = board["slug"]
    key = f"gh:{slug}"
    if _is_circuit_open(key):
        return []
    url = f"https://boards-api.greenhouse.io/v1/boards/{slug}/jobs?content=true"
    try:
        resp = await client.get(url, timeout=6.0)
        if resp.status_code != 200:
            _record_failure(key)
            return []
        _record_success(key)
        jobs = resp.json().get("jobs", [])
        results: List[Dict[str, Any]] = []
        for j in jobs:
            title = (j.get("title") or "").strip()
            if (
                not title
                or not INTERN_TITLE_PATTERN.search(title)
                or EXCLUDED_NON_FINANCE_INTERN.search(title)
                or not FINANCE_OR_BUSINESS_SIGNAL.search(title)
            ):
                continue
            loc = (j.get("location") or {}).get("name") or "Global"
            abs_url = clean_tracking_url(j.get("absolute_url") or "")
            if not abs_url:
                continue
            desc = _strip_html(j.get("content") or "")
            if is_offer_text_expired(title, desc):
                continue
            updated_at = (j.get("updated_at") or "")[:10] or datetime.now(timezone.utc).strftime("%Y-%m-%d")
            desk, asset_class = _infer_desk(title, board["category"])
            start_date, end_date, duration = extract_internship_dates(title, desc[:1500], "Stage / Intern")
            flags = _build_flags(title, desc)
            results.append({
                "title": title,
                "company": board["company"],
                "location": loc,
                "desk": desk,
                "asset_class": asset_class,
                "contract_type": "Summer / Off-Cycle Intern",
                "description": desc[:1800] if desc else f"Offre directe {board['company']} ({board['category']}) via Greenhouse ATS.",
                "requirements": "EDHEC / Master Finance de Marché, analyse financière, Python / Excel.",
                "url": abs_url,
                "url_status": 200,
                "is_verified": True,
                "last_verified_at": datetime.now(timezone.utc),
                "salary_monthly": _estimate_salary(loc),
                "source": f"ATS Direct · {board['company']}",
                "ats_platform": "greenhouse",
                "date_posted": updated_at,
                "start_date": start_date,
                "end_date": end_date,
                "duration_months": duration,
                "hard_flags": flags,
                "tags": f"{desk}, {board['category']}, Greenhouse, Live ATS",
                "direct_apply_email": None,
            })
        return results
    except Exception:
        _record_failure(key)
        return []


async def _poll_ashby(client: httpx.AsyncClient, board: Dict[str, str]) -> List[Dict[str, Any]]:
    slug = board["slug"]
    key = f"ashby:{slug}"
    if _is_circuit_open(key):
        return []
    url = f"https://api.ashbyhq.com/posting-api/job-board/{slug}"
    try:
        resp = await client.get(url, timeout=6.0)
        if resp.status_code != 200:
            _record_failure(key)
            return []
        _record_success(key)
        jobs = resp.json().get("jobs", [])
        results: List[Dict[str, Any]] = []
        for j in jobs:
            if j.get("isListed") is False:
                continue
            title = (j.get("title") or "").strip()
            if (
                not title
                or not INTERN_TITLE_PATTERN.search(title)
                or EXCLUDED_NON_FINANCE_INTERN.search(title)
                or not FINANCE_OR_BUSINESS_SIGNAL.search(title)
            ):
                continue
            loc = j.get("location") or "Global"
            abs_url = j.get("jobUrl") or j.get("applyUrl") or ""
            if not abs_url:
                continue
            desc = _strip_html(j.get("descriptionPlain") or j.get("descriptionHtml") or "")
            if is_offer_text_expired(title, desc):
                continue
            published = (j.get("publishedAt") or "")[:10] or datetime.now(timezone.utc).strftime("%Y-%m-%d")
            desk, asset_class = _infer_desk(title, board["category"])
            start_date, end_date, duration = extract_internship_dates(title, desc[:1500], "Stage / Intern")
            flags = _build_flags(title, desc)
            results.append({
                "title": title,
                "company": board["company"],
                "location": loc,
                "desk": desk,
                "asset_class": asset_class,
                "contract_type": "Internship / Off-Cycle",
                "description": desc[:1800] if desc else f"Offre directe {board['company']} via Ashby ATS.",
                "requirements": "Master Finance / Business School / Analyse & Marchés.",
                "url": abs_url,
                "url_status": 200,
                "is_verified": True,
                "last_verified_at": datetime.now(timezone.utc),
                "salary_monthly": _estimate_salary(loc),
                "source": f"ATS Direct · {board['company']}",
                "ats_platform": "ashby",
                "date_posted": published,
                "start_date": start_date,
                "end_date": end_date,
                "duration_months": duration,
                "hard_flags": flags,
                "tags": f"{desk}, {board['category']}, Ashby, Live ATS",
                "direct_apply_email": None,
            })
        return results
    except Exception:
        _record_failure(key)
        return []


async def _poll_lever(client: httpx.AsyncClient, board: Dict[str, str]) -> List[Dict[str, Any]]:
    slug = board["slug"]
    key = f"lever:{slug}"
    if _is_circuit_open(key):
        return []
    url = f"https://api.lever.co/v0/postings/{slug}?mode=json"
    try:
        resp = await client.get(url, timeout=6.0)
        if resp.status_code != 200:
            _record_failure(key)
            return []
        _record_success(key)
        jobs = resp.json()
        if not isinstance(jobs, list):
            return []
        results: List[Dict[str, Any]] = []
        for j in jobs:
            title = (j.get("text") or "").strip()
            if (
                not title
                or not INTERN_TITLE_PATTERN.search(title)
                or EXCLUDED_NON_FINANCE_INTERN.search(title)
                or not FINANCE_OR_BUSINESS_SIGNAL.search(title)
            ):
                continue
            loc = (j.get("categories") or {}).get("location") or "Global"
            abs_url = j.get("hostedUrl") or j.get("applyUrl") or ""
            if not abs_url:
                continue
            desc = _strip_html(j.get("descriptionPlain") or j.get("description") or "")
            if is_offer_text_expired(title, desc):
                continue
            created_ms = j.get("createdAt")
            posted = (
                datetime.fromtimestamp(created_ms / 1000.0, tz=timezone.utc).strftime("%Y-%m-%d")
                if created_ms
                else datetime.now(timezone.utc).strftime("%Y-%m-%d")
            )
            desk, asset_class = _infer_desk(title, board["category"])
            start_date, end_date, duration = extract_internship_dates(title, desc[:1500], "Stage / Intern")
            flags = _build_flags(title, desc)
            results.append({
                "title": title,
                "company": board["company"],
                "location": loc,
                "desk": desk,
                "asset_class": asset_class,
                "contract_type": "Internship / Off-Cycle",
                "description": desc[:1800] if desc else f"Offre directe {board['company']} via Lever ATS.",
                "requirements": "Master Finance de Marché / Analyse.",
                "url": abs_url,
                "url_status": 200,
                "is_verified": True,
                "last_verified_at": datetime.now(timezone.utc),
                "salary_monthly": _estimate_salary(loc),
                "source": f"ATS Direct · {board['company']}",
                "ats_platform": "lever",
                "date_posted": posted,
                "start_date": start_date,
                "end_date": end_date,
                "duration_months": duration,
                "hard_flags": flags,
                "tags": f"{desk}, {board['category']}, Lever, Live ATS",
                "direct_apply_email": None,
            })
        return results
    except Exception:
        _record_failure(key)
        return []


async def _poll_teamtailor_rss(client: httpx.AsyncClient, feed: Dict[str, str]) -> List[Dict[str, Any]]:
    """Polls native Teamtailor RSS XML feed (zero-login direct ATS)."""
    key = f"teamtailor:{feed['slug']}"
    if _is_circuit_open(key):
        return []
    try:
        resp = await client.get(feed["rss_url"], timeout=8.0)
        if resp.status_code != 200:
            _record_failure(key)
            return []
        _record_success(key)
        results: List[Dict[str, Any]] = []
        for item_xml in re.findall(r"<item>(.*?)</item>", resp.text, re.S):
            t_match = re.search(r"<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?</title>", item_xml, re.S)
            l_match = re.search(r"<link>(.*?)</link>", item_xml, re.S)
            d_match = re.search(r"<description>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?</description>", item_xml, re.S)
            if not t_match or not l_match:
                continue
            title = html.unescape(t_match.group(1)).strip()
            abs_url = l_match.group(1).strip()
            desc = _strip_html(d_match.group(1) if d_match else "")
            if (
                not title
                or not INTERN_TITLE_PATTERN.search(title)
                or EXCLUDED_NON_FINANCE_INTERN.search(title)
                or not FINANCE_OR_BUSINESS_SIGNAL.search(f"{title} {desc[:250]}")
                or is_offer_text_expired(title, desc)
            ):
                continue
            desk, asset_class = _infer_desk(title, feed["category"])
            start_date, end_date, duration = extract_internship_dates(title, desc[:1500], "Stage 6 mois")
            loc_match = re.search(r"-\s*([A-Za-zÀ-ÿ\s]+)$", title)
            loc = loc_match.group(1).strip() if loc_match else "Paris / Europe"
            results.append({
                "title": title,
                "company": feed["company"],
                "location": loc,
                "desk": desk,
                "asset_class": asset_class,
                "contract_type": "Stage / Off-Cycle",
                "description": desc[:1800] if desc else f"Offre directe sans login chez {feed['company']}.",
                "requirements": "Master 1/2 Finance, Marchés Financiers, Python / Excel.",
                "url": abs_url,
                "url_status": 200,
                "is_verified": True,
                "last_verified_at": datetime.now(timezone.utc),
                "salary_monthly": _estimate_salary(loc),
                "source": f"ATS Direct · {feed['company']}",
                "ats_platform": "teamtailor",
                "date_posted": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                "start_date": start_date,
                "end_date": end_date,
                "duration_months": duration,
                "hard_flags": _build_flags(title, desc),
                "tags": f"{desk}, {feed['category']}, Teamtailor, Sans Login",
                "direct_apply_email": None,
            })
        return results
    except Exception:
        _record_failure(key)
        return []


async def _poll_bnp_stage_pages() -> List[Dict[str, Any]]:
    """Polls BNP Paribas official Stage SSR pages directly."""
    key = "frenchbank:bnp_paribas"
    if _is_circuit_open(key):
        return []
    results: List[Dict[str, Any]] = []
    seen_urls: set[str] = set()
    try:
        async with AsyncSession(impersonate="chrome124", timeout=12) as session:
            for page in (1, 2, 3):
                resp = await session.get(
                    f"https://group.bnpparibas/emploi-carriere/toutes-offres-emploi/stage?page={page}",
                    allow_redirects=True,
                )
                if resp.status_code != 200:
                    continue
                soup = BeautifulSoup(resp.text, "html.parser")
                for a in soup.find_all("a", href=True):
                    href = a.get("href") or ""
                    if "/emploi-carriere/offre-emploi/" not in href:
                        continue
                    full_url = href if href.startswith("http") else f"https://group.bnpparibas{href}"
                    if full_url in seen_urls:
                        continue
                    raw_text = re.sub(r"\s+", " ", a.get_text(" ", strip=True)).strip()
                    title = re.sub(r"^Stage\s+", "", raw_text, flags=re.I).strip()
                    if (
                        not title
                        or EXCLUDED_NON_FINANCE_INTERN.search(title)
                        or not FINANCE_OR_BUSINESS_SIGNAL.search(title)
                        or is_offer_text_expired(title, "")
                    ):
                        continue
                    seen_urls.add(full_url)
                    desk, asset_class = _infer_desk(title, "CIB & Finance")
                    start_date, end_date, duration = extract_internship_dates(title, "", "Stage 6 mois")
                    loc = "Londres / UK" if "london" in title.lower() else ("Luxembourg" if "luxembourg" in title.lower() else "Paris / Île-de-France")
                    results.append({
                        "title": title[:160],
                        "company": "BNP Paribas",
                        "location": loc,
                        "desk": desk,
                        "asset_class": asset_class,
                        "contract_type": "Stage Césure / PFE (6 mois)",
                        "description": f"Offre de stage officielle BNP Paribas : {title}. Candidature via portail Avature BNP Paribas.",
                        "requirements": "Master 1/2 Finance (EDHEC / Grande École / Université), analyse financière ou marchés.",
                        "url": full_url,
                        "url_status": 200,
                        "is_verified": True,
                        "last_verified_at": datetime.now(timezone.utc),
                        "salary_monthly": _estimate_salary(loc),
                        "source": "Portail Officiel · BNP Paribas",
                        "ats_platform": "avature",
                        "date_posted": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                        "start_date": start_date,
                        "end_date": end_date,
                        "duration_months": duration,
                        "hard_flags": _build_flags(title, ""),
                        "tags": f"{desk}, BNP Paribas, Avature, Stage",
                        "direct_apply_email": None,
                    })
        if results:
            _record_success(key)
        return results
    except Exception:
        _record_failure(key)
        return []


async def _poll_talentsoft_all(feed: Dict[str, str]) -> List[Dict[str, Any]]:
    """Polls TalentSoft complete job list HTML (Crédit Agricole CIB / Amundi)."""
    key = f"talentsoft:{feed['id']}"
    if _is_circuit_open(key):
        return []
    base_url = feed["base_url"].rstrip("/")
    results: List[Dict[str, Any]] = []
    seen_urls: set[str] = set()
    try:
        async with AsyncSession(impersonate="chrome124", timeout=12) as session:
            resp = await session.get(f"{base_url}/offre-de-emploi/liste-toutes-offres.aspx?all=1", allow_redirects=True)
            if resp.status_code != 200:
                _record_failure(key)
                return []
            _record_success(key)
            soup = BeautifulSoup(resp.text, "html.parser")
            for a in soup.find_all("a", href=True):
                href = a.get("href") or ""
                if "/offre-de-emploi/emploi-" not in href:
                    continue
                title = re.sub(r"\s+", " ", a.get_text(" ", strip=True)).strip()
                low_t = title.lower()
                is_stage_or_assistant = bool(
                    INTERN_TITLE_PATTERN.search(title)
                    or "assistant trader" in low_t
                    or "sales assistant" in low_t
                    or "assistant portfolio" in low_t
                    or "analyst" in low_t and "senior" not in low_t and "director" not in low_t
                )
                if (
                    not title
                    or not is_stage_or_assistant
                    or EXCLUDED_NON_FINANCE_INTERN.search(title)
                    or not FINANCE_OR_BUSINESS_SIGNAL.search(title)
                    or is_offer_text_expired(title, "")
                ):
                    continue
                full_url = href if href.startswith("http") else f"{base_url}{href}"
                if full_url in seen_urls:
                    continue
                seen_urls.add(full_url)
                desk, asset_class = _infer_desk(title, feed["category"])
                start_date, end_date, duration = extract_internship_dates(title, "", "Stage 6 mois")
                loc = "Paris / Montrouge"
                results.append({
                    "title": title[:160],
                    "company": feed["company"],
                    "location": loc,
                    "desk": desk,
                    "asset_class": asset_class,
                    "contract_type": "Stage / Junior Finance",
                    "description": f"Offre directe {feed['company']} (Portail TalentSoft) : {title}.",
                    "requirements": "Master 1/2 Finance, Marchés de Capitaux ou Asset Management.",
                    "url": full_url,
                    "url_status": 200,
                    "is_verified": True,
                    "last_verified_at": datetime.now(timezone.utc),
                    "salary_monthly": _estimate_salary(loc),
                    "source": f"Portail Officiel · {feed['company']}",
                    "ats_platform": "talentsoft",
                    "date_posted": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                    "start_date": start_date,
                    "end_date": end_date,
                    "duration_months": duration,
                    "hard_flags": _build_flags(title, ""),
                    "tags": f"{desk}, {feed['company']}, TalentSoft",
                    "direct_apply_email": None,
                })
        return results
    except Exception:
        _record_failure(key)
        return []


async def _poll_smartrecruiters(client: httpx.AsyncClient, board: Dict[str, str]) -> List[Dict[str, Any]]:
    """Polls public SmartRecruiters postings JSON API (zero-login direct ATS)."""
    slug = board["slug"]
    key = f"smartrecruiters:{slug}"
    if _is_circuit_open(key):
        return []
    url = f"https://api.smartrecruiters.com/v1/companies/{slug}/postings"
    try:
        resp = await client.get(url, timeout=8.0)
        if resp.status_code != 200:
            _record_failure(key)
            return []
        _record_success(key)
        jobs = resp.json().get("content", [])
        results: List[Dict[str, Any]] = []
        for j in jobs:
            title = (j.get("name") or "").strip()
            pid = j.get("id") or ""
            if (
                not title
                or not pid
                or not INTERN_TITLE_PATTERN.search(title)
                or EXCLUDED_NON_FINANCE_INTERN.search(title)
                or not FINANCE_OR_BUSINESS_SIGNAL.search(title)
                or is_offer_text_expired(title, "")
            ):
                continue
            loc_obj = j.get("location") or {}
            loc = ", ".join(p for p in (loc_obj.get("city"), loc_obj.get("country")) if p) or "Paris"
            abs_url = f"https://jobs.smartrecruiters.com/{slug}/{pid}"
            released = (j.get("releasedDate") or "")[:10] or datetime.now(timezone.utc).strftime("%Y-%m-%d")
            desk, asset_class = _infer_desk(title, board["category"])
            start_date, end_date, duration = extract_internship_dates(title, "", "Stage 6 mois")
            results.append({
                "title": title,
                "company": board["company"],
                "location": loc,
                "desk": desk,
                "asset_class": asset_class,
                "contract_type": "Stage / Internship",
                "description": f"Offre directe {board['company']} ({loc}) via SmartRecruiters sans création de compte.",
                "requirements": "Master 1/2 Finance, Analyse de Marchés / Asset Management.",
                "url": abs_url,
                "url_status": 200,
                "is_verified": True,
                "last_verified_at": datetime.now(timezone.utc),
                "salary_monthly": _estimate_salary(loc),
                "source": f"ATS Direct · {board['company']}",
                "ats_platform": "smartrecruiters",
                "date_posted": released,
                "start_date": start_date,
                "end_date": end_date,
                "duration_months": duration,
                "hard_flags": _build_flags(title, ""),
                "tags": f"{desk}, {board['category']}, SmartRecruiters, Sans Login",
                "direct_apply_email": None,
            })
        return results
    except Exception:
        _record_failure(key)
        return []


async def poll_direct_ats_feeds() -> List[Dict[str, Any]]:
    """Polls Greenhouse, Ashby, Lever, SmartRecruiters, Teamtailor RSS, and French bank official portals concurrently."""
    async with httpx.AsyncClient(headers={"User-Agent": "AlphaTracker/2.0"}) as client:
        tasks = (
            [_poll_greenhouse(client, b) for b in GREENHOUSE_BOARDS]
            + [_poll_ashby(client, b) for b in ASHBY_BOARDS]
            + [_poll_lever(client, b) for b in LEVER_BOARDS]
            + [_poll_smartrecruiters(client, b) for b in SMARTRECRUITERS_BOARDS]
            + [_poll_teamtailor_rss(client, f) for f in TEAMTAILOR_FEEDS]
            + [_poll_bnp_stage_pages()]
            + [_poll_talentsoft_all(f) for f in TALENTSOFT_FEEDS]
        )
        batches = await asyncio.gather(*tasks, return_exceptions=True)

    collected: List[Dict[str, Any]] = []
    seen_urls = set()
    for batch in batches:
        if isinstance(batch, list):
            for item in batch:
                u = item.get("url")
                if u and u not in seen_urls:
                    seen_urls.add(u)
                    collected.append(item)
    return collected


def get_ats_health_snapshot() -> Dict[str, Any]:
    open_breakers = [k for k, v in _CIRCUIT_BREAKER.items() if v.get("failures", 0) >= 2]
    return {
        "total_boards": (
            len(GREENHOUSE_BOARDS)
            + len(ASHBY_BOARDS)
            + len(LEVER_BOARDS)
            + len(SMARTRECRUITERS_BOARDS)
            + len(TEAMTAILOR_FEEDS)
            + len(TALENTSOFT_FEEDS)
            + 1
        ),
        "quarantined_boards": open_breakers,
    }
