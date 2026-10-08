import urllib.parse
from typing import Dict, Any, List


DESK_SPECIFIC_PITCHES = {
    "Trading Flow / Exotics": (
        "Particulièrement passionné par la dynamique des marchés de capitaux, la gestion du risque en temps réel "
        "et le pricing des dérivés complexes, je dispose d'une solide formation quantitative (calcul stochastique, "
        "modèle Black-Scholes et surfaces de volatilité) et d'une maîtrise avancée du développement sous Python / C++."
    ),
    "Trading Assistant / Market Making": (
        "Animé par l'exécution rapide, le monitoring des positions de trading et le market making, "
        "je souhaite apporter mes compétences en automatisation de flux (Python, SQL, API de marché) "
        "et mon analyse rigoureuse des spreads et carnets d'ordres au sein de votre desk."
    ),
    "Structuring Produits Structurés": (
        "Intéressé par la conception de payoffs sur-mesure (Autocalls, Reverse Convertibles, capital garanti) "
        "et la relation étroite entre sales et trading, je combine rigueur mathématique et sens du produit d'investissement "
        "pour répondre aux besoins des clients institutionnels et de gestion de fortune."
    ),
    "Quantitative Research / Trading": (
        "Spécialisé en mathématiques financières appliquées, statistiques et algorithmes d'apprentissage statistique, "
        "j'ai développé des outils de backtest et de calibrage de modèles de diffusion. Je souhaite contribuer activement "
        "à la recherche de signaux d'alpha et à l'optimisation des stratégies quantitatives du desk."
    ),
    "Sales FICC / Institutional": (
        "Doté d'un excellent relationnel et d'une compréhension fine des produits de taux, devises et crédit, "
        "je souhaite accompagner vos équipes dans la couverture des comptes institutionnels, l'animation commerciale "
        "et l'élaboration de trade ideas macro-financières pertinentes."
    ),
    "Risk Management de Marché": (
        "Sensible à la robustesse des modèles de valorisation et aux contraintes réglementaires (VaR, Expected Shortfall, "
        "stress-tests), je souhaite mettre mes capacités analytiques au service du contrôle indépendant et de la surveillance "
        "des risques de marché des desks opérationnels."
    )
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
    """Generates an institutional high-impact cover pitch and pre-filled email."""
    desk_pitch = DESK_SPECIFIC_PITCHES.get(desk, (
        "Passionné par les marchés financiers et disposant d'un profil quantitatif rigoureux, "
        "je souhaite vivement mettre mes compétences au service des activités de votre équipe."
    ))

    subject = f"Candidature Stage {job_title} - {candidate_name} ({candidate_school})"
    
    cover_letter = f"""Madame, Monsieur,

Étudiant en finance quantitative au sein de {candidate_school}, je vous adresse ma candidature pour l'offre de stage "{job_title}" au sein de {company} ({desk}).

{desk_pitch}

Au cours de mon cursus académique et de mes projets personnels, j'ai notamment eu l'occasion de développer des modèles d'analyse quantitative sous Python (manipulation de données haute fréquence, pricing de dérivés, automatisation de reporting) et d'approfondir les mécanismes de microstructure des marchés.

Rejoindre {company} représenterait pour moi l'opportunité de mettre mon dynamisme, ma réactivité et ma rigueur technique au profit de l'excellence de votre desk.

Je serais honoré de pouvoir échanger avec vous lors d'un entretien afin de vous exposer plus en détail ma motivation.

Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

{candidate_name}
{candidate_email}
"""

    quick_pitch = (
        f"Bonjour,\n\n"
        f"Étudiant à {candidate_school}, je postule au stage '{job_title}' ({desk}) chez {company}. "
        f"{desk_pitch}\n\n"
        f"Vous trouverez mon CV ci-joint. Disponible dès maintenant pour un échange.\n\n"
        f"Bien cordialement,\n{candidate_name}"
    )

    recipient = direct_email or f"recrutement-campus@{company.lower().replace(' ', '')}.com"
    mailto_params = {
        "subject": subject,
        "body": quick_pitch
    }
    mailto_url = f"mailto:{recipient}?{urllib.parse.urlencode(mailto_params)}"

    bullets = [
        "Maîtrise Python (NumPy, Pandas, SciPy) & pricing d'options",
        "Sensibilité aiguë au risque de marché (Greeks, VaR, stress testing)",
        "Proactivité, rapidité d'exécution et culture des marchés financiers",
        f"Formation d'excellence : {candidate_school}"
    ]

    return {
        "subject": subject,
        "cover_letter": cover_letter,
        "quick_email_pitch": quick_pitch,
        "mailto_url": mailto_url,
        "recommended_portfolio_bullets": bullets
    }
