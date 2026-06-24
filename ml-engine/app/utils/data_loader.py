import os
import json
from typing import Dict, List, Any

def load_cities_data() -> List[Dict[str, Any]]:
    """
    Loads city data from the canonical shared cities.json file.
    Falls back to a default minimal dataset if the file is not found.
    """
    # Try finding the data in data-pipeline/data/cities.json
    possible_paths = [
        os.path.join(os.path.dirname(__file__), "..", "..", "..", "data-pipeline", "data", "cities.json"),
        os.path.join(os.path.dirname(__file__), "..", "data", "cities.json"),
        "/Users/mr.aniruddh/Desktop/Me/Hecathon/Isro Hecathon Project/data-pipeline/data/cities.json"
    ]
    
    for path in possible_paths:
        if os.path.exists(path):
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                print(f"Error reading cities data from {path}: {e}")
                
    # Fallback default dataset
    return [
        {
            "id": "delhi",
            "name": "Delhi",
            "state": "Delhi",
            "lat": 28.6139,
            "lng": 77.2090,
            "baseline_temp": 31.5,
            "ndvi": 0.18,
            "albedo": 0.15,
            "building_density": 0.75,
            "relative_humidity": 45.0
        },
        {
            "id": "mumbai",
            "name": "Mumbai",
            "state": "Maharashtra",
            "lat": 19.0760,
            "lng": 72.8777,
            "baseline_temp": 28.5,
            "ndvi": 0.22,
            "albedo": 0.12,
            "building_density": 0.80,
            "relative_humidity": 75.0
        }
    ]
