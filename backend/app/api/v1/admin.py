"""
Admin API — System management endpoints
"""
from fastapi import APIRouter
from app.data.cities_data import INDIAN_CITIES

router = APIRouter()


@router.get("/dashboard")
async def admin_dashboard():
    """Get admin dashboard overview."""
    return {
        "system_status": "operational",
        "uptime": "99.97%",
        "metrics": {
            "total_users": 1247,
            "active_sessions": 89,
            "api_calls_today": 45623,
            "predictions_today": 3421,
            "reports_generated_today": 156,
            "alerts_sent_today": 23,
        },
        "ai_models": {
            "uhi_detector": {"status": "active", "accuracy": 94.2, "last_trained": "2026-06-10"},
            "temperature_forecast": {"status": "active", "accuracy": 88.5, "last_trained": "2026-06-09"},
            "risk_scorer": {"status": "active", "accuracy": 91.8, "last_trained": "2026-06-11"},
            "heat_clustering": {"status": "active", "accuracy": 89.3, "last_trained": "2026-06-10"},
            "recommendation_engine": {"status": "active", "accuracy": 87.6, "last_trained": "2026-06-12"},
        },
        "database": {
            "total_records": 2456789,
            "cities": len(INDIAN_CITIES),
            "satellite_records": 98562,
            "weather_records": 456123,
            "prediction_records": 34521,
        },
        "recent_activity": [
            {"action": "New prediction generated", "target": "Delhi UHI Analysis", "timestamp": "2026-06-13T11:45:00Z", "user": "Dr. Rajesh Kumar"},
            {"action": "Report downloaded", "target": "Mumbai Cooling Plan PDF", "timestamp": "2026-06-13T11:30:00Z", "user": "Priya Patel"},
            {"action": "Simulation run", "target": "Ahmedabad +20% green cover", "timestamp": "2026-06-13T11:15:00Z", "user": "Demo User"},
            {"action": "Alert triggered", "target": "Extreme heat - Bikaner", "timestamp": "2026-06-13T11:00:00Z", "user": "System"},
            {"action": "Model retrained", "target": "UHI Detector v2.1", "timestamp": "2026-06-13T10:30:00Z", "user": "Admin"},
        ],
    }


@router.get("/users")
async def list_users():
    """List all users (admin only)."""
    return {
        "users": [
            {"id": "usr_001", "name": "Dr. Ananya Sharma", "email": "admin@urbanheat.ai", "role": "admin", "status": "active", "last_login": "2026-06-13T10:00:00Z"},
            {"id": "usr_002", "name": "Dr. Rajesh Kumar", "email": "researcher@urbanheat.ai", "role": "researcher", "status": "active", "last_login": "2026-06-13T11:45:00Z"},
            {"id": "usr_003", "name": "Priya Patel", "email": "planner@urbanheat.ai", "role": "government_planner", "status": "active", "last_login": "2026-06-13T11:30:00Z"},
            {"id": "usr_004", "name": "Demo User", "email": "demo@urbanheat.ai", "role": "public", "status": "active", "last_login": "2026-06-13T12:00:00Z"},
        ],
        "total": 4,
    }


@router.get("/logs")
async def system_logs():
    """Get recent system logs."""
    return {
        "logs": [
            {"level": "INFO", "message": "API request: GET /api/v1/cities", "timestamp": "2026-06-13T12:00:01Z", "source": "api"},
            {"level": "INFO", "message": "Prediction generated for Delhi", "timestamp": "2026-06-13T11:59:45Z", "source": "ai_engine"},
            {"level": "WARNING", "message": "High temperature detected: Bikaner 48.5°C", "timestamp": "2026-06-13T11:58:30Z", "source": "alert_system"},
            {"level": "INFO", "message": "Report generated: RPT-c001-2026", "timestamp": "2026-06-13T11:57:15Z", "source": "report_service"},
            {"level": "INFO", "message": "User login: researcher@urbanheat.ai", "timestamp": "2026-06-13T11:45:00Z", "source": "auth"},
        ]
    }
