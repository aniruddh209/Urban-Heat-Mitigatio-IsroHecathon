# API Reference — UrbanHeat AI

Documentation of HTTP routes exposed by the Express backend Gateway and the Python ML Engine.

---

## 1. Gateway API (Express Backend — Port 3001)

### Authentication
* **POST `/api/auth/login`**
  - Authenticates user and returns JWT.
  - Body: `{ email, password }`
  - Response: `{ token, user: { id, name, email, role } }`
* **POST `/api/auth/signup`**
  - Registers a new user.
  - Body: `{ name, email, password, role }`
* **POST `/api/auth/forgot-password`**
  - Sends password reset link.
* **POST `/api/auth/verify-otp`**
  - Verifies OTP for password reset.

### Cities Data
* **GET `/api/v1/cities/`**
  - Returns all 100 Indian cities with climate telemetry.
* **GET `/api/v1/cities/:id`**
  - Returns detailed data for a single city.
* **GET `/api/v1/cities/top-risk?n=20`**
  - Returns top-N cities by risk score.

### Maps & Layers
* **GET `/api/v1/maps/cities-geojson`**
  - Returns GeoJSON FeatureCollection of all cities.
* **GET `/api/v1/maps/heat-layer`**
  - Heat intensity layer (LST-based).
* **GET `/api/v1/maps/aqi-layer`**
  - Air Quality Index layer.
* **GET `/api/v1/maps/vegetation-layer`**
  - NDVI/Green cover layer.
* **GET `/api/v1/maps/india-boundary`**
  - Simplified India boundary polygon.
* **GET `/api/v1/maps/india-heatmap`**
  - ⭐ Full India heatmap with 100 cities, color gradients, legend.

### Analytics
* **GET `/api/v1/analytics/summary`**
  - Platform-wide statistics (avg UHI, AQI, green cover, etc.)
* **GET `/api/v1/analytics/trends`**
  - 2015–2025 trends (temperature, AQI, green cover, UHI, rainfall)
* **GET `/api/v1/analytics/state-comparison`**
  - State-level comparison rankings.
* **GET `/api/v1/analytics/sdg-impact`**
  - SDG 3/11/13 impact metrics.

### Alerts
* **GET `/api/v1/alerts/active`**
  - Active heat alerts (filtered by risk_score > 70).
* **GET `/api/v1/alerts/history`**
  - Historical alert records.

### Reports
* **GET `/api/v1/reports/generate/:city_id`**
  - Generates comprehensive city report.
* **GET `/api/v1/reports/templates`**
  - Available report templates.
* **GET `/api/v1/reports/bulk-summary`**
  - Bulk report summary across all cities.

### Recommendations
* **GET `/api/v1/recommendations/:city_id`**
  - City-specific action plan with prioritized interventions.

### Admin
* **GET `/api/v1/admin/dashboard`**
  - Admin metrics (users, API calls, model status).
* **GET `/api/v1/admin/users`**
  - User list.
* **GET `/api/v1/admin/logs`**
  - System logs.

---

## 2. Intelligence API (Python ML Engine — Port 8000)

All ML endpoints are proxied through the backend at the same paths.

### Health
* **GET `/`**
  - Returns ML Engine status, version, model info.

### Prediction
* **POST `/api/v1/ml/predict/`**
  - Predicts Land Surface Temperature using trained **CatBoost** model.
  - Body:
    ```json
    {
      "ndvi": 0.18, "ndbi": 0.72, "albedo": 0.15,
      "building_density": 0.78, "relative_humidity": 56,
      "population_density": 22200, "elevation_m": 216,
      "rainfall_mm": 797, "aqi": 278, "green_cover_pct": 12.1,
      "water_body_pct": 2.3, "wind_speed": 8, "baseline_temp": 25.2
    }
    ```
  - Response: `{ predicted_lst, uhi_intensity, risk_level, model_used, model_r2, confidence }`

### Simulation
* **POST `/api/v1/ml/simulate/`**
  - Simulates cooling interventions using the trained model.
  - Body:
    ```json
    {
      "current_lst": 42.5, "baseline_ndvi": 0.18, "baseline_albedo": 0.15,
      "interventions": [
        { "type": "urban_forestry", "coverage_ratio": 0.5 },
        { "type": "cool_pavement", "coverage_ratio": 0.4 }
      ]
    }
    ```
  - Supported interventions: `green_roof`, `cool_pavement`, `urban_forestry`, `reflective_roof`, `water_bodies`, `tree_plantation`
  - Response: `{ before_lst, after_lst, temperature_drop, effectiveness_score, interventions[], model_used }`

### Hotspot Detection
* **POST `/api/v1/ml/hotspots/`**
  - Detects urban heat hotspots using real spatial clustering.
  - Methods: `dbscan` (default), `kmeans`, `gi_star` (Getis-Ord Gi*)
  - Body: `{ points: [{ lat, lng, temperature, name }], method: "dbscan" }`
  - Response: `{ hotspots[], total_candidates, method_used, zone_summary }`

### Explainability (SHAP)
* **POST `/api/v1/ml/explain/`**
  - Computes **real SHAP TreeExplainer** values for a prediction.
  - Returns per-feature attribution with importance percentages and human-readable descriptions.
  - Response: `{ base_value, predicted_lst, shap_values[], top_heating_factor, top_cooling_factor, model_used }`

### Optimization
* **POST `/api/v1/ml/optimize/`**
  - Uses **Genetic Algorithm** (population=50, generations=30) to find optimal intervention mix.
  - Body: `{ target_temp_reduction: 3.0, max_budget_crores: 50.0, current_ndvi, current_albedo, ... }`
  - Response: `{ feasible, total_cost_crores, total_temp_reduction, interventions[], optimization_method }`

### Reports
* **GET `/api/v1/ml/report/training-report`**
  - Full ML training report with 6-model comparison metrics.
* **GET `/api/v1/ml/report/hotspot-report`**
  - Hotspot analysis report (KMeans zones, DBSCAN clusters, Gi* z-scores).
* **GET `/api/v1/ml/report/model-info`**
  - Currently loaded model info and feature list.

---

## 3. ML Models Summary

| Model | Test R² | Test RMSE | Status |
|-------|---------|-----------|--------|
| **CatBoost** | **0.7690** | **2.677°C** | ⭐ Selected |
| Random Forest | 0.7636 | 2.709°C | Compared |
| SVR | 0.7590 | 2.734°C | Compared |
| XGBoost | 0.7524 | 2.772°C | Compared |
| LightGBM | 0.7516 | 2.776°C | Compared |
| Linear Regression | 0.7142 | 2.978°C | Compared |

**Training dataset**: 5,000 samples from 100 Indian cities × 50 synthetic variations each.
**Features**: NDVI, NDBI, albedo, humidity, population density, building density, elevation, rainfall, AQI, green cover %, water body %, wind speed.
**Explainability**: SHAP TreeExplainer with per-feature attribution.
