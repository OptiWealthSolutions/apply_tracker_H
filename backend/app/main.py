import json
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import desc

from .database import engine, Base, get_db
from .models import JobOffer, Application, UserProfile, ScraperLog
from .schemas import (
    JobOfferCreate, JobOfferResponse,
    ApplicationCreate, ApplicationUpdate, ApplicationResponse,
    UserProfileResponse, UserProfileUpdate,
    ScrapeRequest, ScrapeUrlRequest,
    RecommendationResponse,
    ApplyPitchRequest, ApplyPitchResponse
)
from .scraper import scrape_google_search, scrape_single_url
from .recommender import compute_knn_recommendations
from .email_generator import generate_application_pitch
from .seed_data import seed_database

# Create DB schema tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AlphaTracker API",
    description="Backend API pour le suivi et la recommandation intelligente de stages en finance de marché",
    version="1.0.0"
)

# Enable CORS for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    db = next(get_db())
    try:
        seed_database(db)
    finally:
        db.close()


@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "AlphaTracker", "timestamp": datetime.utcnow().isoformat()}


# ==========================================================
# JOB OFFERS ENDPOINTS
# ==========================================================
@app.get("/api/offers", response_model=List[JobOfferResponse])
def get_job_offers(
    query: Optional[str] = None,
    desk: Optional[str] = None,
    location: Optional[str] = None,
    only_favorites: bool = False,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    q = db.query(JobOffer)
    if query:
        filter_str = f"%{query}%"
        q = q.filter(
            (JobOffer.title.ilike(filter_str)) |
            (JobOffer.company.ilike(filter_str)) |
            (JobOffer.description.ilike(filter_str)) |
            (JobOffer.tags.ilike(filter_str))
        )
    if desk and desk != "Tous":
        q = q.filter(JobOffer.desk == desk)
    if location and location != "Toutes":
        q = q.filter(JobOffer.location.ilike(f"%{location}%"))
    if only_favorites:
        q = q.filter(JobOffer.is_favorite == True)

    return q.order_by(desc(JobOffer.id)).limit(limit).all()


@app.post("/api/offers", response_model=JobOfferResponse, status_code=status.HTTP_201_CREATED)
def create_job_offer(offer_in: JobOfferCreate, db: Session = Depends(get_db)):
    offer = JobOffer(**offer_in.model_dump())
    db.add(offer)
    db.commit()
    db.refresh(offer)
    return offer


@app.get("/api/offers/{offer_id}", response_model=JobOfferResponse)
def get_job_offer(offer_id: int, db: Session = Depends(get_db)):
    offer = db.query(JobOffer).filter(JobOffer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offre introuvable")
    return offer


@app.post("/api/offers/{offer_id}/toggle-favorite")
def toggle_offer_favorite(offer_id: int, db: Session = Depends(get_db)):
    offer = db.query(JobOffer).filter(JobOffer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offre introuvable")
    offer.is_favorite = not offer.is_favorite
    db.commit()
    return {"id": offer.id, "is_favorite": offer.is_favorite}


@app.delete("/api/offers/{offer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job_offer(offer_id: int, db: Session = Depends(get_db)):
    offer = db.query(JobOffer).filter(JobOffer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offre introuvable")
    db.delete(offer)
    db.commit()
    return None


# ==========================================================
# APPLICATIONS / TRACKER ENDPOINTS
# ==========================================================
@app.get("/api/applications", response_model=List[ApplicationResponse])
def get_applications(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db)
):
    q = db.query(Application)
    if status_filter and status_filter != "all":
        q = q.filter(Application.status == status_filter)
    return q.order_by(desc(Application.updated_at)).all()


@app.post("/api/applications", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def create_application(app_in: ApplicationCreate, db: Session = Depends(get_db)):
    # If linked to an offer, update is_applied flag
    if app_in.offer_id:
        offer = db.query(JobOffer).filter(JobOffer.id == app_in.offer_id).first()
        if offer:
            offer.is_applied = True

    new_app = Application(**app_in.model_dump())
    if not new_app.applied_date and new_app.status in ["applied", "interviewing", "offer_received"]:
        new_app.applied_date = datetime.utcnow().strftime("%Y-%m-%d")

    db.add(new_app)
    db.commit()
    db.refresh(new_app)
    return new_app


@app.get("/api/applications/{app_id}", response_model=ApplicationResponse)
def get_application(app_id: int, db: Session = Depends(get_db)):
    app_obj = db.query(Application).filter(Application.id == app_id).first()
    if not app_obj:
        raise HTTPException(status_code=404, detail="Candidature introuvable")
    return app_obj


@app.put("/api/applications/{app_id}", response_model=ApplicationResponse)
def update_application(app_id: int, app_in: ApplicationUpdate, db: Session = Depends(get_db)):
    app_obj = db.query(Application).filter(Application.id == app_id).first()
    if not app_obj:
        raise HTTPException(status_code=404, detail="Candidature introuvable")

    update_data = app_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(app_obj, field, val)

    app_obj.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(app_obj)
    return app_obj


@app.delete("/api/applications/{app_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(app_id: int, db: Session = Depends(get_db)):
    app_obj = db.query(Application).filter(Application.id == app_id).first()
    if not app_obj:
        raise HTTPException(status_code=404, detail="Candidature introuvable")
    
    # Reset offer flag if linked
    if app_obj.offer_id:
        offer = db.query(JobOffer).filter(JobOffer.id == app_obj.offer_id).first()
        if offer:
            offer.is_applied = False

    db.delete(app_obj)
    db.commit()
    return None


# ==========================================================
# SCRAPING ENDPOINTS (GOOGLE & WEB KEYWORDS)
# ==========================================================
@app.post("/api/scrape/search", response_model=List[JobOfferResponse])
async def scrape_search_jobs(payload: ScrapeRequest, db: Session = Depends(get_db)):
    results = await scrape_google_search(payload.keywords, limit=payload.limit)
    
    saved_offers: List[JobOffer] = []
    for item in results:
        # Avoid duplicate URLs
        existing = db.query(JobOffer).filter(JobOffer.url == item["url"]).first()
        if not existing:
            new_offer = JobOffer(**item)
            db.add(new_offer)
            saved_offers.append(new_offer)
        else:
            saved_offers.append(existing)

    # Log scrape
    log = ScraperLog(
        keywords=payload.keywords,
        source="Google / DuckDuckGo",
        results_count=len(saved_offers),
        status="success"
    )
    db.add(log)
    db.commit()
    
    for o in saved_offers:
        db.refresh(o)

    return saved_offers


@app.post("/api/scrape/url", response_model=JobOfferResponse)
async def scrape_job_by_url(payload: ScrapeUrlRequest, db: Session = Depends(get_db)):
    try:
        data = await scrape_single_url(payload.url)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erreur d'extraction de l'URL : {str(e)}")

    existing = db.query(JobOffer).filter(JobOffer.url == payload.url).first()
    if existing:
        return existing

    offer = JobOffer(**data)
    db.add(offer)
    db.commit()
    db.refresh(offer)
    return offer


# ==========================================================
# KNN RECOMMENDATION & SERENDIPITY DISCOVERY
# ==========================================================
@app.get("/api/recommendations/knn", response_model=RecommendationResponse)
def get_knn_recommendations(db: Session = Depends(get_db)):
    profile = db.query(UserProfile).first()
    if not profile:
        seed_database(db)
        profile = db.query(UserProfile).first()

    offers = db.query(JobOffer).all()
    recommendations = compute_knn_recommendations(offers, profile, top_k=8, serendipity_k=6)
    return recommendations


# ==========================================================
# USER PROFILE & PREFERENCES
# ==========================================================
@app.get("/api/profile", response_model=UserProfileResponse)
def get_user_profile(db: Session = Depends(get_db)):
    profile = db.query(UserProfile).first()
    if not profile:
        seed_database(db)
        profile = db.query(UserProfile).first()

    def parse_field(val):
        if not val:
            return []
        if isinstance(val, list):
            return val
        try:
            return json.loads(val)
        except Exception:
            return [x.strip() for x in str(val).split(",") if x.strip()]

    return UserProfileResponse(
        id=profile.id,
        full_name=profile.full_name,
        email=profile.email,
        phone=profile.phone,
        school=profile.school,
        degree_level=profile.degree_level,
        target_roles=parse_field(profile.target_roles),
        target_locations=parse_field(profile.target_locations),
        target_asset_classes=parse_field(profile.target_asset_classes),
        technical_skills=parse_field(profile.technical_skills),
        target_duration=profile.target_duration,
        target_start_period=profile.target_start_period,
        min_salary=profile.min_salary,
        bio_summary=profile.bio_summary,
        serendipity_exploration_weight=profile.serendipity_exploration_weight,
        updated_at=profile.updated_at
    )


@app.put("/api/profile", response_model=UserProfileResponse)
def update_user_profile(profile_in: UserProfileUpdate, db: Session = Depends(get_db)):
    profile = db.query(UserProfile).first()
    if not profile:
        profile = UserProfile()
        db.add(profile)

    update_dict = profile_in.model_dump(exclude_unset=True)
    for key, val in update_dict.items():
        if key in ["target_roles", "target_locations", "target_asset_classes", "technical_skills"]:
            setattr(profile, key, json.dumps(val) if isinstance(val, list) else str(val))
        else:
            setattr(profile, key, val)

    profile.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(profile)

    return get_user_profile(db)


# ==========================================================
# DIRECT APPLICATION & PITCH GENERATION
# ==========================================================
@app.post("/api/pitch/generate", response_model=ApplyPitchResponse)
def generate_pitch(payload: ApplyPitchRequest, db: Session = Depends(get_db)):
    profile = db.query(UserProfile).first()
    direct_email = None
    if payload.offer_id:
        offer = db.query(JobOffer).filter(JobOffer.id == payload.offer_id).first()
        if offer and offer.direct_apply_email:
            direct_email = offer.direct_apply_email

    candidate_name = profile.full_name if profile else "Candidat Finance"
    candidate_email = profile.email if profile else "candidat@email.com"
    candidate_school = profile.school if profile else "Grande École"

    pitch_data = generate_application_pitch(
        candidate_name=candidate_name,
        candidate_email=candidate_email,
        candidate_school=candidate_school,
        company=payload.company,
        job_title=payload.job_title,
        desk=payload.desk,
        direct_email=direct_email
    )
    return ApplyPitchResponse(**pitch_data)


# ==========================================================
# ANALYTICS ENDPOINT
# ==========================================================
@app.get("/api/analytics")
def get_analytics(db: Session = Depends(get_db)):
    apps = db.query(Application).all()
    total_apps = len(apps)
    
    status_counts = {
        "saved": 0,
        "applied": 0,
        "follow_up_needed": 0,
        "interviewing": 0,
        "offer_received": 0,
        "rejected": 0,
        "withdrawn": 0
    }
    
    desks_distribution = {}
    companies_distribution = {}
    
    for a in apps:
        status_counts[a.status] = status_counts.get(a.status, 0) + 1
        desks_distribution[a.desk] = desks_distribution.get(a.desk, 0) + 1
        companies_distribution[a.company] = companies_distribution.get(a.company, 0) + 1

    interview_rate = round((status_counts["interviewing"] + status_counts["offer_received"]) / max(1, total_apps) * 100, 1)
    offer_rate = round(status_counts["offer_received"] / max(1, total_apps) * 100, 1)

    return {
        "total_applications": total_apps,
        "status_breakdown": status_counts,
        "desks_distribution": desks_distribution,
        "companies_distribution": companies_distribution,
        "interview_conversion_rate": f"{interview_rate}%",
        "offer_rate": f"{offer_rate}%",
        "action_required_count": status_counts["follow_up_needed"],
        "active_interviews_count": status_counts["interviewing"]
    }
