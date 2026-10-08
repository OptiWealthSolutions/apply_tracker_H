from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


# --- JOB OFFER SCHEMAS ---
class JobOfferBase(BaseModel):
    title: str
    company: str
    location: str = "Paris"
    desk: str = "Trading Flow"
    asset_class: Optional[str] = "Equity Derivatives"
    contract_type: str = "Stage Césure (6 mois)"
    description: str
    requirements: Optional[str] = None
    url: Optional[str] = None
    url_status: int = 200
    is_verified: bool = True
    last_verified_at: Optional[datetime] = None
    salary_monthly: Optional[int] = 2500
    source: str = "Scraper"
    date_posted: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    duration_months: Optional[str] = "6 mois"
    tags: Optional[str] = None
    direct_apply_email: Optional[str] = None


class JobOfferCreate(JobOfferBase):
    pass


class JobOfferResponse(JobOfferBase):
    id: int
    scraped_at: Optional[datetime] = None
    is_favorite: bool = False
    is_applied: bool = False

    class Config:
        from_attributes = True


# --- APPLICATION SCHEMAS ---
class ApplicationBase(BaseModel):
    offer_id: Optional[int] = None
    company: str
    job_title: str
    desk: str = "Trading Flow"
    location: str = "Paris"
    status: str = "applied"  # saved, applied, follow_up_needed, interviewing, offer_received, rejected, withdrawn
    applied_date: Optional[str] = None
    follow_up_date: Optional[str] = None
    interview_date: Optional[str] = None
    salary_monthly: Optional[int] = None
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    application_url: Optional[str] = None
    url_status: Optional[int] = 200
    notes: Optional[str] = None
    cover_letter: Optional[str] = None
    resume_version: Optional[str] = "CV_Finance_Marche_2026.pdf"


class ApplicationCreate(ApplicationBase):
    pass


class ApplicationUpdate(BaseModel):
    company: Optional[str] = None
    job_title: Optional[str] = None
    desk: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = None
    applied_date: Optional[str] = None
    follow_up_date: Optional[str] = None
    interview_date: Optional[str] = None
    salary_monthly: Optional[int] = None
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    application_url: Optional[str] = None
    url_status: Optional[int] = None
    notes: Optional[str] = None
    cover_letter: Optional[str] = None
    resume_version: Optional[str] = None


class ApplicationResponse(ApplicationBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    offer: Optional[JobOfferResponse] = None

    class Config:
        from_attributes = True


# --- USER PROFILE & PREFERENCES SCHEMAS ---
class UserProfileBase(BaseModel):
    full_name: str = "Léo Lombardini"
    email: str = "candidat.finance@market.com"
    phone: Optional[str] = "+33 6 12 34 56 78"
    school: str = "Grande École d'Ingénieur / Université Dauphine Master 203"
    degree_level: str = "Master 2 / PFE"
    target_roles: List[str] = ["Assistant Trader", "Quant Research", "Structuring Produits Structurés"]
    target_locations: List[str] = ["Paris", "Londres", "Genève"]
    target_asset_classes: List[str] = ["Equity Derivatives", "Rates & FX", "Volatility", "Commodities"]
    technical_skills: List[str] = ["Python", "C++", "Calcul Stochastique", "Greeks & Pricing", "SQL", "Bloomberg"]
    target_duration: str = "6 mois"
    target_start_period: str = "Janvier - Avril 2027"
    min_salary: int = 2200
    bio_summary: Optional[str] = None
    serendipity_exploration_weight: float = 0.35


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    school: Optional[str] = None
    degree_level: Optional[str] = None
    target_roles: Optional[List[str]] = None
    target_locations: Optional[List[str]] = None
    target_asset_classes: Optional[List[str]] = None
    technical_skills: Optional[List[str]] = None
    target_duration: Optional[str] = None
    target_start_period: Optional[str] = None
    min_salary: Optional[int] = None
    bio_summary: Optional[str] = None
    serendipity_exploration_weight: Optional[float] = None


class UserProfileResponse(BaseModel):
    id: int
    full_name: str
    email: str
    phone: Optional[str] = None
    school: str
    degree_level: str
    target_roles: List[str]
    target_locations: List[str]
    target_asset_classes: List[str]
    technical_skills: List[str]
    target_duration: str
    target_start_period: str
    min_salary: int
    bio_summary: Optional[str] = None
    serendipity_exploration_weight: float
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- SCRAPING & SYNC SCHEMAS ---
class ScrapeRequest(BaseModel):
    keywords: str = "stage assistant trader paris"
    location: Optional[str] = "Paris"
    limit: int = 15
    scrape_google: bool = True


class ScrapeUrlRequest(BaseModel):
    url: str


class SyncResponse(BaseModel):
    status: str
    total_scraped: int
    verified_valid: int
    invalid_discarded: int
    new_added: int
    timestamp: str


# --- KNN RECOMMENDATION SCHEMAS ---
class RecommendationItem(BaseModel):
    offer: JobOfferResponse
    similarity_score: float
    is_serendipity_gem: bool
    match_reasons: List[str]
    desk_adjacency_tag: Optional[str] = None


class RecommendationResponse(BaseModel):
    top_direct_matches: List[RecommendationItem]
    serendipity_gems: List[RecommendationItem]
    total_evaluated: int
    profile_summary: str


# --- APPLICATION PITCH GENERATOR SCHEMAS ---
class ApplyPitchRequest(BaseModel):
    offer_id: Optional[int] = None
    job_title: str
    company: str
    desk: str
    candidate_profile_override: Optional[dict] = None


class ApplyPitchResponse(BaseModel):
    subject: str
    cover_letter: str
    quick_email_pitch: str
    mailto_url: str
    recommended_portfolio_bullets: List[str]


# --- BANK DIRECTORY & LIVE SEARCH SCHEMAS ---
class BankDirectoryItem(BaseModel):
    id: str
    name: str
    category: str
    region: str
    career_portal_url: str
    search_url_template: str
    specialties: List[str]


class LiveBankSearchRequest(BaseModel):
    keyword: str
    bank_ids: Optional[List[str]] = None
    location: str = "Paris"
    start_period: Optional[str] = None


class LiveBankSearchResultItem(BaseModel):
    title: str
    company: str
    location: str
    desk: str
    asset_class: str
    contract_type: str
    description: str
    requirements: Optional[str] = None
    url: str
    bank_career_portal_url: Optional[str] = None
    bank_search_url: Optional[str] = None
    salary_monthly: int
    source: str
    date_posted: str
    start_date: str
    end_date: str
    duration_months: str
    tags: str
    bank_id: str
    bank_category: str
    url_status: int = 200
    is_verified: bool = True

