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
        print(f"[ML] Could not load model for optimization: {e}")


# ─── Intervention Options ─────────────────────────────────────
INTERVENTIONS = [
    {"type": "reflective_roof", "label": "Reflective Roofs", "unit_cost_crore": 1.2, "ndvi_d": 0.0, "albedo_d": 0.30, "green_d": 0.0, "max_cov": 0.8},
    {"type": "cool_pavement", "label": "Cool Pavements", "unit_cost_crore": 1.5, "ndvi_d": 0.0, "albedo_d": 0.20, "green_d": 0.0, "max_cov": 0.6},
    {"type": "urban_forestry", "label": "Urban Forestry", "unit_cost_crore": 3.0, "ndvi_d": 0.25, "albedo_d": 0.02, "green_d": 8.0, "max_cov": 0.5},
    {"type": "green_roof", "label": "Green Roofs", "unit_cost_crore": 2.5, "ndvi_d": 0.12, "albedo_d": 0.05, "green_d": 3.0, "max_cov": 0.6},
    {"type": "tree_plantation", "label": "Tree Plantation", "unit_cost_crore": 0.8, "ndvi_d": 0.18, "albedo_d": 0.01, "green_d": 5.0, "max_cov": 0.7},
    {"type": "water_bodies", "label": "Water Bodies", "unit_cost_crore": 5.0, "ndvi_d": 0.03, "albedo_d": 0.02, "green_d": 1.0, "max_cov": 0.3},
]


# ─── Request / Response ────────────────────────────────────────
class OptimizationRequest(BaseModel):
    target_temp_reduction: float = Field(..., description="Target LST drop °C", ge=0.5, le=8.0)
    max_budget_crores: float = Field(50.0, description="Maximum budget in crores INR", ge=5.0)
    current_ndvi: float = Field(0.20, description="Current NDVI")
    current_albedo: float = Field(0.18, description="Current albedo")
    current_building_density: float = Field(0.65, description="Current building density")
    current_humidity: float = Field(55.0)
    current_green_cover: float = Field(15.0)
    current_water_body: float = Field(3.0)
    population_density: float = Field(5000.0)
    elevation_m: float = Field(200.0)
    rainfall_mm: float = Field(800.0)
    aqi: float = Field(100.0)
    wind_speed: float = Field(8.0)
    baseline_temp: float = Field(28.0)
    weight_green_cover: float = Field(0.5, description="Preference for green solutions (0-1)")
    weight_albedo: float = Field(0.5, description="Preference for reflective solutions (0-1)")


class OptimalIntervention(BaseModel):
    type: str
    label: str
    coverage_ratio: float
    estimated_cost_crores: float
    temperature_drop: float


class OptimizationResponse(BaseModel):
    feasible: bool
    total_cost_crores: float
    total_temp_reduction: float
    interventions: List[OptimalIntervention]
    recommendation_summary: str
    optimization_method: str
    iterations_run: int


def _predict_lst(ndvi, ndbi, albedo, humidity, pop_density, building_density,
                 elevation, rainfall, aqi, green_cover, water_body, wind_speed):
    """Predict LST using trained model or fallback."""
    if _model is not None and _scaler is not None and _feature_names is not None:
        feature_values = {
            "ndvi": ndvi, "ndbi": ndbi, "albedo": albedo,
            "humidity": humidity, "population_density": pop_density,
            "building_density": building_density, "elevation_m": elevation,
            "rainfall_mm": rainfall, "aqi": aqi, "green_cover_pct": green_cover,
            "water_body_pct": water_body, "wind_speed": wind_speed,
        }
        X = np.array([[feature_values[f] for f in _feature_names]])
        X_scaled = _scaler.transform(X)
        return float(_model.predict(X_scaled)[0])
    else:
        # Physics fallback
        baseline = 30.0
        return baseline + 8.5 * (ndbi - 0.35) - 6.5 * (ndvi - 0.15) - 5.0 * (albedo - 0.20) - 0.03 * (humidity - 55)


@router.post("/", response_model=OptimizationResponse)
async def optimize_strategy(request: OptimizationRequest):
    try:
        _load_model()

        # Get current LST prediction
        current_ndbi = np.clip(1.0 - request.current_ndvi * 0.8, 0.1, 0.95)
        current_lst = _predict_lst(
            request.current_ndvi, current_ndbi, request.current_albedo,
            request.current_humidity, request.population_density,
            request.current_building_density, request.elevation_m,
            request.rainfall_mm, request.aqi, request.current_green_cover,
            request.current_water_body, request.wind_speed
        )

        target_lst = current_lst - request.target_temp_reduction

        # ── Simple Genetic Algorithm ──
        rng = np.random.RandomState(42)
        pop_size = 50
        generations = 30
        n_interventions = len(INTERVENTIONS)

        # Initialize population: each individual is a vector of coverage ratios
        population = rng.uniform(0, 0.3, (pop_size, n_interventions))

        best_individual = None
        best_fitness = -np.inf
        iterations = 0

        for gen in range(generations):
            fitness_scores = []
            for individual in population:
                # Apply interventions
                ndvi = request.current_ndvi
                albedo = request.current_albedo
                green_cover = request.current_green_cover
                water_body = request.current_water_body
                building_density = request.current_building_density
                total_cost = 0.0

                for i, interv in enumerate(INTERVENTIONS):
                    cov = np.clip(individual[i], 0, interv["max_cov"])
                    individual[i] = cov
                    ndvi += interv["ndvi_d"] * cov
                    albedo += interv["albedo_d"] * cov
                    green_cover += interv["green_d"] * cov
                    total_cost += interv["unit_cost_crore"] * cov * 10

                ndvi = np.clip(ndvi, 0.01, 0.85)
                ndbi = np.clip(1.0 - ndvi * 0.8, 0.1, 0.95)
                albedo = np.clip(albedo, 0.05, 0.6)
                green_cover = np.clip(green_cover, 1, 80)
                water_body = np.clip(water_body, 0, 30)

                new_lst = _predict_lst(
                    ndvi, ndbi, albedo, request.current_humidity,
                    request.population_density, building_density,
                    request.elevation_m, request.rainfall_mm, request.aqi,
                    green_cover, water_body, request.wind_speed
                )

                temp_drop = current_lst - new_lst

                # Fitness: maximize cooling, penalize over-budget
                budget_penalty = max(0, total_cost - request.max_budget_crores) * 5.0
                target_bonus = min(temp_drop, request.target_temp_reduction) * 10.0
                green_bonus = sum(individual[i] * INTERVENTIONS[i]["ndvi_d"] for i in range(n_interventions)) * request.weight_green_cover * 5.0
                albedo_bonus = sum(individual[i] * INTERVENTIONS[i]["albedo_d"] for i in range(n_interventions)) * request.weight_albedo * 5.0

                fitness = target_bonus + green_bonus + albedo_bonus - budget_penalty - total_cost * 0.1
                fitness_scores.append(fitness)

                if fitness > best_fitness:
                    best_fitness = fitness
                    best_individual = individual.copy()

            iterations += 1

            # Selection + Crossover + Mutation
            fitness_arr = np.array(fitness_scores)
            # Tournament selection
            new_pop = []
            for _ in range(pop_size):
                i1, i2 = rng.randint(0, pop_size, 2)
                parent1 = population[i1 if fitness_arr[i1] > fitness_arr[i2] else i2]
                i3, i4 = rng.randint(0, pop_size, 2)
                parent2 = population[i3 if fitness_arr[i3] > fitness_arr[i4] else i4]

                # Crossover
                mask = rng.random(n_interventions) > 0.5
                child = np.where(mask, parent1, parent2)

                # Mutation
                if rng.random() < 0.3:
                    mut_idx = rng.randint(0, n_interventions)
                    child[mut_idx] += rng.normal(0, 0.05)
                    child[mut_idx] = np.clip(child[mut_idx], 0, INTERVENTIONS[mut_idx]["max_cov"])

                new_pop.append(child)
            population = np.array(new_pop)

        # ── Build result from best individual ──
        allocated = []
        total_cost = 0.0
        ndvi = request.current_ndvi
        albedo = request.current_albedo
        green_cover = request.current_green_cover

        for i, interv in enumerate(INTERVENTIONS):
            cov = round(float(np.clip(best_individual[i], 0, interv["max_cov"])), 3)
            if cov < 0.02:
                continue
            cost = round(interv["unit_cost_crore"] * cov * 10, 2)
            total_cost += cost
            ndvi += interv["ndvi_d"] * cov
            albedo += interv["albedo_d"] * cov
            green_cover += interv["green_d"] * cov
            allocated.append(OptimalIntervention(
                type=interv["type"],
                label=interv["label"],
                coverage_ratio=cov,
                estimated_cost_crores=cost,
                temperature_drop=0.0,
            ))

        # Predict final LST
        ndvi = np.clip(ndvi, 0.01, 0.85)
        ndbi = np.clip(1.0 - ndvi * 0.8, 0.1, 0.95)
        albedo = np.clip(albedo, 0.05, 0.6)
        green_cover = np.clip(green_cover, 1, 80)

        new_lst = _predict_lst(
            ndvi, ndbi, albedo, request.current_humidity,
            request.population_density, request.current_building_density,
            request.elevation_m, request.rainfall_mm, request.aqi,
            green_cover, request.current_water_body, request.wind_speed
        )

        total_reduction = current_lst - new_lst
        feasible = total_reduction >= request.target_temp_reduction * 0.85

        # Distribute temp drop across interventions
        if allocated and total_reduction > 0:
            total_delta = sum(
                INTERVENTIONS[next(j for j, iv in enumerate(INTERVENTIONS) if iv["type"] == a.type)]["ndvi_d"] * a.coverage_ratio +
                INTERVENTIONS[next(j for j, iv in enumerate(INTERVENTIONS) if iv["type"] == a.type)]["albedo_d"] * a.coverage_ratio
                for a in allocated
            ) or 1.0
            for a in allocated:
                idx = next(j for j, iv in enumerate(INTERVENTIONS) if iv["type"] == a.type)
                prop = (INTERVENTIONS[idx]["ndvi_d"] * a.coverage_ratio + INTERVENTIONS[idx]["albedo_d"] * a.coverage_ratio) / total_delta
                a.temperature_drop = round(total_reduction * prop, 2)

        summary = (
            f"Genetic Algorithm optimized {len(allocated)} interventions over {iterations * pop_size} evaluations. "
            f"Combining {', '.join(f'{int(a.coverage_ratio * 100)}% {a.label}' for a in allocated)} "
            f"achieves a {total_reduction:.1f}°C LST reduction within ₹{total_cost:.1f} Cr budget. "
            f"{'Target met.' if feasible else 'Partial target achieved — consider increasing budget.'}"
        )

        return OptimizationResponse(
            feasible=feasible,
            total_cost_crores=round(total_cost, 2),
            total_temp_reduction=round(total_reduction, 2),
            interventions=allocated,
            recommendation_summary=summary,
            optimization_method="Genetic Algorithm (population=50, generations=30)",
            iterations_run=iterations * pop_size,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Optimization error: {str(e)}")
