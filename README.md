# UrbanHeat AI 🛰️
**AI-Powered Climate Intelligence Platform for Urban Heat Island Detection & Mitigation**

Built for the ISRO Bharatiya Antariksh Hackathon (BAH) 2026.

---

## 🏗️ Folder Structure

```text
UrbanHeat-AI/
├── frontend/          # React 19 + Vite 8 + TS + Tailwind CSS v4 Client
├── backend/           # Node.js Express Gateway & Core API
├── ml-engine/         # Python FastAPI ML Prediction & Optimization Engine
├── data-pipeline/     # Spatial processing pipelines & Canonical datasets
└── docs/              # System architecture, API, and deployment documentation
```

---

## 🚀 Quick Start

### 1. Configure Environment
Copy the example environment configuration in the root:
```bash
cp .env.example .env
```
Fill in the variables, including your `OPENWEATHER_API_KEY`.

### 2. Start ML Engine (FastAPI)
```bash
cd ml-engine
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --port 8000 --reload
```

### 3. Start Backend Gateway (Express)
```bash
cd backend
npm install
npm start
```

### 4. Start Client Frontend (React)
```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │ Landing  │ │Dashboard │ │Simulation│ │ City Detail   │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │ Alerts   │ │Rankings  │ │Assistant │ │ Admin Panel   │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │
└────────────────────────────┬────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Vite Dev Proxy │ (Proxy: /api → http://localhost:3001)
                    └────────┬────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                   GATEWAY BACKEND (Node.js)                 │
│  • Express Router            • JWT Authentication           │
│  • Live weather API Cache    • Unified Reporting & Logs     │
└────────────────────────────┬────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │ FastAPI Proxy   │ (Orchestration Forwarding)
                    └────────┬────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                    ML INTELLIGENCE ENGINE                   │
│  • predict.py (LST)          • hotspots.py (Spatial DBSCAN) │
│  • simulate.py (What-if)     • optimize.py (GA planning)    │
│  • explain.py (SHAP values)  • cities.json Shared Dataset   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧠 AI/ML & Analytics Modules

| Service | Module / Endpoint | Technology | Description |
|---|---|---|---|
| **ml-engine** | `/predict` | XGBoost | Predicts Land Surface Temperature (LST) from albedo, NDVI, and density. |
| **ml-engine** | `/simulate` | Physics + ML | Models local LST drop under various green cover/roof interventions. |
| **ml-engine** | `/hotspots` | DBSCAN / KMeans | Groups geographic high-temp coordinates into heat hotspot bubbles. |
| **ml-engine** | `/explain` | SHAP Explainer | Calculates game-theoretic feature attribution for prediction transparency. |
| **ml-engine** | `/optimize` | Genetic/Greedy LP | Recommends optimal interventions matching targeted cooling goals & budgets. |
| **backend** | `/api/weather` | OpenWeatherMap | Dynamically fetches live climate indicators for 100+ cities. |
| **backend** | `/api/assistant` | Conversational Agent | AI chatbot assistant providing planners guidance. |

---

## 🎨 Interactive Client Pages (9)

- **Landing Page** — Space-themed hero with rotating Earth and particle streams.
- **Dashboard** — Interactive Leaflet Map showing UHI intensity layers across India.
- **Simulation** — Interactive sliders to test "What-if" cooling interventions.
- **Vulnerability Rankings** — Sortable index rankings for 100+ cities.
- **AI Assistant** — Natural language interface answering climate questions.
- **Alerts Page** — Real-time hazard notifications and weather warnings.
- **City Detail** — Full breakdown of albedo, NDVI, NDBI, and explainable AI insights.
- **Admin Panel** — Micro-service monitor, API health check, and system logs.

---

## 🎯 SDG Alignment

- **SDG 11** — Sustainable Cities and Communities (reducing urban heat vulnerability)
- **SDG 13** — Climate Action (decarbonization, cooling models, local planning)
- **SDG 3** — Good Health and Well-being (mitigating extreme temperature exposures)

---

**Team UrbanHeat AI** — ISRO Bharatiya Antariksh Hackathon 2026
