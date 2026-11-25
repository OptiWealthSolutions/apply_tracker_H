import re
import urllib.parse
from typing import Dict, Any, List, Optional

from .cv_generator import recommend_cv_variant
from .local_llm import clean_no_ai_cliches, match_offer_angles_with_qwen


DESK_SPECIFIC_SUBSTANCE: Dict[str, str] = {
    "Trading Flow / Exotics": (
        "En parallèle de mon Master in Management (Finance Track) à l'EDHEC, j'ai conçu Horacle Hub, "
        "une plateforme quantitative en Python intégrant des modèles de pricing cross-asset et un pipeline "
        "systématique calibré sur des payoffs convexes. Je maîtrise la valorisation des dérivés, la dynamique des grecs "
        "et l'exécution algorithmique sous Python et MQL5."
    ),
    "Trading Assistant / Market Making": (
        "Au sein de Horacle Capital, j'ai automatisé des pipelines de données financières et de backtesting de stratégies. "
        "Habitué au monitoring de positions et à l'analyse de spreads, je suis directement opérationnel sur l'automatisation "
        "des flux du desk et l'aide au pricing sous Python."
    ),
    "Structuring Produits Structurés": (
        "Mes travaux sur Horacle Hub portent sur la modélisation de fair value cross-asset et la construction de payoffs asymétriques. "
        "J'ai une solide compréhension des produits structurés (autocalls, reverse convertibles, dispersion) et de l'articulation "
        "entre pricing sur le desk et force de vente."
    ),
    "Structuring & Exécution Marchés": (
        "Mes travaux sur Horacle Hub portent sur l'analyse cross-asset, le pricing de produits structurés et l'exécution systématique en Python et MQL5, "
        "en lien direct avec mes notes macroéconomiques hebdomadaires publiées sur horaclecapital.com."
    ),
    "Quantitative Research / Trading": (
        "Fondateur de Horacle Capital, j'ai développé une infrastructure en Python intégrant des moteurs de scoring macroéconomique, "
        "des indices de surprises économiques et des tests statistiques anti-surapprentissage sur séries temporelles financières."
    ),
    "Rates & FX Desk": (
        "Je rédige régulièrement des notes de recherche macroéconomique sur horaclecapital.com consacrés aux mécanismes de liquidité "
        "des banques centrales (BCE, Fed, €STR/SOFR) et aux courbes de taux souverains, complétés par des outils Python de suivi des écarts de change et de taux."
    ),
    "Sales FICC / Institutional": (
        "Je combine une lecture rigoureuse des marchés de taux, de devises et de crédit acquise à travers les recherches macroéconomiques "
        "de Horacle Capital avec une maîtrise pratique de Python pour formuler des idées de marché claires et argumentées."
    ),
    "Wealth Management & Banque Privée": (
        "Dans le cadre de Horacle Capital, je rédige des notes d'analyse macroéconomique sur les taux directeurs, l'inflation et les flux de liquidité (€STR, SOFR), "
        "et j'ai développé sous Python et MQL5 l'outil Horacle Hub pour suivre l'allocation cross-asset et le risque de portefeuille sur 30 k€ de capital géré activement."
    ),
    "Asset Management Boutique": (
        "À travers Horacle Capital et ma plateforme Horacle Hub (Python), je combine suivi macroéconomique hebdomadaire (banques centrales, courbes de taux, devises), "
        "analyse factorielle multi-actifs et gestion disciplinée du risque sur un portefeuille réel."
    ),
    "Quantitative Asset Management": (
        "Mon cursus Finance à l'EDHEC combiné à Horacle Hub m'a permis de développer des modèles factoriels multi-actifs, "
        "des indicateurs de fair value cross-asset et des outils d'attribution de performance et de contrôle de drawdown sous Python."
    ),
    "Hedge Fund & Global Macro": (
        "Through Horacle Capital (horaclecapital.com), I publish institutional-style global macro research covering central bank liquidity (Fed, ECB, €STR/SOFR), "
        "G10 FX and sovereign rate differentials, backed by Horacle Hub, a Python and MQL5 pipeline built for cross-asset fair-value scoring and systematic backtesting."
    ),
    "Hedge Fund / Systematic Strategies": (
        "Through Horacle Capital, I built a Python and MQL5 quantitative research pipeline focused on macro liquidity regimes, cross-asset fair value, "
        "and strict drawdown control on actively managed capital."
    ),
    "Market Making & Prop Trading": (
        "Alongside my EDHEC Master in Management (Finance Track), I built Horacle Hub in Python and MQL5 for real-time market data ingestion, "
        "volatility regime analysis, and systematic execution under strict risk and drawdown limits."
    ),
}


def _is_english_context(location: str, job_title: str, desk: str) -> bool:
    loc_l = (location or "").lower()
    title_l = (job_title or "").lower()
    desk_l = (desk or "").lower()
    if any(c in loc_l for c in ("london", "londres", "amsterdam", "new york", "zurich", "dublin", "uk", "us")):
        return True
    if any(c in desk_l for c in ("hedge fund", "market making", "prop trading")):
        return True
    if any(w in title_l for w in ("intern", "internship", "summer", "off-cycle", "trader", "analyst")) and "stage" not in title_l and "stagiaire" not in title_l:
        return True
    return False


_OFFER_SKILL_PATTERNS = [
    (r"\bpython\b", "Python", "Python"),
    (r"\b(pandas|numpy|scipy|scikit-learn)\b", "pandas/NumPy", "pandas/NumPy"),
    (r"\bmql5\b", "MQL5", "MQL5"),
    (r"\bsql\b", "SQL", "SQL"),
    (r"\bvba\b", "VBA", "VBA"),
    (r"\bbloomberg\b", "Bloomberg", "Bloomberg"),
    (r"\b(equity derivatives|dérivés actions|options|volatility|exotics)\b", "equity derivatives", "les dérivés actions"),
    (r"\b(fixed income|rates|taux|sovereign|credit|ficc)\b", "rates & fixed income", "les taux et obligations"),
    (r"\b(fx|foreign exchange|devises|g10)\b", "G10 FX", "le change G10"),
    (r"\b(structured products|produits structurés|autocall)\b", "structured products", "les produits structurés"),
    (r"\b(macro|central bank|banques centrales|monetary)\b", "global macro", "l'analyse macroéconomique"),
    (r"\b(systematic|backtest|quantitative|factor|alpha)\b", "quantitative modeling", "la modélisation quantitative"),
    (r"\b(wealth management|private banking|banque privée|allocation|multi-asset|gestion d'actifs|asset management)\b", "multi-asset allocation", "l'allocation multi-actifs"),
]


def _extract_offer_focus_terms(offer_description: str, offer_requirements: str, is_english: bool) -> List[str]:
    blob = f"{offer_description or ''} {offer_requirements or ''}".lower()
    found: List[str] = []
    for pat, en_label, fr_label in _OFFER_SKILL_PATTERNS:
        label = en_label if is_english else fr_label
        if re.search(pat, blob, re.I) and label not in found:
            found.append(label)
        if len(found) >= 4:
            break
    return found


def generate_application_pitch(
    candidate_name: str,
    candidate_email: str,
    candidate_school: str = "EDHEC Business School",
    company: str = "",
    job_title: str = "",
    desk: str = "",
    direct_email: Optional[str] = None,
    location: str = "Paris",
    contact_name: Optional[str] = None,
    offer_description: Optional[str] = None,
    offer_requirements: Optional[str] = None,
    use_llm: bool = True,
) -> Dict[str, Any]:
    """
    Génère un email et une lettre de candidature naturels et adaptés à l'offre,
    en croisant le descriptif du poste via `qwen3-embedding:0.6b` (zéro pattern IA, zéro localhost).
    """
    cv_variant = recommend_cv_variant(desk, job_title)
    is_en = _is_english_context(location, job_title, desk)

    selected_angles, used_qwen = match_offer_angles_with_qwen(
        job_title=job_title,
        desk=desk,
        offer_description=offer_description or "",
        offer_requirements=offer_requirements or "",
        is_english=is_en,
    )
    generated_by = "qwen3-context" if used_qwen else "calibrated"

    offer_terms = _extract_offer_focus_terms(offer_description or "", offer_requirements or "", is_en)
    primary_angle = selected_angles[0] if selected_angles else DESK_SPECIFIC_SUBSTANCE.get(desk, "")
    secondary_angle = selected_angles[1] if len(selected_angles) > 1 else ""

    clean_contact = (contact_name or "").strip()
    if is_en:
        greeting = f"Dear {clean_contact}," if clean_contact else f"Dear {company} Team,"
        subject = f"Internship Application (June 2027) - {job_title} - {candidate_name}"
        focus_line = (
            f"Your description highlights {', '.join(offer_terms[:3])}, which directly matches my daily work. "
            if offer_terms
            else ""
        )
        cover_letter = (
            f"{greeting}\n\n"
            f"I am currently pursuing a Master in Management (Finance Track) at EDHEC Business School, following two years of ENS D2 preparatory classes. "
            f"I am applying for a 6-month internship starting in June 2027 as {job_title} within {company} ({location}).\n\n"
            f"{focus_line}{primary_angle}\n\n"
            f"{secondary_angle}\n\n"
            f"I would welcome the opportunity to discuss how this analytical and technical background can contribute to {company}'s team. "
            f"You will find my CV attached.\n\n"
            f"Sincerely,\n{candidate_name}\n{candidate_email} | +33 7 85 42 69 11 | horaclecapital.com"
        )
        quick_pitch = (
            f"{greeting}\n\n"
            f"I am currently a Master in Management (Finance Track) student at EDHEC looking for a 6-month internship starting June 2027 "
            f"as {job_title} at {company}. {focus_line}{primary_angle}\n\n"
            f"My CV is attached and I would appreciate a brief call at your convenience.\n\n"
            f"Best regards,\n{candidate_name}\n{candidate_email} | +33 7 85 42 69 11 | horaclecapital.com"
        )
    else:
        greeting = f"Bonjour {clean_contact}," if clean_contact else "Madame, Monsieur,"
        subject = f"Candidature Stage Juin 2027 - {job_title} - {candidate_name}"
        focus_line = (
            f"Votre descriptif met l'accent sur {', '.join(offer_terms[:3])}, des sujets sur lesquels je travaille concrètement chaque semaine. "
            if offer_terms
            else ""
        )
        cover_letter = (
            f"{greeting}\n\n"
            f"Actuellement étudiant en Master in Management (Finance Track) à l'EDHEC Business School après deux années de classe préparatoire ENS D2, "
            f"je vous propose ma candidature pour un stage de 6 mois à compter de juin 2027 ({job_title}) au sein de {company} ({location}).\n\n"
            f"{focus_line}{primary_angle}\n\n"
            f"{secondary_angle}\n\n"
            f"Je serais heureux d'échanger avec votre équipe sur la façon dont ce profil technique et marchés peut vous appuyer dès juin 2027. "
            f"Vous trouverez mon CV en pièce jointe.\n\n"
            f"Bien cordialement,\n{candidate_name}\n{candidate_email} | 07 85 42 69 11 | horaclecapital.com"
        )
        quick_pitch = (
            f"{greeting}\n\n"
            f"Étudiant en Master in Management (Finance Track) à l'EDHEC après une prépa ENS D2, je recherche un stage de 6 mois dès juin 2027 "
            f"({job_title}) chez {company}. {focus_line}{primary_angle}\n\n"
            f"Vous trouverez mon CV en pièce jointe. Je reste disponible pour un premier échange à votre convenance.\n\n"
            f"Bien cordialement,\n{candidate_name}\n{candidate_email} | 07 85 42 69 11 | horaclecapital.com"
        )

    subject = clean_no_ai_cliches(subject)
    quick_pitch = clean_no_ai_cliches(quick_pitch)
    cover_letter = clean_no_ai_cliches(cover_letter)

    recipient = (direct_email or "").strip()
    mailto_params = {
        "subject": subject,
        "body": quick_pitch,
    }
    mailto_url = f"mailto:{recipient}?{urllib.parse.urlencode(mailto_params)}"

    if cv_variant == "buyside":
        bullets = [
            "EDHEC Business School · Master in Management Finance Track (Portfolio Construction with Python, Fixed Income & Derivatives)",
            "Horacle Capital : gestion active d'un portefeuille personnel de 30 k€ (FX G10 & indices actions) sous contraintes strictes de drawdown",
            "Horacle Hub (Python / MQL5) : macro-scoring, fair-value cross-asset et notes macro hebdomadaires (horaclecapital.com)",
            "Analyse des bilans des banques centrales (Fed, BCE), différentiels de taux réels et régimes de liquidité (€STR, SOFR)",
            "Disponible dès juin 2027 pour un stage de 6 mois en Wealth Management / Asset Management / Hedge Fund",
        ]
    else:
        bullets = [
            "EDHEC Business School · Master in Management Finance Track (Fixed Income & Derivatives, Financial Markets, Advanced Macroeconomics)",
            "Horacle Capital : trading discrétionnaire Macro FX (paires G10) et stratégies systématiques sur indices US (Python, MQL5)",
            "Gestion active d'un portefeuille personnel de 30 k€ sous règles strictes de risque et de position-sizing",
            "Horacle Hub (Python : NumPy, Pandas, SciPy, Scikit-Learn) : scoring macroéconomique et fair-value cross-asset (horaclecapital.com)",
            "Disponible dès juin 2027 pour un stage de 6 mois en Trading / Structuring / Sales / Macro",
        ]

    return {
        "subject": subject,
        "cover_letter": cover_letter,
        "quick_email_pitch": quick_pitch,
        "mailto_url": mailto_url,
        "recommended_portfolio_bullets": bullets,
        "generated_by": generated_by,
        "cv_view_url": f"/api/cv/view?variant={cv_variant}",
        "cv_download_url": f"/api/cv/download?variant={cv_variant}",
    }
