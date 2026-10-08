from sqlalchemy.orm import Session
from .models import UserProfile


def seed_database(db: Session):
    """
    Initializes default user profile only.
    ZERO HARDCODED OFFERS: all job offers are populated through real verified scraping.
    """
    profile = db.query(UserProfile).first()
    if not profile:
        profile = UserProfile(
            full_name="Léo Lombardini",
            email="leo.lombardini@etudiant.univ.fr",
            phone="+33 6 12 34 56 78",
            school="Grande École d'Ingénieur / Dauphine M203",
            degree_level="Master 2 / Fin d'études (PFE)",
            target_roles='["Assistant Trader", "Quant Research", "Structuring Produits Structurés"]',
            target_locations='["Paris", "Londres", "Genève"]',
            target_asset_classes='["Equity Derivatives", "Rates & FX", "Volatility", "Commodities"]',
            technical_skills='["Python", "C++", "Calcul Stochastique", "Greeks & Pricing", "SQL", "Bloomberg"]',
            target_duration="6 mois",
            target_start_period="Janvier - Avril 2027",
            min_salary=2400,
            bio_summary="Étudiant passionné par la finance quantitative, la gestion des risques de marché et le pricing d'options exotiques. Recherche un stage de fin d'études stimulant sur un desk de trading ou de structuring.",
            serendipity_exploration_weight=0.35
        )
        db.add(profile)
        db.commit()
