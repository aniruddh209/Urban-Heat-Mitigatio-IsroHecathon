# UrbanHeat AI 🛰️

**AI-Powered Climate Intelligence Platform for Urban Heat Island Detection & Mitigation**

Built for the ISRO Bharatiya Antariksh Hackathon (BAH) 2026

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ & npm
- Python 3.11+

### Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (React)                  │
│  Vite + TypeScript + Tailwind CSS v4 + Leaflet     │
│  Recharts + Lucide Icons + React Router            │
└──────────────────────┬──────────────────────────────┘
                       │ REST API (Proxy via Vite)
┌──────────────────────▼──────────────────────────────┐
│                  Backend (FastAPI)                   │
│  12 API Modules • JWT Auth • AI/ML Models          │
│  100-City Dataset • Simulation Engine              │
└─────────────────────────────────────────────────────┘
```

## 📡 API Modules (12)

| Module | Endpoints | Description |
|--------|-----------|-------------|
| Auth | `/api/v1/auth/*` | JWT login, signup, OTP |
| Cities | `/api/v1/cities/*` | 100 Indian cities data |
| Weather | `/api/v1/weather/*` | Current, monthly, yearly |
| Predictions | `/api/v1/predictions/*` | UHI detection, forecasting |
| Analytics | `/api/v1/analytics/*` | Trends, state comparison |
| Maps | `/api/v1/maps/*` | GeoJSON, heat/AQI layers |
| Simulation | `/api/v1/simulation/*` | "What If" climate scenarios |
| Assistant | `/api/v1/assistant/*` | AI chatbot for planning |
| Alerts | `/api/v1/alerts/*` | Emergency heatwave alerts |
| Recommendations | `/api/v1/recommendations/*` | Smart cooling strategies |
| Reports | `/api/v1/reports/*` | Downloadable reports |
| Admin | `/api/v1/admin/*` | System management |

## 🧠 AI/ML Models

| Model | Algorithm | Purpose |
|-------|-----------|---------|
| UHI Detector | XGBoost + SHAP | Urban Heat Island detection |
| Temperature Forecast | PyTorch LSTM | Multi-year projections |
| Risk Scorer | Ensemble | Heat vulnerability ranking |
| Simulation Engine | Physics + ML | "What If" scenario modeling |
| Recommendation Engine | Rule-based + ML | Cooling strategy generation |
| Tree Estimator | AI Planning | Optimal tree plantation |
| XAI Engine | SHAP | Explainable AI reasoning |

## 🎨 Frontend Pages

- **Landing Page** — Space-themed hero with animated Earth
- **Dashboard** — Mission Control with interactive India map
- **Simulation** — "What If" climate intervention simulator
- **Vulnerability Rankings** — Sortable 100-city risk table
- **AI Assistant** — Conversational chatbot for urban planning
- **Alerts** — Emergency heatwave notification center
- **Admin Panel** — System management with model status

## 📊 Key Features

- ✅ 100 Indian cities with real climate data
- ✅ Interactive Leaflet map with heat/AQI/vegetation layers
- ✅ AI Cooling Action Plans with budget estimates
- ✅ Tree Plantation Estimator with species recommendations
- ✅ "What If" Climate Simulation with before/after comparison
- ✅ Explainable AI with SHAP-based feature importance
- ✅ Heat Vulnerability Ranking across India
- ✅ Emergency Heatwave Alert System
- ✅ AI Urban Planning Chatbot Assistant
- ✅ SDG 3, 11, 13 alignment metrics
- ✅ Premium dark theme with ISRO-inspired aesthetics
- ✅ Glassmorphism, gradient effects, particle animations

## 🎯 SDG Alignment

- **SDG 11** — Sustainable Cities and Communities
- **SDG 13** — Climate Action
- **SDG 3** — Good Health and Well-being

---

**Team UrbanHeat AI** — ISRO Bharatiya Antariksh Hackathon 2026
# Urban-Heat-Mitigation---Isro-Hecathon
# Urban-Heat-Mitigation---Isro-Hecathon
