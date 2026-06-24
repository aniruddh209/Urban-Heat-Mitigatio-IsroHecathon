# UrbanHeat AI — Machine Learning Engine

Python-based ML service running FastAPI. This service handles all intelligence endpoints, including hotspot detection, temperature prediction, cooling simulation, SHAP explanations, and mitigation strategy optimization.

## Directory Structure

```text
ml-engine/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI entry point
│   ├── models/              # Saved model binaries
│   ├── routes/              # API endpoints
│   │   ├── predict.py       # LST prediction
│   │   ├── simulate.py      # Cooling intervention simulation
│   │   ├── hotspots.py      # UHI Hotspot clustering
│   │   ├── explain.py       # SHAP explanation generator
│   │   └── optimize.py      # Strategy optimizer (Genetic Algorithm)
│   └── utils/
│       ├── data_loader.py   # Shared JSON loader
│       └── shap_explainer.py
├── requirements.txt
└── README.md
```

## Setup & Running

1. **Create Virtual Environment**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

2. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run Dev Server**:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
