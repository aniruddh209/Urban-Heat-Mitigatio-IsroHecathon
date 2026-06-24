# pyrefly: ignore [missing-import]
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any
import numpy as np
import os
import json

router = APIRouter()

# ─── Model Loading ─────────────────────────────────────────────
from app.config import MODEL_DIR


def _load_hotspot_results():
    """Load precomputed hotspot analysis results."""
    path = os.path.join(MODEL_DIR, "hotspot_results.json")
    if os.path.exists(path):
        with open(path, "r") as f:
            return json.load(f)
    return None


# ─── Request / Response ────────────────────────────────────────
class DataPoint(BaseModel):
    lat: float
    lng: float
    temperature: float
    humidity: float = 50.0
    name: str = ""


class HotspotRequest(BaseModel):
    points: List[DataPoint]
    threshold_temp: float = Field(38.0, description="Minimum temperature to consider a candidate hotspot")
    method: str = Field("dbscan", description="Clustering method: dbscan, kmeans, or gi_star")


class Hotspot(BaseModel):
    center_lat: float
    center_lng: float
    radius_meters: float
    mean_temp: float
    intensity: str  # Critical, Severe, High, Moderate
    affected_points_count: int
    city_names: List[str] = []
    gi_z_score: float = 0.0
    confidence: float = 0.0


class HotspotResponse(BaseModel):
    hotspots: List[Hotspot]
    total_candidates: int
    method_used: str
    zone_summary: Dict[str, Any] = {}


@router.post("/", response_model=HotspotResponse)
async def detect_hotspots(request: HotspotRequest):
    try:
        candidates = [p for p in request.points if p.temperature >= request.threshold_temp]

        if not candidates:
            return HotspotResponse(
                hotspots=[], total_candidates=0,
                method_used=request.method, zone_summary={}
            )

        # Try using precomputed results if no custom points provided
        precomputed = _load_hotspot_results()

        if request.method == "dbscan":
            hotspots = _dbscan_clustering(candidates)
            method_name = "DBSCAN (density-based)"
        elif request.method == "kmeans":
            hotspots = _kmeans_clustering(candidates)
            method_name = "KMeans (partition-based)"
        elif request.method == "gi_star":
            hotspots = _gi_star_analysis(candidates)
            method_name = "Getis-Ord Gi* (spatial statistics)"
        else:
            hotspots = _dbscan_clustering(candidates)
            method_name = "DBSCAN (default)"

        # Sort by temperature descending
        hotspots.sort(key=lambda x: x.mean_temp, reverse=True)

        # Zone summary
        zone_summary = {}
        if precomputed and "zone_summary" in precomputed:
            zone_summary = precomputed["zone_summary"]

        return HotspotResponse(
            hotspots=hotspots,
            total_candidates=len(candidates),
            method_used=method_name,
            zone_summary=zone_summary,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Hotspot detection error: {str(e)}")


def _dbscan_clustering(points: List[DataPoint]) -> List[Hotspot]:
    """Real DBSCAN clustering using scikit-learn."""
    from sklearn.cluster import DBSCAN as SKLearnDBSCAN

    coords = np.array([[p.lat, p.lng] for p in points])
    temps = np.array([p.temperature for p in points])

    # Combine spatial and thermal features
    features = np.column_stack([
        coords / 3.0,  # Normalize spatial (lat/lng degrees)
        temps / 50.0,  # Normalize temperatures
    ])

    # DBSCAN with eps tuned for city-level clustering (~3 degree region)
    db = SKLearnDBSCAN(eps=0.5, min_samples=2)
    labels = db.fit_predict(features)

    hotspots = []
    unique_labels = set(labels) - {-1}

    for label in unique_labels:
        mask = labels == label
        cluster_points = [points[i] for i in range(len(points)) if mask[i]]
        cluster_temps = temps[mask]
        cluster_lats = coords[mask, 0]
        cluster_lngs = coords[mask, 1]

        mean_temp = float(np.mean(cluster_temps))

        if mean_temp >= 44.0:
            intensity = "Critical"
        elif mean_temp >= 42.0:
            intensity = "Severe"
        elif mean_temp >= 40.0:
            intensity = "High"
        else:
            intensity = "Moderate"

        # Calculate radius from spread
        lat_spread = float(np.max(cluster_lats) - np.min(cluster_lats))
        lng_spread = float(np.max(cluster_lngs) - np.min(cluster_lngs))
        radius_deg = max(lat_spread, lng_spread) / 2.0
        radius_m = max(500.0, radius_deg * 111000)  # Approximate meters

        city_names = [p.name for p in cluster_points if p.name]

        hotspots.append(Hotspot(
            center_lat=round(float(np.mean(cluster_lats)), 6),
            center_lng=round(float(np.mean(cluster_lngs)), 6),
            radius_meters=round(radius_m, 0),
            mean_temp=round(mean_temp, 2),
            intensity=intensity,
            affected_points_count=len(cluster_points),
            city_names=city_names,
            confidence=round(min(98.0, 70.0 + len(cluster_points) * 2.0), 1),
        ))

    # Also add noise points as individual hotspots if they're very hot
    for i in range(len(points)):
        if labels[i] == -1 and temps[i] >= 43.0:
            hotspots.append(Hotspot(
                center_lat=round(coords[i, 0], 6),
                center_lng=round(coords[i, 1], 6),
                radius_meters=2000.0,
                mean_temp=round(float(temps[i]), 2),
                intensity="Critical" if temps[i] >= 44 else "Severe",
                affected_points_count=1,
                city_names=[points[i].name] if points[i].name else [],
                confidence=65.0,
            ))

    return hotspots


def _kmeans_clustering(points: List[DataPoint]) -> List[Hotspot]:
    """KMeans-based zone classification."""
    from sklearn.cluster import KMeans

    coords = np.array([[p.lat, p.lng] for p in points])
    temps = np.array([p.temperature for p in points])

    features = np.column_stack([coords / 5.0, temps / 50.0])

    n_clusters = min(5, max(2, len(points) // 3))
    km = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    labels = km.fit_predict(features)

    hotspots = []
    for label in range(n_clusters):
        mask = labels == label
        if not any(mask):
            continue
        cluster_points = [points[i] for i in range(len(points)) if mask[i]]
        cluster_temps = temps[mask]
        cluster_lats = coords[mask, 0]
        cluster_lngs = coords[mask, 1]

        mean_temp = float(np.mean(cluster_temps))
        if mean_temp < 38:
            continue  # Skip cool clusters

        if mean_temp >= 44:
            intensity = "Critical"
        elif mean_temp >= 42:
            intensity = "Severe"
        elif mean_temp >= 40:
            intensity = "High"
        else:
            intensity = "Moderate"

        lat_spread = float(np.max(cluster_lats) - np.min(cluster_lats))
        lng_spread = float(np.max(cluster_lngs) - np.min(cluster_lngs))
        radius_m = max(1000.0, max(lat_spread, lng_spread) / 2.0 * 111000)

        hotspots.append(Hotspot(
            center_lat=round(float(np.mean(cluster_lats)), 6),
            center_lng=round(float(np.mean(cluster_lngs)), 6),
            radius_meters=round(radius_m, 0),
            mean_temp=round(mean_temp, 2),
            intensity=intensity,
            affected_points_count=len(cluster_points),
            city_names=[p.name for p in cluster_points if p.name],
            confidence=round(min(95.0, 60.0 + len(cluster_points) * 3.0), 1),
        ))

    return hotspots


def _gi_star_analysis(points: List[DataPoint]) -> List[Hotspot]:
    """Getis-Ord Gi* spatial hotspot analysis."""
    from scipy import stats as scipy_stats

    coords = np.array([[p.lat, p.lng] for p in points])
    temps = np.array([p.temperature for p in points])
    n = len(points)

    if n < 3:
        return _dbscan_clustering(points)

    x_bar = np.mean(temps)
    s = np.std(temps)

    hotspots = []
    for i in range(n):
        distances = np.sqrt(np.sum((coords - coords[i]) ** 2, axis=1))
        weights = (distances < 3.0).astype(float)  # ~300km threshold
        weights[i] = 1.0

        sum_wj = np.sum(weights)
        sum_wj_xj = np.sum(weights * temps)
        sum_wj2 = np.sum(weights ** 2)

        if s == 0 or (n * sum_wj2 - sum_wj ** 2) <= 0:
            continue

        numerator = sum_wj_xj - x_bar * sum_wj
        denominator = s * np.sqrt((n * sum_wj2 - sum_wj ** 2) / (n - 1))

        if denominator == 0:
            continue

        z_score = numerator / denominator
        p_value = 2 * (1 - scipy_stats.norm.cdf(abs(z_score)))

        # Only report significant hotspots (z > 1.65 = 90% confidence)
        if z_score > 1.65:
            if z_score > 2.58:
                intensity = "Critical"
                confidence = 99.0
            elif z_score > 1.96:
                intensity = "Severe"
                confidence = 95.0
            else:
                intensity = "High"
                confidence = 90.0

            hotspots.append(Hotspot(
                center_lat=round(float(coords[i, 0]), 6),
                center_lng=round(float(coords[i, 1]), 6),
                radius_meters=round(float(sum_wj * 50000), 0),  # Scale by neighbor count
                mean_temp=round(float(temps[i]), 2),
                intensity=intensity,
                affected_points_count=int(sum_wj),
                city_names=[points[i].name] if points[i].name else [],
                gi_z_score=round(float(z_score), 4),
                confidence=confidence,
            ))

    return hotspots
