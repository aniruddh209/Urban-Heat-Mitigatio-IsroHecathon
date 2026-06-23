"""
UrbanHeat AI — Main FastAPI Application
ISRO Bharatiya Antariksh Hackathon 2026
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from app.core.config import get_settings
from app.api.v1 import router as api_v1_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    print("🛰️  UrbanHeat AI — Starting up...")
    print(f"📡 Version: {settings.APP_VERSION}")
    print(f"🌍 Debug mode: {settings.DEBUG}")
    yield
    print("🛰️  UrbanHeat AI — Shutting down...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-Powered Urban Heat Island Detection & Climate Intelligence Platform — ISRO BAH 2026",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS
origins = settings.CORS_ORIGINS.split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routes
app.include_router(api_v1_router, prefix="/api/v1")


@app.get("/")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "operational",
        "mission": "Urban Heat Island Detection & Climate Intelligence",
        "organization": "ISRO Bharatiya Antariksh Hackathon 2026",
    }


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "UrbanHeat AI Backend"}
