"""
Reports API — Generate downloadable reports in multiple formats
"""
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from app.data.cities_data import get_city_by_id, INDIAN_CITIES

router = APIRouter()


@router.get("/generate/{city_id}")
async def generate_report(city_id: str, report_type: str = "comprehensive"):
    """Generate a report for a city."""
    city = get_city_by_id(city_id)
    if not city:
        return {"error": "City not found"}

    report = {
        "report_id": f"RPT-{city_id}-2026",
        "title": f"Urban Heat Island Analysis Report — {city['name']}",
        "type": report_type,
        "generated_at": "2026-06-13T12:00:00Z",
        "organization": "UrbanHeat AI — ISRO BAH 2026",
        "executive_summary": f"{city['name']} ({city['state']}) exhibits a UHI intensity of {city['uhi_intensity']}°C "
                            f"with a risk score of {city['risk_score']}/100 (Vulnerability: {city['vulnerability']}). "
                            f"The city's {city['built_up_pct']}% built-up area and only {city['green_cover_pct']}% green cover "
                            f"contribute significantly to urban heat accumulation.",
        "city_profile": {
            "name": city["name"],
            "state": city["state"],
            "population": city["population"],
            "area_km2": city["area_km2"],
            "coordinates": {"lat": city["lat"], "lng": city["lng"]},
        },
        "climate_analysis": {
            "avg_temperature": city["avg_temp"],
            "max_temperature": city["max_temp"],
            "min_temperature": city["min_temp"],
            "humidity": city["humidity"],
            "rainfall_mm": city["rainfall_mm"],
            "aqi": city["aqi"],
        },
        "satellite_analysis": {
            "ndvi": city["ndvi"],
            "ndbi": city["ndbi"],
            "lst": city["lst"],
            "green_cover_pct": city["green_cover_pct"],
            "water_body_pct": city["water_body_pct"],
            "built_up_pct": city["built_up_pct"],
        },
        "uhi_assessment": {
            "uhi_intensity": city["uhi_intensity"],
            "risk_score": city["risk_score"],
            "vulnerability": city["vulnerability"],
        },
        "recommendations_count": 6,
        "download_formats": ["pdf", "csv", "xlsx", "json"],
    }

    return report


@router.get("/templates")
async def report_templates():
    """Get available report templates."""
    return {
        "templates": [
            {"id": "govt_summary", "name": "Government Summary Report", "description": "Concise policy-ready report for government officials", "pages": 5},
            {"id": "research", "name": "Research Analysis Report", "description": "Detailed scientific analysis with methodology", "pages": 20},
            {"id": "planner", "name": "Urban Planner Report", "description": "Actionable plans with budget estimates and timelines", "pages": 12},
            {"id": "comprehensive", "name": "Comprehensive AI Report", "description": "Full analysis with AI predictions and explanations", "pages": 30},
        ]
    }


@router.get("/bulk-summary")
async def bulk_summary():
    """Generate a summary report for all cities."""
    critical = [c for c in INDIAN_CITIES if c["vulnerability"] == "Critical"]
    return {
        "title": "National Urban Heat Island Assessment — India 2026",
        "total_cities": len(INDIAN_CITIES),
        "critical_cities": len(critical),
        "top_10_hottest": sorted(INDIAN_CITIES, key=lambda x: x["lst"], reverse=True)[:10],
        "top_10_cleanest": sorted(INDIAN_CITIES, key=lambda x: x["aqi"])[:10],
        "top_10_greenest": sorted(INDIAN_CITIES, key=lambda x: x["green_cover_pct"], reverse=True)[:10],
    }
