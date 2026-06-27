#!/usr/bin/env python3
"""
UrbanHeat AI — Feature Engineering Pipeline
=============================================
Creates derived features that capture non-linear relationships between
urban parameters and Land Surface Temperature (LST).

All transformations are deterministic and can be applied identically
during both training and inference.

Usage:
    from training.feature_engineer import engineer_features, ENGINEERED_FEATURE_COLS
"""

import numpy as np
import pandas as pd

# ─── Base feature columns (raw inputs) ────────────────────────
BASE_FEATURE_COLS = [
    "ndvi", "ndbi", "albedo", "humidity", "population_density",
    "building_density", "elevation_m", "rainfall_mm", "aqi",
    "green_cover_pct", "water_body_pct", "wind_speed",
]

# ─── Temporal feature columns (optional, set to defaults if missing)
TEMPORAL_COLS = ["month", "hour_of_day"]

# ─── All engineered feature columns (deterministic order) ─────
ENGINEERED_FEATURE_COLS = (
    BASE_FEATURE_COLS
    + TEMPORAL_COLS
    + [
        # Interaction features
        "ndvi_x_ndbi",              # Vegetation–built-up interaction
        "building_density_x_albedo", # Urban surface reflectance
        "elevation_x_humidity",     # Elevation-moisture interplay
        "green_cover_x_wind",       # Ventilation corridor effect
        "ndbi_sq_minus_ndvi_sq",    # Quadratic heat contrast
        "ndvi_x_green_cover",       # Combined vegetation effect
        "pop_density_x_building",   # Urban intensity
        "aqi_x_humidity",           # Pollution-moisture interaction
        # Ratio features
        "ndvi_ratio",               # ndvi / (ndvi + ndbi)
        "green_to_built_ratio",     # green_cover / (building_density + 0.01)
        "water_to_built_ratio",     # water_body / (building_density + 0.01)
        # Log transforms
        "log_pop_density",          # log(population_density)
        "log_aqi",                  # log(aqi)
        "log_rainfall",             # log(rainfall_mm + 1)
        # Sinusoidal month encoding (captures seasonality)
        "month_sin",                # sin(2π × month / 12)
        "month_cos",                # cos(2π × month / 12)
        # Derived physical indices
        "urban_heat_index",         # Composite: ndbi × building_density - ndvi × green_cover/100
        "thermal_comfort_index",    # Composite: humidity/100 + (1-albedo) - wind_speed/20
    ]
)


def engineer_features(df_or_dict, copy=True):
    """
    Apply all feature engineering transformations.
    
    Parameters
    ----------
    df_or_dict : pd.DataFrame or dict
        If DataFrame, engineers features for all rows.
        If dict, treats it as a single-row input (inference mode).
    copy : bool
        Whether to copy the DataFrame before modifying.
    
    Returns
    -------
    pd.DataFrame with all ENGINEERED_FEATURE_COLS columns.
    """
    if isinstance(df_or_dict, dict):
        df = pd.DataFrame([df_or_dict])
    elif copy:
        df = df_or_dict.copy()
    else:
        df = df_or_dict

    # ── Ensure temporal columns exist (default to summer noon) ──
    if "month" not in df.columns:
        df["month"] = 5  # May (summer default)
    if "hour_of_day" not in df.columns:
        df["hour_of_day"] = 13.0  # Early afternoon (peak LST)

    # ── Interaction features ──
    df["ndvi_x_ndbi"] = df["ndvi"] * df["ndbi"]
    df["building_density_x_albedo"] = df["building_density"] * df["albedo"]
    df["elevation_x_humidity"] = df["elevation_m"] * df["humidity"] / 1000.0  # Scale down
    df["green_cover_x_wind"] = df["green_cover_pct"] * df["wind_speed"] / 100.0
    df["ndbi_sq_minus_ndvi_sq"] = df["ndbi"] ** 2 - df["ndvi"] ** 2
    df["ndvi_x_green_cover"] = df["ndvi"] * df["green_cover_pct"]
    df["pop_density_x_building"] = (
        np.log10(df["population_density"].clip(lower=100)) * df["building_density"]
    )
    df["aqi_x_humidity"] = df["aqi"] * df["humidity"] / 10000.0  # Scale down

    # ── Ratio features ──
    df["ndvi_ratio"] = df["ndvi"] / (df["ndvi"] + df["ndbi"] + 1e-6)
    df["green_to_built_ratio"] = df["green_cover_pct"] / (df["building_density"] * 100 + 1.0)
    df["water_to_built_ratio"] = df["water_body_pct"] / (df["building_density"] * 100 + 1.0)

    # ── Log transforms ──
    df["log_pop_density"] = np.log10(df["population_density"].clip(lower=100))
    df["log_aqi"] = np.log10(df["aqi"].clip(lower=10))
    df["log_rainfall"] = np.log10(df["rainfall_mm"].clip(lower=1) + 1)

    # ── Sinusoidal month encoding ──
    df["month_sin"] = np.sin(2 * np.pi * df["month"] / 12)
    df["month_cos"] = np.cos(2 * np.pi * df["month"] / 12)

    # ── Derived physical indices ──
    df["urban_heat_index"] = (
        df["ndbi"] * df["building_density"]
        - df["ndvi"] * df["green_cover_pct"] / 100.0
    )
    df["thermal_comfort_index"] = (
        df["humidity"] / 100.0
        + (1.0 - df["albedo"])
        - df["wind_speed"] / 20.0
    )

    return df[ENGINEERED_FEATURE_COLS]


def engineer_single_input(feature_values: dict) -> np.ndarray:
    """
    Engineer features for a single prediction input.
    Returns a 1-D numpy array in ENGINEERED_FEATURE_COLS order.
    
    Parameters
    ----------
    feature_values : dict
        Must contain at minimum the BASE_FEATURE_COLS keys.
        May optionally contain 'month' and 'hour_of_day'.
    
    Returns
    -------
    np.ndarray of shape (len(ENGINEERED_FEATURE_COLS),)
    """
    df = engineer_features(feature_values)
    return df.values[0]
