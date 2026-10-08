# AlphaTracker - Tracker de Candidatures pour Stages en Finance de Marché

Système institutionnel de suivi, de scraping et de recommandation intelligente pour les candidatures de stage en finance de marché (Trading, Structuring, Recherche Quantitative, Sales FICC, Gestion des Risques).

---

## Fonctionnalités Principales

1. **Tableau & Pipeline de Candidatures (Kanban & Vue Tableau)** :
   - Suivi complet avec statuts dynamiques : *À postuler*, *Postulé*, *Relance à faire*, *Entretien en cours*, *Offre reçue / Accepté*, *Refusé*, *Retiré*.
   - Détection automatique des relances dues (calcul à J+7 / J+14).
   - Ajout manuel ou import en 1 clic depuis les offres détectées.
   - Base de données locale **SQLite** (`data/market_finance_tracker.db`).

2. **Scraper d'Offres & Google Jobs via Mots-Clés** :
   - Moteur de scraping de requêtes de marché (Google Search & fallback DuckDuckGo sans blocage Captcha).
   - Requêtes prédéfinies : *Assistant Trader EQD*, *Quant Research Python*, *Structuring Produits Structurés*, *Sales FICC*, *ETF Market Making*, *Risques de Marché*.
   - Extraction directe à partir de n'importe quelle URL d'annonce collée (LinkedIn, eFinancialCareers, portails bancaires).

3. **Conseiller Intelligent par Plus Proche Voisin (KNN)** :
   - Vectorisation TF-IDF de l'espace des compétences (pricing de dérivés, Grecs, calcul stochastique, Black-Scholes, C++, Python, volatilité).
   - **Pépites Découverte (KNN Serendipity)** : Découverte d'offres à forte valeur ajoutée sur des desks adjacents qui partagent les mêmes compétences clés mais qui ne figuraient pas dans vos mots-clés directs initiaux.
   - **Top Correspondances Directes** : Calcul de distance cosinus par rapport à votre profil déclaré.
   - Formulaire de préférences modifiable (rôles, asset classes, localisations, compétences, salaire minimum, jauge de curiosité d'exploration).

4. **Postuler Directement via la Plateforme** :
   - Accès immédiat au portail de candidature officiel (ATS).
   - Générateur de lettre et email d'accroche institutionnel calibré selon le desk (pricing, microstructure, convictions de marché).
   - Bouton `mailto:` pré-rempli (destinataire, objet, corps de message) et copie en un clic.
   - Enregistrement synchronisé direct dans le tableau avec calcul automatique de relance.

5. **Design & Ergonomie** :
   - Style épuré, sidebar bleu marine institutionnel (`#0B1E36`), corps blanc immaculé (`#FFFFFF` / `#F8FAFC`).
   - Typographie **Inter** et chiffres tabulaires monospaces (`JetBrains Mono`).
   - **Aucun emoji** : Icônes vectorielles SVG institutionnelles (Lucide React).

---

## Architecture Technique

- **Backend** :
  - Python 3.13 / FastAPI
  - SQLAlchemy 2.0 & SQLite local
  - Scikit-learn (TfidfVectorizer & NearestNeighbors)
  - BeautifulSoup4 & HTTPX
- **Frontend** :
  - React 19 / TypeScript / Vite 8
  - Tailwind CSS 4
  - Lucide React

---

## Démarrage Rapide

### 1. Lancement en un clic
```bash
./start.sh
```

### 2. Lancement manuel séparé

**Backend :**
```bash
python3 -m venv venv
./venv/bin/pip install -r backend/requirements.txt
./venv/bin/python3 backend/run.py
```
*Le backend sera accessible sur : `http://127.0.0.1:8000` (Documentation OpenAPI : `http://127.0.0.1:8000/docs`).*

**Frontend :**
```bash
cd frontend
npm install
npm run dev
```
*L'application web sera accessible sur : `http://localhost:5173`.*
