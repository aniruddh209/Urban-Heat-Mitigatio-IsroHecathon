# pyrefly: ignore [missing-import]
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
import os
import json

router = APIRouter()

from app.config import MODEL_DIR


class TrainingReportResponse(BaseModel):
    project: str
    training_timestamp: str
    total_training_time_sec: float
    dataset: Dict[str, Any]
    model_comparison: Dict[str, Any]
    best_model: Dict[str, Any]
    shap_feature_importance: Dict[str, Any]


@router.get("/training-report")
async def get_training_report():
    """Return the ML training report with model comparison metrics."""
    report_path = os.path.join(MODEL_DIR, "training_report.json")
    if not os.path.exists(report_path):
        raise HTTPException(status_code=404, detail="Training report not found. Run the training pipeline first.")
    
    with open(report_path, "r") as f:
        report = json.load(f)
    
    return report


@router.get("/hotspot-report")
async def get_hotspot_report():
    """Return the hotspot analysis report."""
    report_path = os.path.join(MODEL_DIR, "hotspot_results.json")
    if not os.path.exists(report_path):
        raise HTTPException(status_code=404, detail="Hotspot report not found. Run the hotspot training first.")
    
    with open(report_path, "r") as f:
        report = json.load(f)
    
    return report


@router.get("/model-info")
async def get_model_info():
    """Return information about the currently loaded ML model."""
    report_path = os.path.join(MODEL_DIR, "training_report.json")
    features_path = os.path.join(MODEL_DIR, "feature_names.json")
    model_path = os.path.join(MODEL_DIR, "best_model.joblib")
    
    info = {
        "model_available": os.path.exists(model_path),
        "training_report_available": os.path.exists(report_path),
        "features": [],
        "best_model": {},
        "model_comparison": {},
    }
    
    if os.path.exists(features_path):
        with open(features_path, "r") as f:
            info["features"] = json.load(f)
    
    if os.path.exists(report_path):
        with open(report_path, "r") as f:
            report = json.load(f)
            info["best_model"] = report.get("best_model", {})
            info["model_comparison"] = {
                k: {"test_r2": v["test_r2"], "test_rmse": v["test_rmse"]}
                for k, v in report.get("model_comparison", {}).items()
            }
    
    return info
