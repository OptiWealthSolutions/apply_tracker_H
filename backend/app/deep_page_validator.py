import asyncio
import re
import urllib.parse
from typing import Tuple, Optional
import random
from bs4 import BeautifulSoup
from curl_cffi.requests import AsyncSession

BROWSERS = ["chrome120", "chrome110", "safari17_0", "safari15_5", "edge99"]

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
}

DEEP_DEAD_PAGE_INDICATORS = [
    # French ATS & Bank indicators
    "cette offre n'est plus disponible",
    "cette offre a été pourvue",
    "cette offre est expirée",
    "ce poste a été pourvu",
    "cette annonce est expirée",
    "cette offre n'accepte plus de candidatures",
    "page introuvable",
    "page non trouvée",
    "erreur 404",
    "offre introuvable",
    "offre expirée",
    "l'offre recherchée n'est plus active",
    "l'offre d'emploi que vous recherchez n'est plus disponible",
    "le poste auquel vous essayez d'accéder est fermé",
    "désolé, cette offre n'existe plus",
    "cette opportunité n'est plus ouverte aux candidatures",
    "candidatures closes",
    "recrutement clos",
    "aucun résultat ne correspond à votre recherche",
    "le lien a expiré",

    # English ATS & Bank indicators
    "this job is no longer available",
    "job posting has expired",
    "page not found",
    "404 not found",
    "no longer accepting applications",
    "this position has been filled",
    "position is no longer open",
    "job requisition is no longer available",
    "the job you requested cannot be found",
    "this vacancy has expired",
    "requisition has been closed",
    "job has been unposted",
    "job not found",
    "we're sorry, this job has expired",
    "this listing is no longer active",
    "applications for this role are now closed",
    "posting has closed",
    "cannot find the page you are looking for",
    "this opportunity is no longer available",
    "job unavailable",
    "sorry, we couldn't find that page",
    "job opening is closed",
    "this role is no longer available",
    "job has been closed",
    "this requisition is closed",
    "ce recrutement est terminé",
    "posting expired",
    "applications are closed",
    "this position is closed",
    "we are no longer accepting",
    "plus ouvert aux candidatures",
    "cette annonce n'est plus en ligne",
    "the position you are looking for is no longer open",
]


NO_LOGIN_PLATFORMS = {
    "greenhouse",
    "lever",
    "ashby",
    "smartrecruiters",
    "teamtailor",
    "workable",
    "flatchr",
    "taleez",
    "direct",
}

LOGIN_REQUIRED_PLATFORMS = {
    "linkedin",
    "indeed",
    "glassdoor",
    "jobteaser",
    "wttj",
    "efinancialcareers",
    "workday",
    "taleo",
    "icims",
    "talentsoft",
    "avature",
    "altays",
}

PLATFORM_LABELS = {
    "greenhouse": "Greenhouse",
    "lever": "Lever",
    "ashby": "Ashby",
    "smartrecruiters": "SmartRecruiters",
    "teamtailor": "Teamtailor",
    "workable": "Workable",
    "flatchr": "Flatchr",
    "taleez": "Taleez",
    "direct": "Direct Entreprise",
    "linkedin": "LinkedIn",
    "indeed": "Indeed",
    "glassdoor": "Glassdoor",
    "jobteaser": "JobTeaser EDHEC",
    "wttj": "Welcome to the Jungle",
    "efinancialcareers": "eFinancialCareers",
    "workday": "Workday",
    "taleo": "Taleo",
    "icims": "iCIMS",
    "talentsoft": "TalentSoft",
    "avature": "Avature",
    "altays": "Altays",
}


def detect_ats_platform(url: str, source: str = "") -> str:
    """Identifies the underlying recruitment platform from a posting URL and source."""
    u = (url or "").lower()
    s = (source or "").lower()
    if "greenhouse.io" in u or "gh_jid=" in u:
        return "greenhouse"
    if "lever.co" in u:
        return "lever"
    if "ashbyhq.com" in u:
        return "ashby"
    if "smartrecruiters.com" in u:
        return "smartrecruiters"
    if "teamtailor.com" in u:
        return "teamtailor"
    if "workable.com" in u:
        return "workable"
    if "flatchr.io" in u:
        return "flatchr"
    if "taleez.com" in u:
        return "taleez"
    if "jobs.ca-cib.com" in u or "jobs.amundi.com" in u or "talentsoft" in u:
        return "talentsoft"
    if "bwelcome.hr.bnpparibas" in u or "group.bnpparibas/emploi-carriere" in u or "avature" in u:
        return "avature"
    if "altays-progiciels.com" in u:
        return "altays"
    if "jobteaser.com" in u or "jobteaser" in s:
        return "jobteaser"
    if "welcometothejungle.com" in u or "welcome to the jungle" in s:
        return "wttj"
    if "efinancialcareers" in u:
        return "efinancialcareers"
    if "linkedin.com" in u:
        return "linkedin"
    if "indeed." in u:
        return "indeed"
    if "glassdoor." in u:
        return "glassdoor"
    if "myworkdayjobs.com" in u or "workday" in u:
        return "workday"
    if "taleo" in u:
        return "taleo"
    if "icims.com" in u:
        return "icims"
    return "direct"


def is_login_required(ats_platform: Optional[str], url: str = "") -> bool:
    """Returns True when the candidate typically faces an account/login wall before applying."""
    plat = (ats_platform or detect_ats_platform(url)).lower()
    u = (url or "").lower()
    if any(tok in u for tok in ("/login", "/signin", "account/login", "auth/")):
        return True
    if plat in LOGIN_REQUIRED_PLATFORMS:
        return True
    return plat not in NO_LOGIN_PLATFORMS


def extract_direct_email(text: str) -> Optional[str]:
    """Extracts a direct recruitment email from a description when available."""
    if not text:
        return None
    for match in re.findall(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", text):
        low = match.lower()
        if any(bad in low for bad in ("noreply", "no-reply", "donotreply", "example.com", ".png", ".jpg", "sentry")):
            continue
        return match
    return None


def is_offer_text_expired(title: str, description: str = "") -> bool:
    """Fast local check to reject offers whose text/title signals an expired/closed posting."""
    combined = f"{title or ''} {description or ''}".lower()
    if any(ind in combined for ind in DEEP_DEAD_PAGE_INDICATORS):
        return True
    # Reject explicitly past internship cycles (e.g., 2024 or Summer 2025)
    if re.search(r"\b(2023|2024|summer\s*2025|janvier\s*2025|juin\s*2025|off-cycle\s*2025)\b", combined):
        return True
    return False


def detect_hard_constraints(title: str, description: str = "", requirements: str = "") -> list[str]:
    """
    Reverse-engineered from sliday/resume-job-matcher & zshah101:
    Detects hard disqualifiers or friction constraints (PhD-only, US clearance, etc.)
    before wasting time applying.
    """
    combined = f"{title or ''} {description or ''} {requirements or ''}".lower()
    flags: list[str] = []
    if re.search(r"\b(ph\.?d\.?\s*(only|required|candidate)|doctorate\s*required)\b", combined):
        flags.append("PhD requis")
    if re.search(r"\b(u\.?s\.?\s*citizen(ship)?\s*(only|required)|security\s*clearance|itar)\b", combined):
        flags.append("Citoyenneté US / Clearance")
    if re.search(r"\b([3-9]\+?\s*years?\s*(of\s*)?experience|senior\s*(trader|quant|vp|director))\b", combined) and not re.search(r"\b(intern|stage|off-cycle|summer|analyst)\b", (title or "").lower()):
        flags.append("Profil Senior (>3 ans)")
    if re.search(r"\b(graduat(ing|e)\s*in\s*202[45]|class\s*of\s*2025)\b", combined):
        flags.append("Promo 2025 uniquement")
    return flags


def clean_tracking_url(raw_url: str) -> str:
    """Normalise les URLs d'offres : supprime les paramètres de tracking et résout les wrappers de recherche ATS."""
    if not raw_url:
        return ""
    if "uddg=" in raw_url:
        parsed = urllib.parse.parse_qs(urllib.parse.urlparse(raw_url).query)
        if "uddg" in parsed:
            raw_url = parsed["uddg"][0]
    elif "google." in raw_url and ("url=" in raw_url or "q=" in raw_url):
        parsed = urllib.parse.parse_qs(urllib.parse.urlparse(raw_url).query)
        if "url" in parsed:
            raw_url = parsed["url"][0]
        elif "q" in parsed:
            raw_url = parsed["q"][0]

    try:
        parsed = urllib.parse.urlparse(raw_url)
        if "linkedin.com/jobs/view" in parsed.netloc + parsed.path:
            return f"{parsed.scheme}://{parsed.netloc}{parsed.path}"

        query_dict = urllib.parse.parse_qs(parsed.query)
        # Convert search-wrapper Greenhouse links (?gh_jid=...) directly to direct single-job Greenhouse URL
        if ("/jobs/search" in parsed.path or parsed.path.rstrip("/").endswith("/jobs")) and "gh_jid" in query_dict:
            jid = query_dict["gh_jid"][0]
            if "stripe.com" in parsed.netloc.lower() and jid.isdigit():
                return f"https://job-boards.greenhouse.io/stripe/jobs/{jid}"
            if "coinbase.com" in parsed.netloc.lower() and jid.isdigit():
                return f"https://job-boards.greenhouse.io/coinbase/jobs/{jid}"
        filtered_query = {
            k: v for k, v in query_dict.items()
            if not k.lower().startswith("utm_") and k not in ["refId", "trackingId", "position", "pageNum", "sessionId"]
        }
        new_query = urllib.parse.urlencode(filtered_query, doseq=True)
        return urllib.parse.urlunparse((parsed.scheme, parsed.netloc, parsed.path, parsed.params, new_query, parsed.fragment))
    except Exception:
        return raw_url.split("?")[0] if "?" in raw_url else raw_url


async def deep_verify_page(url: str, max_retries: int = 2) -> Tuple[bool, int, str, Optional[str]]:
    """
    Performs institutional-grade validation of a job page:
    1. HTTP Status check (rejection on 4xx, 5xx)
    2. Redirection inspection (detects silent redirect to generic home / search page)
    3. Title & Header soft 404 detection
    4. French and English ATS dead job pattern detection in full HTML body
    5. Content depth check (rejects blank shells / broken frames)

    Returns: (is_valid, status_code, clean_url, rejection_reason)
    """
    clean_url = clean_tracking_url(url)
    if not clean_url or not clean_url.startswith("http"):
        return False, 400, clean_url, "URL invalide"

    for attempt in range(max_retries):
        browser = random.choice(BROWSERS)
        try:
            async with AsyncSession(impersonate=browser) as session:
                resp = await session.get(clean_url, allow_redirects=True, timeout=8.0)
                code = resp.status_code

                # 1. HTTP Hard Error Check
                if code in [404, 410, 500, 502, 503]:
                    return False, code, clean_url, f"Code HTTP {code}"

                if code == 429:
                    await asyncio.sleep(1.0 + 0.5 * attempt)
                    continue

                if code not in [200, 204, 301, 302, 307, 308]:
                    return False, code, clean_url, f"Code HTTP inattendu {code}"

                # 2. Inspect Redirection Target URL
                final_url = str(resp.url).lower()
                clean_target = clean_tracking_url(str(resp.url))
                
                # If redirected to generic search or error page without the job
                if any(p in final_url for p in ["/404", "/error", "/not-found", "/page-introuvable"]):
                    return False, 404, clean_target, "Redirection vers page d'erreur"

                # 3. HTML Content Inspection
                html = resp.text
                if not html or len(html.strip()) < 150:
                    return False, 404, clean_target, "Contenu de page vide"

                soup = BeautifulSoup(html[:15000], "html.parser")
                title_text = soup.title.get_text(strip=True).lower() if soup.title else ""

                # Check Title for 404 / Error keywords
                if any(k in title_text for k in ["404", "not found", "introuvable", "page expirée", "opportunité indisponible", "error 404", "404 error", "500 error"]):
                    return False, 404, clean_target, f"Titre de page d'erreur : '{title_text[:60]}'"

                # 4. Check Soft 404 & Expired Phrases in body
                text_sample = html[:10000].lower()
                for indicator in DEEP_DEAD_PAGE_INDICATORS:
                    if indicator in text_sample:
                        return False, 404, clean_target, f"Offre expirée détectée ({indicator})"

                # 5. Check specific LinkedIn red banner indicator
                if "no longer accepting applications" in text_sample or "n'accepte plus de candidatures" in text_sample:
                    return False, 404, clean_target, "Offre fermée aux candidatures"

                # Page is alive and valid
                return True, code, clean_target, None

        except Exception as e:
            if attempt == max_retries - 1:
                return False, 500, clean_url, f"Erreur de connexion : {str(e)[:40]}"
            await asyncio.sleep(0.4)

    return False, 408, clean_url, "Délai de connexion dépassé"
