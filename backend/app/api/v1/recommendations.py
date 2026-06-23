"""
Recommendations API — Smart recommendations for cooling and urban planning
"""
from fastapi import APIRouter
from app.data.cities_data import get_city_by_id

router = APIRouter()


@router.get("/{city_id}")
async def get_recommendations(city_id: str):
    """Get smart recommendations for a city."""
    city = get_city_by_id(city_id)
    if not city:
        return {"error": "City not found"}

    recommendations = {
        "city": city["name"],
        "overall_priority": city["vulnerability"],
        "categories": [
            {
                "name": "Roof Cooling Plan",
                "icon": "🏠",
                "priority": "High" if city["lst"] > 40 else "Medium",
                "actions": [
                    {"action": "Cool roof coating on government buildings", "impact": "0.3-0.5°C reduction", "cost": "₹500/sq.m", "timeline": "3-6 months"},
                    {"action": "White/reflective roof mandate for new constructions", "impact": "0.5-1.0°C reduction", "cost": "Policy change", "timeline": "Immediate"},
                    {"action": "Green roof installations on commercial buildings", "impact": "2-3°C local cooling", "cost": "₹2000/sq.m", "timeline": "1-2 years"},
                ],
            },
            {
                "name": "Urban Forest Plan",
                "icon": "🌳",
                "priority": "Critical" if city["green_cover_pct"] < 15 else "High" if city["green_cover_pct"] < 25 else "Medium",
                "actions": [
                    {"action": f"Plant {round(city['area_km2'] * 200):,} trees in hotspot zones", "impact": f"{round(city['uhi_intensity'] * 0.2, 1)}°C reduction", "cost": f"₹{round(city['area_km2'] * 200 * 150 / 10000000, 1)} Cr", "timeline": "1-3 years"},
                    {"action": "Establish Miyawaki forests in vacant lots", "impact": "3-5°C local cooling", "cost": f"₹{round(city['area_km2'] * 0.05, 1)} Cr", "timeline": "2-5 years"},
                    {"action": "Tree-lined avenue program for major roads", "impact": "1-2°C corridor cooling", "cost": f"₹{round(city['area_km2'] * 0.03, 1)} Cr", "timeline": "1-2 years"},
                ],
            },
            {
                "name": "Green Corridor Plan",
                "icon": "🛤️",
                "priority": "High",
                "actions": [
                    {"action": "Connect existing parks with tree-lined walkways", "impact": "Biodiversity + cooling corridors", "cost": f"₹{round(city['area_km2'] * 0.08, 1)} Cr", "timeline": "2-4 years"},
                    {"action": "Railway and highway green buffer zones", "impact": "1.5°C corridor effect", "cost": f"₹{round(city['area_km2'] * 0.04, 1)} Cr", "timeline": "1-3 years"},
                ],
            },
            {
                "name": "Water Body Restoration",
                "icon": "💧",
                "priority": "Critical" if city["water_body_pct"] < 2 else "Medium",
                "actions": [
                    {"action": "Restore historical tanks and ponds", "impact": "0.5-1°C micro-cooling", "cost": f"₹{round(city['area_km2'] * 0.12, 1)} Cr", "timeline": "1-3 years"},
                    {"action": "Rainwater harvesting network", "impact": "Ground temperature reduction", "cost": f"₹{round(city['area_km2'] * 0.06, 1)} Cr", "timeline": "1-2 years"},
                    {"action": "Public fountain and water feature installations", "impact": "2-3°C local cooling", "cost": f"₹{round(city['area_km2'] * 0.03, 1)} Cr", "timeline": "6-12 months"},
                ],
            },
            {
                "name": "Road Material Upgrade",
                "icon": "🛣️",
                "priority": "Medium",
                "actions": [
                    {"action": "Reflective/cool pavement on arterial roads", "impact": "0.3-0.5°C reduction", "cost": "₹800/sq.m", "timeline": "1-3 years"},
                    {"action": "Permeable pavement in residential areas", "impact": "Reduces runoff heat", "cost": "₹1200/sq.m", "timeline": "2-5 years"},
                ],
            },
            {
                "name": "Government Policy",
                "icon": "📜",
                "priority": "Critical",
                "actions": [
                    {"action": "Mandatory green building code", "impact": "Systemic long-term cooling", "cost": "Policy", "timeline": "6 months"},
                    {"action": "Heat action plan with alert systems", "impact": "Reduced heat mortality", "cost": f"₹{round(city['population'] / 10000000, 1)} Cr", "timeline": "3 months"},
                    {"action": "Urban tree protection ordinance", "impact": "Preserve existing canopy", "cost": "Policy", "timeline": "Immediate"},
                    {"action": "Solar incentive program", "impact": "Reduced energy + heat", "cost": f"₹{round(city['area_km2'] * 0.15, 1)} Cr", "timeline": "1-2 years"},
                ],
            },
        ],
    }

    return recommendations
