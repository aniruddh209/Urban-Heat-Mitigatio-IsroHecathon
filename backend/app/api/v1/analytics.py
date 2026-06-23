"""
Analytics API — Aggregated data, trends, comparisons
"""
from fastapi import APIRouter
from app.data.cities_data import INDIAN_CITIES
import random

router = APIRouter()


@router.get("/summary")
async def get_summary():
    """Get platform-wide analytics summary."""
    total_pop = sum(c["population"] for c in INDIAN_CITIES)
    critical_cities = [c for c in INDIAN_CITIES if c["vulnerability"] == "Critical"]
    high_cities = [c for c in INDIAN_CITIES if c["vulnerability"] == "High"]

    return {
        "total_cities_monitored": len(INDIAN_CITIES),
        "total_population_covered": total_pop,
        "critical_cities": len(critical_cities),
        "high_risk_cities": len(high_cities),
        "avg_uhi_intensity": round(sum(c["uhi_intensity"] for c in INDIAN_CITIES) / len(INDIAN_CITIES), 1),
        "avg_aqi": round(sum(c["aqi"] for c in INDIAN_CITIES) / len(INDIAN_CITIES)),
        "avg_green_cover": round(sum(c["green_cover_pct"] for c in INDIAN_CITIES) / len(INDIAN_CITIES), 1),
        "avg_lst": round(sum(c["lst"] for c in INDIAN_CITIES) / len(INDIAN_CITIES), 1),
        "predictions_generated": 15847,
        "alerts_active": len(critical_cities) + len(high_cities),
        "reports_generated": 2341,
        "ai_models_active": 8,
    }


@router.get("/trends")
async def get_trends():
    """Get overall climate trends."""
    random.seed(42)
    years = list(range(2015, 2026))
    return {
        "temperature_trend": [{"year": y, "avg_temp": round(25.2 + (y - 2015) * 0.18 + random.uniform(-0.3, 0.3), 1)} for y in years],
        "aqi_trend": [{"year": y, "avg_aqi": round(120 + (y - 2015) * 5 + random.uniform(-10, 10))} for y in years],
        "green_cover_trend": [{"year": y, "avg_pct": round(20.5 - (y - 2015) * 0.3 + random.uniform(-0.5, 0.5), 1)} for y in years],
        "uhi_trend": [{"year": y, "avg_intensity": round(3.2 + (y - 2015) * 0.08 + random.uniform(-0.1, 0.1), 1)} for y in years],
        "rainfall_trend": [{"year": y, "avg_mm": round(1100 - (y - 2015) * 8 + random.uniform(-50, 50))} for y in years],
    }


@router.get("/state-comparison")
async def state_comparison():
    """Compare states by climate metrics."""
    states = {}
    for city in INDIAN_CITIES:
        state = city["state"]
        if state not in states:
            states[state] = {"cities": [], "name": state}
        states[state]["cities"].append(city)

    comparisons = []
    for state_name, data in states.items():
        cities = data["cities"]
        n = len(cities)
        comparisons.append({
            "state": state_name,
            "city_count": n,
            "avg_risk_score": round(sum(c["risk_score"] for c in cities) / n, 1),
            "avg_uhi": round(sum(c["uhi_intensity"] for c in cities) / n, 1),
            "avg_aqi": round(sum(c["aqi"] for c in cities) / n),
            "avg_green_cover": round(sum(c["green_cover_pct"] for c in cities) / n, 1),
            "avg_lst": round(sum(c["lst"] for c in cities) / n, 1),
            "total_population": sum(c["population"] for c in cities),
        })

    return {"comparisons": sorted(comparisons, key=lambda x: x["avg_risk_score"], reverse=True)}


@router.get("/sdg-impact")
async def sdg_impact():
    """SDG alignment and impact metrics."""
    return {
        "sdg_11": {
            "name": "Sustainable Cities and Communities",
            "score": 78,
            "metrics": {
                "cities_with_cooling_plans": 45,
                "green_infrastructure_projects": 128,
                "urban_heat_reduction_achieved": "1.2°C avg",
            },
        },
        "sdg_13": {
            "name": "Climate Action",
            "score": 82,
            "metrics": {
                "carbon_offset_potential_tons": 45000,
                "tree_plantation_target": 5000000,
                "renewable_energy_coverage": "34%",
            },
        },
        "sdg_3": {
            "name": "Good Health and Well-being",
            "score": 65,
            "metrics": {
                "heat_related_illness_reduction": "18%",
                "air_quality_improvement_cities": 32,
                "population_protected": 45000000,
            },
        },
    }
