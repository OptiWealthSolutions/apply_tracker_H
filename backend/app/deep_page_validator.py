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
]


def clean_tracking_url(raw_url: str) -> str:
    if not raw_url:
        return ""
    if "google." in raw_url and "url=" in raw_url:
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
                if any(k in title_text for k in ["404", "not found", "introuvable", "page expirée", "error", "opportunité indisponible"]):
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
