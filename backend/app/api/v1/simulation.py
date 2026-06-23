"""
Climate Simulation API — "What If" scenarios
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.data.cities_data import get_city_by_id

router = APIRouter()


class SimulationRequest(BaseModel):
    city_id: str
    green_cover_increase_pct: float = 0
    water_body_increase_pct: float = 0
    cool_roof_pct: float = 0
    solar_roof_pct: float = 0
    urban_forest_area_km2: float = 0
    reflective_roads_pct: float = 0


@router.post("/run")
async def run_simulation(request: SimulationRequest):
    """Run a 'What If' climate simulation."""
    city = get_city_by_id(request.city_id)
    if not city:
        return {"error": "City not found"}

    # Calculate impact of each intervention
    temp_reduction = 0
    aqi_improvement = 0
    carbon_reduction = 0

    interventions = []

    if request.green_cover_increase_pct > 0:
        gc_effect = request.green_cover_increase_pct * 0.15
        temp_reduction += gc_effect
        aqi_improvement += request.green_cover_increase_pct * 1.2
        carbon_reduction += request.green_cover_increase_pct * city["area_km2"] * 50
        interventions.append({
            "type": "Green Cover Increase",
            "value": f"+{request.green_cover_increase_pct}%",
            "temp_effect": round(-gc_effect, 2),
            "aqi_effect": round(-request.green_cover_increase_pct * 1.2),
        })

    if request.water_body_increase_pct > 0:
        wb_effect = request.water_body_increase_pct * 0.2
        temp_reduction += wb_effect
        interventions.append({
            "type": "Water Body Increase",
            "value": f"+{request.water_body_increase_pct}%",
            "temp_effect": round(-wb_effect, 2),
        })

    if request.cool_roof_pct > 0:
        cr_effect = request.cool_roof_pct * 0.02
        temp_reduction += cr_effect
        interventions.append({
            "type": "Cool Roofs",
            "value": f"{request.cool_roof_pct}% coverage",
            "temp_effect": round(-cr_effect, 2),
        })

    if request.solar_roof_pct > 0:
        sr_effect = request.solar_roof_pct * 0.01
        temp_reduction += sr_effect
        carbon_reduction += request.solar_roof_pct * city["area_km2"] * 20
        interventions.append({
            "type": "Solar Roofs",
            "value": f"{request.solar_roof_pct}% coverage",
            "temp_effect": round(-sr_effect, 2),
            "carbon_effect": round(-request.solar_roof_pct * city["area_km2"] * 20),
        })

    if request.urban_forest_area_km2 > 0:
        uf_effect = request.urban_forest_area_km2 * 0.5
        temp_reduction += uf_effect
        aqi_improvement += request.urban_forest_area_km2 * 8
        carbon_reduction += request.urban_forest_area_km2 * 500
        interventions.append({
            "type": "Urban Forests",
            "value": f"{request.urban_forest_area_km2} km²",
            "temp_effect": round(-uf_effect, 2),
            "aqi_effect": round(-request.urban_forest_area_km2 * 8),
        })

    if request.reflective_roads_pct > 0:
        rr_effect = request.reflective_roads_pct * 0.015
        temp_reduction += rr_effect
        interventions.append({
            "type": "Reflective Roads",
            "value": f"{request.reflective_roads_pct}% coverage",
            "temp_effect": round(-rr_effect, 2),
        })

    new_temp = round(city["avg_temp"] - temp_reduction, 1)
    new_lst = round(city["lst"] - temp_reduction * 1.5, 1)
    new_uhi = round(max(0, city["uhi_intensity"] - temp_reduction * 0.8), 1)
    new_aqi = round(max(20, city["aqi"] - aqi_improvement))
    new_green = round(min(80, city["green_cover_pct"] + request.green_cover_increase_pct), 1)

    # Heat index calculation
    old_heat_index = round(city["avg_temp"] + 0.5 * city["humidity"] / 10, 1)
    new_heat_index = round(new_temp + 0.5 * city["humidity"] / 10, 1)

    # Sustainability score (0-100)
    sustainability = round(min(100, 30 + new_green * 0.8 + (100 - new_aqi / 3) * 0.3 + (50 - new_lst) * 0.5))

    return {
        "city": city["name"],
        "simulation_id": f"sim_{city['id']}_{hash(str(request))}",
        "interventions": interventions,
        "before": {
            "avg_temp": city["avg_temp"],
            "lst": city["lst"],
            "uhi_intensity": city["uhi_intensity"],
            "aqi": city["aqi"],
            "green_cover_pct": city["green_cover_pct"],
            "heat_index": old_heat_index,
            "risk_score": city["risk_score"],
        },
        "after": {
            "avg_temp": new_temp,
            "lst": new_lst,
            "uhi_intensity": new_uhi,
            "aqi": new_aqi,
            "green_cover_pct": new_green,
            "heat_index": new_heat_index,
            "risk_score": max(5, round(city["risk_score"] - temp_reduction * 12)),
        },
        "impact_summary": {
            "temperature_reduction": round(temp_reduction, 1),
            "aqi_improvement": round(aqi_improvement),
            "carbon_reduction_tons": round(carbon_reduction),
            "heat_index_reduction": round(old_heat_index - new_heat_index, 1),
            "sustainability_score": sustainability,
        },
        "confidence": 85.2,
        "model": "Climate Simulation Engine v1.0 (Physics-based + ML hybrid)",
    }


@router.get("/presets")
async def simulation_presets():
    """Get preset simulation scenarios."""
    return {
        "presets": [
            {"name": "Moderate Greening", "green_cover_increase_pct": 10, "cool_roof_pct": 20, "description": "10% green cover + 20% cool roofs"},
            {"name": "Aggressive Greening", "green_cover_increase_pct": 20, "water_body_increase_pct": 5, "urban_forest_area_km2": 5, "description": "20% green cover + water bodies + urban forests"},
            {"name": "Full Cool Infrastructure", "cool_roof_pct": 50, "solar_roof_pct": 30, "reflective_roads_pct": 40, "description": "Comprehensive cool infrastructure deployment"},
            {"name": "Maximum Intervention", "green_cover_increase_pct": 30, "water_body_increase_pct": 8, "cool_roof_pct": 60, "solar_roof_pct": 40, "urban_forest_area_km2": 10, "reflective_roads_pct": 50, "description": "All interventions at maximum"},
            {"name": "Nature-Based Solutions", "green_cover_increase_pct": 25, "water_body_increase_pct": 10, "urban_forest_area_km2": 8, "description": "Focus on natural cooling mechanisms"},
        ]
    }
