import json
from typing import List, Dict, Any, Tuple
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.neighbors import NearestNeighbors

from .models import JobOffer, UserProfile
from .schemas import RecommendationItem, RecommendationResponse, JobOfferResponse


# Financial desk adjacency graph to discover adjacent domain opportunities
DESK_ADJACENCY_MAP = {
    "Trading Flow": ["Structuring Produits Structurés", "Quantitative Research / Trading", "Risk Management de Marché"],
    "Trading Assistant / Market Making": ["Quantitative Research / Trading", "Trading Flow / Exotics", "Structuring Cross-Asset"],
    "Structuring Produits Structurés": ["Trading Flow / Exotics", "Quantitative Research / Trading", "Sales FICC / Institutional"],
    "Quantitative Research / Trading": ["Quantitative Market Making", "Trading Flow / Exotics", "Market Risk Analytics"],
    "Quantitative Market Making": ["Quantitative Research / Trading", "Trading Assistant / Market Making", "Trading Flow / Exotics"],
    "Sales FICC / Institutional": ["Structuring Produits Structurés", "Trading Flow / Exotics", "Debt Capital Markets (DCM)"],
    "Risk Management de Marché": ["Quantitative Research / Analysis", "Trading Flow / Exotics", "Structuring Produits Structurés"],
    "Market Risk Analytics": ["Quantitative Research / Analysis", "Risk Management de Marché", "Trading Flow / Exotics"],
    "Commodities & Energy": ["Trading Flow / Exotics", "Structuring Produits Structurés", "Foreign Exchange (FX)"],
    "Dérivés Actions & Indices": ["Structuring Produits Structurés", "Rates & FX Desk", "Quantitative Research / Trading"],
    "Rates & Fixed Income": ["Credit Trading / Structuring", "Foreign Exchange (FX)", "Sales FICC / Institutional"],
}


def build_offer_document(offer: JobOffer) -> str:
    """Concatenates rich fields of a job offer into an enriched semantic document."""
    parts = [
        offer.title or "",
        offer.desk or "",
        offer.asset_class or "",
        offer.company or "",
        offer.location or "",
        offer.contract_type or "",
        offer.requirements or "",
        offer.description or "",
        offer.tags or ""
    ]
    return " ".join([p for p in parts if p]).lower()


def build_profile_document(profile: UserProfile) -> Tuple[str, List[str], List[str], List[str]]:
    """Encodes user profile attributes into a target document and attribute lists."""
    def parse_json_or_list(val):
        if not val:
            return []
        if isinstance(val, list):
            return val
        try:
            return json.loads(val)
        except Exception:
            return [x.strip() for x in str(val).split(",") if x.strip()]

    target_roles = parse_json_or_list(profile.target_roles)
    target_locations = parse_json_or_list(profile.target_locations)
    target_asset_classes = parse_json_or_list(profile.target_asset_classes)
    technical_skills = parse_json_or_list(profile.technical_skills)

    text_parts = [
        " ".join(target_roles),
        " ".join(target_asset_classes),
        " ".join(technical_skills),
        " ".join(target_locations),
        profile.school or "",
        profile.degree_level or "",
        profile.bio_summary or "",
        profile.target_duration or "",
    ]
    doc = " ".join([p for p in text_parts if p]).lower()
    return doc, target_roles, target_locations, technical_skills


def compute_knn_recommendations(
    offers: List[JobOffer],
    profile: UserProfile,
    top_k: int = 8,
    serendipity_k: int = 6,
    db=None,
) -> RecommendationResponse:
    """
    Computes recommendations using Qwen3-Embedding (256d) + Ridge Regression when DB is provided,
    separating into Top Direct Matches and Serendipity Gems on adjacent desks.
    """
    if not offers:
        return RecommendationResponse(
            top_direct_matches=[],
            serendipity_gems=[],
            total_evaluated=0,
            profile_summary=f"{profile.full_name} ({profile.school})",
            engine_name="qwen3-embedding:0.6b + Ridge",
            ridge_trained_samples=0,
        )

    # Primary Engine: Qwen3-Embedding + Ridge Regression (OptiWealthSolutions/embedding_prop)
    if db is not None:
        from .embedding_engine import qwen_ridge_engine

        engine_res = qwen_ridge_engine.score_offers(offers, profile, db, persist_scores=True)
        scored_map = engine_res.get("scored", {})
        _, target_roles, _, _ = build_profile_document(profile)
        user_roles_lower = [r.lower() for r in target_roles]

        direct_items: List[Tuple[float, RecommendationItem]] = []
        serendipity_items: List[Tuple[float, RecommendationItem]] = []

        for offer in offers:
            info = scored_map.get(offer.id, {})
            q_score = float(info.get("qwen_score", offer.qwen_score or 50.0))
            sim_01 = round(min(0.99, max(0.05, q_score / 100.0)), 2)
            reasons = info.get("match_reasons") or ["Score Qwen3 + Ridge"]
            offer_resp = JobOfferResponse.model_validate(offer)

            offer_title_desk = f"{offer.title} {offer.desk}".lower()
            is_exact_role = any(role in offer_title_desk for role in user_roles_lower)

            adjacent_desk = None
            for primary_role in target_roles:
                for adj in DESK_ADJACENCY_MAP.get(primary_role, []):
                    if adj.lower() in offer_title_desk:
                        adjacent_desk = adj
                        break
                if adjacent_desk:
                    break

            if is_exact_role:
                direct_items.append((
                    q_score,
                    RecommendationItem(
                        offer=offer_resp,
                        similarity_score=sim_01,
                        is_serendipity_gem=False,
                        match_reasons=reasons,
                        desk_adjacency_tag=None,
                    ),
                ))
            else:
                serendipity_items.append((
                    q_score,
                    RecommendationItem(
                        offer=offer_resp,
                        similarity_score=sim_01,
                        is_serendipity_gem=True,
                        match_reasons=reasons + ["Opportunité adjacente détectée par Qwen3"],
                        desk_adjacency_tag=adjacent_desk or offer.desk,
                    ),
                ))

        direct_items.sort(key=lambda x: x[0], reverse=True)
        serendipity_items.sort(key=lambda x: x[0], reverse=True)

        return RecommendationResponse(
            top_direct_matches=[item for _, item in direct_items[:top_k]],
            serendipity_gems=[item for _, item in serendipity_items[:serendipity_k]],
            total_evaluated=len(offers),
            profile_summary=f"{profile.full_name} | {profile.school} | {', '.join(target_roles[:4])}",
            engine_name=engine_res.get("engine_name", "qwen3-embedding:0.6b + Ridge"),
            ridge_trained_samples=int(engine_res.get("ridge_samples", 0)),
        )

    profile_doc, target_roles, target_locations, technical_skills = build_profile_document(profile)
    offer_docs = [build_offer_document(o) for o in offers]

    # Combine corpus for TF-IDF vectorization
    corpus = [profile_doc] + offer_docs
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        max_features=4000,
        sublinear_tf=True
    )
    tfidf_matrix = vectorizer.fit_transform(corpus)

    profile_vector = tfidf_matrix[0]
    offers_vectors = tfidf_matrix[1:]

    # Cosine similarities
    similarities = cosine_similarity(profile_vector, offers_vectors)[0]

    # Fit KNN on offers feature space
    n_neighbors = min(len(offers), 15)
    knn = NearestNeighbors(n_neighbors=n_neighbors, metric="cosine")
    knn.fit(offers_vectors)

    distances, indices = knn.kneighbors(profile_vector)
    # distances are cosine distances = 1 - cosine_similarity
    
    direct_candidates = []
    serendipity_candidates = []

    user_roles_lower = [r.lower() for r in target_roles]
    user_locations_lower = [loc.lower() for loc in target_locations]
    user_skills_lower = [s.lower() for s in technical_skills]

    for idx, sim in enumerate(similarities):
        offer = offers[idx]
        score = float(sim)
        
        # Check reasons
        match_reasons: List[str] = []
        is_exact_role_match = False

        # Role match check
        offer_title_desk = f"{offer.title} {offer.desk}".lower()
        for role in user_roles_lower:
            if role in offer_title_desk:
                is_exact_role_match = True
                match_reasons.append(f"Correspondance rôle direct: {role.capitalize()}")
                break

        # Location check
        offer_loc = (offer.location or "").lower()
        if any(loc in offer_loc for loc in user_locations_lower):
            match_reasons.append(f"Localisation cible: {offer.location}")

        # Technical skills overlap
        offer_full_text = offer_docs[idx]
        matched_skills = [s for s in user_skills_lower if s in offer_full_text]
        if matched_skills:
            match_reasons.append(f"Compétences clés: {', '.join([s.capitalize() for s in matched_skills[:3]])}")

        # Check desk adjacency for serendipity
        adjacent_desk = None
        for primary_role in target_roles:
            adjacent_list = DESK_ADJACENCY_MAP.get(primary_role, [])
            for adj in adjacent_list:
                if adj.lower() in offer_title_desk:
                    adjacent_desk = adj
                    break
            if adjacent_desk:
                break

        offer_response = JobOfferResponse.model_validate(offer)

        # Categorize into direct match vs serendipity gem
        if is_exact_role_match:
            direct_candidates.append({
                "item": RecommendationItem(
                    offer=offer_response,
                    similarity_score=round(min(score * 1.25, 0.99), 2),
                    is_serendipity_gem=False,
                    match_reasons=match_reasons or ["Forte adéquation avec vos préférences déclarées"],
                    desk_adjacency_tag=None
                ),
                "score": score
            })
        else:
            # Candidate for serendipity / plus proche voisin découverte
            # It shares skills, location or adjacent desk, but expands user horizons
            serendipity_score = score
            gem_reasons = []
            if adjacent_desk:
                gem_reasons.append(f"Desk adjacent à vos cibles: {adjacent_desk}")
                serendipity_score += 0.15
            if matched_skills:
                gem_reasons.append(f"Compétences transférables: {', '.join([s.capitalize() for s in matched_skills[:3]])}")
            gem_reasons.append("Opportunité à forte valeur ajoutée hors de votre recherche initiale")

            serendipity_candidates.append({
                "item": RecommendationItem(
                    offer=offer_response,
                    similarity_score=round(min(serendipity_score * 1.15, 0.96), 2),
                    is_serendipity_gem=True,
                    match_reasons=gem_reasons,
                    desk_adjacency_tag=adjacent_desk or offer.desk
                ),
                "score": serendipity_score
            })

    # Sort each list by score descending
    direct_candidates.sort(key=lambda x: x["score"], reverse=True)
    serendipity_candidates.sort(key=lambda x: x["score"], reverse=True)

    top_direct = [c["item"] for c in direct_candidates[:top_k]]
    
    # If not enough serendipity candidates, take lower-ranked but interesting direct candidates
    top_serendipity = [c["item"] for c in serendipity_candidates[:serendipity_k]]

    return RecommendationResponse(
        top_direct_matches=top_direct,
        serendipity_gems=top_serendipity,
        total_evaluated=len(offers),
        profile_summary=f"{profile.full_name} | {profile.school} | {', '.join(target_roles)}"
    )
