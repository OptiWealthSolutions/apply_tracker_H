"""
Interview Technical Preparation Guide for Market Finance Desks.
Institutional questions, mathematical derivations, Greeks dynamics, and desk routine insights.
Tailored for Master 1 / Master 2 / Off-Cycle Market Finance candidates.
"""

from typing import Dict, List, Optional
from .schemas import DeskInterviewPrepResponse, InterviewQuestionItem, InterviewBrainteaserItem


DESK_PREP_DATA: Dict[str, dict] = {
    "Equity Derivatives": {
        "desk_title": "Equity Derivatives (EQD) - Flow, Exotics & Structuring",
        "overview": "Le desk EQD traite des options vanilles, des dérivés de volatilité (VIX, variance swaps), des produits de flux (indices, single stocks) et des structures complexes (autocalls, phoenix, reverse convertibles). Le trader gère en continu un livre de risques non linéaires (Delta, Gamma, Vega, Vanna, Volga, Theta).",
        "daily_routine": [
            "07h00 - 07h30: Lecture du flux overnight Asie/US, vérification des fixing dividendes et des gaps futures (Euro Stoxx 50, S&P 500).",
            "07h30 - 08h00: Morning call des analystes recherche actions et réunion du desk; analyse des consensus de volatilité implicite.",
            "08h30 - 09h00: Exécution du run de risque EOD précédent, recalibrage des surfaces de volatilité (SVI / SABR) et contrôle des limites de Gamma/Vega.",
            "09h00 - 17h30: Cotation de prix pour les clients (sales), rééquilibrage du delta-hedge sur le sous-jacent ou via futures, gestion du roll des positions.",
            "17h30 - 18h30: P&L explain (décomposition Delta P&L, Gamma P&L, Vega P&L, Theta bleed), soumission des fixings de fin de séance."
        ],
        "key_technical_concepts": [
            "Équation de Black-Scholes et hypothèses sous-jacentes (absence d'arbitrage, volatilité constante, distribution log-normale, frictions nulles).",
            "Les Grecs du premier ordre (Delta, Vega, Theta, Rho) et du second ordre (Gamma, Vanna = dDelta/dVol, Volga = dVega/dVol, Charm = dDelta/dt).",
            "Smile et Skew de volatilité: asymétrie induite par le risque de krach (put OTM surévalués) et effet de levier financier des entreprises.",
            "Décomposition du P&L de trading: P&L ≈ Delta * dS + 0.5 * Gamma * (dS)^2 + Vega * dSigma + Theta * dt.",
            "Structures phares: Autocallable Notes, Reverse Convertibles, Variance Swaps, dispersion trading (indice vs single stocks)."
        ],
        "questions": [
            {
                "id": "eqd_q1",
                "title": "Quelle est l'intuition et le signe de Vanna (dDelta/dSigma) pour un Call OTM vs Call ITM ?",
                "category": "Greeks & Pricing",
                "difficulty": "Standard Desk",
                "question": "Expliquez l'effet d'une hausse de la volatilité implicite sur le Delta d'un Call OTM et d'un Call ITM. Quel est le signe de Vanna dans chaque cas et comment couvrez-vous ce risque ?",
                "expected_answer": "Pour un Call OTM, le Strike K > Spot S. Une hausse de volatilité augmente la probabilité que le sous-jacent finisse dans la monnaie (ITM). Le Delta augmente donc (dDelta/dSigma > 0, Vanna positif). Pour un Call ITM (K < S), la valeur du Delta est déjà proche de 1; une hausse de volatilité augmente au contraire le risque d'expiration OTM, donc son Delta diminue vers 0.5 (dDelta/dSigma < 0, Vanna négatif). Au niveau ATM, Vanna est proche de zéro car Delta ≈ 0.5. Pour couvrir le Vanna, il est impossible d'utiliser le sous-jacent seul; il faut recourir à d'autres options (généralement des options vanilles de strikes différents ou du calendar spread).",
                "candidate_edge": "Souligner vos projets Python sous Horacle Hub où vous avez visualisé les surfaces 3D des Grecs d'ordre supérieur (Vanna/Volga) et simulé l'impact d'un choc de volatilité sur le rebalancement du delta-hedge."
            },
            {
                "id": "eqd_q2",
                "title": "Pourquoi les Puts OTM ont-ils une volatilité implicite plus élevée que les Calls OTM sur indices actions (Skew) ?",
                "category": "Market Intuition",
                "difficulty": "Standard Desk",
                "question": "Expliquez les facteurs financiers et microstructurels qui expliquent le skew de volatilité persistant sur les indices boursiers (S&P 500, Euro Stoxx 50).",
                "expected_answer": "Deux raisons fondamentales: (1) L'effet d'aversion au risque et la demande institutionnelle de protection (crash-o-phobia): les gérants de portefeuille achètent massivement des Puts OTM pour hedger leurs portefeuilles longs d'actions, poussant les prix des Puts et donc leur vol implicite. (2) L'effet de levier financier (leverage effect): quand le cours d'une entreprise chute, sa dette restant constante, son ratio d'endettement augmente mécaniquement, rendant l'actif plus risqué et augmentant la volatilité future. L'inverse se produit lors d'une hausse.",
                "candidate_edge": "Mentionner votre formation M1 à l'EDHEC en pricing d'options et votre compréhension des modèles de saut (Merton) et de volatilité stochastique (Heston) qui intègrent naturellement la corrélation négative prix/volatilité."
            },
            {
                "id": "eqd_q3",
                "title": "Décomposition du P&L d'une position delta-hedgée: relation Gamma-Theta",
                "category": "Pricing & P&L Attribution",
                "difficulty": "Advanced",
                "question": "Démontrez comment un trader d'options long Gamma finance sa position au quotidien et quelle relation lie le Gamma au Theta.",
                "expected_answer": "D'après l'EDP de Black-Scholes sans taux d'intérêt: Theta + 0.5 * (Sigma_impl)^2 * S^2 * Gamma = 0, soit Theta = -0.5 * (Sigma_impl)^2 * S^2 * Gamma. Le P&L quotidien d'un portefeuille delta-neutre est: d(P&L) ≈ 0.5 * Gamma * (dS)^2 + Theta * dt = 0.5 * Gamma * S^2 * [(dS/S)^2 - (Sigma_impl)^2 * dt]. Si la volatilité réalisée du marché (dS/S)^2 / dt dépasse la volatilité implicite payée à l'achat de l'option, le trader génère un P&L positif par ses rééquilibrages de delta (vendre haut, acheter bas). Inversement, si le marché stagne, la position perd du Theta chaque jour.",
                "candidate_edge": "Relier cette formule à votre propre expérience d'ingénierie quantitative: backtester des stratégies de Gamma scalping sur données tick/minute en Python."
            },
            {
                "id": "eqd_q4",
                "title": "Produit Structuré Autocall: Quel est le risque du desk à l'approche de la barrière de protection ?",
                "category": "Structuring & Exotics",
                "difficulty": "Elite / Senior Trader",
                "question": "Sur un produit Phoenix ou Autocall avec barrière désactivante à 70% du strike initial, que se passe-t-il pour le Gamma et le Delta du desk vendeur de protection quand le sous-jacent approche 71% proche de l'échéance ?",
                "expected_answer": "À l'approche de la barrière et de l'échéance, le payoff présente une discontinuité sévère (effet falaise ou cliff risk). Le Delta de la position varie brutalement (Gamma gigantesque), puis s'inverse violemment si la barrière est franchie. Le trader subit un risque de gap: si le spot passe directement de 71% à 69% à l'ouverture d'un marché en baisse, il ne peut pas delta-hedger au prix continu et subit une perte instantanée. En pratique, le desk lisse la barrière (softening/over-hedging) en remplaçant la fonction indicatrice par un call spread très serré pour borner le Gamma.",
                "candidate_edge": "Valoriser votre double compétence mathématiques appliquées (ENS D2) et modélisation financière: capacité à concevoir des barrières lissées sous Monte Carlo."
            }
        ],
        "brainteasers": [
            {
                "question": "Vous lancez un dé à 6 faces équilibré. Vous pouvez choisir de vous arrêter et de recevoir la valeur en euros, ou relancer une seconde fois et recevoir obligatoirement le second tirage. Quel est le prix équitable (espérance) de ce jeu ?",
                "hint": "Calculez d'abord l'espérance au second tour, puis établissez la règle optimale d'arrêt au premier tour.",
                "solution": "Au 2e lancer, l'espérance est E2 = (1+2+3+4+5+6)/6 = 3.5 €. Au 1er lancer, vous devez relancer si le tirage est strictement inférieur à 3.5 €, donc si vous obtenez 1, 2 ou 3. Si vous obtenez 4, 5 ou 6, vous conservez le gain. L'espérance totale est E = (1/6)*(4 + 5 + 6) + (3/6)*3.5 = 15/6 + 10.5/6 = 25.5/6 = 4.25 €."
            },
            {
                "question": "Vous avez deux pièces de monnaie: une équilibrée (P=0.5) et une biaisée qui donne Face avec probabilité 1. Vous en tirez une au hasard sans la regarder, la lancez et obtenez Face. Quelle est la probabilité que ce soit la pièce biaisée ?",
                "hint": "Appliquez le théorème de Bayes: P(Biaisee | Face) = P(Face | Biaisee) * P(Biaisee) / P(Face).",
                "solution": "P(Biaisee) = 0.5, P(Equilibree) = 0.5. P(Face | Biaisee) = 1.0, P(Face | Equilibree) = 0.5. P(Face) = 1.0 * 0.5 + 0.5 * 0.5 = 0.75. P(Biaisee | Face) = (1.0 * 0.5) / 0.75 = 0.5 / 0.75 = 2/3 (soit 66.7%)."
            }
        ],
        "recommended_market_reading": [
            "John C. Hull - Options, Futures, and Other Derivatives (Chapitres 15, 19 et 26).",
            "Nassim Nicholas Taleb - Dynamic Hedging: Managing Vanilla and Exotic Options.",
            "Euan Sinclair - Volatility Trading (2nd Edition).",
            "Suivi quotidien de la courbe de terme VIX (contango vs backwardation) et des rapports d'earnings S&P 500."
        ]
    },

    "Rates & Fixed Income": {
        "desk_title": "Rates, Fixed Income & Currencies (FICC)",
        "overview": "Le desk Rates traite les emprunts d'État (OAT, Bunds, Treasuries), les interest rate swaps (IRS), les futures sur taux (Euribor, SOFR, Euro-Bund), et les options de taux (swaptions, caps/floors). L'activité repose sur la gestion du risque de duration, de convexité, de courbe (steepening/flattening) et de base interbancaire.",
        "daily_routine": [
            "07h15 - 07h45: Analyse des chiffres macroéconomiques nocturnes (inflation CPI/PPI, discours banques centrales Fed/BCE/BoE).",
            "07h45 - 08h15: Examen des adjudications de dette souveraine du jour (AFT pour les OAT, Finanzagentur pour les Bunds).",
            "08h30 - 12h00: Cotation des swaps de taux pour les corporates et gérants de fonds; hedging en continu du DV01 sur les contrats futures (Bund, Bobl, Schatz).",
            "14h30: Point d'orgue: publication des statistiques US (NFP, CPI, retail sales) provoquant des décalages instantanés de la courbe.",
            "17h30 - 18h15: Valorisation des courbes de taux (multi-curve framework OIS/Euribor), vérification des P&L de roll-down et de portage (carry)."
        ],
        "key_technical_concepts": [
            "Sensibilité et Duration Modifiée: D_mod = - (1/P) * (dP/dy). Mesure du risque de variation parallèle des taux.",
            "DV01 / PV01: Dollar Value of 1 basis point (variation de la valeur en euros pour un décalage de +1 bp de la courbe).",
            "Convexité: C = (1/P) * (d^2 P / dy^2). Pourquoi la convexité est positive pour un bond classique et bénéfique à l'investisseur.",
            "Bootstrapping de la courbe de taux et cadre multi-courbes post-2008 (actualisation au taux sans risque OIS / €STR / SOFR, projection sur Euribor / Libor).",
            "Stratégies de courbe: Steepener (2s10s), Flattener, Butterfly trades (2s5s10s) et décomposition Carry + Roll-Down."
        ],
        "questions": [
            {
                "id": "rates_q1",
                "title": "Qu'est-ce que le DV01 et comment calculez-vous le hedge ratio entre une obligation 10 ans et un futur Bund ?",
                "category": "Risk & Hedging",
                "difficulty": "Standard Desk",
                "question": "Définissez le DV01. Si vous détenez 50 M€ d'une obligation avec un DV01 de 8.5 € par 10 000 € de nominal, combien de contrats Euro-Bund futures (DV01 de 75 € par contrat) devez-vous vendre pour vous immuniser contre un choc parallèle de taux ?",
                "expected_answer": "Le DV01 (Dollar/Dollar-equivalent Value of 1 basis point) mesure la perte en euros subie par une position si la courbe de taux monte d'un point de base (+0.01%). DV01_portfolio = (50 000 000 / 10 000) * 8.5 € = 5 000 * 8.5 € = 42 500 € par point de base. Le futur Bund ayant un DV01 de 75 € par contrat, le nombre de contrats à vendre pour neutraliser la duration est N = DV01_portfolio / DV01_futur = 42 500 / 75 = 566.67, soit environ 567 contrats vendus.",
                "candidate_edge": "Montrer votre rigueur en calcul mental et préciser que ce hedge suppose un décalage parallèle parfait; pour un mouvement non parallèle, il faut décomposer en Key Rate Durations (KRD)."
            },
            {
                "id": "rates_q2",
                "title": "Pourquoi la convexité d'une obligation standard est-elle toujours positive et quelle est sa valeur ?",
                "category": "Pricing & Curves",
                "difficulty": "Standard Desk",
                "question": "Expliquez géométriquement et mathématiquement pourquoi la relation prix-rendement d'un bond classique est convexe, et pourquoi les investisseurs paient une prime pour la convexité.",
                "expected_answer": "La relation P(y) = Sum [ CF_t / (1+y)^t ] a une dérivée seconde d^2P/dy^2 = Sum [ t(t+1)*CF_t / (1+y)^(t+2) ] qui est strictement positive pour tout flux CF_t > 0. Géométriquement, lorsque les taux chutent de 100 bps, le gain en prix est strictement supérieur à la perte subie si les taux montent de 100 bps. Les obligations à forte convexité protègent mieux à la hausse des taux et surperforment à la baisse. En contrepartie, sur le marché, elles offrent généralement un rendement actuariel (yield) légèrement plus faible.",
                "candidate_edge": "Expliquer le compromis carry vs convexité : une position long convexité a un carry négatif (effet similaire à long Gamma / short Theta dans les options)."
            },
            {
                "id": "rates_q3",
                "title": "Expliquez le trade de 'Roll-Down' sur une courbe de taux pentue (upward sloping)",
                "category": "Trading Strategy",
                "difficulty": "Advanced",
                "question": "Comment un gérant ou un trader de taux tire-t-il parti d'une courbe normale ascendante sans anticiper de mouvement de politique monétaire ?",
                "expected_answer": "Sur une courbe ascendante (ex: 5 ans à 3.00%, 4 ans à 2.70%), si la structure par terme reste inchangée au cours des 12 prochains mois, une obligation achetée à 5 ans deviendra une obligation à 4 ans l'an prochain. Elle sera alors valorisée au taux de 2.70%, ce qui engendre un gain en capital (cours plus élevé) en plus du coupon perçu. C'est le principe du 'Riding the Yield Curve' ou roll-down return. Le rendement total réalisé est égal au Yield de départ + Roll-Down gain.",
                "candidate_edge": "Citer les outils quantitatifs que vous avez conçus sous Python pour décomposer le rendement espéré d'un univers obligataire en carry pur, roll-down et duration risk."
            }
        ],
        "brainteasers": [
            {
                "question": "Quelle obligation a la plus grande duration : un bond coupon zéro 10 ans ou une obligation 10 ans à coupon annuel de 8% ?",
                "hint": "Rappelez-vous la définition de la duration de Macaulay comme maturité moyenne pondérée des cash-flows.",
                "solution": "Le bond coupon zéro 10 ans. Pour un zéro coupon, il n'y a qu'un seul cash-flow à l'échéance t=10, donc sa duration de Macaulay est exactement de 10 ans. Pour l'obligation à coupon de 8%, des flux sont perçus chaque année dès la 1re année, ce qui réduit la maturité moyenne pondérée (sa duration est d'environ 7.2 ans)."
            }
        ],
        "recommended_market_reading": [
            "Fabozzi - The Handbook of Fixed Income Securities.",
            "Tuckman & Serrat - Fixed Income Securities: Valuation, Risk, and Risk Management.",
            "Suivi de la courbe 2s10s US et EUR, et des anticipations de taux implicites par les Fed Funds Futures."
        ]
    },

    "Quantitative Research & Systematic Trading": {
        "desk_title": "Quantitative Research, Systematic Strategies & Prop Trading",
        "overview": "Conception de modèles statistiques, de stratégies de trading algorithmique systématique (statistical arbitrage, trend following, CTA, market making) et de modèles d'exécution optimale. Exigence extrême en mathématiques appliquées, probabilités, backtesting sans biais et programmation C++/Python.",
        "daily_routine": [
            "08h00 - 08h30: Contrôle de la performance des modèles systématiques exécutés en continu, analyse du slippage et du transaction cost analysis (TCA).",
            "08h30 - 12h00: Développement et recherche quantitative de nouveaux signaux alpha (données alternatives, order book dynamics, microstructure).",
            "12h00 - 14h00: Entraînement de modèles et simulations Monte Carlo sur clusters de calcul; optimisation sous contrainte de risque (Sharpe, Drawdown).",
            "14h00 - 17h00: Nettoyage et feature engineering sur données haute fréquence tick/L2; tests de robustesse (walk-forward, cross-validation temporelle).",
            "17h00 - 18h30: Revue de code de production (C++/Cython/Python), validation avec l'équipe Risk et passage en environnement paper trading."
        ],
        "key_technical_concepts": [
            "Processus d'Ornstein-Uhlenbeck (modélisation de retour à la moyenne / mean-reversion pour les paires cointegrées).",
            "Coinstégration vs Corrélation: test de Dickey-Fuller augmenté (ADF) et test d'Engle-Granger; pourquoi deux séries corrélées peuvent diverger à long terme.",
            "Biais classiques de backtesting: Look-ahead bias, Survivorship bias, Overfitting / Data snooping, Slippage & Market Impact (Almgren-Chriss).",
            "Ratios de performance ajustée du risque: Sharpe, Sortino, Calmar, Information Ratio, Maximum Drawdown.",
            "Microstructure de marché: carnet d'ordres limite (LOB), déséquilibre de liquidité (order book imbalance), VWAP/TWAP execution."
        ],
        "questions": [
            {
                "id": "quant_q1",
                "title": "Quelle est la différence fondamentale entre deux séries temporelles corrélées et deux séries cointégrées ?",
                "category": "Time Series & Stat Arb",
                "difficulty": "Standard Desk",
                "question": "Pourquoi la corrélation statistique est-elle insuffisante pour construire une stratégie de pairs trading (arbitrage statistique), et pourquoi la cointégration est-elle nécessaire ?",
                "expected_answer": "La corrélation mesure la co-variation des rendements à court terme, mais deux séries non stationnaires (I(1)) peuvent être fortement corrélées tout en dérivant indéfiniment l'une par rapport à l'autre sans jamais se croiser (spurious correlation). La cointégration signifie qu'il existe une combinaison linéaire Z_t = Y_t - beta * X_t qui est stationnaire (I(0)). Cela garantit mathématiquement que l'écart (spread) a une espérance constante et revient toujours vers sa moyenne dans le temps, ce qui est la condition sine qua non pour un arbitrage statistique rentable avec des bornes de risque définies.",
                "candidate_edge": "Mettre en avant votre développement de Horacle Hub où vous implémentez les tests ADF et le calcul du z-score de spread pour des stratégies systématiques quantitatives."
            },
            {
                "id": "quant_q2",
                "title": "Comment modélisez-vous le retour à la moyenne via un processus d'Ornstein-Uhlenbeck et comment calibrez-vous la demi-vie ?",
                "category": "Stochastic Calculus",
                "difficulty": "Advanced",
                "question": "Écrivez l'équation différentielle stochastique du processus d'Ornstein-Uhlenbeck et donnez l'expression de la demi-vie (half-life) de mean reversion.",
                "expected_answer": "L'EDS s'écrit: dX_t = theta * (mu - X_t) * dt + sigma * dW_t, où mu est la moyenne à long terme, theta > 0 est la vitesse de rappel à la moyenne, et sigma la volatilité. En discrétisant sous forme AR(1): X_t - X_{t-1} = a + b * X_{t-1} + eps_t, avec b = -theta * dt. La demi-vie, qui représente le temps requis pour que l'écart à la moyenne se réduise de moitié, vaut: t_{1/2} = ln(2) / theta. Si la demi-vie est trop courte, les coûts de transaction dévorent le profit; si elle est trop longue, le capital reste immobilisé trop longtemps.",
                "candidate_edge": "Mentionner votre parcours ENS D2 en mathématiques et économétrie des séries temporelles combiné à la mise en œuvre pratique sous NumPy/SciPy."
            },
            {
                "id": "quant_q3",
                "title": "Comment évitez-vous l'overfitting lors du backtest d'une stratégie systématique ?",
                "category": "Quant Methodology",
                "difficulty": "Standard Desk",
                "question": "Quelles méthodes rigoureuses déployez-vous pour vous assurer que les résultats de backtest d'un modèle systématique ne sont pas le produit du surapprentissage ?",
                "expected_answer": "(1) Purging & Embargoing avec Combinatorial Purged Cross-Validation (CPCV de Marcos López de Prado) pour respecter la causalité temporelle sans fuite d'information. (2) Deflated Sharpe Ratio (DSR) qui ajuste le ratio de Sharpe en tenant compte du nombre d'essais et de variations de paramètres testés. (3) Walk-forward testing hors échantillon (out-of-sample). (4) Réduction du nombre de paramètres libres (parcimonie des modèles) et injection de coûts de transaction réalistes incluant spread bid-ask et market impact quadratique.",
                "candidate_edge": "Présenter la rigueur de vos simulations personnelles : zéro look-ahead bias, modélisation explicite de la latence d'exécution et des commissions de courtage."
            }
        ],
        "brainteasers": [
            {
                "question": "Vous avez un tableau de 100 nombres réels distribués uniformément sur [0, 1]. Quelle est la probabilité que le minimum soit supérieur à 0.05 ?",
                "hint": "Pour que le minimum soit supérieur à 0.05, il faut et il suffit que CHAQUE variable soit supérieure à 0.05.",
                "solution": "Les 100 variables sont indépendantes. P(X_i > 0.05) = 1 - 0.05 = 0.95. Donc P(min(X_1...X_100) > 0.05) = (0.95)^100 ≈ 0.00592, soit environ 0.59% de chance."
            }
        ],
        "recommended_market_reading": [
            "Marcos López de Prado - Advances in Financial Machine Learning.",
            "Stefan Jansen - Machine Learning for Algorithmic Trading.",
            "Edward Qian - Quantitative Equity Portfolio Management."
        ]
    },

    "FX & Cross-Asset": {
        "desk_title": "Foreign Exchange (FX) & Cross-Asset Trading",
        "overview": "Le desk FX gère le trading de devises au comptant (Spot), les contrats à terme (FX Forwards), les swaps de devises (FX Swaps / Cross Currency Basis Swaps) et les options de change (vanilles, barrières, digitals). Le desk interagit en permanence avec la macroéconomie mondiale et les différentiels de taux d'intérêt.",
        "daily_routine": [
            "07h00 - 07h30: Suivi de l'ouverture européenne après les sessions de Tokyo et Sydney; passage en revue des fixings EUR/USD, USD/JPY, GBP/USD.",
            "08h00 - 10h00: Exécution des ordres corporate (couverture de flux import/export) et institutionnels.",
            "10h00 - 15h00: Cotation des spreads sur le carnet électronique, surveillance du fixing WMR (World Markets Reuters) de 16h00 Londres.",
            "16h00: 4pm London Fix: volume massif et gestion des risques de flux d'exécution.",
            "17h30 - 18h00: Clôture du livre de trésorerie, swap overnight pour financer les soldes résiduels de devises."
        ],
        "key_technical_concepts": [
            "Parité des Taux d'Intérêt Couverte (CIP): Forward = Spot * (1 + r_d * T) / (1 + r_f * T).",
            "Points de Swap (Forward Points): Forward Points = Forward - Spot = Spot * [(1 + r_d * T)/(1 + r_f * T) - 1].",
            "Cross-Currency Basis: mesure de l'écart à la CIP reflétant la prime de liquidité pour le dollar américain (USD).",
            "Arbitrage triangulaire: condition de non-arbitrage entre EUR/USD, GBP/USD et EUR/GBP.",
            "Volatilité FX: conventions 25-Delta Risk Reversal (mesure du skew) et 25-Delta Butterfly (mesure du smile/kurtosis)."
        ],
        "questions": [
            {
                "id": "fx_q1",
                "title": "Comment calculez-vous le cours Forward FX à 1 an à partir du cours Spot et des taux d'intérêt ?",
                "category": "Pricing & Arbitrage",
                "difficulty": "Standard Desk",
                "question": "Soit EUR/USD spot = 1.0800. Taux EUR à 1 an = 3.00%, Taux USD à 1 an = 5.00%. Quel est le cours Forward à 1 an et que représentent les points de swap ?",
                "expected_answer": "Par parité des taux couverte: F = S * (1 + r_USD) / (1 + r_EUR) = 1.0800 * (1 + 0.05) / (1 + 0.03) = 1.0800 * (1.05 / 1.03) ≈ 1.0800 * 1.019417 = 1.10097. Les points de swap valent F - S = 1.10097 - 1.0800 = +0.02097 USD (soit +209.7 pips de report). Comme la devise de cotation (USD) rémunère davantage que la devise de base (EUR), l'EUR forward s'apprécie mécaniquement pour compenser le manque à gagner de taux d'intérêt et interdire l'arbitrage.",
                "candidate_edge": "Expliquer l'impact macroéconomique du carry trade et la violation empirique de la parité non couverte (UIP)."
            }
        ],
        "brainteasers": [
            {
                "question": "Si EUR/USD = 1.10 et GBP/USD = 1.32, quel doit être le cours EUR/GBP pour empêcher tout arbitrage triangulaire ?",
                "hint": "EUR/GBP = (EUR/USD) / (GBP/USD).",
                "solution": "EUR/GBP = 1.10 / 1.32 = 110 / 132 = 5 / 6 ≈ 0.8333. Tout écart par rapport à ce cours permettrait un arbitrage sans risque par achat/vente croisée."
            }
        ],
        "recommended_market_reading": [
            "Tim Weithers - Foreign Exchange: A Practical Guide to the FX Markets.",
            "Suivi régulier du Dollar Index (DXY) et des réunions FOMC / BCE."
        ]
    },

    "Structuring": {
        "desk_title": "Structuring & Financial Engineering",
        "overview": "Le desk Structuration est à l'interface entre la recherche quantitative, le trading et la vente (sales). Il conçoit des solutions d'investissement sur mesure (produits structurés de rendement, d'indexation ou de couverture) pour les clients de banque privée, gérants de fortune et institutionnels.",
        "daily_routine": [
            "08h00 - 09h00: Brainstorming des thèmes d'investissement porteurs avec les équipes de recherche actions et macro.",
            "09h00 - 12h00: Conception et pricing de nouvelles structures (Autocall Phoenix, Athena, Green Bond Structuré) sous Pricer interne (Excel/Python/C++).",
            "12h00 - 15h00: Rédaction des term sheets institutionnelles, validation avec les équipes juridiques et conformité (règles PRIIPs / KID).",
            "15h00 - 17h30: Ajustement des conditions commerciales avec les traders de dérivés pour optimiser le funding et la marge desk.",
            "17h30 - 18h30: Analyse des volumes d'émission et veille concurrentielle sur les structures lancées par BNP Paribas, SocGen et Goldman Sachs."
        ],
        "key_technical_concepts": [
            "Décomposition d'un produit structuré: Obligation zéro-coupon (finançant la garantie en capital) + Options exotiques (finançant le payoff).",
            "Budget d'options: Funding bancaire (spread d'émission émetteur) + dividende synthétique sacrifié = enveloppe pour acheter les options de gain.",
            "Mécanismes de protection: Capital garanti, barrière européenne (observée uniquement à maturité), barrière américaine (touchée en continu).",
            "Composante corrélation dans les paniers Worst-Of: pourquoi une faible corrélation entre les sous-jacents augmente le coupon offert (et le risque client).",
            "Grecque spécifique: Cross-Gamma et Vega correlation dans les structures multi-actifs."
        ],
        "questions": [
            {
                "id": "struct_q1",
                "title": "Pourquoi un produit Phoenix Worst-Of offre-t-il un coupon plus élevé lorsque la corrélation entre les actions du panier diminue ?",
                "category": "Pricing & Correlation",
                "difficulty": "Standard Desk",
                "question": "Expliquez l'effet de la baisse de corrélation entre 3 actions composant un panier 'Worst-Of' sur le coupon offert à l'investisseur d'un produit structuré.",
                "expected_answer": "Dans une structure Worst-Of, le remboursement et les coupons dépendent de la performance du sous-jacent qui a le plus baissé parmi les trois. Lorsque la corrélation diminue, la probabilité qu'AU MOINS UNE des actions sous-performe et touche la barrière baissière augmente significativement (dispersion accrue des trajectoires). L'investisseur vend donc une option de vente (put) plus dangereuse à l'émetteur. En échange de ce risque accru de perte en capital, l'émetteur reverse un coupon conditionnel nettement plus élevé.",
                "candidate_edge": "Valoriser votre compréhension du calcul stochastique et de la simulation de copules (Gaussienne, Student) pour modéliser la dépendance extrême de queue."
            }
        ],
        "brainteasers": [
            {
                "question": "Une obligation zéro-coupon 5 ans vaut 80% du nominal. Si l'émetteur garantit 100% du capital à l'échéance, quel est le budget disponible aujourd'hui pour acheter des options exotiques ?",
                "hint": "Budget = 100% - Prix de l'obligation de garantie.",
                "solution": "Il faut consacrer 80% du capital investi pour acheter l'obligation zéro-coupon qui vaudra 100% dans 5 ans. Il reste donc 20% du capital investi (20 points de base de nominal) comme budget net d'options pour structurer le coupon ou la participation à la hausse."
            }
        ],
        "recommended_market_reading": [
            "Arnaud de Servigny - Structured Products: A Primer for Investment Managers.",
            "Publications de l'AFPA (Association Française des Produits Structurés) et SRP (Structured Retail Products)."
        ]
    }
}


def get_interview_prep_for_desk(desk_keyword: str) -> DeskInterviewPrepResponse:
    """
    Returns tailored technical interview preparation for a specific desk.
    Matches desk keywords or falls back to Equity Derivatives.
    """
    desk_lower = (desk_keyword or "").lower()
    
    selected_key = "Equity Derivatives"
    if any(k in desk_lower for k in ["rate", "taux", "ficc", "fixed income", "bond", "obligat"]):
        selected_key = "Rates & Fixed Income"
    elif any(k in desk_lower for k in ["quant", "systematic", "algo", "stat arb", "research"]):
        selected_key = "Quantitative Research & Systematic Trading"
    elif any(k in desk_lower for k in ["fx", "foreign exchange", "forex", "change", "devise"]):
        selected_key = "FX & Cross-Asset"
    elif any(k in desk_lower for k in ["structur", "produits structurés", "engineering"]):
        selected_key = "Structuring"
    elif any(k in desk_lower for k in ["equity", "action", "eqd", "volatilit", "deriv"]):
        selected_key = "Equity Derivatives"

    data = DESK_PREP_DATA[selected_key]
    
    return DeskInterviewPrepResponse(
        desk=selected_key,
        desk_title=data["desk_title"],
        overview=data["overview"],
        daily_routine=data["daily_routine"],
        key_technical_concepts=data["key_technical_concepts"],
        questions=[InterviewQuestionItem(**q) for q in data["questions"]],
        brainteasers=[InterviewBrainteaserItem(**b) for b in data["brainteasers"]],
        recommended_market_reading=data["recommended_market_reading"]
    )
