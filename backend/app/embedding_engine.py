"""
Qwen3-Embedding + Ridge Regression Engine for Internship Scoring & Discovery.
Directly adapted from OptiWealthSolutions/embedding_prop architecture:
  - Ollama /api/embed with `qwen3-embedding:0.6b`
  - Matryoshka truncation to 256d + L2 normalization
  - Content-hashed vector caching in SQLite (`embedding_blob`, `embedding_hash`)
  - Bilingual FR/EN SemanticRouter anchors for internship domain & seniority gating
  - Closed-form RidgeRegression `(X^T X + lam I)^-1 X^T y` calibrated on Léo's CV/profile + live feedback
"""

from __future__ import annotations

import hashlib
import json
import threading
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

import httpx
import numpy as np
from sqlalchemy.orm import Session

from .deep_page_validator import detect_ats_platform, detect_hard_constraints, is_offer_text_expired
from .ats_poller import is_pure_quant_or_eng
from .models import Application, CVDocument, JobOffer, UserProfile

OLLAMA_BASE_URL = "http://127.0.0.1:11434"
EMBED_MODEL = "qwen3-embedding:0.6b"
EMBED_DIM = 256

# Extracted fallback text from CV_Leo_Lombardini.pdf (used if PDF font encoding yields empty pypdf text)
LEO_CV_CANONICAL_TEXT = (
    "Léo Lombardini. leo.lombardini@edhec.com | +33 (0)7 85 42 69 11. "
    "Master 1 Finance student at EDHEC Business School (Nice, Programme Grande École, Finance Track, 09/2025-06/2029). "
    "Relevant coursework: Portfolio Construction with Python & Management, Corporate Finance & Company Valuation, "
    "Financial Markets & Instruments, Fixed Income & Derivatives, Advanced Macroeconomics. "
    "Lycée Jean Perrin Marseille ENS D2 Preparatory Class (Mathematics, Economics, Statistics). "
    "Seeking a 6-month off-cycle internship starting in June 2027 across Trading, Structuring, Asset Management, "
    "Portfolio Management, Hedge Fund or Macro Research. "
    "Founder and Independent Investor at Horacle Capital (10/2024 - Today): "
    "Capital Allocation & Risk Management (actively manage €30k personal portfolio across FX and equity indices under strict drawdowns and position-sizing rules); "
    "Discretionary Macro FX Trading (G10 currency pairs, central bank balance sheet analysis, real interest rate differentials, economic surprise momentum, liquidity cycles); "
    "Systematic Index Strategies (Python, MQL5 algorithmic trading models on US equity indices, mean-reversion, regime shifts, volatility expansion); "
    "Proprietary Research & Analytics Horacle Hub (Python framework, macro-scoring engines, cross-asset fair-value, weekly macro notes on horaclecapital.com). "
    "Institut Paoli Calmettes Junior Accounting Assistant (treasury operations, payments, monthly bank reconciliations). "
    "Skills: Python (NumPy, Pandas, SciPy, Scikit-Learn), MQL5 (MetaTrader 5), Git, VS Code, Excel, Systematic Trading, Backtesting, Time Series Analysis, Statistical Modeling, Macroeconomic Forecasting. "
    "Languages: French (Native), English (C1), Spanish (Intermediate)."
)

POSITIVE_INTERN_ANCHORS: Dict[str, str] = {
    "Portfolio Management & Gérance": (
        "Portfolio management assistant portfolio manager gérance de portefeuille gestion collective "
        "asset allocation multi-asset equity portfolio fixed income rebalancing tracking error "
        "OPCVM UCITS ETF selection assistant gérant"
    ),
    "Asset Management & Buy-Side": (
        "Asset management investment management buy-side fund analyst gérant d'actifs "
        "institutional asset manager ESG integration fundamental equity credit research "
        "Amundi BlackRock AXA IM Natixis IM Carmignac"
    ),
    "Hedge Fund Analyst & Macro": (
        "Hedge fund analyst buy-side investment analyst long short equity event driven global macro "
        "multi-strategy credit fund alternative investments research analyst Point72 Balyasny "
        "Millennium Marshall Wace Brevan Howard"
    ),
    "Sales & Trading / Assistant Trader": (
        "Assistant trader sales and trading equity derivatives flow exotics execution desk "
        "market making client facilitation order book pricing greeks"
    ),
    "Structuring & Solutions": (
        "Structuring produits structurés structured products autocall reverse convertible payoff "
        "cross-asset derivatives pricing sales structuring solutions"
    ),
    "Rates, FX, Credit & FICC": (
        "Fixed income rates bonds sovereign yield curve foreign exchange FX swaps repo money market "
        "credit sales FICC DCM ECM debt equity capital markets"
    ),
    "Market Risk & Treasury": (
        "Market risk analytics VaR stress testing risk management corporate treasury financement "
        "liquidity risk ALM asset liability management"
    ),
    "Wealth & Private Banking": (
        "Private banking wealth management gestion de fortune gestion privée advisory mandate "
        "investment counselor family office banque privée"
    ),
    "M&A, PE & Corporate Finance": (
        "Mergers acquisitions M&A corporate finance investment banking valuation DCF LBO private equity "
        "venture capital transaction services advisory"
    ),
}

NEGATIVE_NOISE_ANCHORS: Dict[str, str] = {
    "Pure Quant / Engineering / PhD": (
        "Quantitative developer software engineer C++ Rust FPGA low latency hardware ASIC "
        "PhD quantitative researcher deep learning applied scientist systems infrastructure engineer"
    ),
    "Senior / Non-Internship": (
        "Senior vice president director managing director head of department 7 years experience "
        "10 years experience principal executive leadership"
    ),
    "Non-Finance / Unrelated": (
        "Retail store cashier fashion merchandising construction BTP nurse medical healthcare "
        "human resources talent acquisition recruiter culinary chef"
    ),
}

TARGET_INTERN_ANCHOR = (
    "Stage 6 mois off-cycle summer analyst internship June 2027 Juin 2027 EDHEC Business School "
    "Master Finance financial markets portfolio management asset management hedge fund analyst "
    "trading sales structuring"
)
SENIOR_BLOCKER_ANCHOR = (
    "Experienced hire minimum 5 years experience senior director VP team lead full-time permanent only"
)


def l2_normalize(vectors: np.ndarray) -> np.ndarray:
    arr = np.asarray(vectors, dtype=np.float32)
    if arr.ndim == 1:
        arr = arr.reshape(1, -1)
    norms = np.linalg.norm(arr, axis=1, keepdims=True)
    norms = np.maximum(norms, 1e-12)
    return arr / norms


def _content_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8", errors="ignore")).hexdigest()[:32]


def _serialize_vec(vec: np.ndarray) -> bytes:
    return np.asarray(vec, dtype=np.float32).tobytes()


def _deserialize_vec(blob: bytes) -> Optional[np.ndarray]:
    if not blob:
        return None
    arr = np.frombuffer(blob, dtype=np.float32)
    if arr.shape[0] != EMBED_DIM:
        return None
    return arr


class RidgeHead:
    """Closed-form L2-regularized Ridge regression `(X^T X + lam I)^-1 X^T y` (< 2 ms)."""

    def __init__(self, l2_reg: float = 0.5) -> None:
        self.l2_reg = l2_reg
        self.weights: Optional[np.ndarray] = None
        self.bias: float = 0.0

    def fit(self, X: np.ndarray, y: np.ndarray, sample_weights: Optional[np.ndarray] = None) -> "RidgeHead":
        arr = np.asarray(X, dtype=np.float32)
        target = np.asarray(y, dtype=np.float32)
        if sample_weights is not None:
            w = np.sqrt(np.asarray(sample_weights, dtype=np.float32))[:, None]
            arr_w = arr * w
            target_mean = float(np.average(target, weights=sample_weights))
            y_centered = (target - target_mean) * w.squeeze(1)
        else:
            arr_w = arr
            target_mean = float(np.mean(target))
            y_centered = target - target_mean

        self.bias = target_mean
        dim = arr.shape[1]
        gram = arr_w.T @ arr_w + self.l2_reg * np.eye(dim, dtype=np.float32)
        self.weights = np.linalg.solve(gram, arr_w.T @ y_centered)
        return self

    def predict(self, X: np.ndarray, clip_range: Tuple[float, float] = (0.0, 100.0)) -> np.ndarray:
        if self.weights is None:
            raise RuntimeError("RidgeHead must be fit before calling predict")
        arr = np.asarray(X, dtype=np.float32)
        if arr.ndim == 1:
            arr = arr.reshape(1, -1)
        preds = arr @ self.weights + self.bias
        return np.clip(preds, clip_range[0], clip_range[1]).astype(np.float32)


class OllamaQwen3Engine:
    """Singleton thread-safe engine managing Qwen3 embeddings and Ridge calibration."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._anchors_loaded = False
        self._ollama_available = True
        self._pos_labels = list(POSITIVE_INTERN_ANCHORS.keys())
        self._neg_labels = list(NEGATIVE_NOISE_ANCHORS.keys())
        self._pos_vecs: Optional[np.ndarray] = None
        self._neg_vecs: Optional[np.ndarray] = None
        self._intern_vec: Optional[np.ndarray] = None
        self._senior_vec: Optional[np.ndarray] = None
        self._profile_cache_hash: Optional[str] = None
        self._profile_vec: Optional[np.ndarray] = None

    def embed_texts(self, texts: List[str], batch_size: int = 24) -> Optional[np.ndarray]:
        if not texts:
            return np.zeros((0, EMBED_DIM), dtype=np.float32)
        try:
            all_vecs: List[np.ndarray] = []
            with httpx.Client(base_url=OLLAMA_BASE_URL, timeout=30.0) as client:
                for i in range(0, len(texts), batch_size):
                    batch = [t[:3000] if t.strip() else "empty" for t in texts[i : i + batch_size]]
                    resp = client.post(
                        "/api/embed",
                        json={"model": EMBED_MODEL, "input": batch},
                    )
                    resp.raise_for_status()
                    raw = np.asarray(resp.json()["embeddings"], dtype=np.float32)
                    if raw.shape[1] > EMBED_DIM:
                        raw = raw[:, :EMBED_DIM]
                    all_vecs.append(l2_normalize(raw))
            self._ollama_available = True
            return np.vstack(all_vecs)
        except Exception:
            self._ollama_available = False
            return None

    def _ensure_anchors(self) -> bool:
        if self._anchors_loaded and self._pos_vecs is not None:
            return True
        with self._lock:
            if self._anchors_loaded and self._pos_vecs is not None:
                return True
            all_texts = (
                list(POSITIVE_INTERN_ANCHORS.values())
                + list(NEGATIVE_NOISE_ANCHORS.values())
                + [TARGET_INTERN_ANCHOR, SENIOR_BLOCKER_ANCHOR]
            )
            vecs = self.embed_texts(all_texts, batch_size=16)
            if vecs is None:
                return False
            n_pos = len(self._pos_labels)
            n_neg = len(self._neg_labels)
            self._pos_vecs = vecs[:n_pos]
            self._neg_vecs = vecs[n_pos : n_pos + n_neg]
            self._intern_vec = vecs[-2]
            self._senior_vec = vecs[-1]
            self._anchors_loaded = True
            return True

    def get_profile_text(self, profile: Optional[UserProfile], db: Session) -> str:
        cv = (
            db.query(CVDocument)
            .filter(CVDocument.is_active == True)
            .order_by(CVDocument.uploaded_at.desc())
            .first()
        )
        cv_text = ""
        if cv and cv.extracted_text and len(cv.extracted_text.strip()) > 200:
            cv_text = cv.extracted_text.strip()
        else:
            cv_text = LEO_CV_CANONICAL_TEXT

        if not profile:
            return cv_text

        def _parse(val):
            if not val:
                return []
            if isinstance(val, list):
                return val
            try:
                return json.loads(val)
            except Exception:
                return [x.strip() for x in str(val).split(",") if x.strip()]

        roles = _parse(profile.target_roles)
        assets = _parse(profile.target_asset_classes)
        skills = _parse(profile.technical_skills)
        locs = _parse(profile.target_locations)
        return (
            f"Candidate: {profile.full_name}. School: {profile.school} ({profile.degree_level}). "
            f"Target roles: {', '.join(roles)}. Asset classes: {', '.join(assets)}. "
            f"Skills: {', '.join(skills)}. Target locations: {', '.join(locs)}. "
            f"Availability: {profile.target_duration}, starting {profile.target_start_period}. "
            f"Summary: {profile.bio_summary or ''}. CV: {cv_text[:2200]}"
        )

    def get_profile_vector(self, profile: Optional[UserProfile], db: Session) -> Optional[np.ndarray]:
        profile_text = self.get_profile_text(profile, db)
        h = _content_hash(profile_text)
        if self._profile_cache_hash == h and self._profile_vec is not None:
            return self._profile_vec
        vecs = self.embed_texts([profile_text])
        if vecs is None:
            return None
        self._profile_vec = vecs[0]
        self._profile_cache_hash = h
        return self._profile_vec

    def offer_text(self, offer: JobOffer) -> str:
        return (
            f"{offer.title or ''} | {offer.company or ''} | {offer.location or ''} | "
            f"{offer.desk or ''} | {offer.asset_class or ''} | {offer.contract_type or ''} | "
            f"{offer.requirements or ''} | {(offer.description or '')[:1400]} | {offer.tags or ''}"
        ).strip()

    def ensure_offer_embeddings(self, offers: List[JobOffer], db: Session) -> Dict[int, np.ndarray]:
        """Returns 256d Qwen3 vectors for all offers, embedding & caching only uncached ones."""
        result: Dict[int, np.ndarray] = {}
        to_embed: List[Tuple[JobOffer, str, str]] = []

        for offer in offers:
            txt = self.offer_text(offer)
            h = _content_hash(txt)
            if offer.embedding_hash == h and offer.embedding_blob:
                vec = _deserialize_vec(offer.embedding_blob)
                if vec is not None:
                    result[offer.id] = vec
                    continue
            to_embed.append((offer, txt, h))

        if to_embed:
            vecs = self.embed_texts([item[1] for item in to_embed], batch_size=24)
            if vecs is not None:
                for (offer, _, h), vec in zip(to_embed, vecs):
                    offer.embedding_hash = h
                    offer.embedding_blob = _serialize_vec(vec)
                    result[offer.id] = vec
                try:
                    db.commit()
                except Exception:
                    db.rollback()

        return result

    def _build_features(
        self,
        offer: JobOffer,
        vec: np.ndarray,
        profile_vec: np.ndarray,
        pos_centroid: Optional[np.ndarray],
        neg_centroid: Optional[np.ndarray],
        target_locations_lower: List[str],
        target_start_period: str = "Juin 2027",
    ) -> Tuple[np.ndarray, List[str], List[str], float, str]:
        pos_sims = self._pos_vecs @ vec
        neg_sims = self._neg_vecs @ vec
        intern_margin = float((self._intern_vec @ vec) - (self._senior_vec @ vec))
        cv_sim = float(profile_vec @ vec)
        fb_pos = float(pos_centroid @ vec) if pos_centroid is not None else cv_sim
        fb_neg = float(neg_centroid @ vec) if neg_centroid is not None else 0.0

        loc_str = (offer.location or "").lower()
        loc_match = 1.0 if any(loc in loc_str for loc in target_locations_lower) else 0.0
        ats_plat = offer.ats_platform or detect_ats_platform(offer.url or "")
        is_direct_ats = 1.0 if ats_plat in ("greenhouse", "lever", "ashby", "workday") else 0.0

        hard_flags: List[str] = []
        if offer.hard_flags:
            try:
                hard_flags = json.loads(offer.hard_flags)
            except Exception:
                hard_flags = []
        else:
            hard_flags = detect_hard_constraints(offer.title or "", offer.description or "", offer.requirements or "")

        if is_pure_quant_or_eng(offer.title or "", offer.description or "") and "Quant Pur / Ingé" not in hard_flags:
            hard_flags.append("Quant Pur / Ingé")

        # Check start date match dynamically against user's chosen target_start_period
        start_str = f"{offer.start_date or ''} {offer.title or ''} {(offer.description or '')[:400]}".lower()
        tsp = (target_start_period or "Juin 2027").lower()
        if "juin" in tsp or "june" in tsp or "été" in tsp or "summer" in tsp:
            start_tokens = ["juin 2027", "june 2027", "summer 2027", "été 2027", "juillet 2027", "july 2027"]
        elif "janvier" in tsp or "january" in tsp:
            start_tokens = ["janvier 2027", "january 2027", "hiver 2027", "winter 2027"]
        elif "septembre" in tsp or "september" in tsp or "automne" in tsp:
            start_tokens = ["septembre 2027", "september 2027", "automne 2027", "fall 2027"]
        elif "2027" in tsp:
            start_tokens = ["2027"]
        else:
            start_tokens = [tsp]
        start_match = 1.0 if any(k in start_str for k in start_tokens) else 0.0

        hard_penalty = min(1.5, len(hard_flags) * 0.6)

        feat = np.concatenate([
            pos_sims.astype(np.float32),
            neg_sims.astype(np.float32),
            np.array(
                [intern_margin, cv_sim, fb_pos - fb_neg, loc_match, is_direct_ats, start_match, hard_penalty],
                dtype=np.float32,
            ),
        ])

        # Build concise explainability reasons
        reasons: List[str] = []
        best_theme_idx = int(np.argmax(pos_sims))
        best_theme = self._pos_labels[best_theme_idx]
        reasons.append(f"Qwen3: {best_theme}")
        if cv_sim >= 0.42:
            reasons.append(f"Fit EDHEC {int(min(99, round(cv_sim * 130)))}%")
        if start_match > 0:
            reasons.append(f"Début {target_start_period}")
        if loc_match > 0:
            reasons.append(f"Hub: {offer.location}")
        if is_direct_ats > 0:
            reasons.append(f"ATS ({ats_plat.upper()})")

        return feat, reasons, hard_flags, cv_sim, best_theme

    def score_offers(
        self,
        offers: List[JobOffer],
        profile: Optional[UserProfile],
        db: Session,
        persist_scores: bool = True,
    ) -> Dict[str, Any]:
        """
        Scores all active available offers using Qwen3-Embedding + closed-form Ridge Regression.
        Learns online from Léo's favorites, applications, dismissals, and interview outcomes.
        """
        if not offers:
            return {
                "engine_name": f"{EMBED_MODEL} + Ridge",
                "ollama_active": self._ollama_available,
                "ridge_samples": 0,
                "scored": {},
            }

        anchors_ok = self._ensure_anchors()
        profile_vec = self.get_profile_vector(profile, db) if anchors_ok else None
        offer_vecs = self.ensure_offer_embeddings(offers, db) if (anchors_ok and profile_vec is not None) else {}

        # Target locations
        target_locations_lower = ["paris", "london", "londres", "marseille", "luxembourg", "geneva", "genève", "new york", "milan"]
        if profile and profile.target_locations:
            try:
                locs = json.loads(profile.target_locations)
                if isinstance(locs, list) and locs:
                    target_locations_lower = [x.lower() for x in locs]
            except Exception:
                pass

        # Fallback if Ollama is unavailable
        if not anchors_ok or profile_vec is None or not offer_vecs:
            scored_fallback: Dict[int, Dict[str, Any]] = {}
            for o in offers:
                flags = detect_hard_constraints(o.title or "", o.description or "", o.requirements or "")
                loc_bonus = 15.0 if any(l in (o.location or "").lower() for l in target_locations_lower) else 0.0
                base = 62.0 + loc_bonus - (len(flags) * 20.0)
                scored_fallback[o.id] = {
                    "qwen_score": round(float(np.clip(base, 10.0, 95.0)), 1),
                    "match_reasons": ["Scoring heuristique (Ollama hors ligne)"],
                    "hard_flags": flags,
                    "cv_sim": 0.5,
                    "best_theme": o.desk or "Finance de Marché",
                }
            return {
                "engine_name": "Fallback Heuristique (Ollama inactif)",
                "ollama_active": False,
                "ridge_samples": 0,
                "scored": scored_fallback,
            }

        # Gather feedback centroids from Léo's real actions + tracked application statuses
        apps_by_offer: Dict[int, Application] = {
            a.offer_id: a for a in db.query(Application).filter(Application.offer_id.isnot(None)).all()
        }
        pos_fb_vecs: List[np.ndarray] = []
        neg_fb_vecs: List[np.ndarray] = []

        for o in offers:
            v = offer_vecs.get(o.id)
            if v is None:
                continue
            app = apps_by_offer.get(o.id)
            if o.is_favorite or o.is_applied or (app and app.status in ("applied", "interviewing", "offer_received", "saved")):
                pos_fb_vecs.append(v)
            elif o.is_dismissed or (app and app.status in ("rejected", "withdrawn")):
                neg_fb_vecs.append(v)

        pos_centroid = l2_normalize(np.mean(pos_fb_vecs, axis=0))[0] if pos_fb_vecs else None
        neg_centroid = l2_normalize(np.mean(neg_fb_vecs, axis=0))[0] if neg_fb_vecs else None

        # Build feature matrix for all offers
        valid_offers: List[JobOffer] = []
        feat_rows: List[np.ndarray] = []
        meta_rows: List[Tuple[List[str], List[str], float, str]] = []

        target_start_period = (profile.target_start_period if profile and profile.target_start_period else "Juin 2027")

        for o in offers:
            v = offer_vecs.get(o.id)
            if v is None:
                continue
            feat, reasons, flags, cv_sim, theme = self._build_features(
                o, v, profile_vec, pos_centroid, neg_centroid, target_locations_lower, target_start_period
            )
            valid_offers.append(o)
            feat_rows.append(feat)
            meta_rows.append((reasons, flags, cv_sim, theme))

        X = np.asarray(feat_rows, dtype=np.float32)

        # Construct supervised Ridge training set combining:
        # 1) Balanced Golden Anchor exemplars across all target domains (PM, AM, Hedge Fund, Trading, Structuring, etc.)
        # 2) Domain & CV anchor priors for every offer
        # 3) Explicit high-weight samples from Léo's real decisions (favorites, applications, dismissals, interviews)
        X_train_list: List[np.ndarray] = []
        y_train_list: List[float] = []
        w_train_list: List[float] = []
        real_feedback_count = 0

        # 1) Balanced Golden Anchor Exemplars (prevents Ridge from skewing only toward trading/sales)
        for i_pos, pv in enumerate(self._pos_vecs):
            p_sims = self._pos_vecs @ pv
            n_sims = self._neg_vecs @ pv
            im = float((self._intern_vec @ pv) - (self._senior_vec @ pv))
            cv_s_anchor = max(0.58, float(profile_vec @ pv))
            f_anchor = np.concatenate([
                p_sims.astype(np.float32),
                n_sims.astype(np.float32),
                np.array([im, cv_s_anchor, cv_s_anchor, 1.0, 1.0, 1.0, 0.0], dtype=np.float32),
            ])
            X_train_list.append(f_anchor)
            y_train_list.append(86.0)
            w_train_list.append(0.8)

        for i_neg, nv in enumerate(self._neg_vecs):
            p_sims = self._pos_vecs @ nv
            n_sims = self._neg_vecs @ nv
            im = float((self._intern_vec @ nv) - (self._senior_vec @ nv))
            cv_s_anchor = float(profile_vec @ nv)
            f_neg = np.concatenate([
                p_sims.astype(np.float32),
                n_sims.astype(np.float32),
                np.array([im, cv_s_anchor, 0.0, 0.0, 0.0, 0.0, 1.0], dtype=np.float32),
            ])
            X_train_list.append(f_neg)
            y_train_list.append(12.0)
            w_train_list.append(0.8)

        for idx, o in enumerate(valid_offers):
            f = X[idx]
            pos_max = float(np.max(f[: len(self._pos_labels)]))
            neg_max = float(np.max(f[len(self._pos_labels) : len(self._pos_labels) + len(self._neg_labels)]))
            intern_m = float(f[-7])
            cv_s = float(f[-6])
            loc_m = float(f[-4])
            ats_m = float(f[-3])
            start_m = float(f[-2])
            hard_p = float(f[-1])

            prior_y = (
                40.0
                + (pos_max - neg_max) * 72.0
                + (cv_s - 0.35) * 48.0
                + intern_m * 35.0
                + loc_m * 7.0
                + ats_m * 3.0
                + start_m * 8.0
                - hard_p * 32.0
            )
            prior_y = float(np.clip(prior_y, 5.0, 95.0))
            X_train_list.append(f)
            y_train_list.append(prior_y)
            w_train_list.append(0.45)

            app = apps_by_offer.get(o.id)
            if app and app.status == "offer_received":
                X_train_list.append(f); y_train_list.append(99.0); w_train_list.append(3.0); real_feedback_count += 1
            elif app and app.status == "interviewing":
                X_train_list.append(f); y_train_list.append(95.0); w_train_list.append(2.5); real_feedback_count += 1
            elif o.is_applied or (app and app.status == "applied"):
                X_train_list.append(f); y_train_list.append(90.0); w_train_list.append(2.0); real_feedback_count += 1
            elif o.is_favorite:
                X_train_list.append(f); y_train_list.append(88.0); w_train_list.append(1.8); real_feedback_count += 1
            elif o.is_dismissed:
                X_train_list.append(f); y_train_list.append(12.0); w_train_list.append(2.0); real_feedback_count += 1
            elif app and app.status in ("rejected", "withdrawn"):
                X_train_list.append(f); y_train_list.append(35.0); w_train_list.append(1.2); real_feedback_count += 1

        ridge = RidgeHead(l2_reg=1.5)
        ridge.fit(
            np.asarray(X_train_list, dtype=np.float32),
            np.asarray(y_train_list, dtype=np.float32),
            sample_weights=np.asarray(w_train_list, dtype=np.float32),
        )
        preds = ridge.predict(X, clip_range=(0.0, 98.5))

        scored: Dict[int, Dict[str, Any]] = {}
        for idx, o in enumerate(valid_offers):
            score_val = round(float(preds[idx]), 1)
            reasons, flags, cv_sim, theme = meta_rows[idx]
            scored[o.id] = {
                "qwen_score": score_val,
                "match_reasons": reasons,
                "hard_flags": flags,
                "cv_sim": cv_sim,
                "best_theme": theme,
            }
            if persist_scores:
                o.qwen_score = score_val
                o.qwen_reasons = json.dumps(reasons, ensure_ascii=False)
                o.hard_flags = json.dumps(flags, ensure_ascii=False)

        if persist_scores:
            try:
                db.commit()
            except Exception:
                db.rollback()

        return {
            "engine_name": f"{EMBED_MODEL} (256d) + Ridge",
            "ollama_active": True,
            "ridge_samples": real_feedback_count,
            "scored": scored,
        }


# Global singleton instance
qwen_ridge_engine = OllamaQwen3Engine()


def compute_freshness_meta(offer: JobOffer) -> Tuple[int, str]:
    """Computes integer days since posting/scraping and a crisp display badge."""
    now = datetime.now(timezone.utc)
    dt: Optional[datetime] = None

    if offer.date_posted:
        try:
            dt = datetime.strptime(offer.date_posted[:10], "%Y-%m-%d").replace(tzinfo=timezone.utc)
        except Exception:
            dt = None
    if dt is None and offer.scraped_at:
        dt = offer.scraped_at.replace(tzinfo=timezone.utc) if offer.scraped_at.tzinfo is None else offer.scraped_at
    if dt is None:
        return 99, "RÉCENT"

    days = max(0, (now - dt).days)
    if days == 0:
        return 0, "NEW · 0J"
    if days == 1:
        return 1, "1J"
    if days <= 3:
        return days, f"{days}J"
    if days <= 7:
        return days, f"{days}J"
    return days, f"{days}J"
