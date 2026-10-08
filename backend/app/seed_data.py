from datetime import datetime
from sqlalchemy.orm import Session
from .models import JobOffer, Application, UserProfile


SEED_OFFERS = [
    {
        "title": "Stage Assistant Trader Dérivés Actions & Indices (EQD)",
        "company": "BNP Paribas",
        "location": "Paris",
        "desk": "Trading Flow / Exotics",
        "asset_class": "Equity Derivatives",
        "contract_type": "Stage Césure (6 mois)",
        "description": "Intégré au desk Flow & Solution Equity Derivatives de BNP Paribas CIB, vous assisterez les traders dans le pricing des options vanilles et exotiques, le monitoring des grecs (Delta, Gamma, Vega, Vanna-Volga) et l'automatisation des outils d'arbitrage statistique.",
        "requirements": "Bac+5 Grande École d'Ingénieur ou Master 2 Finance Quantitative (Dauphine 203, El Karoui, Lamberton). Excellente maîtrise de Python (pandas, numpy), C++ ou VBA, et compréhension approfondie des dérivés.",
        "url": "https://group.bnpparibas/emploi-carriere/offres/stage-assistant-trader-eqd",
        "salary_monthly": 2800,
        "source": "BNP Paribas Careers",
        "date_posted": "2026-10-01",
        "tags": "Trading, Equity Derivatives, Python, Greeks, Pricing, Paris",
        "direct_apply_email": "campus.cib@bnpparibas.com"
    },
    {
        "title": "Stage Structuring Produits Structurés & Cross-Asset Solutions",
        "company": "Société Générale",
        "location": "Paris (La Défense)",
        "desk": "Structuring Produits Structurés",
        "asset_class": "Cross-Asset",
        "contract_type": "Stage Fin d'Études (PFE)",
        "description": "Au sein de l'équipe Structuring Cross-Asset (Actions, Taux, Matières premières), conception et pricing de produits structurés (Autocalls, Phoenix, Reverse Convertibles, capital garanti) à destination des banques privées et investisseurs institutionnels. Modélisation de payoffs et backtesting de sous-jacents indiciels.",
        "requirements": "Dernière année d'école d'ingénieur ou Master 2 finance de marché. Maîtrise des mathématiques financières et programmation Python. Rigueur, créativité dans l'élaboration de structures de marché.",
        "url": "https://careers.societegenerale.com/job-offers/stage-structuring-cross-asset",
        "salary_monthly": 2700,
        "source": "Société Générale Careers",
        "date_posted": "2026-10-03",
        "tags": "Structuring, Cross-Asset, Payoffs, Autocall, Python, PFE",
        "direct_apply_email": "recrutement.marches@socgen.com"
    },
    {
        "title": "Stage Quantitative Researcher / Quant Trader Intern",
        "company": "Qube Research & Technologies (QRT)",
        "location": "Paris",
        "desk": "Quantitative Research / Trading",
        "asset_class": "Multi-Asset",
        "contract_type": "Off-Cycle Internship (6 mois)",
        "description": "Rejoignez une équipe de recherche quantitative de pointe développant des modèles prédictifs et signaux de trading sur actions globales et contrats futures. Travail sur données tick-by-tick, modélisation de séries temporelles financières et optimisation de portefeuilles systématiques.",
        "requirements": "Étudiant(e) en Mathématiques Appliquées, Machine Learning ou Physique Théorique (Polytechnique, ENS, CentraleSupélec, Telecom). Expertise poussée en Python / C++ moderne.",
        "url": "https://www.qube-rt.com/careers/quantitative-research-intern-paris",
        "salary_monthly": 4200,
        "source": "QRT Direct",
        "date_posted": "2026-09-28",
        "tags": "Quant, Systematic Trading, Machine Learning, Python, C++, Paris",
        "direct_apply_email": "paris-campus@qube-rt.com"
    },
    {
        "title": "Stage Assistant Trader ETF & Market Making",
        "company": "Flow Traders",
        "location": "Paris",
        "desk": "Quantitative Market Making",
        "asset_class": "Equity & Fixed Income ETFs",
        "contract_type": "Stage Césure / PFE (6 mois)",
        "description": "Assistance sur le desk de cotation d'ETF européens en temps réel. Analyse des écarts de spread, arbitrages panier/valeur liquidative indicative (iNAV), suivi de l'inventaire et développement de scripts d'analyse des flux d'ordres.",
        "requirements": "Cursus scientifique de premier plan, esprit compétitif, passion pour les marchés financiers, rapidité de calcul mental et compétences en Python.",
        "url": "https://www.flowtraders.com/careers/jobs/junior-trader-intern-paris",
        "salary_monthly": 3500,
        "source": "Flow Traders Careers",
        "date_posted": "2026-10-04",
        "tags": "Market Making, ETF, Arbitrage, Python, Flow Traders",
        "direct_apply_email": "recruitment@flowtraders.com"
    },
    {
        "title": "Stage Trading Fixed Income & Taux (Linear Rates & Swaps)",
        "company": "Crédit Agricole CIB",
        "location": "Paris (Montrouge)",
        "desk": "Rates & FX Desk",
        "asset_class": "Rates & Fixed Income",
        "contract_type": "Stage Césure (6 mois)",
        "description": "Immersion directe sur la table de négociation des swaps de taux en euros et obligations souveraines (OAT, Bunds). Suivi de la courbe des taux, analyse des politiques monétaires BCE/FED, développement d'outils d'aide à la décision pour les traders.",
        "requirements": "École d'ingénieur ou Master Grande École avec spécialisation finance de marché. Maîtrise avancée d'Excel/VBA et Python. Intérêt marqué pour la macroéconomie et les taux.",
        "url": "https://www.ca-cib.com/carrieres/offres/stage-trading-rates",
        "salary_monthly": 2600,
        "source": "CACIB Careers",
        "date_posted": "2026-10-02",
        "tags": "Rates, Fixed Income, Swaps, Macro, Python, CACIB",
        "direct_apply_email": "campus.cib@ca-cib.com"
    },
    {
        "title": "Stage Sales FICC Institutionnels (Taux, Change, Crédit)",
        "company": "Natixis CIB",
        "location": "Paris",
        "desk": "Sales FICC / Institutional",
        "asset_class": "Fixed Income & FX",
        "contract_type": "Stage Césure (6 mois)",
        "description": "Appui à l'équipe commerciale couvrant les investisseurs institutionnels (fonds de pension, assureurs, hedge funds). Rédaction de trade notes matinales, cotations de flux sur obligations d'entreprises et stratégies de couverture de change.",
        "requirements": "Master Grande École de Commerce (HEC, ESSEC, ESCP) ou d'Ingénieur. Fort dynamisme commercial, aisance relationnelle, bilingue anglais.",
        "url": "https://recrutement.natixis.com/offres/stage-sales-ficc",
        "salary_monthly": 2500,
        "source": "Natixis Careers",
        "date_posted": "2026-10-05",
        "tags": "Sales, FICC, FX, Credit, Institutionnels, Paris",
        "direct_apply_email": "campus.ficc@natixis.com"
    },
    {
        "title": "Stage Risques de Marché & Stress Testing Dérivés Complexes",
        "company": "BNP Paribas",
        "location": "Paris",
        "desk": "Risk Management de Marché",
        "asset_class": "Multi-Asset",
        "contract_type": "Stage Fin d'Études (PFE)",
        "description": "Au sein de la direction des Risques de Marché CIB (RISK Global Markets), analyse des profils de risque des positions de trading sur dérivés complexes. Calibrage des modèles de VaR historique, Expected Shortfall et scénarios de stress de crise géopolitique.",
        "requirements": "Master 2 Finance Quantitative ou Ingénieur. Solide socle théorique en probabilités et statistiques. Bonne maîtrise du langage Python et SQL.",
        "url": "https://group.bnpparibas/emploi-carriere/offres/stage-marches-risk",
        "salary_monthly": 2600,
        "source": "BNP Paribas Careers",
        "date_posted": "2026-10-06",
        "tags": "Risk Management, VaR, Stress Testing, Python, SQL, PFE",
        "direct_apply_email": "risk.campus@bnpparibas.com"
    },
    {
        "title": "Stage Assistant Trader Volatilité & Options Actions",
        "company": "Goldman Sachs",
        "location": "Paris",
        "desk": "Trading Flow / Exotics",
        "asset_class": "Equity Derivatives",
        "contract_type": "Off-Cycle Internship (6 mois)",
        "description": "Assistance sur le desk de trading de volatilité actions européennes (Indices EuroStoxx, CAC40, Single Stocks). Exécution de stratégies d'arbitrage de vol, dispersion et skew. Interaction constante avec les quants et la vente.",
        "requirements": "Étudiant d'une école d'ingénieur de rang A (X, Centrale, Mines) ou Master 203. Maîtrise parfaite de l'anglais, agilité en programmation (Python) et rigueur extrême.",
        "url": "https://www.goldmansachs.com/careers/students/programs/off-cycle-internship",
        "salary_monthly": 3800,
        "source": "Goldman Sachs Portal",
        "date_posted": "2026-09-25",
        "tags": "Trading, Volatilité, Options, Goldman Sachs, Paris",
        "direct_apply_email": "gs-paris-campus@gs.com"
    },
    {
        "title": "Stage Quant Developer / Trading Desk Quantitative Analyst",
        "company": "Squarepoint Capital",
        "location": "Paris",
        "desk": "Quantitative Research / Trading",
        "asset_class": "Multi-Asset",
        "contract_type": "Stage Fin d'Études (PFE)",
        "description": "Conception et optimisation des moteurs d'exécution algorithmique et de calcul distribué pour nos stratégies de trading quantitatif. Analyse des micro-structures de marché, latence et modélisation de coûts de transaction.",
        "requirements": "Formation d'excellence en Informatique / Mathématiques Appliquées. Connaissances solides en C++ (17/20), Python et Linux. Goût pour les architectures haute performance.",
        "url": "https://www.squarepoint-capital.com/careers/internship",
        "salary_monthly": 4500,
        "source": "Squarepoint Capital",
        "date_posted": "2026-09-29",
        "tags": "Quant Developer, C++, Python, High Performance, Algorithmic",
        "direct_apply_email": "campus@squarepoint-capital.com"
    },
    {
        "title": "Stage Trading Commodities & Dérivés Énergétiques",
        "company": "Société Générale",
        "location": "Paris (La Défense)",
        "desk": "Commodities & Energy",
        "asset_class": "Commodities",
        "contract_type": "Stage Césure (6 mois)",
        "description": "Participation aux activités de trading et de couverture sur le pétrole, gaz naturel, électricité et quotas d'émission carbone (EUA). Suivi des fondamentaux de l'offre et la demande, pricing de swaps et d'options sur matières premières.",
        "requirements": "École d'ingénieur ou d'agronomie / université de premier plan. Compétences en modélisation de données (Python, PowerBI) et goût prononcé pour la transition énergétique et les matières premières.",
        "url": "https://careers.societegenerale.com/job-offers/stage-trading-commodities",
        "salary_monthly": 2700,
        "source": "Société Générale Careers",
        "date_posted": "2026-10-04",
        "tags": "Commodities, Énergie, Carbone, Trading, Python",
        "direct_apply_email": "commodities.desk@socgen.com"
    },
    {
        "title": "Stage Sales Trading Actions Européennes & Dérivés",
        "company": "Kepler Cheuvreux",
        "location": "Paris",
        "desk": "Sales FICC / Institutional",
        "asset_class": "Equity Derivatives",
        "contract_type": "Stage Césure (6 mois)",
        "description": "Au sein du leader indépendant du courtage en Europe, travail sur le desk d'exécution et de conseil pour les gérants de portefeuille. Suivi de l'actualité des marchés actions, transmission des ordres de bloc et analyse des flux.",
        "requirements": "Bac+4/5 Grande École de Commerce ou Ingénieur. Réactivité, culture financière développée, excellente communication verbale et maîtrise de Bloomberg.",
        "url": "https://www.keplercheuvreux.com/careers/opportunities",
        "salary_monthly": 2400,
        "source": "Kepler Cheuvreux Careers",
        "date_posted": "2026-10-06",
        "tags": "Sales Trading, Actions, Bloomberg, Courtage, Paris",
        "direct_apply_email": "recrutement@keplercheuvreux.com"
    },
    {
        "title": "Stage Gestion Quantitative & Stratégies Systématiques",
        "company": "Amundi Asset Management",
        "location": "Paris",
        "desk": "Quantitative Research / Analysis",
        "asset_class": "Multi-Asset",
        "contract_type": "Stage Fin d'Études (PFE)",
        "description": "Au sein de la division Gestion Quantitative Multi-Asset d'Amundi, participation à l'amélioration de nos modèles de smart beta, momentum et risk parity. Évaluation de l'impact des données alternatives (sentiment de marché, ESG) sur les portefeuilles.",
        "requirements": "Master 2 Finance de marché quantitative ou École d'Ingénieur. Maîtrise de Python (scikit-learn, statsmodels) et notions de gestion de portefeuille.",
        "url": "https://amundi.wd3.myworkdayjobs.com/fr-FR/Amundi_Careers/job-stage-gestion-quantitative",
        "salary_monthly": 2500,
        "source": "Amundi Workday",
        "date_posted": "2026-10-02",
        "tags": "Asset Management, Quantitative, Smart Beta, Python, PFE",
        "direct_apply_email": "campus.amundi@amundi.com"
    }
]


def seed_database(db: Session):
    """Populates database with realistic initial market finance job postings and default profile."""
    # Seed default user profile if not exists
    profile = db.query(UserProfile).first()
    if not profile:
        profile = UserProfile(
            full_name="Léo Lombardini",
            email="leo.lombardini@etudiant.univ.fr",
            phone="+33 6 12 34 56 78",
            school="Grande École d'Ingénieur / Dauphine M203",
            degree_level="Master 2 / Fin d'études (PFE)",
            target_roles='["Assistant Trader", "Quant Research", "Structuring Produits Structurés"]',
            target_locations='["Paris", "Londres", "Genève"]',
            target_asset_classes='["Equity Derivatives", "Rates & FX", "Volatility", "Commodities"]',
            technical_skills='["Python", "C++", "Calcul Stochastique", "Greeks & Pricing", "SQL", "Bloomberg"]',
            target_duration="6 mois",
            target_start_period="Janvier - Avril 2027",
            min_salary=2400,
            bio_summary="Étudiant passionné par la finance quantitative, la gestion des risques de marché et le pricing d'options exotiques. Recherche un stage de fin d'études stimulant sur un desk de trading ou de structuring.",
            serendipity_exploration_weight=0.35
        )
        db.add(profile)
        db.commit()

    # Seed initial job offers if table is empty
    existing_count = db.query(JobOffer).count()
    if existing_count == 0:
        created_offers = []
        for item in SEED_OFFERS:
            offer = JobOffer(**item)
            db.add(offer)
            created_offers.append(offer)
        db.commit()

        # Create 3 sample initial applications to demonstrate tracker functionalities
        if created_offers:
            app1 = Application(
                offer_id=created_offers[0].id,
                company=created_offers[0].company,
                job_title=created_offers[0].title,
                desk=created_offers[0].desk,
                location=created_offers[0].location,
                status="interviewing",
                applied_date="2026-10-02",
                follow_up_date="2026-10-12",
                interview_date="2026-10-14 10:00",
                salary_monthly=2800,
                contact_name="Marc D. (Head of EQD Flow)",
                contact_email="marc.d@bnpparibas.com",
                application_url=created_offers[0].url,
                notes="Entretien technique prévu : révision des grecs d'ordre 2 (Vanna, Volga), modèle de Dupire et questions de calcul mental.",
                resume_version="CV_Leo_Lombardini_Quant_2026.pdf"
            )
            created_offers[0].is_applied = True

            app2 = Application(
                offer_id=created_offers[1].id,
                company=created_offers[1].company,
                job_title=created_offers[1].title,
                desk=created_offers[1].desk,
                location=created_offers[1].location,
                status="applied",
                applied_date="2026-10-04",
                follow_up_date="2026-10-18",
                salary_monthly=2700,
                contact_name="RH Campus SG Markets",
                contact_email="campus.socgen@socgen.com",
                application_url=created_offers[1].url,
                notes="Candidature envoyée via le portail avec lettre personnalisée sur les Autocalls Phoenix.",
                resume_version="CV_Leo_Lombardini_Quant_2026.pdf"
            )
            created_offers[1].is_applied = True

            app3 = Application(
                offer_id=created_offers[4].id,
                company=created_offers[4].company,
                job_title=created_offers[4].title,
                desk=created_offers[4].desk,
                location=created_offers[4].location,
                status="follow_up_needed",
                applied_date="2026-09-24",
                follow_up_date="2026-10-08",
                salary_monthly=2600,
                contact_name="Desk Rates Trading",
                contact_email="rates.trading@ca-cib.com",
                application_url=created_offers[4].url,
                notes="Relance à effectuer suite à 14 jours sans retour pour réaffirmer mon intérêt sur la table swaps de taux.",
                resume_version="CV_Leo_Lombardini_Quant_2026.pdf"
            )
            created_offers[4].is_applied = True

            db.add_all([app1, app2, app3])
            db.commit()
