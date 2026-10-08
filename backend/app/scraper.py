import re
import urllib.parse
from datetime import datetime
from typing import List, Dict, Any, Optional
import httpx
from bs4 import BeautifulSoup


HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
}

FINANCE_DESKS_MAP = {
    "trading": "Trading Flow / Exotics",
    "trader": "Trading Flow / Exotics",
    "assistant trader": "Trading Assistant / Market Making",
    "market making": "Quantitative Market Making",
    "quant": "Quantitative Research / Trading",
    "quantitative": "Quantitative Research / Analysis",
    "structuring": "Structuring Produits Structurés",
    "structured": "Structuring Produits Structurés",
    "sales": "Sales FICC / Institutional",
    "ficc": "Sales & Trading FICC",
    "equity derivatives": "Dérivés Actions & Indices",
    "eqd": "Dérivés Actions & Indices",
    "fixed income": "Fixed Income & Rates",
    "taux": "Rates & FX Desk",
    "fx": "Foreign Exchange (FX)",
    "credit": "Credit Trading / Structuring",
    "commodities": "Commodities & Energy",
    "risk": "Risk Management de Marché",
    "market risk": "Market Risk Analytics",
    "dcm": "Debt Capital Markets (DCM)",
    "ecm": "Equity Capital Markets (ECM)",
    "asset management": "Quantitative Asset Management",
}


def infer_desk_and_asset_class(title: str, text: str) -> tuple[str, str]:
    combined = f"{title.lower()} {text.lower()}"
    
    inferred_desk = "Trading Flow"
    for keyword, desk_name in FINANCE_DESKS_MAP.items():
        if keyword in combined:
            inferred_desk = desk_name
            break

    # Infer asset class
    asset_class = "Equity Derivatives"
    if any(k in combined for k in ["taux", "rates", "fixed income", "bonds"]):
        asset_class = "Rates & Fixed Income"
    elif any(k in combined for k in ["fx", "forex", "change"]):
        asset_class = "Foreign Exchange (FX)"
    elif any(k in combined for k in ["credit", "cds", "spread"]):
        asset_class = "Credit"
    elif any(k in combined for k in ["commodities", "matières premières", "oil", "gas", "power"]):
        asset_class = "Commodities"
    elif any(k in combined for k in ["multi-asset", "cross asset", "cross-asset"]):
        asset_class = "Cross-Asset"
    elif any(k in combined for k in ["quant", "volatility", "options", "warrants"]):
        asset_class = "Equity Derivatives & Volatility"

    return inferred_desk, asset_class


def infer_company_from_text(title: str, snippet: str, link: str) -> str:
    known_banks = [
        "BNP Paribas", "Société Générale", "Natixis", "Crédit Agricole CIB", "CACIB",
        "Goldman Sachs", "Morgan Stanley", "J.P. Morgan", "JPMorgan", "Bank of America",
        "Barclays", "UBS", "Deutsche Bank", "Citi", "Citadel", "Flow Traders", "Optiver",
        "Jane Street", "Qube Research & Technologies", "Squarepoint Capital", "Millennium",
        "Balyasny", "Exane BNP Paribas", "Kepler Cheuvreux", "ODDO BHF", "Rothschild & Co",
        "Lazard", "Amundi", "AXA IM", "Carmignac", "Tradition", "TP ICAP", "BGC Partners",
        "CIC Market Solutions", "HSBC"
    ]
    
    full_str = f"{title} {snippet} {link}".lower()
    for bank in known_banks:
        if bank.lower() in full_str:
            return bank

    # Extract domain if unknown
    try:
        parsed = urllib.parse.urlparse(link)
        domain = parsed.netloc.replace("www.", "")
        if "linkedin" in domain:
            parts = title.split(" - ")
            if len(parts) > 1:
                return parts[1].split("|")[0].strip()
        elif "." in domain:
            return domain.split(".")[0].capitalize()
    except Exception:
        pass
    return "Banque / Institution Financière"


def clean_job_title(raw_title: str) -> str:
    cleaned = raw_title
    for sep in [" - ", " | ", " – ", " — "]:
        if sep in cleaned:
            parts = cleaned.split(sep)
            if len(parts[0].strip()) > 5:
                cleaned = parts[0].strip()
    return cleaned.strip()


async def scrape_duckduckgo_search(query: str, limit: int = 15) -> List[Dict[str, Any]]:
    """Scrapes DuckDuckGo HTML which does not block with Captcha and returns live finance jobs."""
    search_url = "https://html.duckduckgo.com/html/"
    params = {"q": f"{query} stage"}
    
    results: List[Dict[str, Any]] = []
    
    async with httpx.AsyncClient(headers=HEADERS, timeout=12.0, follow_redirects=True) as client:
        try:
            resp = await client.post(search_url, data=params)
            if resp.status_code != 200:
                # Try GET if POST is rejected
                resp = await client.get(f"{search_url}?{urllib.parse.urlencode(params)}")
            
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, "html.parser")
                links = soup.select(".result")
                
                for item in links[:limit]:
                    title_elem = item.select_one(".result__title a")
                    snippet_elem = item.select_one(".result__snippet")
                    
                    if not title_elem:
                        continue
                    
                    raw_title = title_elem.get_text(strip=True)
                    raw_link = title_elem.get("href", "")
                    
                    # Unpack duckduckgo redirect link if present
                    if "uddg=" in raw_link:
                        parsed = urllib.parse.parse_qs(urllib.parse.urlparse(raw_link).query)
                        if "uddg" in parsed:
                            raw_link = parsed["uddg"][0]
                    
                    snippet = snippet_elem.get_text(strip=True) if snippet_elem else ""
                    
                    # Filter relevant finance market internship results
                    combined_check = f"{raw_title} {snippet}".lower()
                    if not any(k in combined_check for k in ["stage", "intern", "internship", "trader", "quant", "structuring", "sales", "finance", "analyste"]):
                        continue

                    cleaned_title = clean_job_title(raw_title)
                    company = infer_company_from_text(raw_title, snippet, raw_link)
                    desk, asset_class = infer_desk_and_asset_class(cleaned_title, snippet)
                    
                    location = "Paris"
                    if "london" in combined_check or "londres" in combined_check:
                        location = "Londres"
                    elif "geneva" in combined_check or "genève" in combined_check:
                        location = "Genève"
                    elif "frankfurt" in combined_check or "francfort" in combined_check:
                        location = "Francfort"
                    elif "la défense" in combined_check:
                        location = "Paris (La Défense)"

                    contract_type = "Stage Césure (6 mois)"
                    if any(k in combined_check for k in ["pfe", "fin d'études", "fin d'etude"]):
                        contract_type = "Stage Fin d'Études (PFE)"
                    elif any(k in combined_check for k in ["summer", "été"]):
                        contract_type = "Summer Analyst (10 semaines)"
                    elif any(k in combined_check for k in ["off-cycle", "offcycle"]):
                        contract_type = "Off-Cycle Internship (6 mois)"

                    results.append({
                        "title": cleaned_title,
                        "company": company,
                        "location": location,
                        "desk": desk,
                        "asset_class": asset_class,
                        "contract_type": contract_type,
                        "description": snippet or f"Offre de stage en finance de marché détectée via recherche pour le rôle {cleaned_title}.",
                        "requirements": "Bac+5 Grande École d'Ingénieur ou Université (Master 203 / Dauphine). Compétences quantitatives, programmation Python / C++ / VBA et maîtrise des dérivés.",
                        "url": raw_link,
                        "salary_monthly": 2600 if location.startswith("Paris") else (3800 if location == "Londres" else 3200),
                        "source": "Moteur de Recherche",
                        "date_posted": datetime.utcnow().strftime("%Y-%m-%d"),
                        "tags": f"{desk}, {asset_class}, {location}, Stage",
                    })
        except Exception as e:
            print(f"Error during search scrape: {e}")
            
    return results


async def scrape_google_search(query: str, limit: int = 10) -> List[Dict[str, Any]]:
    """Performs a direct Google Search scrape with fallback to DuckDuckGo."""
    encoded_query = urllib.parse.quote(f"{query} stage finance de marché")
    google_url = f"https://www.google.com/search?q={encoded_query}&hl=fr&gl=fr&num={limit}"
    
    results: List[Dict[str, Any]] = []
    
    async with httpx.AsyncClient(headers=HEADERS, timeout=10.0, follow_redirects=True) as client:
        try:
            resp = await client.get(google_url)
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, "html.parser")
                items = soup.select("div.g, div.tF2Cxc")
                
                for item in items[:limit]:
                    title_elem = item.select_one("h3")
                    link_elem = item.select_one("a")
                    snippet_elem = item.select_one("div.VwiC3b, div[style*='-webkit-line-clamp']")
                    
                    if not title_elem or not link_elem:
                        continue
                    
                    title = title_elem.get_text(strip=True)
                    url = link_elem.get("href", "")
                    snippet = snippet_elem.get_text(strip=True) if snippet_elem else ""
                    
                    if not url or url.startswith("/search"):
                        continue
                        
                    cleaned_title = clean_job_title(title)
                    company = infer_company_from_text(title, snippet, url)
                    desk, asset_class = infer_desk_and_asset_class(cleaned_title, snippet)
                    
                    location = "Paris"
                    if "londres" in snippet.lower() or "london" in snippet.lower():
                        location = "Londres"
                    elif "genève" in snippet.lower() or "geneva" in snippet.lower():
                        location = "Genève"

                    results.append({
                        "title": cleaned_title,
                        "company": company,
                        "location": location,
                        "desk": desk,
                        "asset_class": asset_class,
                        "contract_type": "Stage Césure / PFE (6 mois)",
                        "description": snippet or f"Offre détectée sur Google: {title}",
                        "requirements": "Excellentes bases en mathématiques financières, pricing d'options, programmation Python / C++.",
                        "url": url,
                        "salary_monthly": 2700,
                        "source": "Google Jobs & Search",
                        "date_posted": datetime.utcnow().strftime("%Y-%m-%d"),
                        "tags": f"{desk}, {asset_class}, Google, Stage",
                    })
        except Exception as e:
            print(f"Google scrape exception (fallback triggered): {e}")

    # Fallback / Complement with DuckDuckGo if Google returns few or blocked results
    if len(results) < 4:
        ddg_results = await scrape_duckduckgo_search(query, limit=limit)
        results.extend(ddg_results)
        
    return results[:limit]


async def scrape_single_url(url: str) -> Dict[str, Any]:
    """Scrapes a specific job posting page from an ATS or career link."""
    async with httpx.AsyncClient(headers=HEADERS, timeout=12.0, follow_redirects=True) as client:
        resp = await client.get(url)
        if resp.status_code != 200:
            raise ValueError(f"Impossible d'accéder à l'URL (Status HTTP {resp.status_code})")
            
        soup = BeautifulSoup(resp.text, "html.parser")
        
        # Try OpenGraph metadata first
        og_title = soup.select_one("meta[property='og:title']")
        og_desc = soup.select_one("meta[property='og:description']")
        
        raw_title = (og_title.get("content") if og_title else None) or soup.title.string if soup.title else "Stage Finance de Marché"
        raw_desc = (og_desc.get("content") if og_desc else None) or ""
        
        if not raw_desc:
            main_p = soup.select("p")
            raw_desc = " ".join([p.get_text(strip=True) for p in main_p[:5]])
            
        cleaned_title = clean_job_title(raw_title)
        company = infer_company_from_text(raw_title, raw_desc, url)
        desk, asset_class = infer_desk_and_asset_class(cleaned_title, raw_desc)
        
        return {
            "title": cleaned_title,
            "company": company,
            "location": "Paris",
            "desk": desk,
            "asset_class": asset_class,
            "contract_type": "Stage Césure / PFE (6 mois)",
            "description": raw_desc[:1200] if raw_desc else "Description extraite depuis l'URL de candidature.",
            "requirements": "Grande École d'Ingénieur ou Université spécialisée en Finance Quantitative. Maîtrise Python / VBA / C++.",
            "url": url,
            "salary_monthly": 2600,
            "source": "Import URL",
            "date_posted": datetime.utcnow().strftime("%Y-%m-%d"),
            "tags": f"{desk}, {asset_class}, Import",
        }
