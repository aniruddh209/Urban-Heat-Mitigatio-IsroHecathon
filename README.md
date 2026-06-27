# UrbanHeat AI

AI-Powered Climate Intelligence Platform for Urban Heat Island Detection & Mitigation — built for the ISRO Bharatiya Antariksh Hackathon (BAH) 2026.

## Folder Structure

```
├── frontend/        React 19 + Vite + TypeScript + Tailwind v4
├── backend/         Node.js Express API Gateway
├── ml-engine/       Python FastAPI ML Engine
├── data-pipeline/   Satellite data processing scripts
└── docs/            Architecture & API documentation
```

## Dataset

**[India Environmental Dataset (2021–2025) — Kaggle](https://www.kaggle.com/datasets/vishalbaraiya1014/india-environmental-dataset-2021-2025)**

A custom-built dataset covering the top 100 Indian cities with monthly satellite-derived environmental indicators from 2021 to 2025. Data was collected using Google Earth Engine from Sentinel-2, MODIS, and SRTM sources. The automated Python pipeline extracted NDVI, NDBI, NDWI, Elevation, and Land Surface Temperature (LST) per city per month, producing 6,000 records across 11 features.

| Column | Description |
|--------|-------------|
| City, State | City name and state/UT |
| Latitude, Longitude | Geographic coordinates |
| Year, Month | Observation period |
| NDVI | Vegetation index (Sentinel-2) |
| NDBI | Built-up index (Sentinel-2) |
| NDWI | Water index (Sentinel-2) |
| Elevation | Meters above sea level (SRTM) |
| LST | Land Surface Temperature in °C (MODIS) |

## Quick Start

**1. ML Engine (Python)**
```bash
cd ml-engine
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --port 8000 --reload
```

**2. Backend (Node.js)**
```bash
cd backend
cp .env.example .env    # add your OPENWEATHER_API_KEY
npm install && npm start
```

**3. Frontend (React)**
```bash
cd frontend
npm install && npm run dev
```

Open **http://localhost:5173**

## Architecture

```
Frontend (React + Vite :5173)
    │
    ▼  Vite proxy /api → :3001
Backend Gateway (Express :3001)
    │  JWT auth, weather cache, routing
    ▼  Proxy to :8000
ML Engine (FastAPI :8000)
    predict / simulate / hotspots / explain / optimize
```

## ML Modules

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/predict` | XGBoost | LST prediction from albedo, NDVI, density |
| `/simulate` | Physics + ML | What-if cooling intervention modeling |
| `/hotspots` | DBSCAN / KMeans | Spatial heat hotspot clustering |
| `/explain` | SHAP | Feature attribution for transparency |
| `/optimize` | Genetic Algorithm | Optimal interventions for budget & targets |

## Pages

Dashboard, Simulation, Vulnerability Rankings, AI Assistant, Alerts, City Detail, Admin Panel

## SDG Alignment

**SDG 11** Sustainable Cities — **SDG 13** Climate Action — **SDG 3** Health & Well-being

---

Team UrbanHeat AI — ISRO BAH 2026
