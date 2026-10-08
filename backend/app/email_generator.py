import urllib.parse
from typing import Dict, Any, List


DESK_SPECIFIC_SUBSTANCE = {
    "Trading Flow / Exotics": (
        "En parallèle de mon cursus en M1 Finance de Marché à l'EDHEC, j'ai développé Horacle Hub, "
        "une infrastructure quantitative en Python intégrant des modèles de pricing cross-asset et un pipeline "
        "systématique calibré pour capturer des payoffs convexes et asymétriques. "
        "Je maîtrise les mécanismes de valorisation des dérivés, la dynamique des grecs (gamma, vega, vanna-volga) "
        "et l'exécution algorithmique sous Python et MQL5."
    ),
    "Trading Assistant / Market Making": (
        "Dans le cadre de mes travaux sur Horacle Capital, j'ai automatisé des pipelines de données financières "
        "et de backtesting de stratégies en temps réel. Habitué au monitoring de positions et à l'analyse de spreads, "
        "je suis immédiatement opérationnel sur l'automatisation des flux quotidiens du desk et l'aide au pricing via Python."
    ),
    "Structuring Produits Structurés": (
        "Mon travail sur Horacle Hub s'articule autour de la modélisation de fair value cross-asset et de l'ingénierie "
        "de payoffs asymétriques. J'ai une solide compréhension de la construction de structures sur-mesure (autocalls, "
        "reverse convertibles, structures de corrélation) et de l'articulation entre trading et force de vente institutionnelle."
    ),
    "Quantitative Research / Trading": (
        "Fondateur de Horacle Capital, j'ai conçu et déployé une plateforme quantitative complète en Python intégrant des "
        "moteurs de scoring macroéconomique, des indices de surprises économiques et des algorithmes d'apprentissage statistique. "
        "Je dispose d'une pratique quotidienne du traitement de séries temporelles financières, du calcul stochastique "
        "et de l'optimisation robuste de signaux d'arbitrage."
    ),
    "Rates & FX Desk": (
        "Je publie régulièrement des notes de recherche macroéconomique institutionnelles (horaclecapital.com) "
        "consacrées aux mécanismes de transmission de la liquidité des banques centrales (BCE, Fed) et à la dynamique "
        "des courbes de taux souverains. J'associe cette vision top-down à des outils quantitatifs en Python pour modéliser "
        "les écarts de valorisation et les flux de change."
    ),
    "Sales FICC / Institutional": (
        "Je combine une compréhension approfondie des marchés de taux, de devises et de crédit à une capacité d'analyse "
        "macroéconomique rigoureuse acquise lors de la rédaction des recherches de Horacle Capital. "
        "Mon profil me permet d'échanger avec pertinence avec des investisseurs institutionnels et de formuler des trade ideas claires."
    ),
    "Risk Management de Marché": (
        "À travers la gestion des contraintes de risque de mes portefeuilles systématiques (VaR historique, Expected Shortfall, "
        "scénarios de stress-test de liquidité), j'ai acquis une culture du risque de marché rigoureuse et une maîtrise "
        "des métriques quantitatives indispensables à la surveillance des expositions des desks."
    ),
    "Commodities & Energy": (
        "Suivant de près les marchés de l'énergie et des matières premières au sein de mes modèles de fair value cross-asset, "
        "je sais analyser les fondamentaux d'offre/demande, les structures de terme (contango/backwardation) et concevoir des "
        "stratégies de couverture sous Python."
    ),
    "Hedge Fund / Systematic Strategies": (
        "En fondant Horacle Capital, j'ai développé une plateforme quantitative complète en Python axée sur l'alpha macroéconomique "
        "et l'extraction de rendements convexes asymétriques. Habitué à concevoir des modèles robustes résistant au sur-apprentissage "
        "et à backtester des stratégies systématiques multi-actifs sous contraintes strictes de Sharpe et de drawdowns, "
        "je m'intègre immédiatement au sein de votre équipe de recherche quantitative ou de gestion alternative."
    ),
    "Quantitative Asset Management": (
        "Mon cursus en M1 Finance à l'EDHEC combiné au développement de Horacle Hub m'a permis de concevoir des modèles factoriels multi-actifs, "
        "des indicateurs de fair value cross-asset et des techniques d'allocation optimisée de portefeuille. "
        "Je maîtrise l'analyse de risque factoriel, l'attribution de performance et l'automatisation des pipelines d'investissement sous Python."
    ),
    "FinTech / Quantitative Engineering": (
        "Concepteur intégral d'Horacle Hub, j'ai bâti une architecture applicative complète alliant ingestion de séries temporelles financières, "
        "moteurs d'analyse macroéconomique et pipelines de pricing stochastique sous Python et MQL5. "
        "Mon double profil finance de marché et ingénierie logicielle quantitative me permet de développer des solutions algorithmiques "
        "fiables, véloces et directement orientées production."
    ),
}


def generate_application_pitch(
    candidate_name: str,
    candidate_email: str,
    candidate_school: str,
    company: str,
    job_title: str,
    desk: str,
    direct_email: str = None
) -> Dict[str, Any]:
    """
    Génère un email et une lettre de candidature sobres, directs et institutionnels,
    sans aucune tournure générique d'IA. Ancré sur l'expérience réelle d'EDHEC M1 Finance & Horacle Capital.
    """
    substance = DESK_SPECIFIC_SUBSTANCE.get(desk, (
        "Actuellement en Master 1 Finance à l'EDHEC (Programme Grande École, filière Financial Markets), "
        "j'ai développé une solide compétence quantitative à travers la création de Horacle Capital et de sa plateforme "
        "propriétaire d'analyse macro et de backtesting systématique sous Python."
    ))

    subject = f"Candidature Stage {job_title} - {candidate_name} ({candidate_school})"

    cv_view_url = "http://127.0.0.1:8000/api/cv/view"
    cv_download_url = "http://127.0.0.1:8000/api/cv/download"

    # Lettre épurée, factuelle, sans fioritures
    cover_letter = f"""Madame, Monsieur,

Actuellement étudiant en Master 1 Finance à l'EDHEC Business School (Programme Grande École, filière Financial Markets), je vous adresse ma candidature pour le stage « {job_title} » au sein de votre desk {desk} chez {company}, pour une durée de 6 mois à compter de juin 2027.

{substance}

Mes compétences s'articulent autour de :
- L'analyse quantitative et le développement d'outils opérationnels sous Python (pandas, numpy, backtest vectorisé et événementiel) et MQL5.
- La modélisation macroéconomique, le pricing d'actifs et l'étude des mécanismes de transmission de liquidité.
- Une rigueur analytique renforcée par deux années de classe préparatoire ENS D2 (économie et gestion quantitatives) avant l'EDHEC.

Rejoindre votre équipe représente pour moi l'opportunité de mettre directement à profit mon autonomie, ma culture financière et ma réactivité d'exécution sur le desk.

Vous trouverez mon curriculum vitæ joint (également consultable en direct : {cv_view_url}). Je me tiens à votre entière disposition pour un entretien technique.

{candidate_name}
{candidate_email}
+33 7 85 42 69 11
"""

    quick_pitch = (
        f"Bonjour,\n\n"
        f"Étudiant en Master 1 Finance à l'EDHEC (Track Financial Markets), je postule au stage '{job_title}' ({desk}) chez {company} (6 mois dès juin 2027).\n\n"
        f"{substance}\n\n"
        f"Mon CV est joint à ce message (également consultable en ligne : {cv_view_url}). Je suis disponible pour un échange technique à votre convenance.\n\n"
        f"Bien cordialement,\n"
        f"{candidate_name}\n"
        f"{candidate_email} | +33 7 85 42 69 11"
    )

    recipient = direct_email or f"recrutement-campus@{company.lower().replace(' ', '')}.com"
    mailto_params = {
        "subject": subject,
        "body": quick_pitch
    }
    mailto_url = f"mailto:{recipient}?{urllib.parse.urlencode(mailto_params)}"

    bullets = [
        "EDHEC Business School - M1 Financial Markets (PGE) & Prépa ENS D2",
        "Fondateur Horacle Capital : conception d'Horacle Hub (scoring macro & fair value en Python)",
        "Modélisation quantitative, backtesting de payoffs asymétriques & convexité",
        "Maîtrise Python (ML finance, data pipelines), MQL5, Excel, Bloomberg",
        "Disponible dès juin 2027 pour un stage off-cycle de 6 mois",
        f"Lien CV hébergé en base de données : {cv_view_url}"
    ]

    return {
        "subject": subject,
        "cover_letter": cover_letter,
        "quick_email_pitch": quick_pitch,
        "mailto_url": mailto_url,
        "recommended_portfolio_bullets": bullets,
        "cv_view_url": cv_view_url,
        "cv_download_url": cv_download_url
    }
