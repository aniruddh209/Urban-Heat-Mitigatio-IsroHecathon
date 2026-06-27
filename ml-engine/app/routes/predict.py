# pyrefly: ignore [missing-import]
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
import numpy as np
import os
import json

router = APIRouter()

# ─── Model Loading ─────────────────────────────────────────────
from app.config import MODEL_DIR
_model = None
_scaler = None
_feature_names = None
_training_report = None


def _load_model():
    """Lazy-load the trained model, scaler, and feature names."""
    global _model, _scaler, _feature_names, _training_report
    if _model is not None:
        return

    try:
        import joblib
        model_path = os.path.join(MODEL_DIR, "best_model.joblib")
        scaler_path = os.path.join(MODEL_DIR, "scaler.joblib")
        features_path = os.path.join(MODEL_DIR, "feature_names.json")
        report_path = os.path.join(MODEL_DIR, "training_report.json")

        if os.path.exists(model_path):
            _model = joblib.load(model_path)
            print(f"[ML] Loaded trained model from {model_path}")
        if os.path.exists(scaler_path):
            _scaler = joblib.load(scaler_path)
            print(f"[ML] Loaded scaler from {scaler_path}")
        if os.path.exists(features_path):
            with open(features_path, "r") as f:
                _feature_names = json.load(f)
            print(f"[ML] Loaded {len(_feature_names)} feature names")
        if os.path.exists(report_path):
            with open(report_path, "r") as f:
                _training_report = json.load(f)
    except Exception as e:
        print(f"[ML] Warning: Could not load trained model: {e}")
        print("[ML] Falling back to physics-based prediction")


def _build_feature_vector(request) -> np.ndarray:
    """
    Build a feature vector using the same feature engineering pipeline
    as training. This ensures inference uses identical transformations.
    """
    import sys
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))
    from training.feature_engineer import engineer_single_input, ENGINEERED_FEATURE_COLS

    raw_features = {
        "ndvi": request.ndvi,
        "ndbi": request.ndbi,
        "albedo": request.albedo,
        "humidity": request.relative_humidity,
        "population_density": request.population_density,
        "building_density": request.building_density,
        "elevation_m": request.elevation_m,
        "rainfall_mm": request.rainfall_mm,
        "aqi": request.aqi,
        "green_cover_pct": request.green_cover_pct,
        "water_body_pct": request.water_body_pct,
        "wind_speed": request.wind_speed,
    }

    # Add temporal features
    if hasattr(request, 'month') and request.month is not None:
        raw_features["month"] = request.month
    if hasattr(request, 'hour_of_day') and request.hour_of_day is not None:
        raw_features["hour_of_day"] = request.hour_of_day

    engineered = engineer_single_input(raw_features)
    return engineered.reshape(1, -1)


# ─── Request / Response Models ─────────────────────────────────
class PredictionRequest(BaseModel):
    ndvi: float = Field(..., description="Normalized Difference Vegetation Index (0.0 to 1.0)", ge=0.0, le=1.0)
    ndbi: float = Field(0.5, description="Normalized Difference Built-up Index (0.0 to 1.0)", ge=0.0, le=1.0)
    albedo: float = Field(0.2, description="Surface Albedo (0.0 to 1.0)", ge=0.0, le=1.0)
    building_density: float = Field(..., description="Percentage of building coverage (0.0 to 1.0)", ge=0.0, le=1.0)
    relative_humidity: float = Field(..., description="Relative Humidity percentage (0 to 100)", ge=0.0, le=100.0)
    population_density: float = Field(5000.0, description="Population per sq km")
    elevation_m: float = Field(200.0, description="Elevation in meters")
    rainfall_mm: float = Field(800.0, description="Annual rainfall in mm")
    aqi: float = Field(100.0, description="Air Quality Index")
    green_cover_pct: float = Field(15.0, description="Green cover percentage")
    water_body_pct: float = Field(3.0, description="Water body percentage")
    wind_speed: float = Field(8.0, description="Wind speed in km/h")
    baseline_temp: float = Field(28.0, description="Ambient air temperature in Celsius")
    # New optional temporal fields
    month: Optional[int] = Field(None, description="Month of year (1-12). Defaults to May (5) if not provided.", ge=1, le=12)
    hour_of_day: Optional[float] = Field(None, description="Hour of day (6-20). Defaults to 13 if not provided.", ge=6.0, le=20.0)


class PredictionResponse(BaseModel):
    predicted_lst: float = Field(..., description="Predicted Land Surface Temperature (LST) in Celsius")
    uhi_intensity: float = Field(..., description="Calculated UHI intensity difference (LST - Ambient)")
    risk_level: str = Field(..., description="UHI Risk Level (Low, Moderate, High, Extreme)")
    model_used: str = Field(..., description="Name of the ML model used")
    model_r2: float = Field(..., description="Model R² score on test set")
    confidence: float = Field(..., description="Prediction confidence percentage")
    prediction_interval_low: Optional[float] = Field(None, description="Lower bound of prediction interval (°C)")
    prediction_interval_high: Optional[float] = Field(None, description="Upper bound of prediction interval (°C)")


def _physics_fallback(request: PredictionRequest) -> float:
    """Physics-based LST estimation as fallback when no trained model is available."""
    lst_effect = (
        request.building_density * 8.5
        - request.ndvi * 5.2
        - request.albedo * 4.0
        + (100.0 - request.relative_humidity) * 0.05
        + request.ndbi * 3.0
        - 0.0065 * (request.elevation_m - 200)
    )
    return request.baseline_temp + lst_effect


def _compute_confidence(X_scaled, model_r2):
    """
    Compute prediction confidence based on how close input is to training
    distribution (approximated via feature magnitude) and model R².
    """
    # Mahalanobis-like: if input is far from mean (0 after scaling), lower confidence
    feature_dist = np.sqrt(np.mean(X_scaled ** 2))
    # Typical range is 0-3 for standardized features; beyond 3 is outlier territory
    dist_penalty = max(0, min(15, (feature_dist - 1.5) * 5))
    confidence = min(98.0, max(60.0, model_r2 * 100 - dist_penalty))
    return round(confidence, 1)


@router.post("/", response_model=PredictionResponse)
async def predict_lst(request: PredictionRequest):
    try:
        _load_model()

        model_name = "Physics-Based Estimation"
        model_r2 = 0.0
        confidence = 70.0
        pred_low = None
        pred_high = None

        if _model is not None and _scaler is not None and _feature_names is not None:
            # Build engineered feature vector
            X_raw = _build_feature_vector(request)
            X_scaled = _scaler.transform(X_raw)
            predicted_lst = float(_model.predict(X_scaled)[0])

            # Get model info from training report
            if _training_report:
                best = _training_report.get("best_model", {})
                model_name = best.get("name", "Trained ML Model")
                model_r2 = best.get("test_r2", 0.90)
            else:
                model_name = "Trained ML Model"
                model_r2 = 0.90

            # Compute confidence based on input distance from training distribution
            confidence = _compute_confidence(X_scaled, model_r2)

            # Prediction interval (approximation based on test RMSE)
            test_rmse = 1.0  # Default conservative estimate
            if _training_report:
                test_rmse = _training_report.get("best_model", {}).get("test_rmse", 1.0)
            pred_low = round(predicted_lst - 1.96 * test_rmse, 2)
            pred_high = round(predicted_lst + 1.96 * test_rmse, 2)
        else:
            # Fallback to physics model
            predicted_lst = _physics_fallback(request)

        uhi_intensity = predicted_lst - request.baseline_temp

        if uhi_intensity < 1.5:
            risk_level = "Low"
        elif uhi_intensity < 3.0:
            risk_level = "Moderate"
        elif uhi_intensity < 5.0:
            risk_level = "High"
        else:
            risk_level = "Extreme"

        return PredictionResponse(
            predicted_lst=round(predicted_lst, 2),
            uhi_intensity=round(uhi_intensity, 2),
            risk_level=risk_level,
            model_used=model_name,
            model_r2=round(model_r2, 4),
            confidence=round(confidence, 1),
            prediction_interval_low=pred_low,
            prediction_interval_high=pred_high,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")
