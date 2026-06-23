"""
Map Data API — GeoJSON, heat layers, map tile data
"""
from fastapi import APIRouter
from app.data.cities_data import INDIAN_CITIES

router = APIRouter()


@router.get("/cities-geojson")
async def cities_geojson():
    """Get cities as GeoJSON for map rendering."""
    features = []
    for city in INDIAN_CITIES:
        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [city["lng"], city["lat"]]},
            "properties": {
                "id": city["id"],
                "name": city["name"],
                "state": city["state"],
                "population": city["population"],
                "risk_score": city["risk_score"],
                "vulnerability": city["vulnerability"],
                "uhi_intensity": city["uhi_intensity"],
                "lst": city["lst"],
                "aqi": city["aqi"],
                "ndvi": city["ndvi"],
                "green_cover_pct": city["green_cover_pct"],
                "humidity": city["humidity"],
                "rainfall_mm": city["rainfall_mm"],
                "avg_temp": city["avg_temp"],
            },
        })
    return {"type": "FeatureCollection", "features": features}


@router.get("/heat-layer")
async def heat_layer():
    """Get heat intensity data for map layer."""
    points = []
    for city in INDIAN_CITIES:
        intensity = min(1.0, city["lst"] / 50)
        points.append({
            "lat": city["lat"],
            "lng": city["lng"],
            "intensity": round(intensity, 2),
            "value": city["lst"],
            "radius": max(15, min(50, city["population"] / 500000)),
        })
    return {"points": points, "layer": "heat", "unit": "°C"}


@router.get("/aqi-layer")
async def aqi_layer():
    """Get AQI data for map layer."""
    points = []
    for city in INDIAN_CITIES:
        points.append({
            "lat": city["lat"],
            "lng": city["lng"],
            "intensity": round(min(1.0, city["aqi"] / 300), 2),
            "value": city["aqi"],
            "category": "Good" if city["aqi"] < 50 else "Moderate" if city["aqi"] < 100 else "Unhealthy" if city["aqi"] < 200 else "Very Unhealthy" if city["aqi"] < 300 else "Hazardous",
        })
    return {"points": points, "layer": "aqi"}


@router.get("/vegetation-layer")
async def vegetation_layer():
    """Get vegetation (NDVI) data for map layer."""
    points = []
    for city in INDIAN_CITIES:
        points.append({
            "lat": city["lat"],
            "lng": city["lng"],
            "intensity": round(city["ndvi"], 2),
            "value": city["green_cover_pct"],
        })
    return {"points": points, "layer": "vegetation"}


@router.get("/india-boundary")
async def india_boundary():
    """Get simplified India boundary for map."""
    return {
        "type": "Feature",
        "properties": {"name": "India"},
        "geometry": {
            "type": "Polygon",
            "coordinates": [[
                [68.1, 8.0], [68.5, 23.5], [70.5, 25.5], [74.0, 31.5],
                [74.8, 34.5], [77.0, 35.5], [80.0, 33.5], [84.0, 28.5],
                [88.0, 27.5], [89.0, 26.5], [92.0, 26.5], [97.0, 28.0],
                [97.5, 25.0], [94.5, 22.0], [92.0, 21.5], [89.5, 22.0],
                [88.5, 22.0], [87.0, 21.5], [84.5, 19.0], [82.5, 17.5],
                [80.0, 15.5], [80.5, 12.5], [79.8, 10.5], [78.5, 8.5],
                [76.5, 8.0], [74.5, 10.5], [72.5, 13.0], [72.5, 18.0],
                [70.0, 22.0], [68.5, 23.5], [68.1, 8.0],
            ]],
        },
    }
