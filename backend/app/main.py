import os
import json
import csv
import io
import asyncio
import urllib.parse
from pathlib import Path
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Query, status, Response, UploadFile, File
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import desc

from .database import engine, Base, get_db, ensure_sqlite_schema
from .models import JobOffer, Application, UserProfile, ScraperLog, CVDocument, BoutiqueContact
from .schemas import (
    JobOfferCreate, JobOfferResponse,
    ApplicationCreate, ApplicationUpdate, ApplicationResponse,
    UserProfileResponse, UserProfileUpdate,
    ScrapeRequest, ScrapeUrlRequest,
    SyncResponse,
    RecommendationResponse,
    DigestOfferItem, DigestResponse,
    ApplyPitchRequest, ApplyPitchResponse,
    BankDirectoryItem, LiveBankSearchRequest, LiveBankSearchResultItem,
    CVInfoResponse, DeskInterviewPrepResponse, ATSFitBreakdown,
    CVAuditRequest, CoverLetterAuditRequest
)
from .scraper import (
    sync_and_verify_real_jobs,
    scrape_linkedin_guest_jobs,
    scrape_duckduckgo_search,
    scrape_single_url,
    verify_job_url,
    clean_tracking_url
)
from .deep_page_validator import (
    NO_LOGIN_PLATFORMS,
    detect_ats_platform,
    detect_hard_constraints,
    extract_direct_email,
    is_login_required,
    is_offer_text_expired,
)
from .ats_poller import get_ats_health_snapshot
from .embedding_engine import qwen_ridge_engine, compute_freshness_meta, LEO_CV_CANONICAL_TEXT
from .bank_career_crawler import get_bank_directory, search_bank_careers_live
from .suggestions_directory import SUGGESTED_BOUTIQUES
from .boutique_contact_scraper import enrich_all_boutiques
from .local_llm import is_valid_person_candidate
from .date_extractor import extract_internship_dates
from .recommender import compute_knn_recommendations
from .email_generator import generate_application_pitch
from .interview_prep import get_interview_prep_for_desk
from .ats_analyzer import analyze_ats_fit
from .cv_quality_analyzer import audit_cv_content, audit_cover_letter, CVAuditResponse, CoverLetterAuditResponse
from .firm_expectations_and_resources import (
    get_firm_interview_expectations,
    get_educational_resources,
    FirmInterviewExpectation,
    EducationalResource,
)
from .seed_data import seed_database

# Create DB schema tables & safely migrate new columns
Base.metadata.create_all(bind=engine)
ensure_sqlite_schema()

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
    ensure_sqlite_schema()
    db = next(get_db())
    try:
        seed_database(db)
        # Ensure both CV variants ('trading' and 'buyside') exist in SQLite
        from .cv_generator import VARIANT_METADATA, generate_cv_pdf_bytes

        active_cv = db.query(CVDocument).filter(CVDocument.is_active == True).first()
        if active_cv and (not active_cv.extracted_text or len(active_cv.extracted_text.strip()) < 200):
            active_cv.extracted_text = LEO_CV_CANONICAL_TEXT
            if not active_cv.variant:
                active_cv.variant = "trading"
            if not active_cv.label:
                active_cv.label = VARIANT_METADATA["trading"]["label"]
            db.commit()

        for var_key, meta in VARIANT_METADATA.items():
            exists_var = (
                db.query(CVDocument)
                .filter(CVDocument.variant == var_key, CVDocument.is_active == True)
                .first()
            )
            if not exists_var:
                try:
                    import os
                    disk_cv = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "CV_Leo_Lombardini.pdf")
                    if os.path.exists(disk_cv):
                        with open(disk_cv, "rb") as f:
                            pdf_bytes = f.read()
                        plain_txt = LEO_CV_CANONICAL_TEXT
                    else:
                        pdf_bytes, plain_txt = generate_cv_pdf_bytes(var_key)
                    db.add(
                        CVDocument(
                            variant=var_key,
                            label=meta["label"],
                            filename="CV_Leo_Lombardini.pdf",
                            mime_type="application/pdf",
                            file_size=len(pdf_bytes),
                            file_bytes=pdf_bytes,
                            extracted_text=plain_txt,
                            is_active=True,
                            uploaded_at=datetime.utcnow(),
                        )
                    )
                    db.commit()
                except Exception as e:
                    print(f"CV variant {var_key} seeding warning: {e}")

        # Purge unavailable/expired/dummy offers so expired internships are never cited
        all_offers = db.query(JobOffer).all()
        for offer in all_offers:
            u = (offer.url or "").lower()
            is_dummy = any(
                p in u
                for p in [
                    "stage-assistant-trader-eqd",
                    "stage-structuring-cross-asset",
                    "stage-trading-rates",
                    "stage-sales-ficc",
                ]
            )
            if (
                is_dummy
                or not offer.is_verified
                or offer.url_status in (400, 404, 410)
                or is_offer_text_expired(offer.title or "", offer.description or "")
            ):
                db.query(Application).filter(Application.offer_id == offer.id).update({"offer_id": None})
                db.delete(offer)
            else:
                cleaned_offer_url = clean_tracking_url(offer.url or "")
                if cleaned_offer_url and cleaned_offer_url != offer.url:
                    existing_target = (
                        db.query(JobOffer)
                        .filter(JobOffer.url == cleaned_offer_url, JobOffer.id != offer.id)
                        .first()
                    )
                    if existing_target:
                        db.query(Application).filter(Application.offer_id == offer.id).update({"offer_id": existing_target.id})
                        db.delete(offer)
                        continue
                    offer.url = cleaned_offer_url
                    db.flush()
                offer.ats_platform = detect_ats_platform(offer.url or "", offer.source or "")
                if not offer.direct_apply_email:
                    found_email = extract_direct_email(offer.description or "")
                    if found_email:
                        offer.direct_apply_email = found_email
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
    Polls direct ATS feeds (Greenhouse/Lever/Ashby) + LinkedIn Guest,
    verifies every link with HTTP 200 checks, discards unavailable postings silently,
    and runs Qwen3 + Ridge scoring on active offers.
    """
    verified_jobs = await sync_and_verify_real_jobs(target_min_offers=150)

    new_added = 0
    for item in verified_jobs:
        item.pop("hard_flags_list", None)
        existing = db.query(JobOffer).filter(JobOffer.url == item["url"]).first()
        if not existing:
            new_offer = JobOffer(**item)
            db.add(new_offer)
            new_added += 1
        else:
            existing.url_status = item.get("url_status", 200)
            existing.is_verified = True
            existing.last_verified_at = datetime.utcnow()
            if item.get("date_posted"):
                existing.date_posted = item["date_posted"]
            if item.get("ats_platform"):
                existing.ats_platform = item["ats_platform"]

    log = ScraperLog(
        keywords="ATS Directs + Marché Finance Quant",
        source="Greenhouse / Lever / Ashby / LinkedIn (Actives)",
        results_count=len(verified_jobs),
        status="success"
    )
    db.add(log)
    db.commit()

    # Run Qwen3 + Ridge scoring on active offers
    active_offers = _active_offers_query(db).all()
    profile = db.query(UserProfile).first()
    qwen_ridge_engine.score_offers(active_offers, profile, db, persist_scores=True)

    return SyncResponse(
        status="success",
        total_scraped=len(verified_jobs),
        verified_valid=len(verified_jobs),
        invalid_discarded=0,
        new_added=new_added,
        timestamp=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    )


@app.post("/api/offers/verify-links")
async def verify_existing_links(db: Session = Depends(get_db)):
    """Concurrently re-checks all offer URLs and purges any unavailable postings."""
    offers = db.query(JobOffer).all()
    sem = asyncio.Semaphore(12)

    async def check_one(offer: JobOffer):
        if not offer.url:
            return offer, False, 404, ""
        async with sem:
            is_valid, code, clean_url = await verify_job_url(offer.url)
            return offer, is_valid, code, clean_url

    results = await asyncio.gather(*(check_one(o) for o in offers), return_exceptions=True)
    verified_count = 0
    dead_count = 0
    protected_count = 0

    for res in results:
        if isinstance(res, Exception):
            protected_count += 1
            continue
        offer, is_valid, code, clean_url = res
        expired_text = is_offer_text_expired(offer.title or "", offer.description or "")
        if is_valid and code == 200 and not expired_text:
            offer.url = clean_url
            offer.url_status = code
            offer.is_verified = True
            offer.last_verified_at = datetime.utcnow()
            verified_count += 1
        elif code in (400, 404, 410) or expired_text:
            # Remove only definitively dead or expired offers
            db.query(Application).filter(Application.offer_id == offer.id).update({"offer_id": None})
            db.delete(offer)
            dead_count += 1
        else:
            # Preserve offers behind rate limits / bot protection (403, 429, 999, 408, 5xx)
            offer.last_verified_at = datetime.utcnow()
            protected_count += 1

    db.commit()
    return {
        "status": "success",
        "total_checked": len(offers),
        "valid_links": verified_count,
        "dead_links": dead_count,
        "protected_skipped": protected_count,
    }


def _active_offers_query(db: Session):
    """Returns SQLAlchemy query strictly scoped to currently available, non-dismissed offers."""
    return db.query(JobOffer).filter(
        JobOffer.is_verified == True,
        JobOffer.url_status == 200,
        (JobOffer.is_dismissed == False) | (JobOffer.is_dismissed.is_(None)),
    )


# ==========================================================
# DAILY DIGEST & QWEN3 + RIDGE ENGINE ENDPOINTS
# ==========================================================
@app.get("/api/digest", response_model=DigestResponse)
def get_daily_digest(
    window_days: int = Query(7, ge=1, le=90),
    start_period: str = Query("all"),
    exclude_pure_quant: bool = Query(True),
    ats_platform: str = Query("all"),
    no_login_only: bool = Query(False),
    db: Session = Depends(get_db)
):
    """
    Personal Home Page Daily Digest:
    - Strictly filters out unavailable/expired/dismissed offers
    - Optional filtering by start_period ('all', 'juin_2027', 'janvier_2027', 'flexible', or custom string)
    - Excludes pure engineering/PhD quant roles by default for EDHEC Business School calibration
    - Scores all active offers with Qwen3-Embedding (256d) + Ridge Regression
    """
    profile = db.query(UserProfile).first()
    if not profile:
        seed_database(db)
        profile = db.query(UserProfile).first()

    raw_offers = _active_offers_query(db).all()
    offers = [
        o for o in raw_offers
        if not is_offer_text_expired(o.title or "", o.description or "")
    ]

    engine_res = qwen_ridge_engine.score_offers(offers, profile, db, persist_scores=True)
    scored_map = engine_res.get("scored", {})

    # Determine target roles for direct vs adjacent-gem split
    target_roles_lower: List[str] = []
    if profile and profile.target_roles:
        try:
            target_roles_lower = [r.lower() for r in json.loads(profile.target_roles)]
        except Exception:
            target_roles_lower = []

    def matches_start_filter(offer: JobOffer) -> bool:
        if not start_period or start_period == "all":
            return True
        sd = (offer.start_date or "").lower()
        hay = f"{sd} {offer.title or ''} {(offer.description or '')[:350]}".lower()
        if start_period == "juin_2027":
            return any(k in hay for k in ["juin 2027", "june 2027", "summer 2027", "été 2027", "juillet 2027", "july 2027"])
        if start_period == "janvier_2027":
            return any(k in hay for k in ["janvier 2027", "january 2027", "hiver 2027", "winter 2027"])
        if start_period == "septembre_2027":
            return any(k in hay for k in ["septembre 2027", "september 2027", "automne 2027"])
        if start_period == "flexible":
            return "flexible" in sd or "non précisée" in sd or not sd
        return start_period.lower() in hay

    enriched: List[DigestOfferItem] = []
    platform_counts: dict[str, int] = {}
    no_login_count = 0
    for o in offers:
        info = scored_map.get(o.id, {})
        q_score = float(info.get("qwen_score", o.qwen_score or 50.0))
        reasons = info.get("match_reasons") or []
        flags = info.get("hard_flags") or []
        if exclude_pure_quant and "Quant Pur / Ingé" in flags:
            continue
        if not matches_start_filter(o):
            continue

        days, f_label = compute_freshness_meta(o)
        ats_plat = detect_ats_platform(o.url or "", o.source or "") if not o.ats_platform else o.ats_platform
        login_req = is_login_required(ats_plat, o.url or "")
        platform_counts[ats_plat] = platform_counts.get(ats_plat, 0) + 1
        if not login_req:
            no_login_count += 1

        if ats_platform and ats_platform not in ("all", "Toutes") and ats_plat != ats_platform:
            continue
        if no_login_only and login_req:
            continue

        title_desk = f"{o.title or ''} {o.desk or ''}".lower()
        is_direct = any(r in title_desk for r in target_roles_lower) if target_roles_lower else True

        enriched.append(
            DigestOfferItem(
                offer=JobOfferResponse.model_validate(o),
                qwen_score=q_score,
                freshness_days=days,
                freshness_label=f_label,
                ats_platform=ats_plat,
                login_required=login_req,
                match_reasons=reasons,
                hard_flags=flags,
                is_serendipity_gem=not is_direct,
            )
        )

    # Sort newest-first (freshness_days asc, then id desc, then qwen_score desc)
    by_newest = sorted(
        enriched,
        key=lambda x: (
            x.freshness_days,
            -(x.offer.id),
            -x.qwen_score,
        ),
    )
    in_window = [item for item in by_newest if item.freshness_days <= window_days]
    latest_offers = (in_window if in_window else by_newest)[:24]

    # Top Qwen3 + Ridge picks
    actionable = [item for item in enriched if not item.offer.is_applied]
    top_qwen_picks = sorted(actionable, key=lambda x: x.qwen_score, reverse=True)[:16]

    serendipity_gems = sorted(
        [item for item in actionable if item.is_serendipity_gem],
        key=lambda x: x.qwen_score,
        reverse=True,
    )[:8]

    apps = db.query(Application).all()
    today_iso = datetime.utcnow().strftime("%Y-%m-%d")
    follow_up_count = sum(
        1
        for a in apps
        if a.status == "follow_up_needed" or (a.follow_up_date and a.follow_up_date <= today_iso and a.status == "applied")
    )
    interview_count = sum(1 for a in apps if a.status == "interviewing")

    return DigestResponse(
        generated_at=datetime.utcnow().strftime("%Y-%m-%d %H:%M"),
        window_days=window_days,
        target_start_period=profile.target_start_period or "Juin 2027",
        selected_start_filter=start_period,
        exclude_pure_quant=exclude_pure_quant,
        selected_platform=ats_platform,
        no_login_only=no_login_only,
        no_login_count=no_login_count,
        platform_counts=platform_counts,
        engine_name=engine_res.get("engine_name", "qwen3-embedding:0.6b + Ridge"),
        ollama_active=bool(engine_res.get("ollama_active", False)),
        ridge_samples=int(engine_res.get("ridge_samples", 0)),
        total_available=len(enriched),
        new_in_window_count=len(in_window),
        latest_offers=latest_offers,
        top_qwen_picks=top_qwen_picks,
        serendipity_gems=serendipity_gems,
        follow_up_alerts_count=follow_up_count,
        active_interviews_count=interview_count,
    )


@app.post("/api/embeddings/recalibrate")
def recalibrate_qwen_ridge(db: Session = Depends(get_db)):
    """Forces closed-form Ridge recalibration over Qwen3 embeddings from latest profile & feedback."""
    profile = db.query(UserProfile).first()
    offers = _active_offers_query(db).all()
    res = qwen_ridge_engine.score_offers(offers, profile, db, persist_scores=True)
    return {
        "status": "ok",
        "engine_name": res.get("engine_name"),
        "ollama_active": res.get("ollama_active"),
        "ridge_samples": res.get("ridge_samples"),
        "evaluated": len(offers),
    }


@app.get("/api/ats/health")
def ats_health():
    return get_ats_health_snapshot()


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
    ats_platform: Optional[str] = None,
    no_login_only: bool = False,
    only_favorites: bool = False,
    only_verified: bool = True,
    limit: int = 1000,
    db: Session = Depends(get_db)
):
    q = _active_offers_query(db)
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
    if ats_platform and ats_platform != "all":
        q = q.filter(JobOffer.ats_platform == ats_platform)
    if no_login_only:
        q = q.filter(JobOffer.ats_platform.in_(list(NO_LOGIN_PLATFORMS)))
    if only_favorites:
        q = q.filter(JobOffer.is_favorite == True)

    rows = q.order_by(desc(JobOffer.qwen_score), desc(JobOffer.date_posted), desc(JobOffer.id)).limit(limit).all()
    # Final strict guard: never surface expired offers
    return [r for r in rows if not is_offer_text_expired(r.title or "", r.description or "")]


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


@app.post("/api/offers/{offer_id}/dismiss")
def dismiss_offer(offer_id: int, db: Session = Depends(get_db)):
    offer = db.query(JobOffer).filter(JobOffer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offre introuvable")
    offer.is_dismissed = True
    db.commit()
    return {"id": offer.id, "is_dismissed": True}


@app.post("/api/offers/{offer_id}/restore")
def restore_offer(offer_id: int, db: Session = Depends(get_db)):
    offer = db.query(JobOffer).filter(JobOffer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offre introuvable")
    offer.is_dismissed = False
    db.commit()
    return {"id": offer.id, "is_dismissed": False}


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
    app_data["status_history"] = json.dumps([
        {"status": app_data.get("status", "applied"), "at": datetime.utcnow().strftime("%Y-%m-%d %H:%M")}
    ])

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

    prev_status = app_obj.status
    for field, val in update_data.items():
        setattr(app_obj, field, val)

    if "status" in update_data and update_data["status"] != prev_status:
        try:
            hist = json.loads(app_obj.status_history) if app_obj.status_history else []
        except Exception:
            hist = []
        hist.append({"status": update_data["status"], "at": datetime.utcnow().strftime("%Y-%m-%d %H:%M")})
        app_obj.status_history = json.dumps(hist)

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
    output.write("\ufeff")  # UTF-8 BOM for clean French Excel opening
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
        iter([output.getvalue().encode("utf-8")]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@app.get("/api/export/offers/csv")
def export_offers_csv(
    query: Optional[str] = None,
    desk: Optional[str] = None,
    location: Optional[str] = None,
    ats_platform: Optional[str] = None,
    no_login_only: bool = False,
    start_period: Optional[str] = None,
    exclude_pure_quant: bool = True,
    only_favorites: bool = False,
    db: Session = Depends(get_db)
):
    """
    Exports all currently available (verified, non-expired) internship offers
    in an Excel-ready UTF-8-BOM semicolon-delimited CSV file with direct apply links
    for easy sharing via WhatsApp or Email.
    """
    q = _active_offers_query(db)
    if query:
        f_str = f"%{query}%"
        q = q.filter(
            (JobOffer.title.ilike(f_str)) |
            (JobOffer.company.ilike(f_str)) |
            (JobOffer.desk.ilike(f_str)) |
            (JobOffer.location.ilike(f_str))
        )
    if desk and desk not in ("all", "Tous"):
        q = q.filter(JobOffer.desk == desk)
    if location and location not in ("all", "Toutes"):
        q = q.filter(JobOffer.location.ilike(f"%{location}%"))
    if ats_platform and ats_platform != "all":
        q = q.filter(JobOffer.ats_platform == ats_platform)
    if no_login_only:
        q = q.filter(JobOffer.ats_platform.in_(list(NO_LOGIN_PLATFORMS)))
    if only_favorites:
        q = q.filter(JobOffer.is_favorite == True)

    rows = q.order_by(desc(JobOffer.qwen_score), desc(JobOffer.date_posted), desc(JobOffer.id)).all()

    filtered_offers: List[JobOffer] = []
    for r in rows:
        if is_offer_text_expired(r.title or "", r.description or ""):
            continue
        if exclude_pure_quant and "quant pur" in (r.hard_flags or "").lower():
            continue
        if start_period and start_period not in ("all", "Toutes"):
            sd = (r.start_date or "").lower()
            hay = f"{sd} {r.title or ''} {(r.description or '')[:350]}".lower()
            if start_period == "juin_2027":
                if not any(k in hay for k in ["juin 2027", "june 2027", "summer 2027", "été 2027", "juillet 2027", "july 2027"]):
                    continue
            elif start_period == "janvier_2027":
                if not any(k in hay for k in ["janvier 2027", "january 2027", "hiver 2027", "winter 2027"]):
                    continue
            elif start_period == "septembre_2027":
                if not any(k in hay for k in ["septembre 2027", "september 2027", "automne 2027"]):
                    continue
            elif start_period == "flexible":
                if sd and "flexible" not in sd and "non précisée" not in sd:
                    continue
            elif start_period.lower() not in hay:
                continue
        filtered_offers.append(r)

    output = io.StringIO()
    output.write("\ufeff")
    writer = csv.writer(output, delimiter=";", quoting=csv.QUOTE_MINIMAL)
    writer.writerow([
        "Entreprise",
        "Intitulé du Poste",
        "Desk / Spécialisation",
        "Classe d'Actifs",
        "Localisation",
        "Type de Contrat",
        "Date de Début",
        "Date de Fin",
        "Durée",
        "Date Publication",
        "Gratification Est. (€/m)",
        "Score Pertinence (/100)",
        "Plateforme / Source",
        "Lien Direct pour Postuler",
        "Contraintes / Notes",
    ])

    for o in filtered_offers:
        flags_txt = ""
        if o.hard_flags:
            try:
                fl = json.loads(o.hard_flags)
                if isinstance(fl, list) and fl:
                    flags_txt = ", ".join(fl)
            except Exception:
                flags_txt = ""
        writer.writerow([
            (o.company or "").strip(),
            (o.title or "").strip(),
            (o.desk or "").strip(),
            (o.asset_class or "").strip(),
            (o.location or "").strip(),
            (o.contract_type or "").strip(),
            (o.start_date or "Flexible").strip(),
            (o.end_date or "").strip(),
            (o.duration_months or "6 mois").strip(),
            (o.date_posted or "").strip(),
            o.salary_monthly or "",
            round(float(o.qwen_score), 1) if o.qwen_score is not None else "",
            (o.ats_platform or o.source or "direct").upper(),
            (o.url or "").strip(),
            flags_txt,
        ])

    output.seek(0)
    filename = f"offres_stages_finance_{datetime.utcnow().strftime('%Y%m%d')}.csv"
    return StreamingResponse(
        iter([output.getvalue().encode("utf-8")]),
        media_type="text/csv; charset=utf-8",
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

    offers = [
        o for o in _active_offers_query(db).all()
        if not is_offer_text_expired(o.title or "", o.description or "")
    ]
    recommendations = compute_knn_recommendations(offers, profile, top_k=10, serendipity_k=8, db=db)
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
        target_domains=parse_field(getattr(profile, "target_domains", None)),
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
        if key in ["target_domains", "target_roles", "target_locations", "target_asset_classes", "technical_skills"]:
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
    direct_email = payload.direct_email
    location = payload.location or "Paris"
    offer_desc = payload.offer_description or ""
    offer_reqs = payload.offer_requirements or ""
    if payload.offer_id:
        offer = db.query(JobOffer).filter(JobOffer.id == payload.offer_id).first()
        if offer:
            if not direct_email and offer.direct_apply_email:
                direct_email = offer.direct_apply_email
            if offer.location:
                location = offer.location
            if not offer_desc and offer.description:
                offer_desc = offer.description
            if not offer_reqs and offer.requirements:
                offer_reqs = offer.requirements

    candidate_name = profile.full_name if profile else "Léo Lombardini"
    candidate_email = profile.email if profile else "llombardini.leo@gmail.com"
    candidate_school = profile.school if profile else "EDHEC Business School"

    pitch_data = generate_application_pitch(
        candidate_name=candidate_name,
        candidate_email=candidate_email,
        candidate_school=candidate_school,
        company=payload.company,
        job_title=payload.job_title,
        desk=payload.desk,
        direct_email=direct_email,
        location=location,
        contact_name=payload.contact_name,
        offer_description=offer_desc,
        offer_requirements=offer_reqs,
        use_llm=payload.use_llm,
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
# WTTJ & JOBTEASER EDHEC CONNECTORS / BATCH IMPORTS
# ==========================================================
@app.post("/api/import/batch")
def import_external_batch_endpoint(payload: dict, db: Session = Depends(get_db)):
    """Imports structured offers from Welcome to the Jungle or JobTeaser EDHEC bookmarklet/JSON."""
    from .connectors import import_batch_to_db

    source = str(payload.get("source") or "WTTJ")
    items = payload.get("items") or []
    if not isinstance(items, list):
        raise HTTPException(status_code=400, detail="items must be a list")
    res = import_batch_to_db(items, source, db)
    return {
        "status": "success",
        "source": source,
        "added": res["added"],
        "total_processed": res["total_processed"],
    }


@app.post("/api/import/jobteaser-text")
def import_jobteaser_text_endpoint(payload: dict, db: Session = Depends(get_db)):
    """Parses copied text/URLs or JSON from JobTeaser EDHEC / WTTJ and scores via Qwen3 + Ridge."""
    from .connectors import import_batch_to_db, parse_jobteaser_raw_text

    raw_text = str(payload.get("raw_text") or "")
    source = str(payload.get("source") or "JobTeaser EDHEC")
    items = parse_jobteaser_raw_text(raw_text)
    if not items:
        raise HTTPException(status_code=400, detail="Aucune offre avec URL valide détectée dans le texte collé.")
    res = import_batch_to_db(items, source, db)
    return {
        "status": "success",
        "source": source,
        "added": res["added"],
        "total_processed": res["total_processed"],
    }


# ==========================================================
# CV DATABASE HOSTING & 2-VARIANT STREAMING ENDPOINTS
# ==========================================================
def _get_cv_by_variant(db: Session, variant: Optional[str] = None) -> Optional[CVDocument]:
    q = db.query(CVDocument).filter(CVDocument.is_active == True)
    if variant:
        cv = q.filter(CVDocument.variant == variant).order_by(desc(CVDocument.uploaded_at)).first()
        if cv:
            return cv
    return q.order_by(desc(CVDocument.uploaded_at)).first()


@app.get("/api/cv/list", response_model=List[CVInfoResponse])
def list_cv_variants(db: Session = Depends(get_db)):
    """Lists all active CV variants ('trading' and 'buyside')."""
    rows = (
        db.query(CVDocument)
        .filter(CVDocument.is_active == True)
        .order_by(CVDocument.variant.asc(), desc(CVDocument.uploaded_at))
        .all()
    )
    seen = set()
    out: List[CVInfoResponse] = []
    for cv in rows:
        var = cv.variant or "trading"
        if var in seen:
            continue
        seen.add(var)
        out.append(
            CVInfoResponse(
                id=cv.id,
                variant=var,
                label=cv.label or var,
                filename=cv.filename,
                mime_type=cv.mime_type,
                file_size=cv.file_size,
                uploaded_at=cv.uploaded_at,
                is_active=cv.is_active,
                view_url=f"/api/cv/view?variant={var}",
                download_url=f"/api/cv/download?variant={var}",
            )
        )
    return out


@app.post("/api/cv/regenerate-variants", response_model=List[CVInfoResponse])
def regenerate_cv_variants_endpoint(db: Session = Depends(get_db)):
    """Regenerates crisp ATS-safe 1-page PDFs for both 'trading' and 'buyside' variants."""
    from .cv_generator import VARIANT_METADATA, generate_cv_pdf_bytes

    for var_key, meta in VARIANT_METADATA.items():
        pdf_bytes, plain_txt = generate_cv_pdf_bytes(var_key)
        db.query(CVDocument).filter(CVDocument.variant == var_key, CVDocument.is_active == True).update({"is_active": False})
        db.add(
            CVDocument(
                variant=var_key,
                label=meta["label"],
                filename=meta["filename"],
                mime_type="application/pdf",
                file_size=len(pdf_bytes),
                file_bytes=pdf_bytes,
                extracted_text=plain_txt,
                is_active=True,
                uploaded_at=datetime.utcnow(),
            )
        )
    db.commit()
    return list_cv_variants(db)


@app.get("/api/cv/info", response_model=CVInfoResponse)
def get_cv_info(variant: Optional[str] = Query(None), db: Session = Depends(get_db)):
    """Returns metadata for the active CV (optionally filtered by variant: 'trading' or 'buyside')."""
    cv = _get_cv_by_variant(db, variant)
    if not cv:
        raise HTTPException(status_code=404, detail="Aucun CV actif hébergé dans la base de données.")
    var = cv.variant or "trading"
    return CVInfoResponse(
        id=cv.id,
        variant=var,
        label=cv.label or var,
        filename=cv.filename,
        mime_type=cv.mime_type,
        file_size=cv.file_size,
        uploaded_at=cv.uploaded_at,
        is_active=cv.is_active,
        view_url=f"/api/cv/view?variant={var}",
        download_url=f"/api/cv/download?variant={var}",
    )


@app.get("/api/cv/view")
def view_cv_inline(variant: Optional[str] = Query(None), db: Session = Depends(get_db)):
    """Streams active CV PDF directly inline for in-browser inspection."""
    cv = _get_cv_by_variant(db, variant)
    if not cv:
        raise HTTPException(status_code=404, detail="CV introuvable.")
    return Response(
        content=cv.file_bytes,
        media_type=cv.mime_type or "application/pdf",
        headers={"Content-Disposition": f'inline; filename="{cv.filename}"'}
    )


@app.get("/api/cv/download")
def download_cv_file(variant: Optional[str] = Query(None), db: Session = Depends(get_db)):
    """Downloads active CV PDF with attachment disposition."""
    cv = _get_cv_by_variant(db, variant)
    if not cv:
        raise HTTPException(status_code=404, detail="CV introuvable.")
    return Response(
        content=cv.file_bytes,
        media_type=cv.mime_type or "application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{cv.filename}"'}
    )


@app.post("/api/cv/upload", response_model=CVInfoResponse)
async def upload_cv_document(
    file: UploadFile = File(...),
    variant: str = Query("trading"),
    db: Session = Depends(get_db)
):
    """Uploads a new CV binary document for the specified variant ('trading' or 'buyside')."""
    from .cv_generator import VARIANT_METADATA

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Fichier PDF vide.")

    var = variant if variant in VARIANT_METADATA else "trading"
    db.query(CVDocument).filter(CVDocument.variant == var, CVDocument.is_active == True).update({"is_active": False})

    extracted = ""
    try:
        import io
        import pypdf
        reader = pypdf.PdfReader(io.BytesIO(content))
        extracted = "\n".join(pg.extract_text() or "" for pg in reader.pages).strip()
    except Exception:
        extracted = ""

    new_cv = CVDocument(
        variant=var,
        label=VARIANT_METADATA[var]["label"],
        filename=file.filename or VARIANT_METADATA[var]["filename"],
        mime_type=file.content_type or "application/pdf",
        file_size=len(content),
        file_bytes=content,
        extracted_text=extracted or LEO_CV_CANONICAL_TEXT,
        is_active=True,
        uploaded_at=datetime.utcnow()
    )
    db.add(new_cv)
    db.commit()
    db.refresh(new_cv)

    return CVInfoResponse(
        id=new_cv.id,
        variant=var,
        label=new_cv.label,
        filename=new_cv.filename,
        mime_type=new_cv.mime_type,
        file_size=new_cv.file_size,
        uploaded_at=new_cv.uploaded_at,
        is_active=new_cv.is_active,
        view_url=f"/api/cv/view?variant={var}",
        download_url=f"/api/cv/download?variant={var}",
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


# ==========================================================
# CV & COVER LETTER QUALITY / KEYWORD RANKING AUDIT
# ==========================================================
@app.post("/api/cv/audit", response_model=CVAuditResponse)
def audit_cv_custom(req: CVAuditRequest):
    """Audits arbitrary or pasted CV text against institutional quality criteria."""
    return audit_cv_content(req.cv_text or "")


@app.get("/api/cv/audit/current", response_model=CVAuditResponse)
def audit_current_cv(db: Session = Depends(get_db)):
    """
    Audits the currently hosted CV document in SQLite database,
    extracting text or analyzing the candidate profile.
    """
    cv = db.query(CVDocument).filter(CVDocument.is_active == True).order_by(desc(CVDocument.uploaded_at)).first()
    extracted_text = ""
    if cv and cv.file_bytes:
        try:
            import io
            import pypdf
            reader = pypdf.PdfReader(io.BytesIO(cv.file_bytes))
            for page in reader.pages:
                txt = page.extract_text()
                if txt:
                    extracted_text += "\n" + txt
        except Exception:
            extracted_text = ""

    if (not extracted_text or len(extracted_text.strip()) < 100) and cv and cv.extracted_text:
        extracted_text = cv.extracted_text

    return audit_cv_content(extracted_text)


@app.post("/api/cover-letter/audit", response_model=CoverLetterAuditResponse)
def audit_cover_letter_endpoint(req: CoverLetterAuditRequest):
    """
    Audits cover letter or application pitch for personalization,
    Google XYZ impact, hook strength, conciseness, and call-to-action.
    """
    return audit_cover_letter(
        cover_letter_text=req.cover_letter_text,
        target_company=req.target_company or "",
        target_role=req.target_role or ""
    )


# ==========================================================
# FIRM EXPECTATIONS & CURATED LEARNING RESOURCES
# ==========================================================
@app.get("/api/firms/expectations", response_model=List[FirmInterviewExpectation])
def get_firm_expectations_endpoint(sector: Optional[str] = Query(None)):
    """
    Returns specific interview expectations, testing culture,
    and insider tips for leading investment banks, prop funds, PE and consulting firms.
    """
    return get_firm_interview_expectations(sector)


@app.get("/api/resources", response_model=List[EducationalResource])
def get_educational_resources_endpoint(
    sector: Optional[str] = Query(None),
    type: Optional[str] = Query(None)
):
    """
    Returns organized educational resources (Videos, Research Papers,
    Reference Books, GitHub Repos, and Trainers) for quantitative finance and investment banking.
    """
    return get_educational_resources(sector_filter=sector, type_filter=type)


@app.get("/api/suggestions")
def get_suggested_boutiques(
    category: Optional[str] = Query(None),
    hub: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """
    Returns curated Wealth Management, Asset Management, Macro Hedge Fund,
    and Market Making boutiques enriched with persisted contacts & LinkedIn profiles.
    """
    tracked_companies = {
        (a.company or "").strip().lower()
        for a in db.query(Application).all()
        if a.company
    }
    contacts_by_id = {
        c.boutique_id: c
        for c in db.query(BoutiqueContact).all()
    }
    out = []
    for item in SUGGESTED_BOUTIQUES:
        if category and category != "all" and item["category"] != category:
            continue
        if hub and hub != "all" and item["hub"] != hub:
            continue
        name_low = item["name"].lower()
        short_name = name_low.split("(")[0].strip()
        is_tracked = any(
            short_name in tc or tc in short_name
            for tc in tracked_companies
            if len(tc) >= 4
        )
        c = contacts_by_id.get(item["id"])
        emails = []
        key_people = []
        if c:
            try:
                emails = json.loads(c.emails_json or "[]")
            except Exception:
                emails = []
            try:
                raw_people = json.loads(c.key_people_json or "[]")
                key_people = [
                    p for p in raw_people
                    if isinstance(p, dict) and is_valid_person_candidate(p.get("name", ""), p.get("role", ""), item["name"])
                ]
            except Exception:
                key_people = []
        best_email = (c.best_email if c and c.best_email else item.get("spontaneous_email"))
        confidence = (
            c.email_confidence
            if c and c.email_confidence
            else ("verified_site" if item.get("spontaneous_email") else "none")
        )
        if confidence == "pattern_inferred":
            valid_guesses = [p.get("email_guess") for p in key_people if p.get("email_guess")]
            if best_email not in valid_guesses:
                best_email = valid_guesses[0] if valid_guesses else item.get("spontaneous_email")
                confidence = "pattern_inferred" if valid_guesses else ("verified_site" if item.get("spontaneous_email") else "none")
        li_q = urllib.parse.quote(f'"{item["name"].split("(")[0].strip()}" (CEO OR CIO OR "Portfolio Manager" OR "Talent" OR "HR" OR "Recruiter")')
        out.append({
            **item,
            "spontaneous_email": best_email if confidence == "verified_site" else item.get("spontaneous_email"),
            "best_email": best_email,
            "email_confidence": confidence,
            "emails": emails,
            "key_people": key_people,
            "company_linkedin_url": c.company_linkedin_url if c else None,
            "linkedin_search_url": (c.linkedin_search_url if c and c.linkedin_search_url else f"https://www.linkedin.com/search/results/people/?keywords={li_q}"),
            "mx_valid": bool(c.mx_valid) if c else False,
            "is_tracked": is_tracked,
        })
    return out


@app.post("/api/suggestions/enrich")
async def enrich_suggestions_contacts(db: Session = Depends(get_db)):
    """Crawls all 39 boutiques' websites & search index for real emails, leaders & LinkedIn URLs."""
    return await enrich_all_boutiques(db)


# ==========================================================
# STATIC FRONTEND SPA SERVING (FOR STANDALONE MAC WEB APP)
# ==========================================================
FRONTEND_DIST_DIR = (Path(__file__).resolve().parents[2] / "frontend" / "dist").resolve()

if (FRONTEND_DIST_DIR / "assets").is_dir():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST_DIR / "assets")), name="frontend-assets")


@app.get("/", include_in_schema=False)
@app.get("/{full_path:path}", include_in_schema=False)
def serve_frontend_spa(full_path: str = ""):
    """Serves built React SPA when present without intercepting /api routes."""
    if full_path.startswith("api/") or full_path == "api":
        raise HTTPException(status_code=404, detail="Endpoint introuvable")
    if FRONTEND_DIST_DIR.is_dir():
        candidate = (FRONTEND_DIST_DIR / full_path).resolve()
        if full_path and candidate.is_file() and candidate.is_relative_to(FRONTEND_DIST_DIR):
            return FileResponse(str(candidate))
        index_html = FRONTEND_DIST_DIR / "index.html"
        if index_html.is_file():
            return FileResponse(str(index_html))
    raise HTTPException(status_code=404, detail="Frontend build introuvable")




