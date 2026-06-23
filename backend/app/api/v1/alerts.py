"""
Alerts API — Emergency heatwave alerts and risk notifications
"""
from fastapi import APIRouter
from app.data.cities_data import INDIAN_CITIES
import random

router = APIRouter()


@router.get("/active")
async def active_alerts():
    """Get all active heatwave and risk alerts."""
    random.seed(42)
    alerts = []
    for city in INDIAN_CITIES:
        if city["lst"] > 40:
            severity = "Extreme" if city["lst"] > 45 else "Severe" if city["lst"] > 43 else "High" if city["lst"] > 41 else "Moderate"
            color = "red" if severity in ["Extreme", "Severe"] else "orange" if severity == "High" else "yellow"
            alerts.append({
                "id": f"alert_{city['id']}",
                "city": city["name"],
                "state": city["state"],
                "type": "Heatwave" if city["lst"] > 43 else "Heat Advisory",
                "severity": severity,
                "color": color,
                "lst": city["lst"],
                "uhi_intensity": city["uhi_intensity"],
                "population_at_risk": round(city["population"] * (0.5 if severity == "Extreme" else 0.3 if severity == "Severe" else 0.2)),
                "hospitals_at_risk": round(city["population"] / 100000 * random.uniform(2, 5)),
                "schools_at_risk": round(city["population"] / 50000 * random.uniform(3, 8)),
                "senior_citizens_at_risk": round(city["population"] * 0.08 * (0.6 if severity == "Extreme" else 0.3)),
                "advisory": f"Heat {'emergency' if severity == 'Extreme' else 'warning' if severity == 'Severe' else 'advisory'} for {city['name']}. "
                           f"{'Avoid outdoor activities. Emergency services on high alert.' if severity in ['Extreme', 'Severe'] else 'Limit outdoor activities between 11 AM - 4 PM.'}",
                "recommendations": [
                    "Stay hydrated — drink water every 30 minutes",
                    "Avoid direct sun exposure between 11 AM and 4 PM",
                    "Wear light-colored, loose-fitting clothing",
                    "Check on elderly neighbors and vulnerable populations",
                    "Keep emergency numbers handy",
                ],
                "timestamp": "2026-06-13T12:00:00Z",
            })

    return {
        "total_alerts": len(alerts),
        "extreme_count": len([a for a in alerts if a["severity"] == "Extreme"]),
        "severe_count": len([a for a in alerts if a["severity"] == "Severe"]),
        "alerts": sorted(alerts, key=lambda x: x["lst"], reverse=True),
    }


@router.get("/history")
async def alert_history():
    """Get historical alert data."""
    random.seed(42)
    months = ["Jan 2026", "Feb 2026", "Mar 2026", "Apr 2026", "May 2026", "Jun 2026"]
    return {
        "history": [
            {"month": m, "total_alerts": round(5 + i * 8 + random.uniform(-3, 5)), "extreme": round(1 + i * 2 + random.uniform(-1, 2)), "cities_affected": round(3 + i * 5)}
            for i, m in enumerate(months)
        ]
    }
