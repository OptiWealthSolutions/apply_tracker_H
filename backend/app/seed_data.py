import json
from sqlalchemy.orm import Session
from .models import UserProfile


TARGET_ROLES_DEFAULT = [
    "Assistant Trader",
    "Quant Research",
    "Quantitative Trading",
    "Structuring Produits Structurés",
    "Asset Management (Gérance Quant / Buy-Side)",
    "Hedge Fund Analyst / Quant Researcher",
    "FinTech Quantitative Engineer / Algo Dev",
    "Macro Trading & Systematic Research",
    "Rates & FX Desk",
    "Sales FICC / Institutional",
    "Market Risk Analytics",
    "Commodities & Energy Trading"
]

TARGET_LOCATIONS_DEFAULT = [
    "Marseille",
    "Paris",
    "Luxembourg",
    "Londres",
    "New York",
    "Milan",
    "Genève"
]

TARGET_ASSET_CLASSES_DEFAULT = [
    "Equity Derivatives & Convexity",
    "Rates & Fixed Income",
    "Hedge Fund Systematic Strategies",
    "Asset Management Quantitatif",
    "FinTech & Execution Algorithmique",
    "Foreign Exchange (FX)",
    "Commodities & Energy",
    "Cross-Asset Fair Value",
    "Volatility Arbitrage & Dispersion"
]

TECHNICAL_SKILLS_DEFAULT = [
    "Python",
    "MQL5 (MT5)",
    "Machine Learning Finance",
    "Backtesting & Stratégies",
    "Macroeconomic Modeling",
    "Courbes de Taux & Liquidité",
    "Pricing Dérivés & Grecs",
    "Payoffs Asymétriques",
    "Excel",
    "Bloomberg"
]


def seed_database(db: Session):
    """
    Initializes default user profile tailored to Léo Lombardini's CV (EDHEC M1 Financial Markets).
    Includes expanded hubs (Marseille, Paris, Luxembourg, London, NY, Milan)
    and sectors (Asset Management, Hedge Funds, FinTech, Trading, Quant).
    """
    profile = db.query(UserProfile).first()
    if not profile:
        profile = UserProfile(
            full_name="Léo Lombardini",
            email="llombardini.leo@gmail.com",
            phone="07 85 42 69 11",
            school="EDHEC Business School - Master in Finance",
            degree_level="Master 1 Financial Markets (PGE)",
            target_roles=json.dumps(TARGET_ROLES_DEFAULT),
            target_locations=json.dumps(TARGET_LOCATIONS_DEFAULT),
            target_asset_classes=json.dumps(TARGET_ASSET_CLASSES_DEFAULT),
            technical_skills=json.dumps(TECHNICAL_SKILLS_DEFAULT),
            target_duration="6 mois (Off-cycle)",
            target_start_period="Juin 2027",
            min_salary=2500,
            bio_summary=(
                "Master 1 Finance à l'EDHEC Business School (Programme Grande École, filière Financial Markets). "
                "Fondateur de Horacle Capital : conception de la plateforme quantitative Horacle Hub en Python "
                "(scoring macroéconomique, indices de surprises, modèles de fair value cross-asset) et développement "
                "d'un pipeline de trading systématique axé sur la haute convexité et les payoffs asymétriques. "
                "Recherche un stage off-cycle de 6 mois à compter de juin 2027 en trading, recherche quantitative, "
                "structuring, hedge fund, asset management ou fintech quant."
            ),
            serendipity_exploration_weight=0.35
        )
        db.add(profile)
        db.commit()
    else:
        # Update existing profile with exact preferences
        profile.full_name = "Léo Lombardini"
        profile.email = "llombardini.leo@gmail.com"
        profile.phone = "07 85 42 69 11"
        profile.school = "EDHEC Business School - Master in Finance"
        profile.degree_level = "Master 1 Financial Markets (PGE)"
        profile.target_roles = json.dumps(TARGET_ROLES_DEFAULT)
        profile.target_locations = json.dumps(TARGET_LOCATIONS_DEFAULT)
        profile.target_asset_classes = json.dumps(TARGET_ASSET_CLASSES_DEFAULT)
        profile.technical_skills = json.dumps(TECHNICAL_SKILLS_DEFAULT)
        profile.target_duration = "6 mois (Off-cycle)"
        profile.target_start_period = "Juin 2027"
        profile.bio_summary = (
            "Master 1 Finance à l'EDHEC Business School (Programme Grande École, filière Financial Markets). "
            "Fondateur de Horacle Capital : conception de la plateforme quantitative Horacle Hub en Python "
            "(scoring macroéconomique, indices de surprises, modèles de fair value cross-asset) et développement "
            "d'un pipeline de trading systématique axé sur la haute convexité et les payoffs asymétriques. "
            "Recherche un stage off-cycle de 6 mois à compter de juin 2027 en trading, recherche quantitative, "
            "structuring, hedge fund, asset management ou fintech quant."
        )
        db.commit()
