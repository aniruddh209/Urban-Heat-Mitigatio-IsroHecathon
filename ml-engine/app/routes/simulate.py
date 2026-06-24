# pyrefly: ignore [missing-import]
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List
import numpy as np
import os
import json

router = APIRouter()

# ─── Model Loading ─────────────────────────────────────────────
from app.config import MODEL_DIR
_model = None
_scaler = None
_feature_names = None


def _load_model():
    """Lazy-load trained model for simulation predictions."""
    global _model, _scaler, _feature_names
    if _model is not None:
        return
    try:
        import joblib
        model_path = os.path.join(MODEL_DIR, "best_model.joblib")
        scaler_path = os.path.join(MODEL_DIR, "scaler.joblib")
        features_path = os.path.join(MODEL_DIR, "feature_names.json")
        if os.path.exists(model_path):
            _model = joblib.load(model_path)
        if os.path.exists(scaler_path):
            _scaler = joblib.load(scaler_path)
        if os.path.exists(features_path):
            with open(features_path, "r") as f:
                _feature_names = json.load(f)
    except Exception as e:
        print(f"[ML] Could not load model for simulation: {e}")


# ─── Intervention Effects Database ─────────────────────────────
# Based on peer-reviewed climate research
INTERVENTION_EFFECTS = {
    "green_roof": {
        "label": "Green Roofs",
        "ndvi_delta": 0.12,
        "albedo_delta": 0.05,
        "building_density_delta": 0.0,
        "green_cover_delta": 3.0,
        "cost_per_unit_crore": 2.5,  # per 10% coverage
        "sustainability_score": 85,
    },
    "cool_pavement": {
        "label": "Cool Pavements",
        "ndvi_delta": 0.0,
        "albedo_delta": 0.20,
        "building_density_delta": 0.0,
        "green_cover_delta": 0.0,
        "cost_per_unit_crore": 1.5,
        "sustainability_score": 70,
    },
    "urban_forestry": {
        "label": "Urban Forestry",
        "ndvi_delta": 0.25,
        "albedo_delta": 0.02,
        "building_density_delta": -0.05,
        "green_cover_delta": 8.0,
        "cost_per_unit_crore": 3.0,
        "sustainability_score": 95,
    },
    "reflective_roof": {
        "label": "Reflective Roofs",
        "ndvi_delta": 0.0,
        "albedo_delta": 0.30,
        "building_density_delta": 0.0,
        "green_cover_delta": 0.0,
        "cost_per_unit_crore": 1.2,
        "sustainability_score": 65,
    },
    "water_bodies": {
        "label": "Water Bodies",
        "ndvi_delta": 0.03,
        "albedo_delta": 0.02,
        "building_density_delta": -0.02,
        "green_cover_delta": 1.0,
        "water_body_delta": 2.0,
        "cost_per_unit_crore": 5.0,
        "sustainability_score": 90,
    },
    "tree_plantation": {
        "label": "Tree Plantation",
        "ndvi_delta": 0.18,
        "albedo_delta": 0.01,
        "building_density_delta": 0.0,
        "green_cover_delta": 5.0,
        "cost_per_unit_crore": 0.8,
        "sustainability_score": 92,
    },
}


# ─── Request / Response ────────────────────────────────────────
class Intervention(BaseModel):
    type: str = Field(..., description="Intervention type")
    coverage_ratio: float = Field(..., description="Coverage ratio 0.0 to 1.0", ge=0.0, le=1.0)


class SimulationRequest(BaseModel):
    current_lst: float = Field(..., description="Current LST in Celsius")
    baseline_albedo: float = Field(0.18, description="Current albedo")
    baseline_ndvi: float = Field(0.20, description="Current NDVI")
    baseline_humidity: float = Field(55.0, description="Current humidity")
    baseline_building_density: float = Field(0.65, description="Current building density")
    baseline_green_cover: float = Field(15.0, description="Current green cover %")
    baseline_water_body: float = Field(3.0, description="Current water body %")
    population_density: float = Field(5000.0, description="Population per sq km")
    elevation_m: float = Field(200.0, description="Elevation")
    rainfall_mm: float = Field(800.0, description="Annual rainfall")
    aqi: float = Field(100.0, description="AQI")
    wind_speed: float = Field(8.0, description="Wind speed")
    interventions: List[Intervention] = Field(..., description="List of interventions")


class InterventionResult(BaseModel):
    type: str
    label: str
    coverage_ratio: float
    temperature_drop: float
    cost_crores: float
    sustainability_score: int


class SimulationResult(BaseModel):
    before_lst: float
    after_lst: float
    temperature_drop: float
    before_ndvi: float
    after_ndvi: float
    before_albedo: float
    after_albedo: float
    effectiveness_score: float
    total_cost_crores: float
    avg_sustainability_score: float
    interventions: List[InterventionResult]
    model_used: str


@router.post("/", response_model=SimulationResult)
async def simulate_cooling(request: SimulationRequest):
    try:
        _load_model()

        # Start with baseline features
        ndvi = request.baseline_ndvi
        ndbi = 1.0 - ndvi  # Simplified inverse
        albedo = request.baseline_albedo
        building_density = request.baseline_building_density
        green_cover = request.baseline_green_cover
        water_body = request.baseline_water_body

        intervention_results = []
        total_cost = 0.0
        sustainability_scores = []

        # Apply each intervention's effects
        for intervention in request.interventions:
            effects = INTERVENTION_EFFECTS.get(intervention.type)
            if not effects:
                continue

            cov = intervention.coverage_ratio
            ndvi += effects["ndvi_delta"] * cov
            albedo += effects["albedo_delta"] * cov
            building_density += effects.get("building_density_delta", 0) * cov
            green_cover += effects["green_cover_delta"] * cov
            water_body += effects.get("water_body_delta", 0) * cov
            cost = effects["cost_per_unit_crore"] * cov * 10
            total_cost += cost
            sustainability_scores.append(effects["sustainability_score"])

            intervention_results.append(InterventionResult(
                type=intervention.type,
                label=effects["label"],
                coverage_ratio=cov,
                temperature_drop=0.0,  # Will be filled after prediction
                cost_crores=round(cost, 2),
                sustainability_score=effects["sustainability_score"],
            ))

        # Clamp values
        ndvi = np.clip(ndvi, 0.01, 0.85)
        ndbi = np.clip(1.0 - ndvi * 0.8, 0.1, 0.95)
        albedo = np.clip(albedo, 0.05, 0.6)
        building_density = np.clip(building_density, 0.05, 0.98)
        green_cover = np.clip(green_cover, 1, 80)
        water_body = np.clip(water_body, 0, 30)

        model_used = "Physics-Based"

        if _model is not None and _scaler is not None and _feature_names is not None:
            # Use trained model to predict new LST
            feature_values = {
                "ndvi": ndvi,
                "ndbi": ndbi,
                "albedo": albedo,
                "humidity": request.baseline_humidity,
                "population_density": request.population_density,
                "building_density": building_density,
                "elevation_m": request.elevation_m,
                "rainfall_mm": request.rainfall_mm,
                "aqi": request.aqi,
                "green_cover_pct": green_cover,
                "water_body_pct": water_body,
                "wind_speed": request.wind_speed,
            }
            X = np.array([[feature_values[f] for f in _feature_names]])
            X_scaled = _scaler.transform(X)
            new_lst = float(_model.predict(X_scaled)[0])
            model_used = "Trained ML Model"
        else:
            # Physics-based fallback
            temp_drop = 0.0
            for intervention in request.interventions:
                effects = INTERVENTION_EFFECTS.get(intervention.type)
                if not effects:
                    continue
                cov = intervention.coverage_ratio
                # Approximate cooling from feature changes
                temp_drop += effects["ndvi_delta"] * cov * 6.5
                temp_drop += effects["albedo_delta"] * cov * 5.0
                temp_drop += effects["green_cover_delta"] * cov * 0.08
                temp_drop += effects.get("water_body_delta", 0) * cov * 0.15
            new_lst = max(18.0, request.current_lst - temp_drop)

        temp_drop = request.current_lst - new_lst
        effectiveness = min(100.0, max(0.0, (temp_drop / 6.0) * 100.0))

        # Distribute temp drop across interventions proportionally
        if intervention_results and temp_drop > 0:
            total_effects = sum(
                INTERVENTION_EFFECTS.get(ir.type, {}).get("ndvi_delta", 0) * ir.coverage_ratio +
                INTERVENTION_EFFECTS.get(ir.type, {}).get("albedo_delta", 0) * ir.coverage_ratio
                for ir in intervention_results
            ) or 1.0
            for ir in intervention_results:
                eff = INTERVENTION_EFFECTS.get(ir.type, {})
                proportion = (eff.get("ndvi_delta", 0) * ir.coverage_ratio + eff.get("albedo_delta", 0) * ir.coverage_ratio) / total_effects
                ir.temperature_drop = round(temp_drop * proportion, 2)

        return SimulationResult(
            before_lst=round(request.current_lst, 2),
            after_lst=round(new_lst, 2),
            temperature_drop=round(temp_drop, 2),
            before_ndvi=round(request.baseline_ndvi, 4),
            after_ndvi=round(float(ndvi), 4),
            before_albedo=round(request.baseline_albedo, 4),
            after_albedo=round(float(albedo), 4),
            effectiveness_score=round(effectiveness, 1),
            total_cost_crores=round(total_cost, 2),
            avg_sustainability_score=round(float(np.mean(sustainability_scores)) if sustainability_scores else 0.0, 1),
            interventions=intervention_results,
            model_used=model_used,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation error: {str(e)}")
