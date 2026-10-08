import json
from sqlalchemy.orm import Session
from .models import UserProfile


def seed_database(db: Session):
    """
    Initializes default user profile tailored to Léo Lombardini's CV (EDHEC M1 Financial Markets).
    ZERO hardcoded mock offers.
    """
    profile = db.query(UserProfile).first()
    if not profile:
        profile = UserProfile(
            full_name="Léo Lombardini",
            email="llombardini.leo@gmail.com",
            phone="07 85 42 69 11",
            school="EDHEC Business School - Master in Finance",
            degree_level="Master 1 Financial Markets (PGE)",
            target_roles=json.dumps([
                "Assistant Trader",
                "Quant Research",
                "Quantitative Trading",
                "Structuring Produits Structurés",
                "Macro Trading / Research",
                "Rates & FX Desk",
                "Sales FICC / Institutional",
                "Market Risk Analytics"
            ]),
            target_locations=json.dumps([
                "Paris",
                "Londres",
                "Genève",
                "Francfort",
                "Luxembourg"
            ]),
            target_asset_classes=json.dumps([
                "Equity Derivatives & Convexity",
                "Rates & Fixed Income",
                "Foreign Exchange (FX)",
                "Commodities & Energy",
                "Cross-Asset Fair Value",
                "Systematic & Multi-Asset"
            ]),
            technical_skills=json.dumps([
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
            ]),
            target_duration="6 mois (Off-cycle)",
            target_start_period="Juin 2027",
            min_salary=2500,
            bio_summary=(
                "Master 1 Finance à l'EDHEC Business School (Programme Grande École, filière Financial Markets). "
                "Fondateur de Horacle Capital : conception de la plateforme quantitative Horacle Hub en Python "
                "(scoring macroéconomique, indices de surprises, modèles de fair value cross-asset) et développement "
                "d'un pipeline de trading systématique axé sur la haute convexité et les payoffs asymétriques. "
                "Recherche un stage off-cycle de 6 mois à compter de juin 2027 en trading, recherche quantitative ou structuring."
            ),
            serendipity_exploration_weight=0.35
        )
        db.add(profile)
        db.commit()
    else:
        # Update existing profile with exact CV info
        profile.full_name = "Léo Lombardini"
        profile.email = "llombardini.leo@gmail.com"
        profile.phone = "07 85 42 69 11"
        profile.school = "EDHEC Business School - Master in Finance"
        profile.degree_level = "Master 1 Financial Markets (PGE)"
        profile.target_roles = json.dumps([
            "Assistant Trader",
            "Quant Research",
            "Quantitative Trading",
            "Structuring Produits Structurés",
            "Macro Trading / Research",
            "Rates & FX Desk",
            "Sales FICC / Institutional",
            "Market Risk Analytics"
        ])
        profile.target_locations = json.dumps([
            "Paris",
            "Londres",
            "Genève",
            "Francfort",
            "Luxembourg"
        ])
        profile.target_asset_classes = json.dumps([
            "Equity Derivatives & Convexity",
            "Rates & Fixed Income",
            "Foreign Exchange (FX)",
            "Commodities & Energy",
            "Cross-Asset Fair Value",
            "Systematic & Multi-Asset"
        ])
        profile.technical_skills = json.dumps([
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
        ])
        profile.target_duration = "6 mois (Off-cycle)"
        profile.target_start_period = "Juin 2027"
        profile.bio_summary = (
            "Master 1 Finance à l'EDHEC Business School (Programme Grande École, filière Financial Markets). "
            "Fondateur de Horacle Capital : conception de la plateforme quantitative Horacle Hub en Python "
            "(scoring macroéconomique, indices de surprises, modèles de fair value cross-asset) et développement "
            "d'un pipeline de trading systématique axé sur la haute convexité et les payoffs asymétriques. "
            "Recherche un stage off-cycle de 6 mois à compter de juin 2027 en trading, recherche quantitative ou structuring."
        )
        db.commit()
