# UrbanHeat AI — Data Processing Pipeline

This directory contains scripts for fetching, cleaning, and preprocessing satellite and climate data used by the ML engine and frontend.

## Directory Structure

```text
data-pipeline/
├── data/
│   └── cities.json          # Canonical shared city climate dataset
├── scripts/
│   ├── fetch_satellite.py   # Stub for downloading Landsat/MODIS data from Bhuvan/Google Earth Engine
│   ├── process_landsat.py   # Stub for computing NDVI and LST from raw bands
│   └── generate_features.py # Stub for generating ML feature sets
└── README.md
```

## Setup & Usage

1. **Virtual Environment**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install pandas numpy requests rasterio geopandas
   ```

2. **Fetching Data**:
   ```bash
   python scripts/fetch_satellite.py --city Delhi
   ```
