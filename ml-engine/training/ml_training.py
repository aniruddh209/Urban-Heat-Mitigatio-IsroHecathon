#!/usr/bin/env python3
"""
UrbanHeat AI — ML Training Pipeline
====================================
Trains and compares multiple ML models for Land Surface Temperature (LST) prediction.
Models: Linear Regression, Random Forest, XGBoost, LightGBM, CatBoost, SVR
Performs cross-validation, hyperparameter tuning, SHAP explainability.
Auto-selects the best model and saves it for the FastAPI inference engine.

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

from sklearn.model_selection import train_test_split, cross_val_score, RandomizedSearchCV
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.svm import SVR
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import joblib

warnings.filterwarnings("ignore")

# ─── CONSTANTS ─────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "models")
DATA_DIR = os.path.join(BASE_DIR, "data")
CITIES_JSON = os.path.join(BASE_DIR, "..", "data-pipeline", "data", "cities.json")

FEATURE_COLS = [
    "ndvi", "ndbi", "albedo", "humidity", "population_density",
    "building_density", "elevation_m", "rainfall_mm", "aqi",
    "green_cover_pct", "water_body_pct", "wind_speed"
]
TARGET_COL = "lst"
RANDOM_STATE = 42


def load_cities_data():
    """Load the 100+ Indian cities dataset."""
    if os.path.exists(CITIES_JSON):
        with open(CITIES_JSON, "r") as f:
            return json.load(f)
    # Fallback to looking in other locations
    alt_path = os.path.join(BASE_DIR, "data", "cities.json")
    if os.path.exists(alt_path):
        with open(alt_path, "r") as f:
            return json.load(f)
    raise FileNotFoundError(f"Cannot find cities.json. Searched:\n  {CITIES_JSON}\n  {alt_path}")


def generate_training_dataset(cities, n_samples_per_city=50):
    """
    Generate a scientifically realistic training dataset.
    
    For each city, we create multiple synthetic samples by adding calibrated 
    Gaussian noise to real city parameters. This simulates spatial and temporal 
    variability within each city (e.g., different wards, seasons).
    
    The LST target is computed using a physics-informed formula that models:
    - Solar absorption by built-up surfaces (+NDBI effect)
    - Evapotranspiration cooling by vegetation (-NDVI effect)
    - Albedo reflection (-albedo effect)
    - Humidity modulation
    - Elevation lapse rate
    - Population-driven anthropogenic heat
    """
    print(f"[*] Generating training dataset from {len(cities)} cities × {n_samples_per_city} samples each...")
    
    rows = []
    rng = np.random.RandomState(RANDOM_STATE)
    
    for city in cities:
        pop_density = city["population"] / max(city["area_km2"], 1)
        building_density = city.get("built_up_pct", 50.0) / 100.0
        albedo = 0.30 - 0.18 * building_density + 0.12 * city.get("ndvi", 0.2)  # Estimated surface albedo
        wind_speed = 8.0 + rng.normal(0, 2)
        
        for _ in range(n_samples_per_city):
            # Add realistic spatial/temporal variability
            ndvi = np.clip(city["ndvi"] + rng.normal(0, 0.06), 0.01, 0.85)
            ndbi = np.clip(city["ndbi"] + rng.normal(0, 0.05), 0.05, 0.95)
            alb = np.clip(albedo + rng.normal(0, 0.03), 0.05, 0.60)
            hum = np.clip(city["humidity"] + rng.normal(0, 6), 15, 98)
            pop_d = max(100, pop_density + rng.normal(0, pop_density * 0.15))
            build_d = np.clip(building_density + rng.normal(0, 0.05), 0.05, 0.98)
            elev = max(0, city["elevation_m"] + rng.normal(0, 10))
            rain = max(0, city["rainfall_mm"] + rng.normal(0, 50))
            aqi_val = max(10, city["aqi"] + rng.normal(0, 20))
            gc = np.clip(city["green_cover_pct"] + rng.normal(0, 2), 1, 80)
            wb = np.clip(city.get("water_body_pct", 3.0) + rng.normal(0, 0.5), 0, 30)
            ws = max(0.5, wind_speed + rng.normal(0, 2.5))
            
            # Physics-informed LST model
            # Baseline: city's average temp adjusted for time variability
            baseline = city["avg_temp"] + rng.normal(2.0, 2.5)  # Daytime is warmer
            
            # UHI effect from built-up surfaces (absorb and re-radiate heat)
            uhi_buildup = 8.5 * (ndbi - 0.35) + 3.2 * (build_d - 0.4)
            
            # Vegetation cooling via evapotranspiration
            veg_cooling = -6.5 * (ndvi - 0.15) - 0.08 * (gc - 10)
            
            # Albedo: higher reflectivity = less absorbed solar radiation
            albedo_effect = -5.0 * (alb - 0.20)
            
            # Humidity modulation (high humidity reduces diurnal range)
            humidity_effect = -0.03 * (hum - 50)
            
            # Elevation lapse rate (~6.5°C per 1000m)
            elev_effect = -0.0065 * (elev - 200)
            
            # Population-driven anthropogenic heat
            anthro_heat = 0.8 * np.log10(max(pop_d, 100)) - 2.0
            
            # Water body cooling
            water_cooling = -0.15 * (wb - 3)
            
            # Wind cooling effect
            wind_effect = -0.08 * (ws - 8)
            
            # Rainfall proxy for cloud cover/cooling
            rain_effect = -0.0005 * (rain - 800)
            
            # AQI greenhouse effect (polluted air traps heat)
            aqi_effect = 0.005 * (aqi_val - 100)
            
            # Compute LST with noise for natural variability
            lst = (baseline + uhi_buildup + veg_cooling + albedo_effect +
                   humidity_effect + elev_effect + anthro_heat + water_cooling +
                   wind_effect + rain_effect + aqi_effect + rng.normal(0, 0.8))
            
            # Clamp to realistic range
            lst = np.clip(lst, 18.0, 55.0)
            
            rows.append({
                "city": city["name"],
                "lat": city["lat"] + rng.normal(0, 0.01),
                "lng": city["lng"] + rng.normal(0, 0.01),
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
                "lst": round(lst, 2),
            })
    
    df = pd.DataFrame(rows)
    print(f"[+] Generated {len(df)} training samples")
    print(f"    LST range: {df['lst'].min():.1f}°C — {df['lst'].max():.1f}°C")
    print(f"    LST mean: {df['lst'].mean():.1f}°C, std: {df['lst'].std():.1f}°C")
    return df


def train_models(X_train, X_test, y_train, y_test, feature_names):
    """Train and compare multiple ML models."""
    
    # Import ML libraries (installed via requirements.txt)
    from xgboost import XGBRegressor
    from lightgbm import LGBMRegressor
    from catboost import CatBoostRegressor
    
    models = {
        "Linear Regression": LinearRegression(),
        "Random Forest": RandomForestRegressor(
            n_estimators=200, max_depth=12, min_samples_split=5,
            min_samples_leaf=3, random_state=RANDOM_STATE, n_jobs=-1
        ),
        "XGBoost": XGBRegressor(
            n_estimators=300, max_depth=8, learning_rate=0.05,
            subsample=0.8, colsample_bytree=0.8, reg_alpha=0.1,
            reg_lambda=1.0, random_state=RANDOM_STATE, verbosity=0
        ),
        "LightGBM": LGBMRegressor(
            n_estimators=300, max_depth=8, learning_rate=0.05,
            subsample=0.8, colsample_bytree=0.8, reg_alpha=0.1,
            reg_lambda=1.0, random_state=RANDOM_STATE, verbose=-1,
            num_leaves=63
        ),
        "CatBoost": CatBoostRegressor(
            iterations=300, depth=8, learning_rate=0.05,
            random_state=RANDOM_STATE, verbose=0,
            l2_leaf_reg=3.0
        ),
        "SVR": SVR(kernel="rbf", C=10.0, epsilon=0.1, gamma="scale"),
    }
    
    results = {}
    trained_models = {}
    
    print("\n" + "=" * 70)
    print("  MODEL TRAINING & COMPARISON")
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
        
        # Cross-validation (5-fold)
        cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring="r2", n_jobs=-1)
        
        results[name] = {
            "train_rmse": round(float(train_rmse), 4),
            "test_rmse": round(float(test_rmse), 4),
            "train_mae": round(float(train_mae), 4),
            "test_mae": round(float(test_mae), 4),
            "train_r2": round(float(train_r2), 4),
            "test_r2": round(float(test_r2), 4),
            "cv_r2_mean": round(float(cv_scores.mean()), 4),
            "cv_r2_std": round(float(cv_scores.std()), 4),
            "training_time_sec": round(train_time, 2),
        }
        trained_models[name] = model
        
        print(f"    ✓ Train R²: {train_r2:.4f}  |  Test R²: {test_r2:.4f}")
        print(f"    ✓ Train RMSE: {train_rmse:.3f}°C  |  Test RMSE: {test_rmse:.3f}°C")
        print(f"    ✓ CV R² (5-fold): {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
        print(f"    ✓ Training time: {train_time:.2f}s")
    
    return results, trained_models


def compute_shap_values(model, X_test, feature_names, model_name):
    """Compute SHAP values for the best model."""
    import shap
    
    print(f"\n[*] Computing SHAP values for {model_name}...")
    
    # Use appropriate explainer based on model type
    tree_models = ["XGBoost", "LightGBM", "CatBoost", "Random Forest"]
    
    if model_name in tree_models:
        explainer = shap.TreeExplainer(model)
        # Use a subset for speed
        X_sample = X_test[:min(500, len(X_test))]
        shap_values = explainer.shap_values(X_sample)
    else:
        # Kernel SHAP for non-tree models (slower, use smaller sample)
        X_sample = X_test[:min(100, len(X_test))]
        explainer = shap.KernelExplainer(model.predict, X_sample[:50])
        shap_values = explainer.shap_values(X_sample)
    
    # Compute mean absolute SHAP for feature importance
    mean_abs_shap = np.abs(shap_values).mean(axis=0)
    total = mean_abs_shap.sum()
    
    feature_importance = {}
    for i, feat in enumerate(feature_names):
        feature_importance[feat] = {
            "mean_abs_shap": round(float(mean_abs_shap[i]), 4),
            "importance_pct": round(float(mean_abs_shap[i] / total * 100), 2),
        }
    
    # Sort by importance
    feature_importance = dict(
        sorted(feature_importance.items(), key=lambda x: x[1]["mean_abs_shap"], reverse=True)
    )
    
    print("    Feature Importance (SHAP):")
    for feat, vals in list(feature_importance.items())[:8]:
        bar = "█" * int(vals["importance_pct"] / 2)
        print(f"      {feat:25s} {vals['importance_pct']:5.1f}%  {bar}")
    
    return feature_importance


def hyperparameter_tuning(X_train, y_train, best_model_name):
    """Perform hyperparameter optimization on the best model."""
    
    print(f"\n[*] Hyperparameter tuning for {best_model_name}...")
    
    if best_model_name == "XGBoost":
        from xgboost import XGBRegressor
        param_dist = {
            "n_estimators": [200, 300, 500],
            "max_depth": [6, 8, 10, 12],
            "learning_rate": [0.01, 0.03, 0.05, 0.1],
            "subsample": [0.7, 0.8, 0.9],
            "colsample_bytree": [0.7, 0.8, 0.9],
            "reg_alpha": [0, 0.1, 0.5],
            "reg_lambda": [0.5, 1.0, 2.0],
        }
        base = XGBRegressor(random_state=RANDOM_STATE, verbosity=0)
    elif best_model_name == "LightGBM":
        from lightgbm import LGBMRegressor
        param_dist = {
            "n_estimators": [200, 300, 500],
            "max_depth": [6, 8, 10, -1],
            "learning_rate": [0.01, 0.03, 0.05, 0.1],
            "num_leaves": [31, 63, 127],
            "subsample": [0.7, 0.8, 0.9],
            "colsample_bytree": [0.7, 0.8, 0.9],
        }
        base = LGBMRegressor(random_state=RANDOM_STATE, verbose=-1)
    elif best_model_name == "CatBoost":
        from catboost import CatBoostRegressor
        param_dist = {
            "iterations": [200, 300, 500],
            "depth": [6, 8, 10],
            "learning_rate": [0.01, 0.03, 0.05, 0.1],
            "l2_leaf_reg": [1, 3, 5, 7],
        }
        base = CatBoostRegressor(random_state=RANDOM_STATE, verbose=0)
    elif best_model_name == "Random Forest":
        param_dist = {
            "n_estimators": [100, 200, 300, 500],
            "max_depth": [8, 12, 16, 20, None],
            "min_samples_split": [2, 5, 10],
            "min_samples_leaf": [1, 2, 4],
        }
        base = RandomForestRegressor(random_state=RANDOM_STATE, n_jobs=-1)
    else:
        print(f"    Skipping tuning for {best_model_name} (not applicable)")
        return None
    
    search = RandomizedSearchCV(
        base, param_dist, n_iter=20, cv=5, scoring="r2",
        random_state=RANDOM_STATE, n_jobs=-1, verbose=0
    )
    search.fit(X_train, y_train)
    
    print(f"    ✓ Best CV R²: {search.best_score_:.4f}")
    print(f"    ✓ Best params: {search.best_params_}")
    
    return search.best_estimator_


def main():
    """Main training pipeline."""
    print("\n" + "=" * 70)
    print("  UrbanHeat AI — ML Training Pipeline")
    print("  ISRO Bharatiya Antariksh Hackathon 2026")
    print("=" * 70)
    
    start_time = time.time()
    
    # ── Step 1: Load data ──
    print("\n[STEP 1] Loading cities data...")
    cities = load_cities_data()
    print(f"    ✓ Loaded {len(cities)} Indian cities")
    
    # ── Step 2: Generate training dataset ──
    print("\n[STEP 2] Generating training dataset...")
    df = generate_training_dataset(cities, n_samples_per_city=50)
    
    # Save dataset
    os.makedirs(DATA_DIR, exist_ok=True)
    dataset_path = os.path.join(DATA_DIR, "training_dataset.csv")
    df.to_csv(dataset_path, index=False)
    print(f"    ✓ Saved training dataset to {dataset_path}")
    
    # ── Step 3: Prepare features ──
    print("\n[STEP 3] Preparing features...")
    X = df[FEATURE_COLS].values
    y = df[TARGET_COL].values
    
    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Split
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, random_state=RANDOM_STATE
    )
    print(f"    ✓ Train: {len(X_train)} samples  |  Test: {len(X_test)} samples")
    print(f"    ✓ Features: {len(FEATURE_COLS)}")
    
    # ── Step 4: Train models ──
    print("\n[STEP 4] Training models...")
    results, trained_models = train_models(X_train, X_test, y_train, y_test, FEATURE_COLS)
    
    # ── Step 5: Select best model ──
    print("\n[STEP 5] Selecting best model...")
    best_name = max(results, key=lambda k: results[k]["test_r2"])
    best_model = trained_models[best_name]
    best_metrics = results[best_name]
    
    print(f"\n    ╔══════════════════════════════════════════════╗")
    print(f"    ║  🏆  BEST MODEL: {best_name:28s} ║")
    print(f"    ║  Test R²: {best_metrics['test_r2']:.4f}                           ║")
    print(f"    ║  Test RMSE: {best_metrics['test_rmse']:.3f}°C                        ║")
    print(f"    ╚══════════════════════════════════════════════╝")
    
    # ── Step 6: Hyperparameter tuning on best model ──
    print("\n[STEP 6] Hyperparameter tuning...")
    tuned_model = hyperparameter_tuning(X_train, y_train, best_name)
    
    if tuned_model is not None:
        # Re-evaluate tuned model
        y_pred_tuned = tuned_model.predict(X_test)
        tuned_r2 = r2_score(y_test, y_pred_tuned)
        tuned_rmse = np.sqrt(mean_squared_error(y_test, y_pred_tuned))
        tuned_mae = mean_absolute_error(y_test, y_pred_tuned)
        
        print(f"\n    Tuned Model Performance:")
        print(f"    ✓ Test R²: {tuned_r2:.4f} (was {best_metrics['test_r2']:.4f})")
        print(f"    ✓ Test RMSE: {tuned_rmse:.3f}°C (was {best_metrics['test_rmse']:.3f}°C)")
        
        if tuned_r2 > best_metrics["test_r2"]:
            print(f"    ✓ Tuned model is BETTER — using tuned version")
            best_model = tuned_model
            best_metrics["test_r2_tuned"] = round(float(tuned_r2), 4)
            best_metrics["test_rmse_tuned"] = round(float(tuned_rmse), 4)
            best_metrics["test_mae_tuned"] = round(float(tuned_mae), 4)
        else:
            print(f"    ✗ Tuned model is not better — keeping original")
    
    # ── Step 7: SHAP Explainability ──
    print("\n[STEP 7] Computing SHAP explainability...")
    shap_importance = compute_shap_values(best_model, X_test, FEATURE_COLS, best_name)
    
    # ── Step 8: Save models and reports ──
    print("\n[STEP 8] Saving models and artifacts...")
    os.makedirs(MODELS_DIR, exist_ok=True)
    
    # Save best model
    model_path = os.path.join(MODELS_DIR, "best_model.joblib")
    joblib.dump(best_model, model_path)
    print(f"    ✓ Saved model to {model_path}")
    
    # Save scaler
    scaler_path = os.path.join(MODELS_DIR, "scaler.joblib")
    joblib.dump(scaler, scaler_path)
    print(f"    ✓ Saved scaler to {scaler_path}")
    
    # Save feature names
    features_path = os.path.join(MODELS_DIR, "feature_names.json")
    with open(features_path, "w") as f:
        json.dump(FEATURE_COLS, f, indent=2)
    print(f"    ✓ Saved feature names to {features_path}")
    
    # Generate training report
    total_time = time.time() - start_time
    report = {
        "project": "UrbanHeat AI — ISRO BAH 2026",
        "training_timestamp": datetime.now().isoformat(),
        "total_training_time_sec": round(total_time, 2),
        "dataset": {
            "total_cities": len(cities),
            "total_samples": len(df),
            "train_samples": len(X_train),
            "test_samples": len(X_test),
            "features": FEATURE_COLS,
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
            "name": best_name,
            "test_r2": best_metrics["test_r2"],
            "test_rmse": best_metrics["test_rmse"],
            "test_mae": best_metrics["test_mae"],
            "cv_r2_mean": best_metrics["cv_r2_mean"],
            "cv_r2_std": best_metrics["cv_r2_std"],
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
    print("  TRAINING COMPLETE")
    print("=" * 70)
    print(f"  Total time: {total_time:.1f}s")
    print(f"  Best model: {best_name}")
    print(f"  Test R²: {best_metrics['test_r2']:.4f}")
    print(f"  Test RMSE: {best_metrics['test_rmse']:.3f}°C")
    print(f"  Test MAE: {best_metrics['test_mae']:.3f}°C")
    print(f"  Files saved in: {MODELS_DIR}/")
    print("=" * 70 + "\n")
    
    return report


if __name__ == "__main__":
    main()
