"""
Local Semantic AI Layer powered exclusively by `qwen3-embedding:0.6b` (lightweight 256d vectors):
1. Semantic ranking of scraped email candidates & surrounding HTML context (`rank_emails_with_qwen`)
2. Shared strict validation of human decision-maker / HR candidates (`is_valid_person_candidate`)
3. Semantic matching of real job-offer descriptions against Léo's factual finance angles (`match_offer_angles_with_qwen`)
4. Output sanitizer (`clean_no_ai_cliches`) removing localhost links, markdown bold, em-dashes, and bullets
"""

from __future__ import annotations

import asyncio
import re
import unicodedata
from typing import Any, Dict, List, Optional, Tuple

import httpx
import numpy as np

OLLAMA_BASE_URL = "http://127.0.0.1:11434"
EMBED_MODEL = "qwen3-embedding:0.6b"
EMBED_DIM = 256
_OLLAMA_SEMS: Dict[int, asyncio.Semaphore] = {}

POSITIVE_EMAIL_ANCHOR = (
    "recrutement stages finance analyste trader portfolio manager asset management "
    "careers jobs internship campus recruitment talent acquisition human resources hr contact"
)
NEGATIVE_EMAIL_ANCHOR = (
    "protection des donnees personnelles rgpd gdpr dpo privacy policy cookie notice "
    "reclamation legal compliance press media newsletter unsubscribe noreply webmaster"
)

_ANCHOR_CACHE: Dict[str, np.ndarray] = {}

_NON_PERSON_TOKENS = {
    "asset", "wealth", "private", "banking", "bank", "banque", "capital", "management",
    "gestion", "investment", "investments", "group", "groupe", "partners", "advisors",
    "advisory", "company", "entreprise", "societe", "fondation", "holding", "holdings",
    "fund", "funds", "fond", "fonds", "sicav", "ucits", "sas", "sarl", "ltd", "llc", "inc",
    "global", "macro", "markets", "equities", "fixed", "income", "trading", "strategy",
    "strategique", "solutions", "services", "insights", "research", "portfolio", "directeur",
    "general", "managing", "partner", "officer", "president", "chief", "founder", "fondateur",
    "head", "talent", "career", "careers", "team", "equipe", "contact", "legal", "notice",
    "mentions", "legales", "privacy", "cookie", "policy", "nos", "atouts", "notre", "votre",
    "politique", "egalite", "femmes", "independance", "monaco", "paris", "geneva", "geneve",
    "zurich", "london", "londres", "france", "suisse", "luxembourg", "europe", "rothschild",
    "indosuez", "pictet", "lombard", "mirabaud", "moneta", "syquant", "richelieu", "monterra",
    "cmb", "edmond", "odier", "baer", "julius", "marshall", "wace", "brevan", "howard",
    "winton", "capula", "rokos", "trevor", "learn", "more", "read", "join", "find", "out",
    "alpha", "select", "alpha-t", "megatrends", "transitions", "including",
    "views", "human", "resources", "experienced", "professionals", "open",
    "positions", "open-source", "software",
}

_NON_PERSON_ROLES = (
    "entreprise",
    "company",
    "société",
    "societe",
    "indépendance",
    "independance",
    "banque privée",
    "banque privee",
    "cabinet",
    "institution",
)

# Domain-specific candidate proof blocks scored against real offer text using qwen3-embedding:0.6b
OFFER_PROOF_ANGLES: List[Dict[str, str]] = [
    {
        "id": "macro_rates_fx",
        "anchor": "global macro central banks monetary policy fed ecb rates curves sovereign bonds liquidity estr sofr g10 fx currencies ficc sales",
        "fr": "Dans le cadre de Horacle Capital (horaclecapital.com), je rédige chaque semaine des notes d'analyse sur les banques centrales (Fed, BCE), les conditions de liquidité (€STR/SOFR), les courbes de taux et les devises du G10.",
        "en": "Through Horacle Capital (horaclecapital.com), I publish weekly macro notes covering central bank reaction functions (Fed, ECB), money-market liquidity (€STR/SOFR), sovereign rate curves, and G10 FX.",
    },
    {
        "id": "quant_systematic_python",
        "anchor": "quantitative research systematic trading algorithmic backtesting python pandas numpy scikit-learn statistics alpha signals execution mql5",
        "fr": "Sous Python (pandas, NumPy, scikit-learn) et MQL5, j'ai développé Horacle Hub pour automatiser la collecte de données de marché, scorer la valeur relative cross-asset et backtester des signaux systématiques avec contrôle anti-surapprentissage.",
        "en": "Using Python (pandas, NumPy, scikit-learn) and MQL5, I built Horacle Hub to automate market data pipelines, compute cross-asset fair-value scores, and backtest systematic signals under strict statistical validation.",
    },
    {
        "id": "derivatives_structuring_pricing",
        "anchor": "equity derivatives exotic options structured products autocall dispersion volatility surface pricing greeks hedging desk assistant trading",
        "fr": "En parallèle de mes cours de dérivés et fixed income à l'EDHEC, j'ai modélisé sous Python des payoffs convexes et asymétriques sur Horacle Hub afin d'analyser la dynamique des grecs et la sensibilité aux régimes de volatilité.",
        "en": "Alongside my EDHEC coursework in derivatives and fixed income, I built Python valuation and payoff-profiling scripts inside Horacle Hub to track Greeks sensitivity and convexity across volatility regimes.",
    },
    {
        "id": "portfolio_wealth_risk",
        "anchor": "asset management wealth management private banking portfolio allocation multi-asset client advisory mandate drawdown risk control fund selection ucits",
        "fr": "Je gère activement un portefeuille personnel de 30 k€ sur les devises majeures et indices actions sous règles strictes de drawdown et de sizing, en complétant l'approche discrétionnaire par un suivi factoriel multi-actifs.",
        "en": "I actively manage a personal €30k portfolio across G10 FX and major equity indices under strict drawdown and position-sizing limits, pairing macro conviction with multi-asset factor tracking.",
    },
]


def _get_ollama_sem() -> asyncio.Semaphore:
    loop_id = id(asyncio.get_running_loop())
    sem = _OLLAMA_SEMS.get(loop_id)
    if sem is None:
        sem = asyncio.Semaphore(1)
        _OLLAMA_SEMS[loop_id] = sem
    return sem


def _strip_accents_lower(val: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFKD", val or "") if not unicodedata.combining(c)
    ).lower().strip()


def is_valid_person_candidate(name: str, role: str, company_name: str = "") -> bool:
    """Filters out firm names, navigation labels, legal entities, and UI strings mistaken for people."""
    if not name or any(ch.isdigit() for ch in name):
        return False
    norm_name = _strip_accents_lower(name)
    raw_words = [w for w in re.split(r"[\s]+", norm_name) if w]
    if len(raw_words) < 2 or len(raw_words) > 4:
        return False
    significant = [w for w in raw_words if w not in {"de", "du", "des", "van", "von", "le", "la"}]
    if len(significant) < 2:
        return False
    if not all(re.match(r"^[a-z][a-z'-]{1,22}$", w) for w in significant):
        return False
    if any(w in _NON_PERSON_TOKENS for w in significant):
        return False

    norm_company = _strip_accents_lower(company_name.split("(")[0])
    co_words = {w for w in re.split(r"[\s/&,-]+", norm_company) if len(w) > 2}
    overlap = [w for w in significant if w in co_words]
    if len(overlap) >= 2 or (len(overlap) == 1 and overlap[0] == significant[0]):
        return False

    norm_role = _strip_accents_lower(role)
    if norm_role in _NON_PERSON_ROLES or any(norm_role.startswith(r) for r in _NON_PERSON_ROLES):
        return False
    return True


async def _embed_texts(texts: List[str]) -> Optional[np.ndarray]:
    if not texts:
        return None
    try:
        async with _get_ollama_sem():
            async with httpx.AsyncClient(timeout=10.0, trust_env=False) as client:
                resp = await client.post(
                    f"{OLLAMA_BASE_URL}/api/embed",
                    json={"model": EMBED_MODEL, "input": texts},
                )
                if resp.status_code != 200:
                    return None
                embs = resp.json().get("embeddings")
                if not embs or len(embs) != len(texts):
                    return None
                mat = np.asarray(embs, dtype=np.float32)[:, :EMBED_DIM]
                norms = np.linalg.norm(mat, axis=1, keepdims=True)
                norms[norms == 0] = 1.0
                return mat / norms
    except Exception:
        return None


def _embed_texts_sync(texts: List[str]) -> Optional[np.ndarray]:
    if not texts:
        return None
    try:
        with httpx.Client(timeout=6.0, trust_env=False) as client:
            resp = client.post(
                f"{OLLAMA_BASE_URL}/api/embed",
                json={"model": EMBED_MODEL, "input": texts},
            )
            if resp.status_code != 200:
                return None
            embs = resp.json().get("embeddings")
            if not embs or len(embs) != len(texts):
                return None
            mat = np.asarray(embs, dtype=np.float32)[:, :EMBED_DIM]
            norms = np.linalg.norm(mat, axis=1, keepdims=True)
            norms[norms == 0] = 1.0
            return mat / norms
    except Exception:
        return None


async def rank_emails_with_qwen(
    candidates: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    Uses `qwen3-embedding:0.6b` cosine similarity on (email + surrounding HTML context)
    to boost genuine HR/recruitment/PM emails and penalize legal/GDPR/technical addresses.
    """
    if not candidates:
        return candidates

    if "pos" not in _ANCHOR_CACHE or "neg" not in _ANCHOR_CACHE:
        anchors = await _embed_texts([POSITIVE_EMAIL_ANCHOR, NEGATIVE_EMAIL_ANCHOR])
        if anchors is None:
            return candidates
        _ANCHOR_CACHE["pos"] = anchors[0]
        _ANCHOR_CACHE["neg"] = anchors[1]

    snippets = [
        f"{c['email']} - {(c.get('context') or '')[:220]}"
        for c in candidates
    ]
    vecs = await _embed_texts(snippets)
    if vecs is None:
        return candidates

    pos_vec = _ANCHOR_CACHE["pos"]
    neg_vec = _ANCHOR_CACHE["neg"]
    for i, c in enumerate(candidates):
        pos_sim = float(np.dot(vecs[i], pos_vec))
        neg_sim = float(np.dot(vecs[i], neg_vec))
        qwen_bonus = round((pos_sim - neg_sim) * 80.0, 2)
        c["qwen_score"] = qwen_bonus
        c["priority"] = round(float(c.get("priority", 40)) + qwen_bonus, 2)

    candidates.sort(key=lambda x: x["priority"], reverse=True)
    return candidates


def match_offer_angles_with_qwen(
    job_title: str,
    desk: str,
    offer_description: str,
    offer_requirements: str,
    is_english: bool,
) -> Tuple[List[str], bool]:
    """
    Uses `qwen3-embedding:0.6b` to pick the 2 most relevant proof paragraphs for this exact offer,
    falling back to zero-latency deterministic scoring if Ollama is unreachable.
    Returns (selected_paragraphs, used_qwen).
    """
    query_text = f"{job_title} {desk} {(offer_description or '')[:1200]} {(offer_requirements or '')[:500]}".strip()
    lang_key = "en" if is_english else "fr"

    # Compute/cache anchor vectors for the 4 proof angles
    if "angles_mat" not in _ANCHOR_CACHE:
        angle_vecs = _embed_texts_sync([a["anchor"] for a in OFFER_PROOF_ANGLES])
        if angle_vecs is not None:
            _ANCHOR_CACHE["angles_mat"] = angle_vecs

    angles_mat = _ANCHOR_CACHE.get("angles_mat")
    q_vec = _embed_texts_sync([query_text]) if angles_mat is not None else None
    if angles_mat is not None and q_vec is not None:
        sims = np.dot(angles_mat, q_vec[0])
        top_indices = np.argsort(-sims)[:2].tolist()
        return [OFFER_PROOF_ANGLES[idx][lang_key] for idx in top_indices], True

    # Deterministic fallback
    low = query_text.lower()
    if any(k in low for k in ("quant", "systematic", "algo", "python", "market making", "data")):
        idxs = [1, 2]
    elif any(k in low for k in ("deriv", "structur", "option", "volatil", "exotic", "trading")):
        idxs = [2, 1]
    elif any(k in low for k in ("wealth", "private", "asset management", "gérant", "portfolio", "fund")):
        idxs = [3, 0]
    else:
        idxs = [0, 1]
    return [OFFER_PROOF_ANGLES[i][lang_key] for i in idxs], False


def clean_no_ai_cliches(text: str) -> str:
    """Strips markdown bold, bullet prefixes, em-dashes, and localhost URLs."""
    if not text:
        return ""
    cleaned = text.replace("**", "").replace("—", ",").replace("–", "-")
    cleaned = re.sub(r"```(?:json)?|```", "", cleaned)
    cleaned = re.sub(r"(?m)^\s*[-*•]\s+", "", cleaned)
    cleaned = re.sub(r"https?://(?:127\.0\.0\.1|localhost)(?::\d+)?[^\s\)]*", "", cleaned, flags=re.I)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    return cleaned.strip()
