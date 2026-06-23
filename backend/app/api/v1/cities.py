"""
Cities API — CRUD and search for Indian cities climate data
"""
from fastapi import APIRouter, Query
from typing import Optional
from app.data.cities_data import INDIAN_CITIES, get_city_by_id, get_city_by_name, get_cities_by_state, get_top_risk_cities, get_vulnerability_summary

router = APIRouter()


@router.get("/")
async def list_cities(
    state: Optional[str] = None,
    vulnerability: Optional[str] = None,
    sort_by: str = Query("risk_score", enum=["risk_score", "name", "population", "avg_temp", "aqi", "uhi_intensity"]),
    order: str = Query("desc", enum=["asc", "desc"]),
    limit: int = Query(100, le=200),
    offset: int = 0,
):
    """List cities with optional filtering and sorting."""
    cities = INDIAN_CITIES.copy()

    if state:
        cities = [c for c in cities if c["state"].lower() == state.lower()]
    if vulnerability:
        cities = [c for c in cities if c["vulnerability"].lower() == vulnerability.lower()]

    reverse = order == "desc"
    cities.sort(key=lambda x: x.get(sort_by, 0), reverse=reverse)

    total = len(cities)
    cities = cities[offset:offset + limit]

    return {"total": total, "cities": cities, "limit": limit, "offset": offset}


@router.get("/search")
async def search_cities(q: str = Query(..., min_length=2)):
    """Search cities by name."""
    results = [c for c in INDIAN_CITIES if q.lower() in c["name"].lower()]
    return {"results": results, "count": len(results)}


@router.get("/top-risk")
async def top_risk_cities(n: int = Query(20, le=100)):
    """Get top N cities by risk score."""
    return {"cities": get_top_risk_cities(n)}


@router.get("/vulnerability-summary")
async def vulnerability_summary():
    """Get vulnerability level distribution."""
    summary = get_vulnerability_summary()
    return {
        "summary": summary,
        "total_cities": len(INDIAN_CITIES),
        "critical_count": summary.get("Critical", 0),
        "high_count": summary.get("High", 0),
    }


@router.get("/states")
async def list_states():
    """Get all unique states."""
    states = sorted(set(c["state"] for c in INDIAN_CITIES))
    state_data = []
    for state in states:
        state_cities = get_cities_by_state(state)
        avg_risk = sum(c["risk_score"] for c in state_cities) / len(state_cities)
        state_data.append({
            "name": state,
            "city_count": len(state_cities),
            "avg_risk_score": round(avg_risk, 1),
        })
    return {"states": state_data}


@router.get("/{city_id}")
async def get_city(city_id: str):
    """Get detailed city information."""
    city = get_city_by_id(city_id)
    if not city:
        return {"error": "City not found"}, 404
    return {"city": city}
