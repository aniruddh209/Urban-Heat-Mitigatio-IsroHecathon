#!/usr/bin/env python3
"""
UrbanHeat AI — Feature Generator
Extracts features from the cities registry and generates a structured CSV
training dataset for the ML models. This script bridges the data-pipeline
and the ml-engine.
"""
import os
import argparse
import json
import csv
import math

FEATURE_COLUMNS = [
    "city", "lat", "lng", "ndvi", "ndbi", "albedo", "humidity",
    "population_density", "building_density", "elevation_m",
    "rainfall_mm", "aqi", "green_cover_pct", "water_body_pct",
    "wind_speed", "lst"
]


def generate_features(processed_dir: str, canonical_cities_json: str, output_json: str, output_csv: str):
    print(f"[*] Loading city metadata from: {canonical_cities_json}")

    with open(canonical_cities_json, 'r') as f:
        cities = json.load(f)

    print(f"[*] Loaded {len(cities)} cities from registry.")
    print(f"[*] Computing derived features...")

    enhanced_cities = []
    csv_rows = []

    for city in cities:
        pop_density = round(city["population"] / max(city["area_km2"], 1), 1)
        building_density = round(city.get("built_up_pct", 50.0) / 100.0, 4)
        albedo = round(0.30 - 0.18 * building_density + 0.12 * city.get("ndvi", 0.2), 4)
        tree_canopy = round(city.get("green_cover_pct", 15.0) * 0.8, 1)
        wind_speed = round(8.0 + (city.get("elevation_m", 200) - 200) * 0.003, 1)

        # Enhanced city record
        enhanced = {
            **city,
            "albedo": albedo,
            "tree_canopy_cover_pct": tree_canopy,
            "population_density_km2": pop_density,
            "building_density": building_density,
            "wind_speed": wind_speed,
        }
        enhanced_cities.append(enhanced)

        # CSV row for ML training
        csv_rows.append({
            "city": city["name"],
            "lat": city["lat"],
            "lng": city["lng"],
            "ndvi": city["ndvi"],
            "ndbi": city["ndbi"],
            "albedo": albedo,
            "humidity": city["humidity"],
            "population_density": pop_density,
            "building_density": building_density,
            "elevation_m": city["elevation_m"],
            "rainfall_mm": city["rainfall_mm"],
            "aqi": city["aqi"],
            "green_cover_pct": city["green_cover_pct"],
            "water_body_pct": city.get("water_body_pct", 3.0),
            "wind_speed": wind_speed,
            "lst": city["lst"],
        })

    # Save enhanced JSON
    os.makedirs(os.path.dirname(output_json), exist_ok=True)
    with open(output_json, 'w') as f:
        json.dump(enhanced_cities, f, indent=2)
    print(f"[+] Enhanced JSON saved to: {output_json}")

    # Save CSV for ML training
    os.makedirs(os.path.dirname(output_csv), exist_ok=True)
    with open(output_csv, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=FEATURE_COLUMNS)
        writer.writeheader()
        writer.writerows(csv_rows)
    print(f"[+] ML training CSV saved to: {output_csv}")

    # Print summary stats
    lsts = [r["lst"] for r in csv_rows]
    print(f"\n[*] Dataset Summary:")
    print(f"    Cities: {len(csv_rows)}")
    print(f"    Features: {len(FEATURE_COLUMNS) - 4} (excluding city, lat, lng, lst)")
    print(f"    LST range: {min(lsts):.1f}°C — {max(lsts):.1f}°C")
    print(f"    LST mean: {sum(lsts)/len(lsts):.1f}°C")
    print(f"    Ready for ml-engine training pipeline.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Extract ML features from city registry.")
    parser.add_argument("--processed-dir", type=str, default="data/processed", help="Processed raster directory")
    parser.add_argument("--registry", type=str, default="data/cities.json", help="Canonical cities registry")
    parser.add_argument("--out-json", type=str, default="data/features/cities_enhanced.json", help="Output enhanced JSON")
    parser.add_argument("--out-csv", type=str, default="data/features/cities_features.csv", help="Output CSV for ML")

    args = parser.parse_args()
    generate_features(args.processed_dir, args.registry, args.out_json, args.out_csv)
