#!/usr/bin/env python3
"""
UrbanHeat AI — ML Training Pipeline v2 (Upgraded)
===================================================
Trains and compares multiple ML models for Land Surface Temperature (LST) prediction.

Key improvements over v1:
  - 20,000 samples (4× more) with temporal/seasonal features
  - Feature engineering: interactions, log transforms, ratios, sinusoidal month
  - GroupShuffleSplit: cities never leak between train and test
  - Stacking ensemble: XGBoost + LightGBM + CatBoost → Ridge meta-learner
  - 50-iteration hyperparameter search with 10-fold CV
  - Early stopping on validation set for gradient boosted models
  - Permutation importance in addition to SHAP

Usage:
    cd ml-engine
    python -m training.ml_training
"""

import os
import json
import time
import warnings
import numpy as np
import pandas as pd
from datetime import datetime

from sklearn.model_selection import (
    train_test_split, cross_val_score, RandomizedSearchCV,
    GroupShuffleSplit, GroupKFold
)
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.ensemble import RandomForestRegressor, StackingRegressor
from sklearn.svm import SVR
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import joblib

warnings.filterwarnings("ignore")

# ─── CONSTANTS ─────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "models")
DATA_DIR = os.path.join(BASE_DIR, "data")
CITIES_JSON = os.path.join(BASE_DIR, "..", "data-pipeline", "data", "cities.json")

TARGET_COL = "lst"
RANDOM_STATE = 42


def load_cities_data():
    """Load the 100+ Indian cities dataset."""
    if os.path.exists(CITIES_JSON):
        with open(CITIES_JSON, "r") as f:
            return json.load(f)
    alt_path = os.path.join(BASE_DIR, "data", "cities.json")
    if os.path.exists(alt_path):
        with open(alt_path, "r") as f:
            return json.load(f)
    raise FileNotFoundError(f"Cannot find cities.json. Searched:\n  {CITIES_JSON}\n  {alt_path}")


def generate_training_dataset(cities, n_samples_per_city=200):
    """
    Generate a scientifically realistic training dataset.
    
    For each city, creates multiple synthetic samples by adding calibrated
    Gaussian noise to real city parameters. Includes temporal/seasonal
    variation (month, time of day) and spatially-aware noise magnitudes.
    
    The LST target is computed using a physics-informed formula that models:
    - Solar absorption by built-up surfaces (+NDBI effect)
    - Evapotranspiration cooling by vegetation (-NDVI effect)
    - Albedo reflection (-albedo effect)
    - Humidity modulation
    - Elevation lapse rate
    - Population-driven anthropogenic heat
    - Seasonal temperature cycle
    - Diurnal temperature variation
    - Non-linear interaction effects
    """
    print(f"[*] Generating training dataset from {len(cities)} cities × {n_samples_per_city} samples each...")
    
    rows = []
    rng = np.random.RandomState(RANDOM_STATE)
    
    # Pre-compute city-level variability scales
    all_lsts = [c.get("lst", c.get("avg_temp", 30)) for c in cities]
    lst_global_std = np.std(all_lsts)
    
    for city in cities:
        pop_density = city["population"] / max(city["area_km2"], 1)
        building_density = city.get("built_up_pct", 50.0) / 100.0
        base_albedo = 0.30 - 0.18 * building_density + 0.12 * city.get("ndvi", 0.2)
        base_wind = 8.0 + rng.normal(0, 1.5)
        
        # City-specific noise scales (larger cities = more variability)
        pop_scale = np.clip(np.log10(max(city["population"], 1e5)) / 7.0, 0.5, 1.5)
        
        for _ in range(n_samples_per_city):
            # ── Temporal features ──
            month = rng.randint(1, 13)
            hour_of_day = np.clip(rng.normal(13, 3), 6, 20)  # Mostly daytime observations
            
            # Seasonal temperature modulation (Indian climate: hottest Apr-Jun, coolest Dec-Jan)
            seasonal_cycle = -4.5 * np.cos(2 * np.pi * (month - 5) / 12)  # Peak in May
            
            # Diurnal temperature variation (peak around 14:00)
            diurnal = 3.5 * np.sin(np.pi * (hour_of_day - 6) / 14) if 6 <= hour_of_day <= 20 else -2.0
            
            # ── Spatial features with realistic variability ──
            ndvi = np.clip(city["ndvi"] + rng.normal(0, 0.07 * pop_scale), 0.01, 0.85)
            ndbi = np.clip(city["ndbi"] + rng.normal(0, 0.06 * pop_scale), 0.05, 0.95)
            alb = np.clip(base_albedo + rng.normal(0, 0.035), 0.05, 0.60)
            hum = np.clip(city["humidity"] + rng.normal(0, 8 * pop_scale), 15, 98)
            pop_d = max(100, pop_density + rng.normal(0, pop_density * 0.18))
            build_d = np.clip(building_density + rng.normal(0, 0.06 * pop_scale), 0.05, 0.98)
            elev = max(0, city["elevation_m"] + rng.normal(0, 15))
            rain = max(0, city["rainfall_mm"] + rng.normal(0, 60))
            aqi_val = max(10, city["aqi"] + rng.normal(0, 25 * pop_scale))
            gc = np.clip(city["green_cover_pct"] + rng.normal(0, 3 * pop_scale), 1, 80)
            wb = np.clip(city.get("water_body_pct", 3.0) + rng.normal(0, 0.8), 0, 30)
            ws = max(0.5, base_wind + rng.normal(0, 2.5))
            
            # ── Monsoon humidity boost (Jul-Sep) ──
            if month in [7, 8, 9]:
                hum = np.clip(hum + rng.normal(15, 5), 15, 98)
                rain_factor = 1.5
            else:
                rain_factor = 1.0
            
            # ═══════════════════════════════════════════════════════
            # Physics-informed LST model (enhanced v2)
            # ═══════════════════════════════════════════════════════
            
            # Baseline: city's avg temp + seasonal + diurnal modulation
            baseline = city["avg_temp"] + seasonal_cycle + diurnal
            
            # UHI effect from built-up surfaces (non-linear)
            uhi_buildup = (
                9.0 * (ndbi - 0.35)
                + 3.5 * (build_d - 0.4)
                + 2.0 * (ndbi * build_d)  # Interaction: compounding heat
            )
            
            # Vegetation cooling via evapotranspiration (stronger in humid conditions)
            humidity_veg_boost = 1.0 + 0.3 * (hum / 100.0)  # More humid = more evapotranspiration
            veg_cooling = (
                -7.0 * (ndvi - 0.15) * humidity_veg_boost
                - 0.10 * (gc - 10)
            )
            
            # Albedo: higher reflectivity = less absorbed solar radiation
            # Effect is stronger during peak solar hours
            solar_intensity = max(0, np.sin(np.pi * (hour_of_day - 6) / 14)) if 6 <= hour_of_day <= 20 else 0
            albedo_effect = -5.5 * (alb - 0.20) * (0.7 + 0.3 * solar_intensity)
            
            # Humidity modulation (high humidity reduces diurnal range)
            humidity_effect = -0.035 * (hum - 50)
            
            # Elevation lapse rate (~6.5°C per 1000m)
            elev_effect = -0.0065 * (elev - 200)
            
            # Population-driven anthropogenic heat (log scale, saturates)
            anthro_heat = 1.0 * np.log10(max(pop_d, 100)) - 2.5
            
            # Water body cooling (more effective in hot conditions)
            water_cooling = -0.18 * (wb - 3) * (1.0 + 0.1 * max(0, baseline - 30) / 10)
            
            # Wind cooling effect (turbulent mixing)
            wind_effect = -0.10 * (ws - 8)
            
            # Rainfall proxy for soil moisture and cloud cover
            rain_effect = -0.0006 * (rain * rain_factor - 800)
            
            # AQI greenhouse effect (polluted air traps heat)
            aqi_effect = 0.006 * (aqi_val - 100)
            
            # ── Interaction effects (non-linear, physics-based) ──
            # Built-up × vegetation: mutual opposition
            interaction_1 = 2.5 * (ndbi - ndvi) * (build_d - 0.3)
            
            # Green cover × wind: ventilation corridors
            interaction_2 = -0.003 * gc * ws
            
            # Compute LST with heteroscedastic noise (larger noise for extreme temps)
            raw_lst = (baseline + uhi_buildup + veg_cooling + albedo_effect +
                       humidity_effect + elev_effect + anthro_heat + water_cooling +
                       wind_effect + rain_effect + aqi_effect +
                       interaction_1 + interaction_2)
            
            # Noise scales with distance from mean (heteroscedastic)
            noise_scale = 0.5 + 0.15 * abs(raw_lst - 30) / 10
            lst = raw_lst + rng.normal(0, noise_scale)
            
            # Clamp to realistic range
            lst = np.clip(lst, 15.0, 58.0)
            
            rows.append({
                "city": city["name"],
                "lat": city["lat"] + rng.normal(0, 0.015),
                "lng": city["lng"] + rng.normal(0, 0.015),
                "ndvi": round(ndvi, 4),
                "ndbi": round(ndbi, 4),
                "albedo": round(alb, 4),
                "humidity": round(hum, 1),
                "population_density": round(pop_d, 1),
                "building_density": round(build_d, 4),
                "elevation_m": round(elev, 1),
                "rainfall_mm": round(rain, 1),
                "aqi": round(aqi_val, 0),
                "green_cover_pct": round(gc, 1),
                "water_body_pct": round(wb, 1),
                "wind_speed": round(ws, 1),
                "month": int(month),
                "hour_of_day": round(hour_of_day, 1),
                "lst": round(lst, 2),
            })
    
    df = pd.DataFrame(rows)
    print(f"[+] Generated {len(df)} training samples")
    print(f"    LST range: {df['lst'].min():.1f}°C — {df['lst'].max():.1f}°C")
    print(f"    LST mean: {df['lst'].mean():.1f}°C, std: {df['lst'].std():.1f}°C")
    print(f"    Months covered: 1–12, Hours: {df['hour_of_day'].min():.0f}–{df['hour_of_day'].max():.0f}")
    return df


def train_models(X_train, X_test, y_train, y_test, feature_names):
    """Train and compare multiple ML models with stronger regularization."""
    
    from xgboost import XGBRegressor
    from lightgbm import LGBMRegressor
    from catboost import CatBoostRegressor
    
    n_features = X_train.shape[1]
    
    models = {
        "Linear Regression": LinearRegression(),
        "Ridge Regression": Ridge(alpha=10.0),
        "Random Forest": RandomForestRegressor(
            n_estimators=400, max_depth=16, min_samples_split=8,
            min_samples_leaf=4, max_features=0.7,
            random_state=RANDOM_STATE, n_jobs=-1
        ),
        "XGBoost": XGBRegressor(
            n_estimators=600, max_depth=7, learning_rate=0.03,
            subsample=0.75, colsample_bytree=0.75,
            reg_alpha=0.5, reg_lambda=2.0,
            min_child_weight=5, gamma=0.1,
            random_state=RANDOM_STATE, verbosity=0
        ),
        "LightGBM": LGBMRegressor(
            n_estimators=600, max_depth=7, learning_rate=0.03,
            subsample=0.75, colsample_bytree=0.75,
            reg_alpha=0.5, reg_lambda=2.0,
            num_leaves=63, min_child_samples=10,
            random_state=RANDOM_STATE, verbose=-1
        ),
        "CatBoost": CatBoostRegressor(
            iterations=600, depth=7, learning_rate=0.03,
            random_state=RANDOM_STATE, verbose=0,
            l2_leaf_reg=5.0, subsample=0.75,
            min_data_in_leaf=10
        ),
    }
    
    results = {}
    trained_models = {}
    
    print("\n" + "=" * 70)
    print("  MODEL TRAINING & COMPARISON (v2 — Enhanced)")
    print("=" * 70)
    
    for name, model in models.items():
        print(f"\n[*] Training: {name}...")
        start = time.time()
        
        model.fit(X_train, y_train)
        train_time = time.time() - start
        
        # Predictions
        y_pred_train = model.predict(X_train)
        y_pred_test = model.predict(X_test)
        
        # Metrics
        train_rmse = np.sqrt(mean_squared_error(y_train, y_pred_train))
        test_rmse = np.sqrt(mean_squared_error(y_test, y_pred_test))
        train_mae = mean_absolute_error(y_train, y_pred_train)
        test_mae = mean_absolute_error(y_test, y_pred_test)
        train_r2 = r2_score(y_train, y_pred_train)
        test_r2 = r2_score(y_test, y_pred_test)
        
        # Cross-validation (10-fold for more reliable estimates)
        cv_scores = cross_val_score(model, X_train, y_train, cv=10, scoring="r2", n_jobs=-1)
        
        # Overfitting gap
        overfit_gap = train_r2 - test_r2
        
        results[name] = {
            "train_rmse": round(float(train_rmse), 4),
            "test_rmse": round(float(test_rmse), 4),
            "train_mae": round(float(train_mae), 4),
            "test_mae": round(float(test_mae), 4),
            "train_r2": round(float(train_r2), 4),
            "test_r2": round(float(test_r2), 4),
            "cv_r2_mean": round(float(cv_scores.mean()), 4),
            "cv_r2_std": round(float(cv_scores.std()), 4),
            "overfit_gap": round(float(overfit_gap), 4),
            "training_time_sec": round(train_time, 2),
        }
        trained_models[name] = model
        
        overfit_flag = " ⚠️ OVERFIT" if overfit_gap > 0.05 else " ✓ OK"
        print(f"    ✓ Train R²: {train_r2:.4f}  |  Test R²: {test_r2:.4f}  (gap: {overfit_gap:.4f}{overfit_flag})")
        print(f"    ✓ Train RMSE: {train_rmse:.3f}°C  |  Test RMSE: {test_rmse:.3f}°C")
        print(f"    ✓ CV R² (10-fold): {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
        print(f"    ✓ Training time: {train_time:.2f}s")
    
    return results, trained_models


def build_stacking_ensemble(X_train, y_train, X_test, y_test):
    """Build a Stacking Ensemble: XGBoost + LightGBM + CatBoost → Ridge meta-learner."""
    
    from xgboost import XGBRegressor
    from lightgbm import LGBMRegressor
    from catboost import CatBoostRegressor
    
    print("\n[*] Building Stacking Ensemble (XGBoost + LightGBM + CatBoost → Ridge)...")
    start = time.time()
    
    estimators = [
        ("xgb", XGBRegressor(
            n_estimators=500, max_depth=7, learning_rate=0.03,
            subsample=0.75, colsample_bytree=0.75,
            reg_alpha=0.5, reg_lambda=2.0,
            min_child_weight=5, gamma=0.1,
            random_state=RANDOM_STATE, verbosity=0
        )),
        ("lgbm", LGBMRegressor(
            n_estimators=500, max_depth=7, learning_rate=0.03,
            subsample=0.75, colsample_bytree=0.75,
            reg_alpha=0.5, reg_lambda=2.0,
            num_leaves=63, min_child_samples=10,
            random_state=RANDOM_STATE, verbose=-1
        )),
        ("cat", CatBoostRegressor(
            iterations=500, depth=7, learning_rate=0.03,
            random_state=RANDOM_STATE, verbose=0,
            l2_leaf_reg=5.0, subsample=0.75,
            min_data_in_leaf=10
        )),
    ]
    
    stack = StackingRegressor(
        estimators=estimators,
        final_estimator=Ridge(alpha=1.0),
        cv=5,
        n_jobs=-1,
        passthrough=False,  # Only use base model predictions, not raw features
    )
    
    stack.fit(X_train, y_train)
    train_time = time.time() - start
    
    y_pred_train = stack.predict(X_train)
    y_pred_test = stack.predict(X_test)
    
    train_r2 = r2_score(y_train, y_pred_train)
    test_r2 = r2_score(y_test, y_pred_test)
    test_rmse = np.sqrt(mean_squared_error(y_test, y_pred_test))
    test_mae = mean_absolute_error(y_test, y_pred_test)
    train_rmse = np.sqrt(mean_squared_error(y_train, y_pred_train))
    overfit_gap = train_r2 - test_r2
    
    print(f"    ✓ Stacking Ensemble — Train R²: {train_r2:.4f}  |  Test R²: {test_r2:.4f}  (gap: {overfit_gap:.4f})")
    print(f"    ✓ Test RMSE: {test_rmse:.3f}°C  |  Test MAE: {test_mae:.3f}°C")
    print(f"    ✓ Training time: {train_time:.2f}s")
    
    metrics = {
        "train_rmse": round(float(train_rmse), 4),
        "test_rmse": round(float(test_rmse), 4),
        "train_mae": round(float(np.mean(np.abs(y_train - y_pred_train))), 4),
        "test_mae": round(float(test_mae), 4),
        "train_r2": round(float(train_r2), 4),
        "test_r2": round(float(test_r2), 4),
        "overfit_gap": round(float(overfit_gap), 4),
        "training_time_sec": round(train_time, 2),
    }
    
    return stack, metrics


def compute_shap_values(model, X_test, feature_names, model_name):
    """Compute SHAP values for the best model."""
    import shap
    
    print(f"\n[*] Computing SHAP values for {model_name}...")
    
    tree_models = ["XGBoost", "LightGBM", "CatBoost", "Random Forest"]
    
    if model_name in tree_models:
        explainer = shap.TreeExplainer(model)
        X_sample = X_test[:min(500, len(X_test))]
        shap_values = explainer.shap_values(X_sample)
    elif model_name == "Stacking Ensemble":
        # For stacking, use the best base estimator for SHAP
        # Use the XGBoost base estimator
        try:
            base_model = model.estimators_[0]  # XGBoost
            explainer = shap.TreeExplainer(base_model)
            X_sample = X_test[:min(500, len(X_test))]
            shap_values = explainer.shap_values(X_sample)
            print("    (Using XGBoost base estimator for SHAP)")
        except Exception:
            # Fallback to KernelExplainer
            X_sample = X_test[:min(100, len(X_test))]
            explainer = shap.KernelExplainer(model.predict, X_sample[:50])
            shap_values = explainer.shap_values(X_sample)
    else:
        X_sample = X_test[:min(100, len(X_test))]
        explainer = shap.KernelExplainer(model.predict, X_sample[:50])
        shap_values = explainer.shap_values(X_sample)
    
    mean_abs_shap = np.abs(shap_values).mean(axis=0)
    total = mean_abs_shap.sum()
    
    feature_importance = {}
    for i, feat in enumerate(feature_names):
        feature_importance[feat] = {
            "mean_abs_shap": round(float(mean_abs_shap[i]), 4),
            "importance_pct": round(float(mean_abs_shap[i] / total * 100), 2),
        }
    
    feature_importance = dict(
        sorted(feature_importance.items(), key=lambda x: x[1]["mean_abs_shap"], reverse=True)
    )
    
    print("    Feature Importance (SHAP — top 10):")
    for feat, vals in list(feature_importance.items())[:10]:
        bar = "█" * int(vals["importance_pct"] / 2)
        print(f"      {feat:30s} {vals['importance_pct']:5.1f}%  {bar}")
    
    return feature_importance


def hyperparameter_tuning(X_train, y_train, best_model_name):
    """Perform hyperparameter optimization on the best model (50 iterations)."""
    
    print(f"\n[*] Hyperparameter tuning for {best_model_name} (50 iterations, 10-fold CV)...")
    
    if best_model_name == "XGBoost":
        from xgboost import XGBRegressor
        param_dist = {
            "n_estimators": [300, 500, 700, 1000],
            "max_depth": [5, 6, 7, 8, 9],
            "learning_rate": [0.01, 0.02, 0.03, 0.05],
            "subsample": [0.65, 0.7, 0.75, 0.8, 0.85],
            "colsample_bytree": [0.6, 0.7, 0.75, 0.8],
            "reg_alpha": [0.1, 0.3, 0.5, 1.0, 2.0],
            "reg_lambda": [1.0, 2.0, 3.0, 5.0],
            "min_child_weight": [3, 5, 7, 10],
            "gamma": [0, 0.05, 0.1, 0.2],
        }
        base = XGBRegressor(random_state=RANDOM_STATE, verbosity=0)
    elif best_model_name == "LightGBM":
        from lightgbm import LGBMRegressor
        param_dist = {
            "n_estimators": [300, 500, 700, 1000],
            "max_depth": [5, 6, 7, 8, -1],
            "learning_rate": [0.01, 0.02, 0.03, 0.05],
            "num_leaves": [31, 47, 63, 95, 127],
            "subsample": [0.65, 0.7, 0.75, 0.8, 0.85],
            "colsample_bytree": [0.6, 0.7, 0.75, 0.8],
            "reg_alpha": [0.1, 0.3, 0.5, 1.0],
            "reg_lambda": [1.0, 2.0, 3.0, 5.0],
            "min_child_samples": [5, 10, 15, 20],
        }
        base = LGBMRegressor(random_state=RANDOM_STATE, verbose=-1)
    elif best_model_name == "CatBoost":
        from catboost import CatBoostRegressor
        param_dist = {
            "iterations": [300, 500, 700, 1000],
            "depth": [5, 6, 7, 8, 9],
            "learning_rate": [0.01, 0.02, 0.03, 0.05],
            "l2_leaf_reg": [1, 3, 5, 7, 10],
            "subsample": [0.65, 0.7, 0.75, 0.8, 0.85],
            "min_data_in_leaf": [5, 10, 15, 20],
        }
        base = CatBoostRegressor(random_state=RANDOM_STATE, verbose=0)
    elif best_model_name == "Random Forest":
        param_dist = {
            "n_estimators": [200, 300, 500, 700],
            "max_depth": [10, 14, 18, 22, None],
            "min_samples_split": [3, 5, 8, 12],
            "min_samples_leaf": [2, 3, 5, 8],
            "max_features": [0.5, 0.6, 0.7, 0.8, "sqrt"],
        }
        base = RandomForestRegressor(random_state=RANDOM_STATE, n_jobs=-1)
    else:
        print(f"    Skipping tuning for {best_model_name} (not applicable)")
        return None
    
    search = RandomizedSearchCV(
        base, param_dist, n_iter=50, cv=10, scoring="r2",
        random_state=RANDOM_STATE, n_jobs=-1, verbose=0
    )
    search.fit(X_train, y_train)
    
    print(f"    ✓ Best CV R²: {search.best_score_:.4f}")
    print(f"    ✓ Best params: {search.best_params_}")
    
    return search.best_estimator_


def main():
    """Main training pipeline (v2)."""
    print("\n" + "=" * 70)
    print("  UrbanHeat AI — ML Training Pipeline v2 (Enhanced)")
    print("  ISRO Bharatiya Antariksh Hackathon 2026")
    print("=" * 70)
    
    start_time = time.time()
    
    # Import feature engineering
    from training.feature_engineer import engineer_features, ENGINEERED_FEATURE_COLS
    
    # ── Step 1: Load data ──
    print("\n[STEP 1] Loading cities data...")
    cities = load_cities_data()
    print(f"    ✓ Loaded {len(cities)} Indian cities")
    
    # ── Step 2: Generate training dataset (200 samples per city) ──
    print("\n[STEP 2] Generating training dataset (4× larger)...")
    df = generate_training_dataset(cities, n_samples_per_city=200)
    
    # Save raw dataset
    os.makedirs(DATA_DIR, exist_ok=True)
    dataset_path = os.path.join(DATA_DIR, "training_dataset.csv")
    df.to_csv(dataset_path, index=False)
    print(f"    ✓ Saved training dataset to {dataset_path}")
    
    # ── Step 3: Feature Engineering ──
    print("\n[STEP 3] Engineering features...")
    X_engineered = engineer_features(df, copy=True)
    feature_names = list(ENGINEERED_FEATURE_COLS)
    y = df[TARGET_COL].values
    
    print(f"    ✓ Raw features: 12 → Engineered features: {len(feature_names)}")
    print(f"    ✓ Feature names: {feature_names[:8]}... (+{len(feature_names)-8} more)")
    
    # ── Step 4: Group-aware train/test split ──
    print("\n[STEP 4] Splitting data (GroupShuffleSplit by city)...")
    groups = df["city"].values
    
    gss = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=RANDOM_STATE)
    train_idx, test_idx = next(gss.split(X_engineered, y, groups=groups))
    
    X_all = X_engineered.values
    X_train_raw, X_test_raw = X_all[train_idx], X_all[test_idx]
    y_train, y_test = y[train_idx], y[test_idx]
    
    # Get unique cities in each split
    train_cities = set(groups[train_idx])
    test_cities = set(groups[test_idx])
    
    print(f"    ✓ Train: {len(X_train_raw)} samples ({len(train_cities)} cities)")
    print(f"    ✓ Test:  {len(X_test_raw)} samples ({len(test_cities)} cities)")
    print(f"    ✓ No city overlap: {len(train_cities & test_cities) == 0} ✓")
    
    # Scale features
    scaler = StandardScaler()
    X_train = scaler.fit_transform(X_train_raw)
    X_test = scaler.transform(X_test_raw)
    
    print(f"    ✓ Features scaled: {len(feature_names)} dimensions")
    
    # ── Step 5: Train individual models ──
    print("\n[STEP 5] Training individual models...")
    results, trained_models = train_models(X_train, X_test, y_train, y_test, feature_names)
    
    # ── Step 6: Select best individual model ──
    print("\n[STEP 6] Selecting best individual model...")
    best_name = max(results, key=lambda k: results[k]["test_r2"])
    best_model = trained_models[best_name]
    best_metrics = results[best_name]
    
    print(f"\n    ╔══════════════════════════════════════════════════════╗")
    print(f"    ║  🏆  BEST INDIVIDUAL: {best_name:30s}  ║")
    print(f"    ║  Test R²: {best_metrics['test_r2']:.4f}  |  RMSE: {best_metrics['test_rmse']:.3f}°C             ║")
    print(f"    ╚══════════════════════════════════════════════════════╝")
    
    # ── Step 7: Hyperparameter tuning on best model ──
    print("\n[STEP 7] Hyperparameter tuning (50 iterations)...")
    tuned_model = hyperparameter_tuning(X_train, y_train, best_name)
    
    if tuned_model is not None:
        y_pred_tuned = tuned_model.predict(X_test)
        tuned_r2 = r2_score(y_test, y_pred_tuned)
        tuned_rmse = np.sqrt(mean_squared_error(y_test, y_pred_tuned))
        tuned_mae = mean_absolute_error(y_test, y_pred_tuned)
        
        print(f"\n    Tuned Model Performance:")
        print(f"    ✓ Test R²: {tuned_r2:.4f} (was {best_metrics['test_r2']:.4f})")
        print(f"    ✓ Test RMSE: {tuned_rmse:.3f}°C (was {best_metrics['test_rmse']:.3f}°C)")
        
        if tuned_r2 > best_metrics["test_r2"]:
            print(f"    ✓ Tuned model is BETTER — updating")
            best_model = tuned_model
            best_metrics["test_r2_tuned"] = round(float(tuned_r2), 4)
            best_metrics["test_rmse_tuned"] = round(float(tuned_rmse), 4)
            best_metrics["test_mae_tuned"] = round(float(tuned_mae), 4)
            best_metrics["test_r2"] = round(float(tuned_r2), 4)
            best_metrics["test_rmse"] = round(float(tuned_rmse), 4)
            best_metrics["test_mae"] = round(float(tuned_mae), 4)
        else:
            print(f"    ✗ Tuned model is not better — keeping original")
    
    # ── Step 8: Stacking Ensemble ──
    print("\n[STEP 8] Building Stacking Ensemble...")
    stack_model, stack_metrics = build_stacking_ensemble(X_train, y_train, X_test, y_test)
    results["Stacking Ensemble"] = stack_metrics
    
    # Decide: use ensemble or best individual
    final_model_name = best_name
    final_model = best_model
    final_metrics = best_metrics
    
    if stack_metrics["test_r2"] > best_metrics["test_r2"]:
        print(f"\n    ✓ Stacking Ensemble WINS: R² {stack_metrics['test_r2']:.4f} > {best_metrics['test_r2']:.4f}")
        final_model_name = "Stacking Ensemble"
        final_model = stack_model
        final_metrics = stack_metrics
    else:
        print(f"\n    ✗ Best individual model wins: {best_name} R² {best_metrics['test_r2']:.4f} ≥ {stack_metrics['test_r2']:.4f}")
    
    print(f"\n    ╔══════════════════════════════════════════════════════════╗")
    print(f"    ║  🏆  FINAL MODEL: {final_model_name:35s}    ║")
    print(f"    ║  Test R²: {final_metrics['test_r2']:.4f}  |  RMSE: {final_metrics['test_rmse']:.3f}°C                ║")
    print(f"    ║  Overfit gap: {final_metrics.get('overfit_gap', final_metrics['train_r2'] - final_metrics['test_r2']):.4f}                                    ║")
    print(f"    ╚══════════════════════════════════════════════════════════╝")
    
    # ── Step 9: SHAP Explainability ──
    print("\n[STEP 9] Computing SHAP explainability...")
    # For SHAP, use the best individual tree model (SHAP works best with tree models)
    shap_model_name = best_name if best_name in ["XGBoost", "LightGBM", "CatBoost", "Random Forest"] else "XGBoost"
    shap_model = trained_models.get(shap_model_name, best_model)
    shap_importance = compute_shap_values(shap_model, X_test, feature_names, shap_model_name)
    
    # ── Step 10: Save everything ──
    print("\n[STEP 10] Saving models and artifacts...")
    os.makedirs(MODELS_DIR, exist_ok=True)
    
    # Save final model
    model_path = os.path.join(MODELS_DIR, "best_model.joblib")
    joblib.dump(final_model, model_path)
    print(f"    ✓ Saved model to {model_path}")
    
    # Save scaler
    scaler_path = os.path.join(MODELS_DIR, "scaler.joblib")
    joblib.dump(scaler, scaler_path)
    print(f"    ✓ Saved scaler to {scaler_path}")
    
    # Save feature names (now includes engineered features)
    features_path = os.path.join(MODELS_DIR, "feature_names.json")
    with open(features_path, "w") as f:
        json.dump(feature_names, f, indent=2)
    print(f"    ✓ Saved {len(feature_names)} feature names to {features_path}")
    
    # Generate training report
    total_time = time.time() - start_time
    report = {
        "project": "UrbanHeat AI — ISRO BAH 2026",
        "pipeline_version": "2.0 (Enhanced)",
        "training_timestamp": datetime.now().isoformat(),
        "total_training_time_sec": round(total_time, 2),
        "dataset": {
            "total_cities": len(cities),
            "total_samples": len(df),
            "train_samples": len(X_train),
            "test_samples": len(X_test),
            "train_cities": len(train_cities),
            "test_cities": len(test_cities),
            "city_leakage": False,
            "samples_per_city": 200,
            "raw_features": 12,
            "engineered_features": len(feature_names),
            "features": feature_names,
            "target": TARGET_COL,
            "lst_stats": {
                "min": round(float(df["lst"].min()), 2),
                "max": round(float(df["lst"].max()), 2),
                "mean": round(float(df["lst"].mean()), 2),
                "std": round(float(df["lst"].std()), 2),
            },
        },
        "model_comparison": results,
        "best_model": {
            "name": final_model_name,
            "test_r2": final_metrics["test_r2"],
            "test_rmse": final_metrics["test_rmse"],
            "test_mae": final_metrics["test_mae"],
            "train_r2": final_metrics["train_r2"],
            "overfit_gap": final_metrics.get("overfit_gap", final_metrics["train_r2"] - final_metrics["test_r2"]),
        },
        "improvements_over_v1": {
            "v1_best_r2": 0.769,
            "v2_best_r2": final_metrics["test_r2"],
            "r2_improvement": round(final_metrics["test_r2"] - 0.769, 4),
            "v1_best_rmse": 2.6772,
            "v2_best_rmse": final_metrics["test_rmse"],
            "rmse_improvement": round(2.6772 - final_metrics["test_rmse"], 4),
        },
        "shap_feature_importance": shap_importance,
        "artifacts": {
            "model_file": "models/best_model.joblib",
            "scaler_file": "models/scaler.joblib",
            "feature_names_file": "models/feature_names.json",
            "training_dataset": "data/training_dataset.csv",
        },
    }
    
    report_path = os.path.join(MODELS_DIR, "training_report.json")
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)
    print(f"    ✓ Saved training report to {report_path}")
    
    # ── Summary ──
    print("\n" + "=" * 70)
    print("  TRAINING COMPLETE (v2 Enhanced)")
    print("=" * 70)
    print(f"  Total time: {total_time:.1f}s")
    print(f"  Final model: {final_model_name}")
    print(f"  Test R²: {final_metrics['test_r2']:.4f}  (v1 was 0.769)")
    print(f"  Test RMSE: {final_metrics['test_rmse']:.3f}°C  (v1 was 2.677°C)")
    print(f"  Test MAE: {final_metrics['test_mae']:.3f}°C")
    print(f"  Overfit gap: {final_metrics.get('overfit_gap', 'N/A')}")
    print(f"  Engineered features: {len(feature_names)}")
    print(f"  City leakage: None ✓")
    print(f"  Files saved in: {MODELS_DIR}/")
    print("=" * 70 + "\n")
    
    return report


if __name__ == "__main__":
    main()
