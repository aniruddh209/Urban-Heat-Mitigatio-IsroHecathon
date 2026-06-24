# SHAP Explainability helper methods for UHI predictions
from typing import Dict, List, Any

def get_shap_summary(ndvi: float, albedo: float, building_density: float, relative_humidity: float) -> Dict[str, Any]:
    """
    Computes explainability scores and insights.
    """
    # Simple relative importance weights
    contributions = {
        "vegetation": -5.2 * (ndvi - 0.3),
        "albedo": -4.0 * (albedo - 0.2),
        "building_density": 8.5 * (building_density - 0.4),
        "humidity": -0.05 * (relative_humidity - 50.0)
    }
    
    total_impact = sum(abs(v) for v in contributions.values())
    if total_impact == 0:
        total_impact = 1.0
        
    percentages = {k: round((abs(v) / total_impact) * 100, 1) for k, v in contributions.items()}
    
    return {
        "contributions": contributions,
        "relative_importance_percent": percentages,
        "dominant_factor": max(contributions, key=lambda k: abs(contributions[k])),
        "recommendation": "Increase urban green cover (NDVI) or tree canopy density." if contributions["building_density"] > abs(contributions["vegetation"]) else "Apply highly reflective coatings (cool roofs/cool pavements)."
    }
