"""
UrbanHeat AI — API v1 Router
Aggregates all API endpoint modules.
"""
from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.cities import router as cities_router
from app.api.v1.weather import router as weather_router
from app.api.v1.predictions import router as predictions_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.maps import router as maps_router
from app.api.v1.reports import router as reports_router
from app.api.v1.simulation import router as simulation_router
from app.api.v1.assistant import router as assistant_router
from app.api.v1.alerts import router as alerts_router
from app.api.v1.recommendations import router as recommendations_router
from app.api.v1.admin import router as admin_router

router = APIRouter()

router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
router.include_router(cities_router, prefix="/cities", tags=["Cities"])
router.include_router(weather_router, prefix="/weather", tags=["Weather Data"])
router.include_router(predictions_router, prefix="/predictions", tags=["AI Predictions"])
router.include_router(analytics_router, prefix="/analytics", tags=["Analytics"])
router.include_router(maps_router, prefix="/maps", tags=["Map Data"])
router.include_router(reports_router, prefix="/reports", tags=["Reports"])
router.include_router(simulation_router, prefix="/simulation", tags=["Climate Simulation"])
router.include_router(assistant_router, prefix="/assistant", tags=["AI Assistant"])
router.include_router(alerts_router, prefix="/alerts", tags=["Alerts"])
router.include_router(recommendations_router, prefix="/recommendations", tags=["Recommendations"])
router.include_router(admin_router, prefix="/admin", tags=["Admin"])
