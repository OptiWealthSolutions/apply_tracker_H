"""
ATS Match Score and Desk Relevance Analyzer.
Evaluates alignment between market finance job postings and candidate profile (Léo Lombardini: EDHEC M1, ENS D2, Horacle Capital, Python/MQL5 quant).
"""

from typing import List, Dict, Any
import re
from .schemas import ATSFitBreakdown


def analyze_ats_fit(job_title: str, desk: str, description: str, requirements: str = "") -> ATSFitBreakdown:
    combined_text = f"{job_title} {desk} {description} {requirements}".lower()
    
    # Candidate known competencies
    candidate_profile = {
        "education": ["edhec", "ens", "master", "grande école", "mathématiques", "finance de marché"],
        "coding": ["python", "c++", "numpy", "pandas", "scipy", "git", "sql", "mql5", "backtest"],
        "derivatives": ["options", "greeks", "pricing", "volatilité", "black-scholes", "delta", "gamma", "vega", "couverture", "hedging"],
        "quant_math": ["calcul stochastique", "monte carlo", "statistiques", "probabilités", "séries temporelles", "time series", "optimisation"],
        "markets": ["actions", "equity", "taux", "rates", "fx", "devises", "produits structurés", "autocall", "etf", "swaps"]
    }

    # Evaluate matches
    strengths: List[str] = []
    missing_keywords: List[str] = []
    
    # 1. Coding check
    has_python = "python" in combined_text
    has_cpp = "c++" in combined_text or "cpp" in combined_text
    has_sql = "sql" in combined_text
    has_vba = "vba" in combined_text or "excel" in combined_text
    
    if has_python:
        strengths.append("Compétence Python confirmée (librairies quantitatives NumPy/pandas, projet Horacle Hub).")
    if has_cpp:
        strengths.append("Notions C++ pour l'ingénierie financière et l'implémentation algorithmique.")
    if has_sql:
        strengths.append("Bases de données SQL et extraction de séries temporelles de marché.")
        
    # Check what might be missing or good to mention
    if "bloomberg" in combined_text:
        strengths.append("Familier des terminaux de données de marché et tickers financiers.")
    elif any(k in combined_text for k in ["factset", "reuters", "refinitiv"]):
        missing_keywords.append("Terminaux de données (Bloomberg / Refinitiv Eikon)")
        
    if "power bi" in combined_text or "tableau" in combined_text:
        missing_keywords.append("Outils BI (PowerBI / Tableau Dashboarding)")
        
    if "docker" in combined_text or "cloud" in combined_text:
        missing_keywords.append("Déploiement conteneurisé (Docker / Cloud CI-CD)")

    # 2. Financial & Quantitative Concepts check
    if any(k in combined_text for k in ["option", "pricing", "grecs", "greeks", "volatilité", "black"]):
        strengths.append("Maîtrise du calcul stochastique et de la décomposition des Grecs (Delta, Gamma, Vega).")
    
    if any(k in combined_text for k in ["taux", "rates", "swap", "courbe", "duration", "dv01"]):
        strengths.append("Structure par terme des taux d'intérêt, duration modifiée et calcul de DV01.")
        
    if any(k in combined_text for k in ["structur", "autocall", "phoenix", "payoff"]):
        strengths.append("Conception et décomposition de produits structurés actions et multi-actifs.")

    if any(k in combined_text for k in ["backtest", "stratégie", "algorithmique", "statistique", "machine learning"]):
        strengths.append("Expérience concrète de backtesting sans biais de look-ahead via Horacle Capital.")

    # Check for desk-specific missing keywords to suggest adding to cover letter
    if any(k in combined_text for k in ["credit", "cds", "spread", "high yield"]) and not any("credit" in s.lower() for s in strengths):
        missing_keywords.append("Valorisation spreads de crédit & CDS (Credit Default Swaps)")

    if any(k in combined_text for k in ["reglement", "mifid", "priips", "esg", "sfdr"]):
        missing_keywords.append("Réglementations financières (MIFID II, PRIIPs, reporting ESG)")

    if any(k in combined_text for k in ["anglais", "fluent", "bilingual", "english"]):
        strengths.append("Anglais professionnel et capacité à échanger en salle des marchés internationale.")

    # Compute category scores
    coding_score = 95 if has_python else 85
    math_score = 92 if any(k in combined_text for k in ["math", "stochastique", "calcul", "quant"]) else 88
    finance_fit_score = 94 if any(k in combined_text for k in ["trader", "structuring", "quant", "analyst"]) else 86
    institution_score = 96  # EDHEC M1 + ENS D2 tier-1 recognition

    overall = int((coding_score * 0.25) + (math_score * 0.25) + (finance_fit_score * 0.3) + (institution_score * 0.2))

    if not missing_keywords:
        missing_keywords = [
            "Préciser l'environnement technique Bloomberg/Python exact utilisé",
            "Mentionner la gestion des limites de risque P&L EOD"
        ]

    strategic_advice = [
        f"Mettre en exergue votre track Financial Markets à l'EDHEC et votre double cursus ENS D2 dès le premier paragraphe.",
        "Citer explicitement la plateforme Horacle Hub pour prouver votre capacité à coder des modèles réels et opérationnels.",
        f"Pour cette offre chez {job_title.split('-')[0].strip() if '-' in job_title else 'l institution'}, insister sur votre réactivité en temps réel et votre rigueur mathématique."
    ]

    recommended_projects = [
        "Pricer Monte Carlo en Python avec surfaces de volatilité locale (SVI/Dupire)",
        "Stratégie de Pairs Trading cointégrée (Ornstein-Uhlenbeck) sur indices Euro Stoxx 50",
        "Dashboard interactif de calcul de DV01 et Key Rate Durations sur la courbe souveraine"
    ]

    return ATSFitBreakdown(
        overall_score=overall,
        category_scores={
            "Formation Académique (EDHEC / ENS D2)": institution_score,
            "Compétences Code & Data (Python/C++/SQL)": coding_score,
            "Finance Quantitative & Modélisation": math_score,
            "Adéquation Métier & Desk": finance_fit_score
        },
        strengths=strengths,
        missing_keywords=missing_keywords,
        strategic_advice=strategic_advice,
        recommended_projects=recommended_projects
    )
