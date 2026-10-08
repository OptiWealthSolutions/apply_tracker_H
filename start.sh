#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "=========================================================="
echo "      ALPHATRACKER - STAGES FINANCE DE MARCHÉ             "
echo "=========================================================="
echo "Démarrage des services en local..."

# 1. Vérification environnement virtuel Python
if [ ! -d "venv" ]; then
    echo "Création de l'environnement virtuel venv..."
    python3 -m venv venv
    ./venv/bin/pip install -r backend/requirements.txt
fi

# 2. Démarrage du Backend FastAPI
echo "Lancement du backend FastAPI sur http://127.0.0.1:8000 ..."
./venv/bin/python3 backend/run.py &
BACKEND_PID=$!

# 3. Démarrage du Frontend React (Vite)
echo "Lancement du frontend React Vite sur http://localhost:5173 ..."
cd frontend
npm run dev -- --host 127.0.0.1 &
FRONTEND_PID=$!

cleanup() {
    echo ""
    echo "Arrêt d'AlphaTracker..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    exit 0
}

trap cleanup INT TERM

echo ""
echo "AlphaTracker est opérationnel :"
echo "  - Interface Web : http://localhost:5173"
echo "  - API Backend   : http://127.0.0.1:8000/docs"
echo "Appuyez sur Ctrl+C pour arrêter l'application."
echo "=========================================================="

wait
