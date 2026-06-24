#!/usr/bin/env python3
"""
UrbanHeat AI — Hotspot Detection Training
==========================================
Implements real spatial clustering for Urban Heat Island hotspot detection.
Methods: KMeans, DBSCAN, Getis-Ord Gi* (z-score based)

Usage:
    cd ml-engine
    python -m training.hotspot_training
"""

import os
import json
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans, DBSCAN
from sklearn.preprocessing import StandardScaler
from scipy import stats
import joblib

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "models")
CITIES_JSON = os.path.join(BASE_DIR, "..", "data-pipeline", "data", "cities.json")


def load_cities():
    """Load cities data."""
    if os.path.exists(CITIES_JSON):
        with open(CITIES_JSON, "r") as f:
            return json.load(f)
    alt = os.path.join(BASE_DIR, "data", "cities.json")
    if os.path.exists(alt):
        with open(alt, "r") as f:
            return json.load(f)
    raise FileNotFoundError("cities.json not found")


def getis_ord_gi_star(values, coords, distance_threshold=2.0):
    """
    Compute Getis-Ord Gi* statistic for spatial hotspot detection.
    
    A positive Gi* z-score indicates a hotspot (high value surrounded by high values).
    A negative Gi* z-score indicates a cold spot.
    
    Parameters:
        values: array of attribute values (e.g., LST)
        coords: array of [lat, lng] coordinates
        distance_threshold: threshold in degrees (~200km at equator)
    
    Returns:
        z_scores: Gi* z-scores for each point
        p_values: associated p-values
    """
    n = len(values)
    x_bar = np.mean(values)
    s = np.std(values)
    
    z_scores = np.zeros(n)
    p_values = np.zeros(n)
    
    for i in range(n):
        # Compute distance-based weights
        distances = np.sqrt(np.sum((coords - coords[i]) ** 2, axis=1))
        weights = (distances < distance_threshold).astype(float)
        weights[i] = 1.0  # Include self (Gi* vs Gi)
        
        sum_wj = np.sum(weights)
        sum_wj_xj = np.sum(weights * values)
        sum_wj2 = np.sum(weights ** 2)
        
        if s == 0 or (n * sum_wj2 - sum_wj ** 2) <= 0:
            z_scores[i] = 0
            p_values[i] = 1.0
            continue
        
        numerator = sum_wj_xj - x_bar * sum_wj
        denominator = s * np.sqrt((n * sum_wj2 - sum_wj ** 2) / (n - 1))
        
        if denominator == 0:
            z_scores[i] = 0
            p_values[i] = 1.0
        else:
            z_scores[i] = numerator / denominator
            p_values[i] = 2 * (1 - stats.norm.cdf(abs(z_scores[i])))
    
    return z_scores, p_values


def train_hotspot_models(cities):
    """Train hotspot detection models."""
    print("\n" + "=" * 60)
    print("  HOTSPOT DETECTION TRAINING")
    print("=" * 60)
    
    # Prepare data
    data = []
    for c in cities:
        data.append({
            "name": c["name"],
            "lat": c["lat"],
            "lng": c["lng"],
            "lst": c["lst"],
            "uhi_intensity": c["uhi_intensity"],
            "risk_score": c["risk_score"],
            "ndvi": c["ndvi"],
            "ndbi": c["ndbi"],
            "aqi": c["aqi"],
        })
    
    df = pd.DataFrame(data)
    coords = df[["lat", "lng"]].values
    
    # Feature set for clustering
    features = df[["lst", "uhi_intensity", "risk_score", "ndbi", "aqi"]].values
    scaler = StandardScaler()
    features_scaled = scaler.fit_transform(features)
    
    # ── Method 1: KMeans (3 zones: Hot, Moderate, Cool) ──
    print("\n[1] KMeans Clustering (3 zones)...")
    kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
    kmeans_labels = kmeans.fit_predict(features_scaled)
    
    # Map cluster labels to zone names based on mean LST
    cluster_lsts = {}
    for label in range(3):
        mask = kmeans_labels == label
        cluster_lsts[label] = df.loc[mask, "lst"].mean()
    
    sorted_clusters = sorted(cluster_lsts.items(), key=lambda x: x[1], reverse=True)
    zone_map = {}
    zone_names = ["Hot Zone", "Moderate Zone", "Cool Zone"]
    for i, (label, _) in enumerate(sorted_clusters):
        zone_map[label] = zone_names[i]
    
    df["kmeans_zone"] = [zone_map[l] for l in kmeans_labels]
    
    print(f"    ✓ Zone distribution:")
    for zone in zone_names:
        count = (df["kmeans_zone"] == zone).sum()
        mean_lst = df.loc[df["kmeans_zone"] == zone, "lst"].mean()
        print(f"      {zone}: {count} cities (avg LST: {mean_lst:.1f}°C)")
    
    # ── Method 2: DBSCAN ──
    print("\n[2] DBSCAN Clustering...")
    # Use spatial + thermal features
    spatial_thermal = np.column_stack([
        coords / 5.0,  # Normalize coords
        features_scaled[:, 0:2],  # LST and UHI
    ])
    dbscan = DBSCAN(eps=0.8, min_samples=3)
    dbscan_labels = dbscan.fit_predict(spatial_thermal)
    
    n_clusters = len(set(dbscan_labels)) - (1 if -1 in dbscan_labels else 0)
    n_noise = (dbscan_labels == -1).sum()
    print(f"    ✓ Found {n_clusters} clusters, {n_noise} noise points")
    df["dbscan_cluster"] = dbscan_labels
    
    # ── Method 3: Getis-Ord Gi* ──
    print("\n[3] Getis-Ord Gi* Hotspot Analysis...")
    lst_values = df["lst"].values
    gi_z_scores, gi_p_values = getis_ord_gi_star(lst_values, coords, distance_threshold=3.0)
    
    df["gi_z_score"] = gi_z_scores.round(4)
    df["gi_p_value"] = gi_p_values.round(4)
    
    # Classify: z > 1.96 = hotspot (95% confidence), z < -1.96 = coldspot
    gi_classification = []
    for z, p in zip(gi_z_scores, gi_p_values):
        if z > 2.58:
            gi_classification.append("Critical Hotspot")
        elif z > 1.96:
            gi_classification.append("Significant Hotspot")
        elif z > 1.65:
            gi_classification.append("Marginal Hotspot")
        elif z < -1.96:
            gi_classification.append("Cold Spot")
        else:
            gi_classification.append("Not Significant")
    
    df["gi_classification"] = gi_classification
    
    print(f"    ✓ Gi* classification:")
    for cls in ["Critical Hotspot", "Significant Hotspot", "Marginal Hotspot", "Cold Spot", "Not Significant"]:
        count = (df["gi_classification"] == cls).sum()
        if count > 0:
            print(f"      {cls}: {count} cities")
    
    # ── Save models ──
    print("\n[*] Saving hotspot models...")
    os.makedirs(MODELS_DIR, exist_ok=True)
    
    joblib.dump(kmeans, os.path.join(MODELS_DIR, "kmeans_hotspot.joblib"))
    joblib.dump(scaler, os.path.join(MODELS_DIR, "hotspot_scaler.joblib"))
    
    # Save hotspot analysis results
    hotspot_results = {
        "cities": [],
        "zone_summary": {},
    }
    
    for _, row in df.iterrows():
        hotspot_results["cities"].append({
            "name": row["name"],
            "lat": row["lat"],
            "lng": row["lng"],
            "lst": row["lst"],
            "kmeans_zone": row["kmeans_zone"],
            "dbscan_cluster": int(row["dbscan_cluster"]),
            "gi_z_score": float(row["gi_z_score"]),
            "gi_p_value": float(row["gi_p_value"]),
            "gi_classification": row["gi_classification"],
        })
    
    for zone in zone_names:
        mask = df["kmeans_zone"] == zone
        hotspot_results["zone_summary"][zone] = {
            "count": int(mask.sum()),
            "avg_lst": round(float(df.loc[mask, "lst"].mean()), 2),
            "avg_uhi": round(float(df.loc[mask, "uhi_intensity"].mean()), 2),
            "cities": df.loc[mask, "name"].tolist(),
        }
    
    results_path = os.path.join(MODELS_DIR, "hotspot_results.json")
    with open(results_path, "w") as f:
        json.dump(hotspot_results, f, indent=2)
    
    print(f"    ✓ Saved hotspot results to {results_path}")
    print("    ✓ Saved KMeans model to models/kmeans_hotspot.joblib")
    print("\n" + "=" * 60 + "\n")
    
    return hotspot_results


def main():
    cities = load_cities()
    print(f"[*] Loaded {len(cities)} cities")
    train_hotspot_models(cities)


if __name__ == "__main__":
    main()
