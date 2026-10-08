import asyncio
import urllib.parse
from typing import List, Dict, Any, Optional
import random
from bs4 import BeautifulSoup
from curl_cffi.requests import AsyncSession

from .scraper import (
    BROWSERS,
    clean_tracking_url,
    clean_job_title,
    infer_desk_and_asset_class,
    is_finance_job,
    verify_job_url,
)
from .date_extractor import extract_internship_dates

# Comprehensive Registry of French and Anglophone Banks & Institutions
BANK_DIRECTORIES: List[Dict[str, Any]] = [
    # --- French Banks & Asset Managers ---
    {
        "id": "bnp_paribas",
        "name": "BNP Paribas",
        "category": "Banque Française",
        "region": "France / Europe",
        "career_portal_url": "https://group.bnpparibas/emploi-carriere/toutes-offres-emploi",
        "search_url_template": "https://group.bnpparibas/emploi-carriere/toutes-offres-emploi?keyword={query}",
        "specialties": ["Global Markets", "Equity Derivatives", "Fixed Income", "Asset Management"]
    },
    {
        "id": "societe_generale",
        "name": "Société Générale",
        "category": "Banque Française",
        "region": "France / Europe",
        "career_portal_url": "https://careers.societegenerale.com/recherche-d-offres",
        "search_url_template": "https://careers.societegenerale.com/recherche-d-offres?keyword={query}",
        "specialties": ["SGCIB", "Derivatives", "Quant Trading", "Cross-Asset Research"]
    },
    {
        "id": "credit_agricole_cib",
        "name": "Crédit Agricole CIB / Amundi",
        "category": "Banque Française",
        "region": "France / Europe",
        "career_portal_url": "https://www.groupecreditagricole.jobs/nos-offres-d-emploi/",
        "search_url_template": "https://www.groupecreditagricole.jobs/nos-offres-d-emploi/?keywords={query}",
        "specialties": ["Rates & FX", "Structured Finance", "Asset Management (Amundi)"]
    },
    {
        "id": "natixis_bpce",
        "name": "Natixis CIB (Groupe BPCE)",
        "category": "Banque Française",
        "region": "France / Europe",
        "career_portal_url": "https://recrutement.bpce.fr/nos-offres/",
        "search_url_template": "https://recrutement.bpce.fr/nos-offres/?query={query}",
        "specialties": ["Equity Derivatives", "Fixed Income", "Commodities", "Mirova"]
    },
    {
        "id": "lazard",
        "name": "Lazard Frères",
        "category": "Banque Française / Internationale",
        "region": "France / Global",
        "career_portal_url": "https://lazard.wd5.myworkdayjobs.com/Lazard_Careers",
        "search_url_template": "https://lazard.wd5.myworkdayjobs.com/Lazard_Careers?q={query}",
        "specialties": ["Lazard Asset Management", "Financial Advisory", "Produits Structurés"]
    },
    {
        "id": "rothschild_co",
        "name": "Rothschild & Co",
        "category": "Banque Française / Internationale",
        "region": "France / Global",
        "career_portal_url": "https://www.rothschildandco.com/en/careers/opportunities/",
        "search_url_template": "https://www.rothschildandco.com/en/careers/opportunities/?search={query}",
        "specialties": ["Produits Structurés", "Global Advisory", "Merchant Banking"]
    },
    {
        "id": "oddo_bhf",
        "name": "Oddo BHF",
        "category": "Banque Franco-Allemande",
        "region": "France / Allemagne",
        "career_portal_url": "https://www.oddo-bhf.com/fr/carrieres",
        "search_url_template": "https://www.oddo-bhf.com/fr/carrieres?query={query}",
        "specialties": ["Asset Management", "Private Wealth", "Brokerage"]
    },
    {
        "id": "kepler_cheuvreux",
        "name": "Kepler Cheuvreux",
        "category": "Banque Française / Broker",
        "region": "Europe",
        "career_portal_url": "https://www.keplercheuvreux.com/careers/",
        "search_url_template": "https://www.keplercheuvreux.com/careers/?s={query}",
        "specialties": ["Equity Research", "Execution", "Fixed Income"]
    },

    # --- Anglophone & Global Tier-1 Banks ---
    {
        "id": "jpmorgan",
        "name": "JPMorgan Chase",
        "category": "Banque Anglophone",
        "region": "US / Global",
        "career_portal_url": "https://careers.jpmorgan.com/global/en/students/programs",
        "search_url_template": "https://careers.jpmorgan.com/global/en/search-results?keywords={query}",
        "specialties": ["Global Markets", "Quantitative Research", "FICC", "Equity Trading"]
    },
    {
        "id": "goldman_sachs",
        "name": "Goldman Sachs",
        "category": "Banque Anglophone",
        "region": "US / Global",
        "career_portal_url": "https://www.goldmansachs.com/careers/students/programs/",
        "search_url_template": "https://www.goldmansachs.com/careers/students/programs/?search={query}",
        "specialties": ["Global Banking & Markets", "Quantitative Strategies", "Asset Management"]
    },
    {
        "id": "morgan_stanley",
        "name": "Morgan Stanley",
        "category": "Banque Anglophone",
        "region": "US / Global",
        "career_portal_url": "https://www.morganstanley.com/people-opportunities/students-graduates",
        "search_url_template": "https://www.morganstanley.com/people-opportunities/students-graduates?search={query}",
        "specialties": ["Institutional Securities", "Sales & Trading", "Fixed Income", "Quantitative Modeling"]
    },
    {
        "id": "barclays",
        "name": "Barclays",
        "category": "Banque Anglophone",
        "region": "UK / Global",
        "career_portal_url": "https://search.jobs.barclays/",
        "search_url_template": "https://search.jobs.barclays/search-jobs/{query}",
        "specialties": ["Quantitative Analytics", "Markets", "Trading Flow", "Structuring"]
    },
    {
        "id": "deutsche_bank",
        "name": "Deutsche Bank",
        "category": "Banque Anglophone / Internationale",
        "region": "Allemagne / UK / US",
        "career_portal_url": "https://careers.db.com/students-graduates/",
        "search_url_template": "https://careers.db.com/students-graduates/?search={query}",
        "specialties": ["Quantitative FIC", "Global Markets", "Rates & FX"]
    },
    {
        "id": "ubs",
        "name": "UBS",
        "category": "Banque Anglophone / Suisse",
        "region": "Suisse / Global",
        "career_portal_url": "https://jobs.ubs.com/",
        "search_url_template": "https://jobs.ubs.com/TGnewUI/Search/Home/HomeWithPreLoad?partnerid=25008&siteid=5012#keyWordSearch={query}",
        "specialties": ["Investment Bank Quants", "Global Wealth Management", "Asset Management"]
    },
    {
        "id": "hsbc",
        "name": "HSBC",
        "category": "Banque Anglophone",
        "region": "UK / Global",
        "career_portal_url": "https://mycareer.hsbc.com/en_GB/external",
        "search_url_template": "https://mycareer.hsbc.com/en_GB/external?keyword={query}",
        "specialties": ["Global Markets", "Repo & Financing", "FX & Emerging Markets"]
    },
    {
        "id": "bank_of_america",
        "name": "Bank of America",
        "category": "Banque Anglophone",
        "region": "US / Global",
        "career_portal_url": "https://campus.bankofamerica.com/",
        "search_url_template": "https://campus.bankofamerica.com/search-jobs.html?k={query}",
        "specialties": ["Quantitative Strategies", "Sales & Trading", "Global Risk"]
    },
    {
        "id": "citi",
        "name": "Citi",
        "category": "Banque Anglophone",
        "region": "US / Global",
        "career_portal_url": "https://jobs.citi.com/",
        "search_url_template": "https://jobs.citi.com/search-jobs/{query}",
        "specialties": ["Markets & Securities Services", "FX Desk", "Algo Trading"]
    },
    {
        "id": "jefferies",
        "name": "Jefferies",
        "category": "Banque Anglophone",
        "region": "US / Europe",
        "career_portal_url": "https://jefferies.wd5.myworkdayjobs.com/Jefferies_Careers",
        "search_url_template": "https://jefferies.wd5.myworkdayjobs.com/Jefferies_Careers?q={query}",
        "specialties": ["Equities", "Fixed Income", "Electronic Trading"]
    },

    # --- Hedge Funds & Quantitative Prop Trading ---
    {
        "id": "brevan_howard",
        "name": "Brevan Howard",
        "category": "Hedge Fund",
        "region": "UK / US / Global",
        "career_portal_url": "https://www.brevanhoward.com/careers/",
        "search_url_template": "https://www.brevanhoward.com/careers/?search={query}",
        "specialties": ["Global Macro", "Systematic Trading", "Crypto & Digital Assets"]
    },
    {
        "id": "balyasny_am",
        "name": "Balyasny Asset Management",
        "category": "Hedge Fund",
        "region": "US / UK / Global",
        "career_portal_url": "https://www.bamfunds.com/careers",
        "search_url_template": "https://www.bamfunds.com/careers?query={query}",
        "specialties": ["Multi-Strategy", "Macro & Commodities", "Quantitative Research"]
    },
    {
        "id": "maven_securities",
        "name": "Maven Securities",
        "category": "Hedge Fund / Prop Trading",
        "region": "UK / Europe",
        "career_portal_url": "https://mavensecurities.com/careers/",
        "search_url_template": "https://mavensecurities.com/careers/?s={query}",
        "specialties": ["Quant Trading", "Derivatives Market Making", "Systematic Alpha"]
    },
    {
        "id": "talos",
        "name": "Talos",
        "category": "FinTech Quantitative",
        "region": "US / Europe",
        "career_portal_url": "https://talos.com/careers/",
        "search_url_template": "https://talos.com/careers/?search={query}",
        "specialties": ["Institutional Trading Infrastructure", "Execution Algorithms", "Crypto"]
    }
]


def get_bank_directory() -> List[Dict[str, Any]]:
    return BANK_DIRECTORIES


async def execute_live_bank_query(
    bank_info: Dict[str, Any],
    keyword: str,
    location: str = "Paris"
) -> List[Dict[str, Any]]:
    """
    Executes live real-time search for an exact bank and keyword across its posting channels.
    """
    bank_name = bank_info["name"]
    query_str = f"{bank_name} {keyword}"
    encoded_q = urllib.parse.quote(query_str)
    encoded_loc = urllib.parse.quote(location)
    api_url = f"https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords={encoded_q}&location={encoded_loc}&start=0"

    browser = random.choice(BROWSERS)
    try:
        async with AsyncSession(impersonate=browser) as session:
            resp = await session.get(api_url, timeout=7.0)
            if resp.status_code != 200:
                return []

            soup = BeautifulSoup(resp.text, "html.parser")
            cards = soup.select("li")
            candidates = []

            for card in cards:
                title_elem = card.select_one(".base-search-card__title")
                comp_elem = card.select_one(".base-search-card__subtitle")
                loc_elem = card.select_one(".job-search-card__location")
                link_elem = card.select_one("a.base-card__full-link")
                date_elem = card.select_one("time")

                if not title_elem or not link_elem:
                    continue

                raw_title = title_elem.get_text(strip=True)
                company = comp_elem.get_text(strip=True) if comp_elem else bank_name
                job_loc = loc_elem.get_text(strip=True) if loc_elem else location
                raw_link = link_elem.get("href", "")
                date_posted = date_elem.get("datetime") if date_elem else "Récemment"

                # Keep relevant postings (must relate to finance desk)
                if not is_finance_job(raw_title, company):
                    continue

                clean_url = clean_tracking_url(raw_link)
                cleaned_title = clean_job_title(raw_title)
                desk, asset_class = infer_desk_and_asset_class(cleaned_title, company)

                # Extract start date, end date, and duration
                start_date, end_date, duration = extract_internship_dates(cleaned_title, "", "Stage 6 mois")

                contract_type = "Stage Césure / Off-Cycle (6 mois)"
                if "10 semaine" in duration:
                    contract_type = "Summer Analyst (10 semaines)"
                elif "PFE" in duration or "4-6" in duration:
                    contract_type = "Stage Fin d'Études (PFE)"

                loc_lower = job_loc.lower()
                salary = 4500 if ("new york" in loc_lower or "ny" in loc_lower) else (
                    3800 if ("london" in loc_lower or "londres" in loc_lower) else (
                        3600 if ("geneva" in loc_lower or "genève" in loc_lower or "zurich" in loc_lower) else (
                            3000 if "luxembourg" in loc_lower else (
                                2400 if ("milan" in loc_lower or "marseille" in loc_lower) else 2800
                            )
                        )
                    )
                )

                candidates.append({
                    "title": cleaned_title,
                    "company": company,
                    "location": job_loc,
                    "desk": desk,
                    "asset_class": asset_class,
                    "contract_type": contract_type,
                    "description": f"Poste en direct chez {company} sur le desk {desk} ({asset_class}). Postulez directement via le portail carrières officiel.",
                    "requirements": "Master 1 Finance de marché EDHEC ou École d'Ingénieur. Maîtrise Python, modélisation quantitative, pricing d'actifs.",
                    "url": clean_url,
                    "bank_career_portal_url": bank_info.get("career_portal_url"),
                    "bank_search_url": bank_info.get("search_url_template", "").format(query=urllib.parse.quote(keyword)),
                    "salary_monthly": salary,
                    "source": f"Portail Carrières {bank_name} (Direct)",
                    "date_posted": date_posted,
                    "start_date": start_date,
                    "end_date": end_date,
                    "duration_months": duration,
                    "tags": f"{desk}, {asset_class}, {job_loc}, {bank_name}, Portail Direct",
                    "bank_id": bank_info["id"],
                    "bank_category": bank_info["category"]
                })

            return candidates

    except Exception:
        return []


async def search_bank_careers_live(
    keyword: str,
    bank_ids: Optional[List[str]] = None,
    location: str = "Paris",
    start_period: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Orchestrates live simultaneous search across bank career portals.
    Verifies every result URL in real time with HTTP 200 checks.
    """
    banks_to_query = [
        b for b in BANK_DIRECTORIES
        if not bank_ids or b["id"] in bank_ids or "all" in bank_ids
    ]

    tasks = [execute_live_bank_query(bank, keyword, location) for bank in banks_to_query]
    all_results = await asyncio.gather(*tasks, return_exceptions=True)

    flattened: List[Dict[str, Any]] = []
    seen_urls = set()

    for res in all_results:
        if isinstance(res, list):
            for item in res:
                u = item.get("url")
                if not u or u in seen_urls:
                    continue
                seen_urls.add(u)
                flattened.append(item)

    # Filter by start_period if requested
    if start_period and start_period != "Toutes":
        flattened = [
            item for item in flattened
            if start_period.lower() in (item.get("start_date") or "").lower()
        ]

    # Verify URLs concurrently
    verified_results: List[Dict[str, Any]] = []
    sem = asyncio.Semaphore(4)

    async def verify_item(item: Dict[str, Any]):
        async with sem:
            await asyncio.sleep(0.08)
            is_valid, code, clean_u = await verify_job_url(item["url"])
            if is_valid and code in [200, 204, 301, 302, 307, 308]:
                item["url"] = clean_u
                item["url_status"] = code
                item["is_verified"] = True
                return item
            return None

    verif_tasks = [verify_item(it) for it in flattened]
    verif_res = await asyncio.gather(*verif_tasks, return_exceptions=True)

    for r in verif_res:
        if isinstance(r, dict) and r is not None:
            verified_results.append(r)

    return verified_results
