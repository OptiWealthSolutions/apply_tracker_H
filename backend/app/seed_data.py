import json
from sqlalchemy.orm import Session
from .models import UserProfile


TARGET_ROLES_DEFAULT = [
    "Assistant Trader",
    "Sales & Trading (EQD / FICC)",
    "Structuring Produits Structurés",
    "Asset Management (Gérance / Buy-Side)",
    "Hedge Fund Analyst / Macro",
    "Market Risk & Portfolio Analytics",
    "Equity Research & Stratégie",
    "Commodities & Energy Trading",
    "Corporate Finance / M&A / Capital Markets",
    "FinTech Finance & Operations",
]

TARGET_LOCATIONS_DEFAULT = [
    "Paris",
    "Marseille",
    "Luxembourg",
    "Londres",
    "Genève",
    "Zurich",
    "Milan",
    "New York",
]

TARGET_ASSET_CLASSES_DEFAULT = [
    "Equity Derivatives & Flow",
    "Rates, Credit & FX (FICC)",
    "Structured Products & Solutions",
    "Asset Management & Buy-Side",
    "Global Macro & Multi-Asset",
    "Commodities & Energy",
    "Corporate Finance & Capital Markets",
]

TECHNICAL_SKILLS_DEFAULT = [
    "Python (Data & Finance)",
    "Pricing Dérivés & Grecs",
    "Macroeconomic Modeling",
    "Courbes de Taux & Liquidité",
    "Backtesting & Analyse de Risque",
    "Excel / VBA",
    "Bloomberg",
    "Analyse Financière & Valorisation",
]


def seed_database(db: Session):
    """
    Initializes default user profile tailored to Léo Lombardini (EDHEC Business School - M1 Financial Markets).
    Calibrated for Sales & Trading, Structuring, Asset Management, Macro, Risk & Capital Markets
    (excluding pure engineering/PhD quant roles) with target start Juin 2027.
    """
    profile = db.query(UserProfile).first()
    bio = (
        "Étudiant en Master 1 Finance à l'EDHEC Business School (Programme Grande École, filière Financial Markets). "
        "Fondateur de Horacle Capital : conception d'Horacle Hub (scoring macroéconomique, indices de surprises, "
        "modèles cross-asset) et rédaction de notes macro hebdomadaires. "
        "Recherche un stage de 6 mois à partir de Juin 2027 en Sales & Trading, Assistant Trader, Structuration, "
        "Asset Management, Hedge Fund Macro, Risque de Marché ou Capital Markets."
    )
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
            min_salary=2200,
            bio_summary=bio,
            serendipity_exploration_weight=0.35,
        )
        db.add(profile)
        db.commit()
    else:
        # Preserve user's chosen target_start_period if already set
        if not profile.target_start_period:
            profile.target_start_period = "Juin 2027"
        if not profile.bio_summary or "fintech quant" in profile.bio_summary.lower():
            profile.target_roles = json.dumps(TARGET_ROLES_DEFAULT)
            profile.target_asset_classes = json.dumps(TARGET_ASSET_CLASSES_DEFAULT)
            profile.technical_skills = json.dumps(TECHNICAL_SKILLS_DEFAULT)
            profile.bio_summary = bio
            db.commit()
