from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from .database import Base


class JobOffer(Base):
    __tablename__ = "job_offers"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    company = Column(String(255), nullable=False, index=True)
    location = Column(String(100), nullable=False, default="Paris", index=True)
    desk = Column(String(100), nullable=False, default="Trading Flow", index=True)
    asset_class = Column(String(100), nullable=True, default="Equity Derivatives")
    contract_type = Column(String(100), nullable=False, default="Stage Césure (6 mois)")
    description = Column(Text, nullable=False)
    requirements = Column(Text, nullable=True)
    url = Column(String(1000), nullable=True)
    url_status = Column(Integer, default=200)
    is_verified = Column(Boolean, default=True)
    last_verified_at = Column(DateTime, default=datetime.utcnow)
    start_date = Column(String(100), nullable=True)
    end_date = Column(String(100), nullable=True)
    duration_months = Column(String(50), nullable=True, default="6 mois")
    salary_monthly = Column(Integer, nullable=True, default=2500)
    source = Column(String(100), nullable=False, default="Scraper")
    date_posted = Column(String(50), nullable=True)
    scraped_at = Column(DateTime, default=datetime.utcnow)
    is_favorite = Column(Boolean, default=False)
    is_applied = Column(Boolean, default=False)
    tags = Column(String(500), nullable=True)
    direct_apply_email = Column(String(255), nullable=True)

    # Relationships
    applications = relationship("Application", back_populates="offer", cascade="all, delete-orphan")


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    offer_id = Column(Integer, ForeignKey("job_offers.id", ondelete="SET NULL"), nullable=True)
    company = Column(String(255), nullable=False, index=True)
    job_title = Column(String(255), nullable=False, index=True)
    desk = Column(String(100), nullable=False, default="Trading Flow")
    location = Column(String(100), nullable=False, default="Paris")
    
    # Status: 'saved', 'applied', 'follow_up_needed', 'interviewing', 'offer_received', 'rejected', 'withdrawn'
    status = Column(String(50), nullable=False, default="applied", index=True)
    
    applied_date = Column(String(50), nullable=True)
    follow_up_date = Column(String(50), nullable=True)
    interview_date = Column(String(50), nullable=True)
    salary_monthly = Column(Integer, nullable=True)
    contact_name = Column(String(150), nullable=True)
    contact_email = Column(String(255), nullable=True)
    application_url = Column(String(1000), nullable=True)
    url_status = Column(Integer, nullable=True, default=200)
    notes = Column(Text, nullable=True)
    cover_letter = Column(Text, nullable=True)
    resume_version = Column(String(100), nullable=True, default="CV_Finance_Marche_2026.pdf")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    offer = relationship("JobOffer", back_populates="applications")


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False, default="Léo Lombardini")
    email = Column(String(255), nullable=False, default="candidat.finance@market.com")
    phone = Column(String(50), nullable=True, default="+33 6 12 34 56 78")
    school = Column(String(255), nullable=False, default="Grande École d'Ingénieur / Université Dauphine Master 203")
    degree_level = Column(String(50), nullable=False, default="Master 2 / PFE")
    
    # Stored as JSON strings
    target_roles = Column(Text, nullable=False, default='["Assistant Trader", "Quant Research", "Structuring Produits Structurés"]')
    target_locations = Column(Text, nullable=False, default='["Paris", "Londres", "Genève"]')
    target_asset_classes = Column(Text, nullable=False, default='["Equity Derivatives", "Rates & FX", "Volatility", "Commodities"]')
    technical_skills = Column(Text, nullable=False, default='["Python", "C++", "Calcul Stochastique", "Greeks & Pricing", "SQL", "Bloomberg"]')
    
    target_duration = Column(String(50), nullable=False, default="6 mois")
    target_start_period = Column(String(100), nullable=False, default="Janvier - Avril 2027")
    min_salary = Column(Integer, default=2200)
    bio_summary = Column(Text, nullable=True, default="Étudiant passionné par la modélisation mathématique des dérivés, le pricing d'options, le market making et l'arbitrage statistique. Recherche un stage de césure ou PFE sur desk de trading ou structuring.")
    
    # Exploration factor for KNN (higher = discovers adjacent/cross-discipline desks)
    serendipity_exploration_weight = Column(Float, default=0.35)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ScraperLog(Base):
    __tablename__ = "scraper_logs"

    id = Column(Integer, primary_key=True, index=True)
    keywords = Column(String(255), nullable=False)
    source = Column(String(100), nullable=False)
    results_count = Column(Integer, default=0)
    status = Column(String(50), default="success")
    created_at = Column(DateTime, default=datetime.utcnow)
