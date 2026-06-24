# pyrefly: ignore [missing-import]
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any
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
    """Lazy-load the trained model for SHAP analysis."""
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
        if os.path.exists(scaler_path):
            _scaler = joblib.load(scaler_path)
        if os.path.exists(features_path):
            with open(features_path, "r") as f:
                _feature_names = json.load(f)
        if os.path.exists(report_path):
            with open(report_path, "r") as f:
                _training_report = json.load(f)
    except Exception as e:
        print(f"[ML] Could not load model for explainability: {e}")


# ─── Request / Response ────────────────────────────────────────
class ExplanationRequest(BaseModel):
    ndvi: float = Field(..., description="NDVI value (0 to 1)")
    ndbi: float = Field(0.5, description="NDBI value (0 to 1)")
    albedo: float = Field(0.2, description="Albedo value (0 to 1)")
    building_density: float = Field(..., description="Building density value (0 to 1)")
    relative_humidity: float = Field(..., description="Relative humidity (0 to 100)")
    population_density: float = Field(5000.0, description="Population per sq km")
    elevation_m: float = Field(200.0, description="Elevation in meters")
    rainfall_mm: float = Field(800.0, description="Annual rainfall mm")
    aqi: float = Field(100.0, description="Air Quality Index")
    green_cover_pct: float = Field(15.0, description="Green cover %")
    water_body_pct: float = Field(3.0, description="Water body %")
    wind_speed: float = Field(8.0, description="Wind speed km/h")
    baseline_temp: float = Field(28.0, description="Baseline ambient temperature")


class ShapValue(BaseModel):
    feature: str
    feature_value: float
    shap_value: float
    importance_pct: float
    direction: str  # "heating" or "cooling"
    description: str


class ExplanationResponse(BaseModel):
    base_value: float
    predicted_lst: float
    uhi_intensity: float
    shap_values: List[ShapValue]
    top_heating_factor: str
    top_cooling_factor: str
    model_used: str
    explanation_method: str


# Feature display names and descriptions
FEATURE_INFO = {
    "ndvi": {
        "display": "Vegetation Index (NDVI)",
        "heating_desc": "Lack of vegetation increases local temperature due to reduced evapotranspiration.",
        "cooling_desc": "Vegetation provides evapotranspiration cooling, reducing surface heat.",
    },
    "ndbi": {
        "display": "Built-up Index (NDBI)",
        "heating_desc": "Dense built-up areas absorb and re-radiate solar energy, trapping heat.",
        "cooling_desc": "Lower built-up density allows natural cooling through vegetation and airflow.",
    },
    "albedo": {
        "display": "Surface Albedo",
        "heating_desc": "Dark surfaces (low albedo) absorb more solar radiation, heating the surface.",
        "cooling_desc": "Reflective surfaces bounce back solar radiation, reducing heat absorption.",
    },
    "humidity": {
        "display": "Relative Humidity",
        "heating_desc": "Dry air reduces evaporative cooling, accelerating thermal buildup.",
        "cooling_desc": "Moisture in the air aids evaporative cooling, moderating surface temperatures.",
    },
    "population_density": {
        "display": "Population Density",
        "heating_desc": "High population generates anthropogenic heat from vehicles, AC, and industry.",
        "cooling_desc": "Lower population density means less anthropogenic heat generation.",
    },
    "building_density": {
        "display": "Building Density",
        "heating_desc": "Dense concrete and asphalt trap heat in urban canyons.",
        "cooling_desc": "Open spaces allow convective cooling and better airflow.",
    },
    "elevation_m": {
        "display": "Elevation",
        "heating_desc": "Low elevation areas tend to trap heat in atmospheric inversion layers.",
        "cooling_desc": "Higher elevation benefits from atmospheric lapse rate cooling (~6.5°C/km).",
    },
    "rainfall_mm": {
        "display": "Annual Rainfall",
        "heating_desc": "Low rainfall means less evaporative cooling and drier soil conditions.",
        "cooling_desc": "Higher rainfall provides moisture for evapotranspiration and soil cooling.",
    },
    "aqi": {
        "display": "Air Quality Index",
        "heating_desc": "Air pollution creates a greenhouse effect, trapping outgoing heat radiation.",
        "cooling_desc": "Cleaner air allows heat to dissipate more efficiently.",
    },
    "green_cover_pct": {
        "display": "Green Cover %",
        "heating_desc": "Insufficient green cover exposes more impervious surfaces to solar radiation.",
        "cooling_desc": "Extensive green cover provides shade and evapotranspiration cooling.",
    },
    "water_body_pct": {
        "display": "Water Body %",
        "heating_desc": "Lack of water bodies removes a key natural cooling mechanism.",
        "cooling_desc": "Water bodies provide evaporative cooling to surrounding areas.",
    },
    "wind_speed": {
        "display": "Wind Speed",
        "heating_desc": "Low wind speed reduces convective heat removal from surfaces.",
        "cooling_desc": "Wind facilitates convective cooling and heat dispersal.",
    },
}


@router.post("/", response_model=ExplanationResponse)
async def explain_prediction(request: ExplanationRequest):
    try:
        _load_model()

        # Build feature vector
        feature_values = {
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

        model_name = "Physics-Based"
        explanation_method = "Analytical Decomposition"

        if _model is not None and _scaler is not None and _feature_names is not None:
            # Use real SHAP explainer
            try:
                import shap

                X = np.array([[feature_values[f] for f in _feature_names]])
                X_scaled = _scaler.transform(X)
                predicted_lst = float(_model.predict(X_scaled)[0])

                # Try TreeExplainer first, fall back to KernelExplainer
                try:
                    explainer = shap.TreeExplainer(_model)
                    shap_vals = explainer.shap_values(X_scaled)[0]
                    base_val = float(explainer.expected_value)
                except Exception:
                    # Kernel explainer for non-tree models
                    background = np.zeros((1, len(_feature_names)))
                    explainer = shap.KernelExplainer(_model.predict, background)
                    shap_vals = explainer.shap_values(X_scaled)[0]
                    base_val = float(explainer.expected_value)

                model_name = _training_report.get("best_model", {}).get("name", "ML Model") if _training_report else "ML Model"
                explanation_method = "SHAP (TreeExplainer)"

            except Exception as e:
                print(f"[ML] SHAP computation failed, using analytical fallback: {e}")
                predicted_lst, base_val, shap_vals = _analytical_fallback(request, feature_values)
        else:
            predicted_lst, base_val, shap_vals = _analytical_fallback(request, feature_values)

        uhi_intensity = predicted_lst - request.baseline_temp

        # Build SHAP value response
        total_abs = sum(abs(v) for v in shap_vals) or 1.0
        features_to_use = _feature_names if _feature_names else list(feature_values.keys())

        shap_list = []
        top_heating = ("unknown", 0)
        top_cooling = ("unknown", 0)

        for i, feat in enumerate(features_to_use):
            sv = float(shap_vals[i])
            direction = "heating" if sv > 0 else "cooling"
            info = FEATURE_INFO.get(feat, {"display": feat, "heating_desc": "Contributes to heating.", "cooling_desc": "Contributes to cooling."})

            if sv > top_heating[1]:
                top_heating = (info["display"], sv)
            if sv < top_cooling[1]:
                top_cooling = (info["display"], sv)

            shap_list.append(ShapValue(
                feature=info["display"],
                feature_value=round(feature_values[feat], 4),
                shap_value=round(sv, 4),
                importance_pct=round(abs(sv) / total_abs * 100, 1),
                direction=direction,
                description=info["heating_desc"] if sv > 0 else info["cooling_desc"],
            ))

        # Sort by absolute importance
        shap_list.sort(key=lambda x: abs(x.shap_value), reverse=True)

        return ExplanationResponse(
            base_value=round(base_val, 2),
            predicted_lst=round(predicted_lst, 2),
            uhi_intensity=round(uhi_intensity, 2),
            shap_values=shap_list,
            top_heating_factor=top_heating[0],
            top_cooling_factor=top_cooling[0],
            model_used=model_name,
            explanation_method=explanation_method,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Explanation error: {str(e)}")


def _analytical_fallback(request, feature_values):
    """Analytical SHAP-like decomposition as fallback."""
    features = list(feature_values.keys())
    base_val = request.baseline_temp + 2.0

    # Physics-informed contributions
    contributions = {
        "ndvi": -6.5 * (feature_values["ndvi"] - 0.25),
        "ndbi": 8.5 * (feature_values["ndbi"] - 0.45),
        "albedo": -5.0 * (feature_values["albedo"] - 0.20),
        "humidity": -0.03 * (feature_values["humidity"] - 55),
        "population_density": 0.8 * (np.log10(max(feature_values["population_density"], 100)) - 3.5),
        "building_density": 3.2 * (feature_values["building_density"] - 0.45),
        "elevation_m": -0.0065 * (feature_values["elevation_m"] - 200),
        "rainfall_mm": -0.0005 * (feature_values["rainfall_mm"] - 800),
        "aqi": 0.005 * (feature_values["aqi"] - 100),
        "green_cover_pct": -0.08 * (feature_values["green_cover_pct"] - 15),
        "water_body_pct": -0.15 * (feature_values["water_body_pct"] - 3),
        "wind_speed": -0.08 * (feature_values["wind_speed"] - 8),
    }

    shap_vals = [contributions.get(f, 0) for f in features]
    predicted = base_val + sum(shap_vals)

    return predicted, base_val, shap_vals
