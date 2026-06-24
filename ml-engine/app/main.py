# pyrefly: ignore [missing-import]
import uvicorn
# pyrefly: ignore [missing-import]
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import predict, simulate, hotspots, explain, optimize, report

app = FastAPI(
    title="UrbanHeat AI - ML Engine",
    description="Machine Learning service for Urban Heat Island mitigation & prediction (ISRO BAH 2026)",
    version="2.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(predict.router, prefix="/api/v1/ml/predict", tags=["Prediction"])
app.include_router(simulate.router, prefix="/api/v1/ml/simulate", tags=["Simulation"])
app.include_router(hotspots.router, prefix="/api/v1/ml/hotspots", tags=["Hotspots"])
app.include_router(explain.router, prefix="/api/v1/ml/explain", tags=["Explanation"])
app.include_router(optimize.router, prefix="/api/v1/ml/optimize", tags=["Optimization"])
app.include_router(report.router, prefix="/api/v1/ml/report", tags=["Reports"])

@app.get("/")
async def root():
    return {
        "status": "healthy",
        "service": "UrbanHeat AI ML Engine",
        "version": "2.0.0",
        "hackathon": "ISRO Bharatiya Antariksh Hackathon 2026",
        "models": {
            "prediction": "Trained ML Model (XGBoost/LightGBM/CatBoost — auto-selected)",
            "explainability": "SHAP TreeExplainer",
            "hotspots": "DBSCAN + KMeans + Getis-Ord Gi*",
            "optimization": "Genetic Algorithm",
        },
        "endpoints": {
            "prediction": "/api/v1/ml/predict",
            "simulation": "/api/v1/ml/simulate",
            "hotspot_detection": "/api/v1/ml/hotspots",
            "explainability": "/api/v1/ml/explain",
            "optimization": "/api/v1/ml/optimize",
            "reports": "/api/v1/ml/report",
            "docs": "/docs",
        }
    }

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
