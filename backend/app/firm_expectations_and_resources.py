"""
Firm-Specific Interview Expectations and Curated Educational Resources.
Comprehensive coverage across:
- Investment Banking & M&A Boutiques
- Global Markets / S&T (Equity Derivatives, Rates, FX, Structuring)
- Quantitative Hedge Funds & Prop Trading
- Private Equity & Private Debt
- Audit & Transaction Services
- Strategy Consulting
Includes authentic resources: Videos, Research Papers, Reference Books, GitHub Repos, and Trainers.
"""

from typing import List, Optional
from pydantic import BaseModel


class FirmInterviewExpectation(BaseModel):
    id: str
    firm_name: str
    sector: str  # "Investment Banking", "Global Markets S&T", "Hedge Funds & Prop Trading", "Private Equity", "Audit & TS", "Conseil en Stratégie"
    division: str
    locations: List[str]
    recruitment_process: List[str]
    culture_and_fit_expectations: List[str]
    technical_evaluations: List[str]
    brainteasers_or_tests: List[str]
    typical_interview_questions: List[str]
    insider_candidate_tips: str
    official_careers_url: str


class EducationalResource(BaseModel):
    id: str
    title: str
    creator_or_author: str
    resource_type: str  # "Vidéo / Cours", "Paper de Recherche", "Livre de Référence", "Repository GitHub", "Entraînement / Outil"
    sector: str  # "Finance de Marché & Dérivés", "Investment Banking & M&A", "Quant Finance & Algo Trading", "Brainteasers & Math", "Private Equity & LBO", "Strategy Consulting & TS"
    url: str
    duration_or_pages: str
    difficulty: str  # "Fondamental", "Intermédiaire", "Avancé / Desk Head"
    description: str
    key_takeaways: List[str]


# ============================================================================
# FIRM-SPECIFIC INTERVIEW EXPECTATIONS DATABASE
# ============================================================================
FIRM_EXPECTATIONS_DATABASE: List[FirmInterviewExpectation] = [
    # --- INVESTMENT BANKING & M&A ---
    FirmInterviewExpectation(
        id="firm_goldman_ibd",
        firm_name="Goldman Sachs",
        sector="Investment Banking",
        division="Investment Banking Division (Classic M&A, Financing Group)",
        locations=["Paris", "Londres", "New York"],
        recruitment_process=[
            "Candidature en ligne via GS Career Portal (CV 1 page strict, sans photo)",
            "Évaluation vidéo asynchrone HireVue (3 questions comportementales et d'actualité)",
            "Premier tour technique (Associate / VP) : états financiers, valorisation, fit",
            "Superday final : 3 à 4 entretiens consécutifs avec Managing Directors et VPs"
        ],
        culture_and_fit_expectations=[
            "Maîtrise absolue des 'Business Principles' de Goldman Sachs (intégrité, travail d'équipe d'excellence, culture du partenariat).",
            "Capacité à articuler pourquoi Goldman Sachs plutôt qu'une boutique ou Morgan Stanley.",
            "Résistance au stress et présentation irréprochable sous pression."
        ],
        technical_evaluations=[
            "Lien mécanique entre les 3 états financiers (Bilan, Compte de Résultat, Tableau de Flux de Trésorerie). Ex: impact de +10€ d'amortissement.",
            "Méthodes de valorisation : DCF étape par étape (WACC, terminal value Gordon-Shapiro vs multiple d'EBITDA, calcul du Free Cash Flow).",
            "Multiples boursiers (Trading Comps) vs Transactions Précédentes (precedent transactions) : prime de contrôle et normalisation.",
            "Notions de base de LBO : papier LBO sans calculatrice, calcul du TRI mental."
        ],
        brainteasers_or_tests=[
            "Test rapide de calcul mental (multiplication à 2 chiffres, pourcentages d'accrétion).",
            "Questions d'actualité financière récente (analyser le dernier deal de la presse du matin)."
        ],
        typical_interview_questions=[
            "Parlez-moi d'une opération M&A récente qui a retenu votre attention et analysez la logique stratégique de l'acquéreur.",
            "Une entreprise dépense 100M€ en Capex financé par 50M€ de dette et 50M€ de trésorerie. Détaillez l'impact sur les 3 états financiers au jour 1 et après 1 an.",
            "Entre un DCF et des multiples de transactions comparables, quelle méthode donne généralement la valeur la plus élevée et pourquoi ?"
        ],
        insider_candidate_tips="Préparez 2 deals récents conseillés par Goldman Sachs dans la presse financière (ex: Les Échos, FT). Connaissez les ratios EBITDA et le montant de l'opération au centime près.",
        official_careers_url="https://www.goldmansachs.com/careers/students"
    ),
    FirmInterviewExpectation(
        id="firm_rothschild_mna",
        firm_name="Rothschild & Co",
        sector="Investment Banking",
        division="Global Advisory (M&A, Debt Advisory, Restructuring)",
        locations=["Paris", "Londres"],
        recruitment_process=[
            "Sélection sur dossier académique d'élite (Grandes Écoles de Commerce / Ingénieurs, EDHEC, Dauphine)",
            "Screening téléphonique / premier tour technique avec Analyste senior",
            "Tour technique écrit : modélisation financière et cas pratique de valorisation / comptabilité",
            "Dernier tour avec Partners et Managing Directors parisiens"
        ],
        culture_and_fit_expectations=[
            "Prestige du conseil indépendant pur (pure-play advisory sans bilan de prêt commercial).",
            "Sens aigu de la discrétion, de la relation client de long terme et de l'étiquette d'affaires à la française.",
            "Connaissance précise des forces sectorielles de Rothschild à Paris (Fig, TMT, Consumer, Large Cap et Merchant Banking)."
        ],
        technical_evaluations=[
            "Comptabilité française et IFRS ultra-rigoureuse : goodwill, dépréciation, variation de BFR, impôts différés.",
            "Passage de l'Enterprise Value à l'Equity Value (Bridge dette nette, minoritaires, provisions, participations).",
            "Modélisation de fusion : calcul d'accrétion/dilution du BPA, synergies de coûts et de revenus, goodwill créé.",
            "Analyse de structure de capital : coût moyen pondéré du capital (WACC) et formule de Hamada pour délever le bêta."
        ],
        brainteasers_or_tests=[
            "Exercice de cas pratique papier : valoriser une cible à partir d'un mini-compte de résultat sur 3 ans.",
            "Estimation de valorisation d'une société non cotée sans comparables directs."
        ],
        typical_interview_questions=[
            "Quelle est la différence entre Enterprise Value et Equity Value ? Si j'émets 50M€ d'actions pour racheter 50M€ de dette, comment varie l'EV ?",
            "Pourquoi utilise-t-on le coût de la dette après impôts dans le calcul du WACC ?",
            "Expliquez le concept de BFR négatif et citez deux secteurs d'activité où il est structurel."
        ],
        insider_candidate_tips="À Paris, Rothschild teste la précision comptable au millimètre. Ne confondez jamais flux de trésorerie d'exploitation (CFO) et Free Cash Flow to Firm (FCFF).",
        official_careers_url="https://www.rothschildandco.com/en/careers"
    ),
    FirmInterviewExpectation(
        id="firm_morgan_stanley_ibd",
        firm_name="Morgan Stanley",
        sector="Investment Banking",
        division="Investment Banking Division (M&A, Sponsors, Capital Markets)",
        locations=["Paris", "Londres", "New York"],
        recruitment_process=[
            "Candidature portail MS + HireVue",
            "Premier round technique (Associate / Analyst 3)",
            "Superday : 3 entretiens croisés (Technique poussée, Fit/Comportemental, Commercial Awareness)"
        ],
        culture_and_fit_expectations=[
            "Culture d'excellence intellectuelle, 'Giving Back', 'Do the Right Thing', 'Lead with Exceptional Ideas'.",
            "Capacité à défendre une thèse d'investissement ou un pitch M&A avec conviction.",
            "Esprit d'équipe et esprit critique sur les chiffres présentés."
        ],
        technical_evaluations=[
            "Modèle DCF : hypothèses de taux sans risque, prime de risque de marché, terminal growth rate vs PIB.",
            "Mécanique LBO : sources & uses, levier maximal soutenable (Dette Nette / EBITDA), cash sweep et TRI sponsor.",
            "Marchés de capitaux (ECM / DCM) : mécanismes d'IPO, d'ABO (Accelerated Bookbuilding) et d'émissions obligataires."
        ],
        brainteasers_or_tests=[
            "Pitch d'une entreprise cible pour un acquéreur industriel du CAC 40.",
            "Mental math rapide sur les pourcentages de participation et les multiples d'EBITDA."
        ],
        typical_interview_questions=[
            "Si une entreprise avec un PER de 25 rachète une cible avec un PER de 15 par échange de titres à 100%, la transaction est-elle relutive ou dilutive ?",
            "Pourquoi ne prend-on pas en compte les charges financières dans le Free Cash Flow to Firm (FCFF) ?",
            "Comment modéliseriez-vous l'impact d'une hausse des taux d'intérêt de 100 bps sur la valorisation DCF d'une entreprise technologique à forte croissance ?"
        ],
        insider_candidate_tips="Morgan Stanley accorde une importance capitale à l'impact des taux sur les valorisations technologiques et aux transactions sponsor/PE récentes.",
        official_careers_url="https://www.morganstanley.com/people-opportunities/students-graduates"
    ),
    FirmInterviewExpectation(
        id="firm_lazard_mna",
        firm_name="Lazard",
        sector="Investment Banking",
        division="Financial Advisory (M&A, Restructuring, Sovereign Advisory)",
        locations=["Paris", "Londres", "New York"],
        recruitment_process=[
            "Screening académique strict",
            "Round 1 : 2 entretiens techniques (Analyste + Associate)",
            "Round 2 : Étude de cas financière écrite (Business Plan + Valorisation)",
            "Round final : 2 à 3 entretiens avec Managing Directors parisiens"
        ],
        culture_and_fit_expectations=[
            "ADN aristocratique et intellectuel du conseil sur mesure. Culture de l'argumentation rigoureuse.",
            "Forte exigence sur la culture financière générale, l'histoire des grands deals et la macroéconomie.",
            "Autonomie et maturité professionnelle immédiate."
        ],
        technical_evaluations=[
            "Maîtrise complète des subtilités comptables et des ajustements d'EBITDA (crédit-bail, IFRS 16, provisions).",
            "Valorisation par SOTP (Sum of the Parts) et décote de conglomérat.",
            "Restructuring financier : dette senior vs mezzanine, covenants financiers, waivers et Chapter 11 / Sauvegarde."
        ],
        brainteasers_or_tests=[
            "Étude de cas en temps limité : analyse d'un mémo d'information et proposition d'une fourchette de prix.",
            "Questions de culture financière générale (ex: dette souveraine, crises de liquidité historique)."
        ],
        typical_interview_questions=[
            "Quelle est l'incidence du traitement IFRS 16 des contrats de location opérationnelle sur l'EBITDA, la Dette Nette et l'Enterprise Value ?",
            "Comment évaluez-vous une filiale déficitaire au sein d'un grand conglomérat ?",
            "Quelles sont les trois manières principales pour un fonds de PE de sortir d'un investissement ?"
        ],
        insider_candidate_tips="Lazard Paris adore tester la compréhension approfondie d'IFRS 16 et la transition Dette Nette / Enterprise Value. Soyez incollable sur ces points.",
        official_careers_url="https://www.lazard.com/careers/students/"
    ),

    # --- GLOBAL MARKETS & S&T ---
    FirmInterviewExpectation(
        id="firm_bnp_markets",
        firm_name="BNP Paribas CIB",
        sector="Global Markets S&T",
        division="Global Markets (Equity Derivatives, FICC, Structuring, Commodity Derivatives)",
        locations=["Paris", "Londres"],
        recruitment_process=[
            "Candidature portail Carrières BNP + tests psychométriques/logiques en ligne",
            "Premier tour technique avec Trader / Structurer Senior (45-60 min)",
            "Deuxième tour approfondi : tests mathématiques sur les Grecs et pricing d'options",
            "Échange final avec le Desk Head"
        ],
        culture_and_fit_expectations=[
            "Leader mondial incontesté sur les dérivés actions et les produits structurés ('World's Best Bank for Markets').",
            "Recherche de profils rigoureux, techniquement pointus, humbles et passionnés de marchés.",
            "Forte valorisation des profils hybrides : mathématiques financières + programmation (Python/C++)."
        ],
        technical_evaluations=[
            "Pricing Black-Scholes et intuition physique des Grecs (Delta, Gamma, Vega, Vanna, Volga, Theta).",
            "Dynamique du smile et du skew de volatilité : local vol (Dupire) vs stochastic vol (Heston).",
            "Stratégies systématiques et Gamma scalping : lien EDP Theta-Gamma et P&L explain.",
            "Produits structurés : Autocalls, coupons conditionnels, lissage de barrières et risque de gap."
        ],
        brainteasers_or_tests=[
            "Questions de probabilités conditionnelles et espérance mathématique sur dés/tirages.",
            "Exercices d'arbitrage de parité Call-Put avec dividendes et taux d'emprunt (repo)."
        ],
        typical_interview_questions=[
            "Donnez-moi la parité Call-Put. Si un Call vaut 5€, un Put 3€, le Spot 100€ et le Strike 98€ avec taux nul, que faites-vous ?",
            "Quel est le signe de Vanna (dDelta/dSigma) pour un Call OTM ? Pourquoi augmente-t-il quand la vol monte ?",
            "Comment couvrez-vous un Autocall à 3 jours de l'échéance si le spot est à 1% au-dessus de la barrière de protection ?"
        ],
        insider_candidate_tips="BNP valorise énormément les projets personnels concrets : mettez impérativement en avant votre plateforme Horacle Hub et vos backtests vectorisés sous Python.",
        official_careers_url="https://group.bnpparibas/emploi-carriere"
    ),
    FirmInterviewExpectation(
        id="firm_sg_markets",
        firm_name="Société Générale CIB",
        sector="Global Markets S&T",
        division="Global Markets (Equity Derivatives & Exotics, Cross-Asset Solutions)",
        locations=["Paris", "Londres"],
        recruitment_process=[
            "Screening CV spécialisé (focus Grandes Écoles, EDHEC Financial Markets, masters quantitatifs)",
            "Entretien technique #1 : mathématiques pures, calcul stochastique, parité, dérivés vanilles",
            "Entretien technique #2 : dérivés exotiques, Monte Carlo, microstructure et coding Python",
            "Entretien fit et gestion du risque avec le Responsable de Desk"
        ],
        culture_and_fit_expectations=[
            "Maison historique pionnière des produits dérivés exotiques et des mathématiques financières en France.",
            "Attente d'une rigueur démonstrative sans faille (démontrer plutôt que deviner).",
            "Capacité à vulgariser des concepts mathématiques complexes pour des clients ou des sales."
        ],
        technical_evaluations=[
            "Lemme d'Itô et calcul stochastique : dérivation de l'équation de diffusion de Black-Scholes.",
            "Surfaces de volatilité : calibration SVI / SABR et absence d'arbitrage de calendrier ou de butterfly.",
            "Correlation et dispersion trading : variance swaps indiciels vs composants.",
            "Sensibilités de taux : duration, convexité, DV01 et courbe de forward rates."
        ],
        brainteasers_or_tests=[
            "Énigme du temps d'arrêt optimal et martingales.",
            "Calcul mental rapide de valorisation de payoffs exotiques (digital options, barrier options)."
        ],
        typical_interview_questions=[
            "Démontrez que le Gamma d'une option vanille est maximal au niveau de la monnaie (ATM) à l'approche de l'échéance.",
            "Quelle est la différence entre volatilité implicite, volatilité historique et volatilité locale ?",
            "Expliquez le payoff d'un Variance Swap. Pourquoi le Vega d'un variance swap est-il constant par rapport au niveau du spot ?"
        ],
        insider_candidate_tips="À la SG, révisez la démonstration de la formule de parité Call-Put et l'intuition de Vanna et Volga. Les traders attendent des explications géométriques claires.",
        official_careers_url="https://careers.societegenerale.com"
    ),

    # --- QUANTITATIVE HEDGE FUNDS & PROP TRADING ---
    FirmInterviewExpectation(
        id="firm_jane_street",
        firm_name="Jane Street",
        sector="Hedge Funds & Prop Trading",
        division="Quantitative Trading / Research / Software Engineering",
        locations=["Londres", "New York", "Hong Kong", "Amsterdam"],
        recruitment_process=[
            "Candidature avec CV analytique sans fioritures",
            "Entretien téléphonique de probabilités pures (45 minutes, 3 à 5 questions rapides)",
            "Deuxième entretien quantitatif : jeux de marché et espérance sous incertitude",
            "Final Round 'Onsite' : 4 entretiens intensifs de trading, de paris de marché et d'estimation"
        ],
        culture_and_fit_expectations=[
            "Prise de décision probabiliste bayésienne sous incertitude. Pas d'arrogance : calibration des convictions.",
            "Importance capitale de savoir admettre quand on ne sait pas et de réviser ses probabilités dès qu'une info arrive.",
            "Passion pour les jeux de stratégie (poker, échecs, theory of games, OCaml)."
        ],
        technical_evaluations=[
            "Calcul d'espérance mathématique conditionnelle complexe en temps réel.",
            "Théorème de Bayes et réévaluation dynamique des probabilités (updating priors).",
            "Jeux de 'Market Making' : proposer une fourchette Bid / Ask sur un événement inconnu (ex: nombre de stations de métro à Londres) avec risque de sélection adverse.",
            "Compréhension de la liquidité et de l'impact de marché."
        ],
        brainteasers_or_tests=[
            "Jeu de cartes ou dés tronqués avec paris en continu.",
            "Estimation de fourchettes de confiance à 80% : le candidat doit faire en sorte que 8 questions sur 10 tombent dans son intervalle."
        ],
        typical_interview_questions=[
            "Vous lancez 10 pièces équilibrées. Sachant qu'au moins 3 donnent Face, quelle est la probabilité d'avoir exactement 5 Faces ?",
            "Donnez-moi un marché Bid/Ask sur le nombre de fenêtres de l'Empire State Building. Si j'achète à votre Ask, ajustez votre cote.",
            "Deux joueurs lancent un dé à tour de rôle. Le premier qui fait 6 gagne. Quelle est la probabilité que le premier joueur gagne ?"
        ],
        insider_candidate_tips="Entraînez-vous sur Zetamac et les énigmes du livre de Xinfeng Zhou. Ne donnez jamais une réponse au hasard : verbalisez TOUT votre raisonnement probabiliste.",
        official_careers_url="https://www.janestreet.com/join-jane-street/"
    ),
    FirmInterviewExpectation(
        id="firm_citadel",
        firm_name="Citadel & Citadel Securities",
        sector="Hedge Funds & Prop Trading",
        division="Global Quantitative Strategies / Quantitative Research / Execution",
        locations=["Londres", "Paris", "New York", "Chicago"],
        recruitment_process=[
            "Screening CV + test en ligne HackerRank / Codesignal (algorithmique C++ ou Python)",
            "Round 1 : Entretien technique mathématiques financières, séries temporelles et signaux alpha",
            "Round 2 : Deep-dive sur vos projets de recherche quantitative et modèles de backtest",
            "Superday : 4 entretiens avec Portfolio Managers (PMs) et Quants séniors"
        ],
        culture_and_fit_expectations=[
            "Culture méritocratique d'élite absolue, intensité maximale, recherche d'un 'edge' statistique tangible.",
            "Rigueur sans compromis sur la validation statistique (overfitting, p-hacking, fuite de données futures).",
            "Compétences informatiques de haut niveau : manipulation de très gros volumes de données en mémoire."
        ],
        technical_evaluations=[
            "Économétrie des séries temporelles : cointégration (Engle-Granger, Johansen), test de Dickey-Fuller augmenté, processus d'Ornstein-Uhlenbeck.",
            "Microstructure de marché : dynamique du carnet d'ordres, toxicité du flux (VPIN), loi d'impact de racine carrée.",
            "Machine Learning appliqué à la finance : validation croisée purgée (Purged CV), feature importance (MDI/MDA).",
            "Optimisation de portefeuille : frontière efficiente de Markowitz, Black-Litterman, neutralisation factorielle (Barra)."
        ],
        brainteasers_or_tests=[
            "Démonstration mathématique de la vitesse de retour à la moyenne (half-life) d'une paire d'actifs cointégrée.",
            "Calcul d'un filtre de Kalman pour estimer un hedge ratio dynamique."
        ],
        typical_interview_questions=[
            "Comment testez-vous la stationnarité d'un spread entre deux actions ? Que faites-vous si la série est non-stationnaire ?",
            "Pourquoi le backtesting classique par train/test split échoue-t-il sur les données financières ? Comment purger vos échantillons ?",
            "Expliquez la différence entre un ratio de Sharpe annualisé sur données journalières vs données intrajournalières tick."
        ],
        insider_candidate_tips="Présentez les détails architecturaux de la plateforme Horacle Hub : expliquez comment vous évitez le look-ahead bias et comment vous modélisez les frais de slippage.",
        official_careers_url="https://www.citadel.com/careers/"
    ),
    FirmInterviewExpectation(
        id="firm_optiver",
        firm_name="Optiver",
        sector="Hedge Funds & Prop Trading",
        division="Market Making (Derivatives & ETF Flow)",
        locations=["Amsterdam", "Londres", "Chicago"],
        recruitment_process=[
            "Test de calcul mental chronométré Optiver 80 questions en 8 minutes (score minimum requis 55+)",
            "Test de logique numérique et de reconnaissance de séquences",
            "Entretien technique avec Trader : options en direct, greeks intuitifs, gestion du carnet",
            "Assessment Day : simulation de trading, jeux de dés et entretien final avec Head of Trading"
        ],
        culture_and_fit_expectations=[
            "Vitesse d'exécution mentale fulgurante et résistance à la pression.",
            "Esprit de compétition sain et passion pour le market making bid-ask.",
            "Capacité à prendre des risques calculés et à couper ses pertes sans émotion."
        ],
        technical_evaluations=[
            "Calcul instantané des Greeks de tête : si le spot monte de 2%, de combien bouge le Delta de mon Call ?",
            "Payoffs d'options et spreads : straddle, strangle, bull spread, butterfly, condor.",
            "Notions de base de market making : ajuster sa fourchette quand on accumule un inventaire long ou court."
        ],
        brainteasers_or_tests=[
            "Épreuve de calcul mental ultra-rapide sous stress.",
            "Jeu de dés avec possibilité d'acheter une information supplémentaire à un prix donné."
        ],
        typical_interview_questions=[
            "Le spot vaut 100, la volatilité est de 20%, l'échéance est 1 an, le taux est 0%. Quelle est la valeur approximative d'un Straddle ATM ?",
            "Vous cotez 10 - 12 sur un actif. Un acheteur achète 100 contrats à votre Ask. Quel est votre nouveau prix et votre position ?",
            "Si un Call 100 vaut 8€ et un Call 110 vaut 4€, quel est le payoff maximum d'un Bull Call Spread 100/110 ?"
        ],
        insider_candidate_tips="Entraînez-vous sur Tradermath et Zetamac pour atteindre au moins 70-80 au score 120s. C'est le prérequis éliminatoire numéro un chez Optiver.",
        official_careers_url="https://optiver.com/working-at-optiver/career-opportunities/"
    ),

    # --- PRIVATE EQUITY & ASSET MANAGEMENT ---
    FirmInterviewExpectation(
        id="firm_ardian_pe",
        firm_name="Ardian",
        sector="Private Equity",
        division="Buyout / Expansion / Private Debt / Secondaries",
        locations=["Paris", "Londres", "Francfort"],
        recruitment_process=[
            "Screening académique Grandes Écoles / Masters Finance d'élite",
            "Entretien technique #1 avec Analyste/Associate : logique LBO et comptabilité",
            "Test technique de modélisation LBO sur Excel (durée 90 minutes à 2h) : créer un modèle complet avec sources & uses, cascade de dette et rendements TRI/MoIC",
            "Grand oral avec Directeurs d'Investissement et Managing Directors"
        ],
        culture_and_fit_expectations=[
            "Leader européen du private equity indépendant (plus de 160 milliards $ d'actifs gérés).",
            "Excellence d'analyse des business models industriels et résilience du cash-flow récurrent.",
            "Sens du partenariat avec les fondateurs et dirigeants d'entreprises."
        ],
        technical_evaluations=[
            "Moteurs de création de valeur d'un LBO : désendettement (deleveraging), croissance de l'EBITDA (croissance organique / build-ups), expansion de multiple.",
            "Tranches de financement : dette senior bancaire (Term Loan A/B), dette unitranche, mezzanine, high yield.",
            "Mécanismes de protection des prêteurs : covenants de levier (Dette Nette / EBITDA), ratio de couverture des intérêts (ICR).",
            "Management package : Sweet Equity, bons de souscription d'actions (BSA), ratchet de performance."
        ],
        brainteasers_or_tests=[
            "Test Paper LBO : calculer le TRI sans calculatrice en utilisant la règle des 72 (ex: doubler son capital en 5 ans = TRI de 14.9%, tripler en 5 ans = 24.6%).",
            "Analyse qualitative rapide des forces et faiblesses d'un modèle d'affaires B2B SaaS vs industriel."
        ],
        typical_interview_questions=[
            "Une entreprise génère 20M€ d'EBITDA. Vous l'achetez 10x EBITDA financé avec 4x de dette senior. Dans 5 ans, l'EBITDA passe à 30M€ et vous revendez à 10x EBITDA en ayant remboursé toute la dette. Quel est le MoIC et le TRI ?",
            "Qu'est-ce qu'une bonne cible de LBO selon vous ? Détaillez les 5 critères clés.",
            "Quelle est la différence entre le TRI (IRR) et le multiple monétaire (MoIC) ? Pourquoi un fonds préfère-t-il parfois un MoIC plus élevé qu'un TRI élevé ?"
        ],
        insider_candidate_tips="Apprenez par cœur la table d'équivalence MoIC vers TRI pour des durées de détention de 3, 4 et 5 ans. C'est l'atout roi des tests papier LBO.",
        official_careers_url="https://www.ardian.com/careers"
    ),

    # --- AUDIT & TRANSACTION SERVICES ---
    FirmInterviewExpectation(
        id="firm_pwc_ts",
        firm_name="PwC Deals / Transaction Services",
        sector="Audit & TS",
        division="Transaction Services (Financial Due Diligence - FDD / VDD)",
        locations=["Paris", "Londres", "Lyon"],
        recruitment_process=[
            "Candidature en ligne + tests d'évaluation cognitive",
            "Entretien technique #1 avec Senior Consultant / Manager : bilan, résultat, ajustements",
            "Étude de cas TS écrite : analyser un jeu de comptes, retraiter l'EBITDA et identifier les dettes nettes cachées",
            "Entretien de synthèse et fit avec un Associé Deals (Partner)"
        ],
        culture_and_fit_expectations=[
            "Rigueur comptable absolue et esprit d'investigation critique ('ne rien prendre pour acquis').",
            "Compréhension de la réalité opérationnelle des transactions d'acquisition pour des fonds de PE et des corporates.",
            "Capacité à rédiger des synthèses limpides et orientées décision."
        ],
        technical_evaluations=[
            "Normalisation de l'EBITDA (Quality of Earnings - QoE) : élimination des charges non récurrentes, pro-forma d'acquisitions récentes, loyers de marché, litiges.",
            "Analyse du BFR normatif (Working Capital Peg) : saisonnalité du cash, comparaison des 12 derniers mois (LTM vs moyenne 12M).",
            "Dette Nette Ajustée (Net Debt Bridge) : dettes financières, trésorerie bloquée, provisions pour risques, dettes fiscales/sociales, affacturage.",
            "Mécanisme de révision du prix d'acquisition : Completion Accounts vs Locked Box."
        ],
        brainteasers_or_tests=[
            "Exercice de réconciliation : retrouver le Free Cash Flow à partir de l'EBITDA retraité.",
            "Détection des éléments non récurrents dans un grand livre de comptes."
        ],
        typical_interview_questions=[
            "Qu'est-ce qu'un ajustement de Quality of Earnings ? Citez 4 exemples concrets de retraitements d'EBITDA fréquents.",
            "Pourquoi fixe-t-on un niveau de BFR de référence (Working Capital Peg) dans le contrat d'acquisition (SPA) ?",
            "Comment traitez-vous un crédit d'impôt recherche (CIR) ou un litige prud'homal dans le bridge de dette nette ?"
        ],
        insider_candidate_tips="Expliquez la différence entre un mécanisme de prix 'Locked Box' et 'Completion Accounts'. Cette distinction montre que vous comprenez déjà les enjeux de deal réels.",
        official_careers_url="https://carrieres.pwc.fr"
    ),

    # --- STRATEGY CONSULTING ---
    FirmInterviewExpectation(
        id="firm_mckinsey",
        firm_name="McKinsey & Company",
        sector="Conseil en Stratégie",
        division="Generalist / Financial Services Practice",
        locations=["Paris", "Londres", "Genève", "Bruxelles"],
        recruitment_process=[
            "Screening académique d'excellence",
            "Test d'évaluation en ligne Solve (Problem Solving Game digital)",
            "Round 1 : 2 entretiens croisés comprenant PEI (Personal Experience Interview) + Case Interview",
            "Round 2 (Final) : 2 à 3 entretiens avec Partners et Directeurs Associés"
        ],
        culture_and_fit_expectations=[
            "Qualités de leadership prouvées (PEI : Personal Impact, Inclusive Leadership, Entrepreneurial Drive).",
            "Raisonnement MECE (Mutuellement Exclusif, Collectivement Exhaustif) et structuration descendante 'Top-Down' (Pyramide de Minto).",
            "Capacité à garder son calme et à synthétiser des recommandations exécutives pour un CEO."
        ],
        technical_evaluations=[
            "Résolution de cas d'affaires : rentabilité (décomposition Prix/Volume/Coûts), entrée sur un nouveau marché, lancement de produit, fusions-acquisitions.",
            "Market Sizing : estimation de taille de marché par hypothèses raisonnées sans calculatrice.",
            "Calcul mental rapide et précis (dividendes, pourcentages de part de marché, élasticité-prix).",
            "Synthèse finale structurée (Recommendation First, 3 arguments étayés, prochaines étapes et risques)."
        ],
        brainteasers_or_tests=[
            "Market sizing : estimer le volume d'affaires annuel des cartes de crédit pour une grande banque européenne.",
            "Questions de jugement stratégique sous contrainte de temps."
        ],
        typical_interview_questions=[
            "Racontez-moi une situation où vous avez dû convaincre une équipe en désaccord avec votre stratégie (PEI).",
            "Notre client, une banque de détail européenne, constate une baisse de 15% de sa rentabilité nette malgré une hausse des encours. Comment structurez-vous le diagnostic ?",
            "Quels sont les facteurs clés de succès d'une intégration post-acquisition (PMI) dans le secteur financier ?"
        ],
        insider_candidate_tips="La clé chez McKinsey est la rigueur de structure MECE dès la première minute et la réponse directe 'Bottom-Line First' lors de la conclusion du cas.",
        official_careers_url="https://www.mckinsey.com/careers"
    ),
]


# ============================================================================
# CURATED EDUCATIONAL RESOURCES DATABASE
# ============================================================================
EDUCATIONAL_RESOURCES_DATABASE: List[EducationalResource] = [
    # --- FINANCE DE MARCHÉ & DÉRIVÉS ---
    EducationalResource(
        id="res_hull_options",
        title="Options, Futures, and Other Derivatives (The Bible of Derivatives)",
        creator_or_author="John C. Hull (University of Toronto)",
        resource_type="Livre de Référence",
        sector="Finance de Marché & Dérivés",
        url="https://www.pearson.com/en-us/subject-catalog/p/options-futures-and-other-derivatives/P200000005929",
        duration_or_pages="880 pages",
        difficulty="Fondamental",
        description="Le manuel de référence mondial incontournable pour tout stage en finance de marché. Couvre l'évaluation des options, la formule de Black-Scholes-Merton, les Grecs, la volatilité implicite, les arbres binomiaux, les dérivés de taux et le risque de crédit.",
        key_takeaways=[
            "Compréhension mathématique et financière rigoureuse des modèles de pricing vanille.",
            "Intuition détaillée de la couverture dynamique (delta-hedging et gamma-hedging).",
            "Base théorique universellement reconnue sur les desks de trading de Wall Street et Paris."
        ]
    ),
    EducationalResource(
        id="res_taleb_dynamic_hedging",
        title="Dynamic Hedging: Managing Vanilla and Exotic Options",
        creator_or_author="Nassim Nicholas Taleb",
        resource_type="Livre de Référence",
        sector="Finance de Marché & Dérivés",
        url="https://www.wiley.com/en-us/Dynamic+Hedging%3A+Managing+Vanilla+and+Exotic+Options-p-9780471152804",
        duration_or_pages="512 pages",
        difficulty="Avancé / Desk Head",
        description="Rédigé par un ancien prop trader d'options, cet ouvrage aborde le trading d'options non pas sous l'angle abstrait des équations, mais sous l'angle du trader dans le feu de l'action. Il dissèque les Grecs du second et troisième ordre (Vanna, Volga, Charm, Color), les pièges des barrières et la gestion des risques extrêmes.",
        key_takeaways=[
            "Explication intuitive et graphique de Vanna et Volga pour la gestion d'un book de volatilité.",
            "Démystification des hypothèses irréalistes du modèle Black-Scholes en conditions de marché réelles.",
            "Maîtrise des risques non linéaires lors de l'expiration des options exotiques."
        ]
    ),
    EducationalResource(
        id="res_patrick_boyle_markets",
        title="Patrick Boyle on Finance (Derivatives, Market Microstructure & Crises)",
        creator_or_author="Patrick Boyle (Hedge Fund Manager & Visiting Professor, QMUL)",
        resource_type="Vidéo / Cours",
        sector="Finance de Marché & Dérivés",
        url="https://www.youtube.com/@PatrickBoyleOnFinance",
        duration_or_pages="150+ vidéos (15-40 min)",
        difficulty="Intermédiaire",
        description="Chaîne YouTube animée par un gérant de hedge fund quantitatif et professeur d'université. Explications d'une clarté exceptionnelle sur les faillites bancaires, la liquidité interbancaire, les arbitrages de taux, les failles des modèles d'options et l'histoire des grands hedge funds.",
        key_takeaways=[
            "Décryptage des mécanismes de contagion financière et de la plomberie des marchés (repo, collatéral).",
            "Compréhension concrète de la routine des hedge funds et de la gestion de levier.",
            "Culture financière institutionnelle de premier plan pour briller en entretien."
        ]
    ),
    EducationalResource(
        id="res_sinclair_volatility",
        title="Volatility Trading (2nd Edition) & Option Market Making",
        creator_or_author="Euan Sinclair",
        resource_type="Livre de Référence",
        sector="Finance de Marché & Dérivés",
        url="https://www.wiley.com/en-us/Volatility+Trading%2C+2nd+Edition-p-9781118347133",
        duration_or_pages="384 pages",
        difficulty="Avancé / Desk Head",
        description="Le guide pratique moderne par excellence pour le trading de volatilité. Sinclair explique comment prévoir la volatilité réalisée, extraire la prime de risque de volatilité (VRP), exécuter un Gamma scalping rentable et gérer la taille des positions.",
        key_takeaways=[
            "Méthodes quantitatives pour mesurer la différence entre volatilité implicite et réalisée.",
            "Formules précises de calcul du P&L de Gamma scalping avec coûts de transaction réels.",
            "Optimisation du sizing de portefeuille sous contrainte de tirage (drawdown)."
        ]
    ),
    EducationalResource(
        id="res_dupire_paper",
        title="Pricing with a Smile (Local Volatility Foundation Paper)",
        creator_or_author="Bruno Dupire (Risk Magazine, 1994)",
        resource_type="Paper de Recherche",
        sector="Finance de Marché & Dérivés",
        url="https://www.risk.net/derivatives/structured-products/2431718/pricing-smile-local-volatility-bruno-dupire",
        duration_or_pages="8 pages",
        difficulty="Avancé / Desk Head",
        description="Le papier de recherche historique de Bruno Dupire qui a révolutionné la modélisation des dérivés d'actions en introduisant la formule de volatilité locale, permettant de calibrer exactement le modèle sur les prix d'options observés sur le marché.",
        key_takeaways=[
            "Formule exacte de Dupire liant la volatilité locale à la dérivée du prix de Call par rapport au strike et à la maturité.",
            "Résolution du problème du smile de volatilité sans recourir à des processus stochastiques non observables.",
            "Connaissance fondamentale indispensable pour les desks de structuration et de pricing à Paris."
        ]
    ),

    # --- INVESTMENT BANKING & CORPORATE FINANCE ---
    EducationalResource(
        id="res_rosenbaum_pearl_ib",
        title="Investment Banking: Valuation, LBOs, M&A, and IPOs (3rd Edition)",
        creator_or_author="Joshua Rosenbaum & Joshua Pearl",
        resource_type="Livre de Référence",
        sector="Investment Banking & M&A",
        url="https://www.wiley.com/en-us/Investment+Banking%3A+Valuation%2C+LBOs%2C+M%26A%2C+and+IPOs%2C+3rd+Edition-p-9781119706182",
        duration_or_pages="544 pages",
        difficulty="Fondamental",
        description="Considéré par l'ensemble des banques d'investissement de Wall Street, Londres et Paris comme la bible absolue de formation des analystes M&A. Présente méthodiquement les comparables boursiers, les transactions précédentes, le DCF et le modèle LBO.",
        key_takeaways=[
            "Méthodologie standardisée de construction d'un football field de valorisation.",
            "Calcul pas à pas du WACC, de la valeur terminale et du Free Cash Flow to Firm.",
            "Construction rigoureuse d'un modèle LBO complet sur Excel avec dette et retours sponsor."
        ]
    ),
    EducationalResource(
        id="res_damodaran_valuation",
        title="Aswath Damodaran - Corporate Finance & Valuation Lectures",
        creator_or_author="Prof. Aswath Damodaran (NYU Stern School of Business)",
        resource_type="Vidéo / Cours",
        sector="Investment Banking & M&A",
        url="https://www.youtube.com/@AswathDamodaranonValuation",
        duration_or_pages="70+ heures de cours universitaires complets",
        difficulty="Intermédiaire",
        description="Les cours semestriels complets de Corporate Finance et Valuation dispensés par le professeur Damodaran à NYU Stern, disponibles gratuitement avec slides et modèles téléchargeables. Couvre l'estimation du coût du capital, les primes de risque et l'analyse narrative des entreprises technologiques.",
        key_takeaways=[
            "Calcul des bêta délevés et relevés par secteur d'activité.",
            "Valorisation des entreprises à forte croissance et des licornes technologiques déficitaires.",
            "Ressources de données gratuites mondiales (primes de risque par pays, WACC par industrie)."
        ]
    ),
    EducationalResource(
        id="res_biws_400_questions",
        title="Breaking Into Wall Street (BIWS) - 400 Investment Banking Interview Questions",
        creator_or_author="Brian DeChesare (Mergers & Inquisitions)",
        resource_type="Entraînement / Outil",
        sector="Investment Banking & M&A",
        url="https://mergersandinquisitions.com/investment-banking-interview-questions/",
        duration_or_pages="Guide PDF 180 pages",
        difficulty="Intermédiaire",
        description="Le guide de préparation d'entretiens M&A et Corporate Finance le plus célèbre au monde. Classe les questions par niveau (Basic, Intermediate, Advanced) sur la comptabilité, le DCF, les multiples, le LBO et les fusions-acquisitions.",
        key_takeaways=[
            "Réponses types aux questions classiques d'interaction entre les 3 états financiers.",
            "Explication intuitive des impacts de refinancement et d'émissions d'actions sur l'Enterprise Value.",
            "Questions pièges fréquentes posées lors des Superdays à Londres et Paris."
        ]
    ),

    # --- QUANTITATIVE FINANCE & ALGORITHMIC TRADING ---
    EducationalResource(
        id="res_lopez_de_prado_afml",
        title="Advances in Financial Machine Learning",
        creator_or_author="Marcos López de Prado (Cornell University / Abu Dhabi Investment Authority)",
        resource_type="Livre de Référence",
        sector="Quant Finance & Algo Trading",
        url="https://www.wiley.com/en-us/Advances+in+Financial+Machine+Learning-p-9781119482086",
        duration_or_pages="400 pages",
        difficulty="Avancé / Desk Head",
        description="L'ouvrage fondamental qui a redéfini le machine learning financier au sein des plus grands hedge funds (Citadel, Two Sigma, Millennium). Développe les barres de volume et de dollar, le Triple-Barrier Method, le Purged K-Fold Cross Validation et le Meta-Labeling.",
        key_takeaways=[
            "Élimination stricte des fuites de données futures et du sur-apprentissage en backtest.",
            "Technique de Triple-Barrier Method pour étiqueter les cours financiers de manière réaliste.",
            "Séparation de la direction du signal et du sizing de la position via le Meta-Labeling."
        ]
    ),
    EducationalResource(
        id="res_chan_quant_trading",
        title="Quantitative Trading: How to Build Your Own Algorithmic Trading Business",
        creator_or_author="Ernest P. Chan (QTS Capital Management)",
        resource_type="Livre de Référence",
        sector="Quant Finance & Algo Trading",
        url="https://www.wiley.com/en-us/Quantitative+Trading%3A+How+to+Build+Your+Own+Algorithmic+Trading+Business%2C+2nd+Edition-p-9781119800064",
        duration_or_pages="256 pages",
        difficulty="Intermédiaire",
        description="Guide pratique clair et accessible détaillant comment concevoir, tester et exécuter des stratégies de mean-reversion (arbitrage statistique, paires d'actions) et de momentum avec du code vectorisé.",
        key_takeaways=[
            "Tests de cointégration (ADF test et test de Johansen) appliqués aux actifs financiers.",
            "Gestion du risque avec critère de Kelly pour le dimensionnement du levier optimal.",
            "Modélisation réaliste des coûts de transaction, commissions de courtage et slippage."
        ]
    ),
    EducationalResource(
        id="res_github_ml_trading",
        title="Machine Learning for Algorithmic Trading (GitHub Open Source)",
        creator_or_author="Stefan Jansen",
        resource_type="Repository GitHub",
        sector="Quant Finance & Algo Trading",
        url="https://github.com/stefan-jansen/machine-learning-for-trading",
        duration_or_pages="Codebase Python complète",
        difficulty="Intermédiaire",
        description="Dépôt GitHub open source de référence contenant des notebooks Jupyter et des scripts Python pour créer des pipelines de trading algorithmique : données de marché, ingénierie de features, modèles d'arbres (LightGBM), réseaux de neurones et backtests sous Zipline/Pyfolio.",
        key_takeaways=[
            "Code Python prêt à l'emploi pour calculer les facteurs d'alpha et les ratios de Sharpe/Sortino.",
            "Pipelines de données financières avec pandas, NumPy et scikit-learn.",
            "Implémentation des analyses de performance sous forme de tear sheets Pyfolio."
        ]
    ),
    EducationalResource(
        id="res_avellaneda_stoikov_paper",
        title="High-Frequency Trading in a Limit Order Book (Canonical Paper)",
        creator_or_author="Marco Avellaneda & Sasha Stoikov (Quantitative Finance, 2008)",
        resource_type="Paper de Recherche",
        sector="Quant Finance & Algo Trading",
        url="https://www.tandfonline.com/doi/abs/10.1080/14697680701381228",
        duration_or_pages="12 pages",
        difficulty="Avancé / Desk Head",
        description="Le papier de recherche classique qui a posé les bases mathématiques du market making algorithmique moderne dans les carnets d'ordres. Formalise le problème de l'ajustement optimal des cotes Bid/Ask en fonction de l'inventaire accumulé et du risque de volatilité.",
        key_takeaways=[
            "Formulation du prix de réservation (indifference price) du market maker.",
            "Ajustement dynamique du spread pour repousser ou attirer les flux d'ordres.",
            "Fondement théorique testé lors des entretiens chez Citadel Securities, Optiver et Flow Traders."
        ]
    ),

    # --- BRAINTEASERS, MENTAL MATH & PROBABILITÉS ---
    EducationalResource(
        id="res_xinfeng_zhou_quant",
        title="A Practical Guide to Quantitative Finance Interviews (The Green Book)",
        creator_or_author="Xinfeng Zhou",
        resource_type="Livre de Référence",
        sector="Brainteasers & Math",
        url="https://www.goodreads.com/book/show/4412214-a-practical-guide-to-quantitative-finance-interviews",
        duration_or_pages="352 pages",
        difficulty="Intermédiaire",
        description="Le 'Livre Vert' culte que chaque candidat en finance quantitative et prop trading révise avant ses entretiens. Plus de 300 questions résolues couvrant les énigmes de logique, les probabilités, le calcul stochastique, la programmation et l'intuition de marché.",
        key_takeaways=[
            "Méthodes systématiques pour résoudre les énigmes de dés, pièces et cartes.",
            "Formules d'espérance conditionnelle et théorèmes de probabilités appliqués.",
            "Questions réelles issues des entretiens de Jane Street, Citadel, Jump Trading et SIG."
        ]
    ),
    EducationalResource(
        id="res_zetamac_trainer",
        title="Zetamac - Arithmetic Speed Trainer",
        creator_or_author="Zetamac Arithmetic Game",
        resource_type="Entraînement / Outil",
        sector="Brainteasers & Math",
        url="https://arithmetic.zetamac.com/",
        duration_or_pages="Sessions de 120 secondes",
        difficulty="Fondamental",
        description="La plateforme d'entraînement au calcul mental la plus populaire parmi les traders de prop trading (Optiver, Flow Traders, Jane Street). Permet de s'entraîner quotidiennement aux additions, soustractions, multiplications et divisions sous chronomètre.",
        key_takeaways=[
            "Développement des réflexes de calcul mental sous stress.",
            "Objectif de score recommandé pour les candidatures prop trading : 65 à 80+ en 120 secondes.",
            "Élimination des erreurs d'inattention lors des tests chronométrés des banques."
        ]
    ),
    EducationalResource(
        id="res_tradermath_platform",
        title="Tradermath & Jane Street Probability Preparation",
        creator_or_author="Tradermath",
        resource_type="Entraînement / Outil",
        sector="Brainteasers & Math",
        url="https://www.tradermath.org/",
        duration_or_pages="Tests interactifs illimités",
        difficulty="Intermédiaire",
        description="Plateforme dédiée à la préparation des tests mathématiques et logiques des desks de trading : tests spécifiques Optiver (80 questions 8 min), tests Akuna Capital, market making games et suites numériques.",
        key_takeaways=[
            "Simulateur conforme aux tests de sélection réels d'Optiver et Flow Traders.",
            "Statistiques détaillées de précision et de temps par question.",
            "Exercices d'estimation de fourchettes de confiance à 80%."
        ]
    ),

    # --- PRIVATE EQUITY & LBO ---
    EducationalResource(
        id="res_wall_street_prep_lbo",
        title="The Ultimate Paper LBO Modeling Guide & Video Walkthrough",
        creator_or_author="Wall Street Prep",
        resource_type="Vidéo / Cours",
        sector="Private Equity & LBO",
        url="https://www.wallstreetprep.com/knowledge/paper-lbo-model/",
        duration_or_pages="Guide écrit + Vidéo 45 min",
        difficulty="Intermédiaire",
        description="Tutoriel complet et gratuit pour réussir l'épreuve reine des entretiens de Private Equity : construire un Paper LBO complet en moins de 30 minutes sans calculatrice sur une simple feuille blanche.",
        key_takeaways=[
            "Méthode pas à pas pour poser les Sources & Uses sans se tromper de balance.",
            "Calcul du désendettement par le cash flow libre cumulé sur 5 ans.",
            "Astuces de calcul mental du TRI sponsor à l'aide de la règle des 72."
        ]
    ),

    # --- STRATEGY CONSULTING & TS ---
    EducationalResource(
        id="res_crafting_cases",
        title="Crafting Cases - Structured Thinking & Free Case Interview Mastery",
        creator_or_author="Julio & Bruno (Former McKinsey Consultants)",
        resource_type="Vidéo / Cours",
        sector="Strategy Consulting & TS",
        url="https://www.craftingcases.com/",
        duration_or_pages="Cours vidéo + Articles méthodologiques",
        difficulty="Intermédiaire",
        description="Ressource moderne d'excellence pour préparer les entretiens chez McKinsey, BCG et Bain. Se concentre sur l'apprentissage de la pensée structurée, de la personnalisation des frameworks plutôt que des modèles stéréotypés, et de la synthèse orientée CEO.",
        key_takeaways=[
            "Apprentissage de la création de structures MECE sur-mesure pour chaque cas d'affaires.",
            "Techniques pour formuler des hypothèses fortes dès le début du cas.",
            "Méthode de communication descendante (Top-Down communication)."
        ]
    ),
]


def get_firm_interview_expectations(sector_filter: Optional[str] = None) -> List[FirmInterviewExpectation]:
    """Returns curated firm expectations, optionally filtered by sector."""
    if not sector_filter or sector_filter.lower() == "all" or sector_filter.lower() == "tous":
        return FIRM_EXPECTATIONS_DATABASE
    
    sec_lower = sector_filter.lower()
    return [
        f for f in FIRM_EXPECTATIONS_DATABASE
        if sec_lower in f.sector.lower() or sec_lower in f.firm_name.lower()
    ]


def get_educational_resources(
    sector_filter: Optional[str] = None,
    type_filter: Optional[str] = None
) -> List[EducationalResource]:
    """Returns educational resources filtered by sector and resource type."""
    results = EDUCATIONAL_RESOURCES_DATABASE

    if sector_filter and sector_filter.lower() not in ["all", "tous"]:
        sec_lower = sector_filter.lower()
        results = [r for r in results if sec_lower in r.sector.lower()]

    if type_filter and type_filter.lower() not in ["all", "tous"]:
        type_lower = type_filter.lower()
        results = [r for r in results if type_lower in r.resource_type.lower()]

    return results
