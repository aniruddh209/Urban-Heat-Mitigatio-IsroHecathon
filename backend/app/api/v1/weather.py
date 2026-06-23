"""
Weather Data API — Current and historical weather for cities
"""
from fastapi import APIRouter, Query
from typing import Optional
import random
import math
from app.data.cities_data import INDIAN_CITIES, get_city_by_id

router = APIRouter()


def generate_monthly_data(city: dict) -> list:
    """Generate realistic monthly weather data for a city."""
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    base_temp = city["avg_temp"]
    base_humidity = city["humidity"]
    base_rainfall = city["rainfall_mm"] / 12

    monthly = []
    temp_pattern = [-4, -2, 2, 6, 9, 7, 3, 2, 1, -1, -3, -5]
    rain_pattern = [0.2, 0.3, 0.4, 0.5, 0.8, 2.5, 3.5, 3.2, 2.0, 1.2, 0.5, 0.2]
    humid_pattern = [-8, -6, -2, 2, 5, 12, 18, 16, 10, 2, -4, -8]

    for i, month in enumerate(months):
        temp = round(base_temp + temp_pattern[i] + random.uniform(-0.5, 0.5), 1)
        humidity = round(min(95, max(20, base_humidity + humid_pattern[i] + random.uniform(-2, 2))), 1)
        rainfall = round(max(0, base_rainfall * rain_pattern[i] + random.uniform(-5, 5)), 1)
        aqi = round(max(20, city["aqi"] + random.uniform(-30, 30) + (20 if i in [10, 11, 0] else -15 if i in [6, 7, 8] else 0)))

        monthly.append({
            "month": month,
            "month_num": i + 1,
            "avg_temp": temp,
            "max_temp": round(temp + 8 + random.uniform(0, 3), 1),
            "min_temp": round(temp - 6 + random.uniform(-2, 0), 1),
            "humidity": humidity,
            "rainfall_mm": rainfall,
            "aqi": aqi,
            "wind_speed_kmh": round(8 + random.uniform(-3, 8) + (5 if i in [5, 6] else 0), 1),
            "uv_index": round(min(12, max(3, 7 + math.sin(math.pi * (i - 2) / 6) * 4 + random.uniform(-0.5, 0.5))), 1),
        })
    return monthly


def generate_yearly_trend(city: dict) -> list:
    """Generate 10-year temperature trend."""
    trend = []
    base = city["avg_temp"] - 1.5
    for year in range(2015, 2026):
        warming = (year - 2015) * 0.15 + random.uniform(-0.2, 0.2)
        trend.append({
            "year": year,
            "avg_temp": round(base + warming, 1),
            "max_temp": round(city["max_temp"] - 2 + warming + random.uniform(-1, 1), 1),
            "aqi": round(max(30, city["aqi"] - 20 + (year - 2015) * 5 + random.uniform(-10, 10))),
            "green_cover_pct": round(max(3, city["green_cover_pct"] + 2 - (year - 2015) * 0.3 + random.uniform(-0.5, 0.5)), 1),
            "uhi_intensity": round(max(0.2, city["uhi_intensity"] - 0.5 + (year - 2015) * 0.08 + random.uniform(-0.1, 0.1)), 1),
        })
    return trend


@router.get("/current/{city_id}")
async def get_current_weather(city_id: str):
    """Get current weather conditions for a city."""
    city = get_city_by_id(city_id)
    if not city:
        return {"error": "City not found"}

    return {
        "city": city["name"],
        "state": city["state"],
        "temperature": round(city["avg_temp"] + random.uniform(-2, 5), 1),
        "feels_like": round(city["avg_temp"] + random.uniform(0, 8), 1),
        "humidity": city["humidity"],
        "wind_speed_kmh": round(8 + random.uniform(-3, 12), 1),
        "wind_direction": random.choice(["N", "NE", "E", "SE", "S", "SW", "W", "NW"]),
        "aqi": city["aqi"] + random.randint(-20, 20),
        "uv_index": round(random.uniform(5, 11), 1),
        "visibility_km": round(random.uniform(2, 10), 1),
        "pressure_hpa": round(1013 + random.uniform(-10, 10), 1),
        "lst": city["lst"],
        "conditions": random.choice(["Clear", "Partly Cloudy", "Hazy", "Sunny", "Hot"]),
    }


@router.get("/monthly/{city_id}")
async def get_monthly_weather(city_id: str):
    """Get monthly weather data for a city."""
    city = get_city_by_id(city_id)
    if not city:
        return {"error": "City not found"}
    random.seed(hash(city_id))
    return {"city": city["name"], "monthly_data": generate_monthly_data(city)}


@router.get("/yearly-trend/{city_id}")
async def get_yearly_trend(city_id: str):
    """Get yearly trend data (10 years)."""
    city = get_city_by_id(city_id)
    if not city:
        return {"error": "City not found"}
    random.seed(hash(city_id + "yearly"))
    return {"city": city["name"], "yearly_trend": generate_yearly_trend(city)}


@router.get("/heatwave-status")
async def heatwave_status():
    """Get current heatwave status across India."""
    random.seed(42)
    active_alerts = []
    for city in INDIAN_CITIES:
        if city["lst"] > 42:
            severity = "Extreme" if city["lst"] > 45 else "Severe" if city["lst"] > 43 else "Moderate"
            active_alerts.append({
                "city": city["name"],
                "state": city["state"],
                "lst": city["lst"],
                "severity": severity,
                "population_at_risk": round(city["population"] * random.uniform(0.2, 0.5)),
                "advisory": f"Extreme heat advisory for {city['name']}. Stay indoors between 11 AM - 4 PM.",
            })

    return {
        "total_alerts": len(active_alerts),
        "alerts": sorted(active_alerts, key=lambda x: x["lst"], reverse=True),
    }
