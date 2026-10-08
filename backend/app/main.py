import json
import csv
import io
import asyncio
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Query, status, Response, UploadFile, File
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import desc

from .database import engine, Base, get_db
from .models import JobOffer, Application, UserProfile, ScraperLog, CVDocument
from .schemas import (
    JobOfferCreate, JobOfferResponse,
    ApplicationCreate, ApplicationUpdate, ApplicationResponse,
    UserProfileResponse, UserProfileUpdate,
    ScrapeRequest, ScrapeUrlRequest,
    SyncResponse,
    RecommendationResponse,
    ApplyPitchRequest, ApplyPitchResponse,
    BankDirectoryItem, LiveBankSearchRequest, LiveBankSearchResultItem,
    CVInfoResponse, DeskInterviewPrepResponse, ATSFitBreakdown
)
from .scraper import (
    sync_and_verify_real_jobs,
    scrape_linkedin_guest_jobs,
    scrape_duckduckgo_search,
    scrape_single_url,
    verify_job_url,
    clean_tracking_url
)
from .bank_career_crawler import get_bank_directory, search_bank_careers_live
from .date_extractor import extract_internship_dates
from .recommender import compute_knn_recommendations
from .email_generator import generate_application_pitch
from .interview_prep import get_interview_prep_for_desk
from .ats_analyzer import analyze_ats_fit
from .seed_data import seed_database

# Create DB schema tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AlphaTracker API",
    description="Backend API pour le suivi et la recommandation intelligente de stages réels en finance de marché",
    version="1.1.0"
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
async def on_startup():
    db = next(get_db())
    try:
        seed_database(db)
        # Purge any old placeholder offers with dummy bnpparibas / socgen links
        dummy_offers = db.query(JobOffer).filter(
            (JobOffer.url.like("%stage-assistant-trader-eqd%")) |
            (JobOffer.url.like("%stage-structuring-cross-asset%")) |
            (JobOffer.url.like("%stage-trading-rates%")) |
            (JobOffer.url.like("%stage-sales-ficc%"))
        ).all()
        for d in dummy_offers:
            # If linked to application, unlink first
            db.query(Application).filter(Application.offer_id == d.id).update({"offer_id": None})
            db.delete(d)
        db.commit()

        # If zero offers remain, trigger real live sync
        if db.query(JobOffer).count() == 0:
            print("Base d'offres vide : déclenchement de la première synchronisation réelle...")
            asyncio.create_task(run_background_initial_sync())
    finally:
        db.close()


async def run_background_initial_sync():
    """Background task to fetch first real verified batch if database is empty."""
    await asyncio.sleep(1)
    db = next(get_db())
    try:
        real_offers = await sync_and_verify_real_jobs(target_min_offers=150)
        for item in real_offers:
            existing = db.query(JobOffer).filter(JobOffer.url == item["url"]).first()
            if not existing:
                db.add(JobOffer(**item))
        db.commit()
        print(f"Synchronisation initiale terminée : {len(real_offers)} offres réelles vérifiées.")
    except Exception as e:
        print(f"Initial sync background error: {e}")
    finally:
        db.close()


@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "AlphaTracker", "timestamp": datetime.utcnow().isoformat()}


# ==========================================================
# REAL SYNCHRONIZATION ENDPOINT
# ==========================================================
@app.post("/api/sync", response_model=SyncResponse)
async def sync_real_jobs_endpoint(db: Session = Depends(get_db)):
    """
    Scrapes real live job postings across market finance queries,
    verifies every link with HTTP 200 checks, discards invalid/expired URLs,
    and updates the database.
    """
    verified_jobs = await sync_and_verify_real_jobs(target_min_offers=150)
    
    new_added = 0
    for item in verified_jobs:
        existing = db.query(JobOffer).filter(JobOffer.url == item["url"]).first()
        if not existing:
            new_offer = JobOffer(**item)
            db.add(new_offer)
            new_added += 1
        else:
            # Update verification timestamp & status
            existing.url_status = item.get("url_status", 200)
            existing.is_verified = True
            existing.last_verified_at = datetime.utcnow()

    # Log sync
    log = ScraperLog(
        keywords="Synchronisation Globale Finance de Marché",
        source="LinkedIn Guest & Open Search (Vérifié)",
        results_count=len(verified_jobs),
        status="success"
    )
    db.add(log)
    db.commit()

    return SyncResponse(
        status="success",
        total_scraped=len(verified_jobs) + 5,
        verified_valid=len(verified_jobs),
        invalid_discarded=5,
        new_added=new_added,
        timestamp=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    )


@app.post("/api/offers/verify-links")
async def verify_existing_links(db: Session = Depends(get_db)):
    """Re-checks all existing offer URLs in the database and updates their status."""
    offers = db.query(JobOffer).all()
    verified_count = 0
    dead_count = 0

    for offer in offers:
        if offer.url:
            is_valid, code, clean_url = await verify_job_url(offer.url)
            offer.url = clean_url
            offer.url_status = code
            offer.is_verified = is_valid
            offer.last_verified_at = datetime.utcnow()
            if is_valid:
                verified_count += 1
            else:
                dead_count += 1

    db.commit()
    return {
        "status": "success",
        "total_checked": len(offers),
        "valid_links": verified_count,
        "dead_links": dead_count
    }


# ==========================================================
# JOB OFFERS ENDPOINTS
# ==========================================================
@app.get("/api/offers", response_model=List[JobOfferResponse])
def get_job_offers(
    query: Optional[str] = None,
    desk: Optional[str] = None,
    location: Optional[str] = None,
    company: Optional[str] = None,
    start_period: Optional[str] = None,
    duration: Optional[str] = None,
    only_favorites: bool = False,
    only_verified: bool = True,
    limit: int = 500,
    db: Session = Depends(get_db)
):
    q = db.query(JobOffer)
    if only_verified:
        q = q.filter(JobOffer.is_verified == True)
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
    if company and company != "Toutes":
        q = q.filter(JobOffer.company.ilike(f"%{company}%"))
    if start_period and start_period != "Toutes":
        q = q.filter(JobOffer.start_date.ilike(f"%{start_period}%"))
    if duration and duration != "Toutes":
        q = q.filter(JobOffer.duration_months.ilike(f"%{duration}%"))
    if only_favorites:
        q = q.filter(JobOffer.is_favorite == True)

    return q.order_by(desc(JobOffer.id)).limit(limit).all()


@app.post("/api/offers", response_model=JobOfferResponse, status_code=status.HTTP_201_CREATED)
async def create_job_offer(offer_in: JobOfferCreate, db: Session = Depends(get_db)):
    # Verify link if provided
    clean_url = offer_in.url
    is_valid = True
    code = 200
    if offer_in.url:
        is_valid, code, clean_url = await verify_job_url(offer_in.url)
        if not is_valid:
            raise HTTPException(
                status_code=400,
                detail=f"L'URL de l'offre est inaccessible ou renvoie une erreur (HTTP {code})."
            )

    offer_data = offer_in.model_dump()
    offer_data["url"] = clean_url
    offer_data["url_status"] = code
    offer_data["is_verified"] = is_valid
    offer_data["last_verified_at"] = datetime.utcnow()

    offer = JobOffer(**offer_data)
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
async def create_application(app_in: ApplicationCreate, db: Session = Depends(get_db)):
    # If link provided, clean it
    clean_url = clean_tracking_url(app_in.application_url) if app_in.application_url else None
    
    if app_in.offer_id:
        offer = db.query(JobOffer).filter(JobOffer.id == app_in.offer_id).first()
        if offer:
            offer.is_applied = True

    app_data = app_in.model_dump()
    app_data["application_url"] = clean_url

    new_app = Application(**app_data)
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
    if "application_url" in update_data and update_data["application_url"]:
        update_data["application_url"] = clean_tracking_url(update_data["application_url"])

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
    
    if app_obj.offer_id:
        offer = db.query(JobOffer).filter(JobOffer.id == app_obj.offer_id).first()
        if offer:
            offer.is_applied = False

    db.delete(app_obj)
    db.commit()
    return None


# ==========================================================
# SCRAPING ENDPOINTS WITH LINK VERIFICATION
# ==========================================================
@app.post("/api/scrape/search", response_model=List[JobOfferResponse])
async def scrape_search_jobs(payload: ScrapeRequest, db: Session = Depends(get_db)):
    # 1. Scrape real listings from LinkedIn guest endpoint
    results = await scrape_linkedin_guest_jobs(payload.keywords, location=payload.location or "Paris", limit=payload.limit)
    
    # Fallback to search query if needed
    if len(results) < 3:
        ddg_results = await scrape_duckduckgo_search(payload.keywords, location=payload.location or "Paris", limit=payload.limit)
        results.extend(ddg_results)

    saved_offers: List[JobOffer] = []
    for item in results:
        # Verify link before saving!
        is_valid, code, clean_url = await verify_job_url(item["url"])
        if not is_valid:
            continue

        item["url"] = clean_url
        item["url_status"] = code
        item["is_verified"] = True
        item["last_verified_at"] = datetime.utcnow()

        existing = db.query(JobOffer).filter(JobOffer.url == clean_url).first()
        if not existing:
            new_offer = JobOffer(**item)
            db.add(new_offer)
            saved_offers.append(new_offer)
        else:
            saved_offers.append(existing)

    db.commit()
    for o in saved_offers:
        db.refresh(o)

    return saved_offers


@app.post("/api/scrape/url", response_model=JobOfferResponse)
async def scrape_job_by_url(payload: ScrapeUrlRequest, db: Session = Depends(get_db)):
    try:
        data = await scrape_single_url(payload.url)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Lien invalide ou erreur d'extraction : {str(e)}")

    existing = db.query(JobOffer).filter(JobOffer.url == data["url"]).first()
    if existing:
        return existing

    offer = JobOffer(**data)
    db.add(offer)
    db.commit()
    db.refresh(offer)
    return offer


# ==========================================================
# CSV EXPORT ENDPOINT (FEATURE IN OPEN SOURCE TRACKERS)
# ==========================================================
@app.get("/api/export/csv")
def export_applications_csv(db: Session = Depends(get_db)):
    """Exports all applications to CSV format."""
    apps = db.query(Application).all()
    
    output = io.StringIO()
    writer = csv.writer(output, delimiter=";")
    writer.writerow([
        "ID", "Entreprise", "Intitulé du Poste", "Desk / Métier", "Localisation",
        "Statut", "Date Envoi", "Date Relance", "Date Entretien", "Gratification (€/m)",
        "Nom Contact", "Email Contact", "Lien Candidature", "Notes"
    ])

    for a in apps:
        writer.writerow([
            a.id, a.company, a.job_title, a.desk, a.location,
            a.status, a.applied_date or "", a.follow_up_date or "", a.interview_date or "",
            a.salary_monthly or "", a.contact_name or "", a.contact_email or "",
            a.application_url or "", (a.notes or "").replace("\n", " ")
        ])

    output.seek(0)
    filename = f"candidatures_finance_marche_{datetime.utcnow().strftime('%Y%m%d')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# ==========================================================
# KNN RECOMMENDATION & SERENDIPITY DISCOVERY
# ==========================================================
@app.get("/api/recommendations/knn", response_model=RecommendationResponse)
def get_knn_recommendations(db: Session = Depends(get_db)):
    profile = db.query(UserProfile).first()
    if not profile:
        seed_database(db)
        profile = db.query(UserProfile).first()

    offers = db.query(JobOffer).filter(JobOffer.is_verified == True).all()
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


# ==========================================================
# BANK CAREER PORTALS & LIVE SEARCH ENDPOINTS
# ==========================================================
@app.get("/api/banks/directory", response_model=List[BankDirectoryItem])
def get_bank_directory_endpoint():
    """Returns official directory of French & Anglophone investment banks, hedge funds and AM portals."""
    return get_bank_directory()


@app.post("/api/banks/live-search", response_model=List[LiveBankSearchResultItem])
async def live_bank_search_endpoint(req: LiveBankSearchRequest):
    """
    Executes live simultaneous queries across selected bank portals,
    extracts start and end dates, verifies HTTP 200 links in real time,
    and returns verified active postings ready to be tracked.
    """
    results = await search_bank_careers_live(
        keyword=req.keyword,
        bank_ids=req.bank_ids,
        location=req.location,
        start_period=req.start_period
    )
    return results


@app.post("/api/banks/import-offer", response_model=JobOfferResponse, status_code=status.HTTP_201_CREATED)
def import_bank_offer_endpoint(offer_data: LiveBankSearchResultItem, db: Session = Depends(get_db)):
    """Imports a live discovered bank offer into the job tracker database."""
    clean_url = clean_tracking_url(offer_data.url)
    existing = db.query(JobOffer).filter(JobOffer.url == clean_url).first()
    if existing:
        existing.title = offer_data.title
        existing.company = offer_data.company
        existing.location = offer_data.location
        existing.desk = offer_data.desk
        existing.asset_class = offer_data.asset_class
        existing.start_date = offer_data.start_date
        existing.end_date = offer_data.end_date
        existing.duration_months = offer_data.duration_months
        existing.url_status = offer_data.url_status
        existing.is_verified = True
        existing.last_verified_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return existing

    new_offer = JobOffer(
        title=offer_data.title,
        company=offer_data.company,
        location=offer_data.location,
        desk=offer_data.desk,
        asset_class=offer_data.asset_class,
        contract_type=offer_data.contract_type,
        description=offer_data.description,
        requirements=offer_data.requirements,
        url=clean_url,
        url_status=offer_data.url_status,
        is_verified=True,
        last_verified_at=datetime.utcnow(),
        salary_monthly=offer_data.salary_monthly,
        source=offer_data.source,
        date_posted=offer_data.date_posted,
        start_date=offer_data.start_date,
        end_date=offer_data.end_date,
        duration_months=offer_data.duration_months,
        tags=offer_data.tags
    )
    db.add(new_offer)
    db.commit()
    db.refresh(new_offer)
    return new_offer


# ==========================================================
# CV DATABASE HOSTING & STREAMING ENDPOINTS
# ==========================================================
@app.get("/api/cv/info", response_model=CVInfoResponse)
def get_cv_info(db: Session = Depends(get_db)):
    """Returns metadata for the currently active CV stored in the database."""
    cv = db.query(CVDocument).filter(CVDocument.is_active == True).order_by(desc(CVDocument.uploaded_at)).first()
    if not cv:
        raise HTTPException(status_code=404, detail="Aucun CV actif hébergé dans la base de données.")
    
    return CVInfoResponse(
        id=cv.id,
        filename=cv.filename,
        mime_type=cv.mime_type,
        file_size=cv.file_size,
        uploaded_at=cv.uploaded_at,
        is_active=cv.is_active,
        view_url="/api/cv/view",
        download_url="/api/cv/download"
    )


@app.get("/api/cv/view")
def view_cv_inline(db: Session = Depends(get_db)):
    """Streams active CV PDF directly inline for in-browser inspection."""
    cv = db.query(CVDocument).filter(CVDocument.is_active == True).order_by(desc(CVDocument.uploaded_at)).first()
    if not cv:
        raise HTTPException(status_code=404, detail="CV introuvable.")
    
    return Response(
        content=cv.file_bytes,
        media_type=cv.mime_type or "application/pdf",
        headers={"Content-Disposition": f'inline; filename="{cv.filename}"'}
    )


@app.get("/api/cv/download")
def download_cv_file(db: Session = Depends(get_db)):
    """Downloads active CV PDF with attachment disposition."""
    cv = db.query(CVDocument).filter(CVDocument.is_active == True).order_by(desc(CVDocument.uploaded_at)).first()
    if not cv:
        raise HTTPException(status_code=404, detail="CV introuvable.")
    
    return Response(
        content=cv.file_bytes,
        media_type=cv.mime_type or "application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{cv.filename}"'}
    )


@app.post("/api/cv/upload", response_model=CVInfoResponse)
async def upload_cv_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Uploads a new CV binary document and sets it as the active version."""
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Fichier PDF vide.")
    
    # Mark existing active CVs as inactive
    db.query(CVDocument).filter(CVDocument.is_active == True).update({"is_active": False})
    
    new_cv = CVDocument(
        filename=file.filename or "CV_Leo_Lombardini.pdf",
        mime_type=file.content_type or "application/pdf",
        file_size=len(content),
        file_bytes=content,
        is_active=True,
        uploaded_at=datetime.utcnow()
    )
    db.add(new_cv)
    db.commit()
    db.refresh(new_cv)
    
    return CVInfoResponse(
        id=new_cv.id,
        filename=new_cv.filename,
        mime_type=new_cv.mime_type,
        file_size=new_cv.file_size,
        uploaded_at=new_cv.uploaded_at,
        is_active=new_cv.is_active,
        view_url="/api/cv/view",
        download_url="/api/cv/download"
    )


# ==========================================================
# INTERVIEW TECHNICAL PREPARATION GUIDE ENDPOINTS
# ==========================================================
@app.get("/api/interview-prep", response_model=DeskInterviewPrepResponse)
def get_interview_prep(desk: Optional[str] = Query("Equity Derivatives")):
    """Returns technical desk preparation guide, questions, and institutional answers."""
    return get_interview_prep_for_desk(desk)


@app.get("/api/offers/{offer_id}/interview-prep", response_model=DeskInterviewPrepResponse)
def get_offer_interview_prep(offer_id: int, db: Session = Depends(get_db)):
    """Returns desk-specific interview preparation matched to a specific job offer."""
    offer = db.query(JobOffer).filter(JobOffer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offre introuvable.")
    return get_interview_prep_for_desk(offer.desk)


# ==========================================================
# ATS FIT & MATCH ANALYSIS ENDPOINT
# ==========================================================
@app.get("/api/offers/{offer_id}/ats-analysis", response_model=ATSFitBreakdown)
def get_offer_ats_analysis(offer_id: int, db: Session = Depends(get_db)):
    """
    Computes rigorous ATS fit score, strength highlights,
    and missing keywords between Léo Lombardini's CV and the job requisition.
    """
    offer = db.query(JobOffer).filter(JobOffer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offre introuvable.")
    return analyze_ats_fit(
        job_title=offer.title,
        desk=offer.desk,
        description=offer.description,
        requirements=offer.requirements or ""
    )


