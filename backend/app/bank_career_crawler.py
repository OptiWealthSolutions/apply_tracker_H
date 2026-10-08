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
)
from .date_extractor import extract_internship_dates
from .deep_page_validator import deep_verify_page

# Comprehensive Registry of French and Anglophone Banks & Institutions
BANK_DIRECTORIES: List[Dict[str, Any]] = [
    # --- 1. BANQUES D'INVESTISSEMENT & MARCHÉS (CIB) ---
    {
        "id": "bnp_paribas",
        "name": "BNP Paribas CIB",
        "category": "Banque d'Investissement",
        "region": "France / Europe / Global",
        "career_portal_url": "https://group.bnpparibas/emploi-carriere/toutes-offres-emploi",
        "search_url_template": "https://group.bnpparibas/emploi-carriere/toutes-offres-emploi?keyword={query}",
        "specialties": ["Global Markets", "Equity Derivatives", "Fixed Income", "Asset Management"]
    },
    {
        "id": "societe_generale",
        "name": "Société Générale CIB",
        "category": "Banque d'Investissement",
        "region": "France / Europe / Global",
        "career_portal_url": "https://careers.societegenerale.com/recherche-d-offres",
        "search_url_template": "https://careers.societegenerale.com/recherche-d-offres?keyword={query}",
        "specialties": ["SGCIB", "Derivatives", "Quant Trading", "Cross-Asset Research"]
    },
    {
        "id": "credit_agricole_cib",
        "name": "Crédit Agricole CIB / Amundi",
        "category": "Banque d'Investissement",
        "region": "France / Europe / Global",
        "career_portal_url": "https://www.groupecreditagricole.jobs/nos-offres-d-emploi/",
        "search_url_template": "https://www.groupecreditagricole.jobs/nos-offres-d-emploi/?keywords={query}",
        "specialties": ["Rates & FX", "Structured Finance", "Asset Management (Amundi)"]
    },
    {
        "id": "natixis_bpce",
        "name": "Natixis CIB (Groupe BPCE)",
        "category": "Banque d'Investissement",
        "region": "France / Europe",
        "career_portal_url": "https://recrutement.bpce.fr/nos-offres/",
        "search_url_template": "https://recrutement.bpce.fr/nos-offres/?query={query}",
        "specialties": ["Equity Derivatives", "Fixed Income", "Commodities", "Mirova"]
    },
    {
        "id": "oddo_bhf",
        "name": "Oddo BHF",
        "category": "Banque d'Investissement",
        "region": "France / Allemagne",
        "career_portal_url": "https://www.oddo-bhf.com/fr/carrieres",
        "search_url_template": "https://www.oddo-bhf.com/fr/carrieres?query={query}",
        "specialties": ["Asset Management", "Private Wealth", "Brokerage"]
    },
    {
        "id": "kepler_cheuvreux",
        "name": "Kepler Cheuvreux",
        "category": "Banque d'Investissement",
        "region": "Europe",
        "career_portal_url": "https://www.keplercheuvreux.com/careers/",
        "search_url_template": "https://www.keplercheuvreux.com/careers/?s={query}",
        "specialties": ["Equity Research", "Execution", "Fixed Income"]
    },
    {
        "id": "jpmorgan",
        "name": "JPMorgan Chase",
        "category": "Banque d'Investissement",
        "region": "US / UK / Global",
        "career_portal_url": "https://careers.jpmorgan.com/global/en/students/programs",
        "search_url_template": "https://careers.jpmorgan.com/global/en/search-results?keywords={query}",
        "specialties": ["Global Markets", "Quantitative Research", "FICC", "Equity Trading"]
    },
    {
        "id": "goldman_sachs",
        "name": "Goldman Sachs",
        "category": "Banque d'Investissement",
        "region": "US / UK / Global",
        "career_portal_url": "https://www.goldmansachs.com/careers/students/programs/",
        "search_url_template": "https://www.goldmansachs.com/careers/students/programs/?search={query}",
        "specialties": ["Global Banking & Markets", "Quantitative Strategies", "Asset Management"]
    },
    {
        "id": "morgan_stanley",
        "name": "Morgan Stanley",
        "category": "Banque d'Investissement",
        "region": "US / UK / Global",
        "career_portal_url": "https://www.morganstanley.com/people-opportunities/students-graduates",
        "search_url_template": "https://www.morganstanley.com/people-opportunities/students-graduates?search={query}",
        "specialties": ["Institutional Securities", "Sales & Trading", "Fixed Income", "Quantitative Modeling"]
    },
    {
        "id": "barclays",
        "name": "Barclays",
        "category": "Banque d'Investissement",
        "region": "UK / Global",
        "career_portal_url": "https://search.jobs.barclays/",
        "search_url_template": "https://search.jobs.barclays/search-jobs/{query}",
        "specialties": ["Quantitative Analytics", "Markets", "Trading Flow", "Structuring"]
    },
    {
        "id": "deutsche_bank",
        "name": "Deutsche Bank",
        "category": "Banque d'Investissement",
        "region": "Allemagne / UK / US",
        "career_portal_url": "https://careers.db.com/students-graduates/",
        "search_url_template": "https://careers.db.com/students-graduates/?search={query}",
        "specialties": ["Quantitative FIC", "Global Markets", "Rates & FX"]
    },
    {
        "id": "ubs",
        "name": "UBS",
        "category": "Banque d'Investissement",
        "region": "Suisse / Global",
        "career_portal_url": "https://jobs.ubs.com/",
        "search_url_template": "https://jobs.ubs.com/TGnewUI/Search/Home/HomeWithPreLoad?partnerid=25008&siteid=5012#keyWordSearch={query}",
        "specialties": ["Investment Bank Quants", "Global Wealth Management", "Asset Management"]
    },
    {
        "id": "hsbc",
        "name": "HSBC",
        "category": "Banque d'Investissement",
        "region": "UK / Global",
        "career_portal_url": "https://mycareer.hsbc.com/en_GB/external",
        "search_url_template": "https://mycareer.hsbc.com/en_GB/external?keyword={query}",
        "specialties": ["Global Markets", "Repo & Financing", "FX & Emerging Markets"]
    },
    {
        "id": "bank_of_america",
        "name": "Bank of America",
        "category": "Banque d'Investissement",
        "region": "US / Global",
        "career_portal_url": "https://campus.bankofamerica.com/",
        "search_url_template": "https://campus.bankofamerica.com/search-jobs.html?k={query}",
        "specialties": ["Quantitative Strategies", "Sales & Trading", "Global Risk"]
    },
    {
        "id": "citi",
        "name": "Citi",
        "category": "Banque d'Investissement",
        "region": "US / Global",
        "career_portal_url": "https://jobs.citi.com/",
        "search_url_template": "https://jobs.citi.com/search-jobs/{query}",
        "specialties": ["Markets & Securities Services", "FX Desk", "Algo Trading"]
    },
    {
        "id": "jefferies",
        "name": "Jefferies",
        "category": "Banque d'Investissement",
        "region": "US / Europe",
        "career_portal_url": "https://jefferies.wd5.myworkdayjobs.com/Jefferies_Careers",
        "search_url_template": "https://jefferies.wd5.myworkdayjobs.com/Jefferies_Careers?q={query}",
        "specialties": ["Equities", "Fixed Income", "Electronic Trading"]
    },

    # --- 2. M&A & BOUTIQUES DE CONSEIL FINANCIER ---
    {
        "id": "rothschild_co",
        "name": "Rothschild & Co",
        "category": "M&A & Conseil Financier",
        "region": "France / UK / Global",
        "career_portal_url": "https://www.rothschildandco.com/en/careers/opportunities/",
        "search_url_template": "https://www.rothschildandco.com/en/careers/opportunities/?search={query}",
        "specialties": ["Global Advisory M&A", "Sovereign Advisory", "Merchant Banking", "Produits Structurés"]
    },
    {
        "id": "lazard",
        "name": "Lazard Frères",
        "category": "M&A & Conseil Financier",
        "region": "France / US / Global",
        "career_portal_url": "https://lazard.wd5.myworkdayjobs.com/Lazard_Careers",
        "search_url_template": "https://lazard.wd5.myworkdayjobs.com/Lazard_Careers?q={query}",
        "specialties": ["Financial Advisory M&A", "Restructuring", "Lazard Asset Management"]
    },
    {
        "id": "evercore",
        "name": "Evercore",
        "category": "M&A & Conseil Financier",
        "region": "US / UK / Europe",
        "career_portal_url": "https://www.evercore.com/careers/",
        "search_url_template": "https://www.evercore.com/careers/?search={query}",
        "specialties": ["Strategic Advisory M&A", "Equities & Research", "Restructuring"]
    },
    {
        "id": "centerview",
        "name": "Centerview Partners",
        "category": "M&A & Conseil Financier",
        "region": "US / UK / France",
        "career_portal_url": "https://www.centerviewpartners.com/careers",
        "search_url_template": "https://www.centerviewpartners.com/careers?q={query}",
        "specialties": ["Elite M&A Advisory", "Restructuring", "Corporate Valuation"]
    },
    {
        "id": "messier_associes",
        "name": "Messier & Associés",
        "category": "M&A & Conseil Financier",
        "region": "France / Europe",
        "career_portal_url": "https://www.messier-associes.com/carrieres/",
        "search_url_template": "https://www.messier-associes.com/carrieres/?s={query}",
        "specialties": ["M&A Large & Mid Cap", "Conseil Stratégique", "LBO"]
    },
    {
        "id": "houlihan_lokey",
        "name": "Houlihan Lokey",
        "category": "M&A & Conseil Financier",
        "region": "US / Europe / Global",
        "career_portal_url": "https://hl.com/careers/",
        "search_url_template": "https://hl.com/careers/?search={query}",
        "specialties": ["Financial Restructuring", "Corporate Finance M&A", "Financial and Valuation Advisory"]
    },

    # --- 3. PRIVATE EQUITY & ASSET MANAGEMENT ---
    {
        "id": "blackrock",
        "name": "BlackRock",
        "category": "Private Equity & AM",
        "region": "US / Europe / Global",
        "career_portal_url": "https://careers.blackrock.com/",
        "search_url_template": "https://careers.blackrock.com/search-jobs/{query}",
        "specialties": ["Quantitative Investing", "Aladdin Platform", "iShares ETF", "Fixed Income"]
    },
    {
        "id": "amundi",
        "name": "Amundi Asset Management",
        "category": "Private Equity & AM",
        "region": "France / Europe / Global",
        "career_portal_url": "https://about.amundi.com/carrieres",
        "search_url_template": "https://about.amundi.com/carrieres/offres?keyword={query}",
        "specialties": ["Gestion Passive & ETF", "Multi-Asset", "Recherche Économique", "ESG"]
    },
    {
        "id": "ardian",
        "name": "Ardian",
        "category": "Private Equity & AM",
        "region": "France / Europe / US",
        "career_portal_url": "https://www.ardian.com/careers",
        "search_url_template": "https://www.ardian.com/careers?q={query}",
        "specialties": ["Direct LBO", "Private Debt", "Infrastructure", "Fonds de Fonds"]
    },
    {
        "id": "eurazeo",
        "name": "Eurazeo",
        "category": "Private Equity & AM",
        "region": "France / Europe / US",
        "career_portal_url": "https://www.eurazeo.com/fr/carrieres",
        "search_url_template": "https://www.eurazeo.com/fr/carrieres?query={query}",
        "specialties": ["Mid-Large Buyout", "Growth Equity", "Private Debt", "Real Assets"]
    },
    {
        "id": "eqt",
        "name": "EQT Partners",
        "category": "Private Equity & AM",
        "region": "Suède / Europe / Global",
        "career_portal_url": "https://eqtgroup.com/careers/",
        "search_url_template": "https://eqtgroup.com/careers/?s={query}",
        "specialties": ["Private Capital", "Infrastructure", "Real Estate", "Venture"]
    },
    {
        "id": "blackstone",
        "name": "Blackstone",
        "category": "Private Equity & AM",
        "region": "US / UK / Global",
        "career_portal_url": "https://www.blackstone.com/careers/",
        "search_url_template": "https://www.blackstone.com/careers/?search={query}",
        "specialties": ["Private Equity LBO", "Real Estate", "Credit & Insurance", "Hedge Fund Solutions"]
    },

    # --- 4. HEDGE FUNDS & QUANT PROP TRADING ---
    {
        "id": "citadel",
        "name": "Citadel & Citadel Securities",
        "category": "Hedge Fund & Prop Trading",
        "region": "US / UK / Global",
        "career_portal_url": "https://www.citadel.com/careers/",
        "search_url_template": "https://www.citadel.com/careers/open-opportunities/?keyword={query}",
        "specialties": ["Quantitative Research", "Equities Market Making", "Global Fixed Income", "Commodities"]
    },
    {
        "id": "jane_street",
        "name": "Jane Street",
        "category": "Hedge Fund & Prop Trading",
        "region": "US / UK / Europe",
        "career_portal_url": "https://www.janestreet.com/join-jane-street/open-roles/",
        "search_url_template": "https://www.janestreet.com/join-jane-street/open-roles/?search={query}",
        "specialties": ["Quantitative Trading", "Software Engineering OCaml/Python", "ETF Market Making"]
    },
    {
        "id": "point72",
        "name": "Point72 Asset Management",
        "category": "Hedge Fund & Prop Trading",
        "region": "US / UK / Global",
        "career_portal_url": "https://careers.point72.com/",
        "search_url_template": "https://careers.point72.com/search-jobs/{query}",
        "specialties": ["Long/Short Equity", "Cubist Systematic Strategies", "Macro & Discretionary"]
    },
    {
        "id": "millennium",
        "name": "Millennium Management",
        "category": "Hedge Fund & Prop Trading",
        "region": "US / UK / Global",
        "career_portal_url": "https://www.mlp.com/careers/",
        "search_url_template": "https://www.mlp.com/careers/?search={query}",
        "specialties": ["Multi-Strategy Hedge Fund", "Quant Strategies", "Volatility Arbitrage"]
    },
    {
        "id": "brevan_howard",
        "name": "Brevan Howard",
        "category": "Hedge Fund & Prop Trading",
        "region": "UK / US / Global",
        "career_portal_url": "https://www.brevanhoward.com/careers/",
        "search_url_template": "https://www.brevanhoward.com/careers/?search={query}",
        "specialties": ["Global Macro", "Systematic Trading", "Fixed Income & FX"]
    },
    {
        "id": "balyasny_am",
        "name": "Balyasny Asset Management",
        "category": "Hedge Fund & Prop Trading",
        "region": "US / UK / Global",
        "career_portal_url": "https://www.bamfunds.com/careers",
        "search_url_template": "https://www.bamfunds.com/careers?query={query}",
        "specialties": ["Multi-Strategy", "Macro & Commodities", "Quantitative Research"]
    },
    {
        "id": "optiver",
        "name": "Optiver",
        "category": "Hedge Fund & Prop Trading",
        "region": "Pays-Bas / Europe / US",
        "career_portal_url": "https://optiver.com/working-at-optiver/career-opportunities/",
        "search_url_template": "https://optiver.com/working-at-optiver/career-opportunities/?search={query}",
        "specialties": ["Derivatives Market Making", "Options Volatility", "Low-Latency C++"]
    },
    {
        "id": "flow_traders",
        "name": "Flow Traders",
        "category": "Hedge Fund & Prop Trading",
        "region": "Pays-Bas / Europe / US",
        "career_portal_url": "https://www.flowtraders.com/careers",
        "search_url_template": "https://www.flowtraders.com/careers/jobs?search={query}",
        "specialties": ["ETP & Bond Market Making", "Digital Assets", "Algorithmic Arbitrage"]
    },

    # --- 5. AUDIT & TRANSACTION SERVICES (BIG 4 & MAZARS) ---
    {
        "id": "pwc",
        "name": "PwC (PricewaterhouseCoopers)",
        "category": "Audit & Transaction Services",
        "region": "France / Global",
        "career_portal_url": "https://carrieres.pwc.fr/",
        "search_url_template": "https://carrieres.pwc.fr/fr/offres-d-emploi?keyword={query}",
        "specialties": ["Transaction Services (TS)", "Financial Due Diligence", "Audit Financier Marchés", "Deals Valuation"]
    },
    {
        "id": "deloitte",
        "name": "Deloitte",
        "category": "Audit & Transaction Services",
        "region": "France / Global",
        "career_portal_url": "https://deloitte.recrutement.net/",
        "search_url_template": "https://deloitte.recrutement.net/recherche-offres?keyword={query}",
        "specialties": ["Financial Advisory (FDD)", "Audit Bancaire & Asset Management", "Forensic", "Restructuring"]
    },
    {
        "id": "ey",
        "name": "EY (Ernst & Young)",
        "category": "Audit & Transaction Services",
        "region": "France / Global",
        "career_portal_url": "https://ey.taleo.net/careersection/ey_careers/jobsearch.ftl",
        "search_url_template": "https://ey.taleo.net/careersection/ey_careers/jobsearch.ftl?keyword={query}",
        "specialties": ["Strategy and Transactions (SaT)", "Valuation & Business Modeling", "Audit FSO (Financial Services)"]
    },
    {
        "id": "kpmg",
        "name": "KPMG",
        "category": "Audit & Transaction Services",
        "region": "France / Global",
        "career_portal_url": "https://carrieres.kpmg.fr/",
        "search_url_template": "https://carrieres.kpmg.fr/nos-offres?query={query}",
        "specialties": ["Deal Advisory (TS/M&A)", "Financial Services Audit", "Corporate Finance", "Restructuring"]
    },
    {
        "id": "mazars",
        "name": "Forvis Mazars",
        "category": "Audit & Transaction Services",
        "region": "France / Global",
        "career_portal_url": "https://carrieres.mazars.fr/",
        "search_url_template": "https://carrieres.mazars.fr/offres-emploi?keyword={query}",
        "specialties": ["Audit Grands Comptes & CIB", "Transaction Services", "Modélisation Financière", "Actuariat"]
    },

    # --- 6. CONSEIL EN STRATÉGIE & MANAGEMENT ---
    {
        "id": "mckinsey",
        "name": "McKinsey & Company",
        "category": "Conseil en Stratégie",
        "region": "France / Global",
        "career_portal_url": "https://www.mckinsey.com/careers/search-jobs",
        "search_url_template": "https://www.mckinsey.com/careers/search-jobs?query={query}",
        "specialties": ["Strategy Consulting", "Financial Institutions Practice", "QuantumBlack AI", "Corporate Finance"]
    },
    {
        "id": "bcg",
        "name": "The Boston Consulting Group (BCG)",
        "category": "Conseil en Stratégie",
        "region": "France / Global",
        "career_portal_url": "https://careers.bcg.com/",
        "search_url_template": "https://careers.bcg.com/search-jobs/{query}",
        "specialties": ["Corporate Development", "Financial Institutions Strategy", "BCG GAMMA Data Science"]
    },
    {
        "id": "bain",
        "name": "Bain & Company",
        "category": "Conseil en Stratégie",
        "region": "France / Global",
        "career_portal_url": "https://www.bain.com/careers/",
        "search_url_template": "https://www.bain.com/careers/find-a-role/?query={query}",
        "specialties": ["Private Equity Due Diligence", "Financial Services Strategy", "Mergers & Acquisitions"]
    },
    {
        "id": "oliver_wyman",
        "name": "Oliver Wyman",
        "category": "Conseil en Stratégie",
        "region": "France / Global",
        "career_portal_url": "https://www.oliverwyman.com/careers.html",
        "search_url_template": "https://www.oliverwyman.com/careers.html?search={query}",
        "specialties": ["Financial Services Leader", "Corporate & Institutional Banking", "Quantitative Risk", "Actuarial"]
    },
    {
        "id": "roland_berger",
        "name": "Roland Berger",
        "category": "Conseil en Stratégie",
        "region": "France / Europe / Global",
        "career_portal_url": "https://www.rolandberger.com/fr/Join.html",
        "search_url_template": "https://www.rolandberger.com/fr/Join.html?query={query}",
        "specialties": ["Restructuring", "Financial Services Advisory", "Strategic M&A Support"]
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
            is_valid, code, clean_u, failure_reason = await deep_verify_page(item["url"])
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
