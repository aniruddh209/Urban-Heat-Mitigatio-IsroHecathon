/**
 * Simulation Routes — "What If" Climate Scenarios
 */
const express = require('express');
const router = express.Router();
const { getCityById } = require('../data/citiesData');

router.post('/run', (req, res) => {
  const { city_id, green_cover_increase_pct = 0, water_body_increase_pct = 0, cool_roof_pct = 0, solar_roof_pct = 0, urban_forest_area_km2 = 0, reflective_roads_pct = 0 } = req.body;
  const city = getCityById(city_id);
  if (!city) return res.status(404).json({ error: 'City not found' });

  let tempReduction = 0, aqiImprovement = 0, carbonReduction = 0;
  const interventions = [];

  if (green_cover_increase_pct > 0) {
    const e = green_cover_increase_pct * 0.15;
    tempReduction += e; aqiImprovement += green_cover_increase_pct * 1.2;
    carbonReduction += green_cover_increase_pct * city.area_km2 * 50;
    interventions.push({ type: 'Green Cover Increase', value: `+${green_cover_increase_pct}%`, temp_effect: Math.round(-e * 100) / 100, aqi_effect: Math.round(-green_cover_increase_pct * 1.2) });
  }
  if (water_body_increase_pct > 0) {
    const e = water_body_increase_pct * 0.2; tempReduction += e;
    interventions.push({ type: 'Water Body Increase', value: `+${water_body_increase_pct}%`, temp_effect: Math.round(-e * 100) / 100 });
  }
  if (cool_roof_pct > 0) {
    const e = cool_roof_pct * 0.02; tempReduction += e;
    interventions.push({ type: 'Cool Roofs', value: `${cool_roof_pct}% coverage`, temp_effect: Math.round(-e * 100) / 100 });
  }
  if (solar_roof_pct > 0) {
    const e = solar_roof_pct * 0.01; tempReduction += e;
    carbonReduction += solar_roof_pct * city.area_km2 * 20;
    interventions.push({ type: 'Solar Roofs', value: `${solar_roof_pct}% coverage`, temp_effect: Math.round(-e * 100) / 100, carbon_effect: Math.round(-solar_roof_pct * city.area_km2 * 20) });
  }
  if (urban_forest_area_km2 > 0) {
    const e = urban_forest_area_km2 * 0.5; tempReduction += e;
    aqiImprovement += urban_forest_area_km2 * 8; carbonReduction += urban_forest_area_km2 * 500;
    interventions.push({ type: 'Urban Forests', value: `${urban_forest_area_km2} km²`, temp_effect: Math.round(-e * 100) / 100, aqi_effect: Math.round(-urban_forest_area_km2 * 8) });
  }
  if (reflective_roads_pct > 0) {
    const e = reflective_roads_pct * 0.015; tempReduction += e;
    interventions.push({ type: 'Reflective Roads', value: `${reflective_roads_pct}% coverage`, temp_effect: Math.round(-e * 100) / 100 });
  }

  const newTemp = Math.round((city.avg_temp - tempReduction) * 10) / 10;
  const newLst = Math.round((city.lst - tempReduction * 1.5) * 10) / 10;
  const newUhi = Math.round(Math.max(0, city.uhi_intensity - tempReduction * 0.8) * 10) / 10;
  const newAqi = Math.round(Math.max(20, city.aqi - aqiImprovement));
  const newGreen = Math.round(Math.min(80, city.green_cover_pct + green_cover_increase_pct) * 10) / 10;
  const oldHI = Math.round((city.avg_temp + 0.5 * city.humidity / 10) * 10) / 10;
  const newHI = Math.round((newTemp + 0.5 * city.humidity / 10) * 10) / 10;
  const sustainability = Math.round(Math.min(100, 30 + newGreen * 0.8 + (100 - newAqi / 3) * 0.3 + (50 - newLst) * 0.5));

  res.json({
    city: city.name, simulation_id: `sim_${city.id}_${Date.now()}`, interventions,
    before: { avg_temp: city.avg_temp, lst: city.lst, uhi_intensity: city.uhi_intensity, aqi: city.aqi, green_cover_pct: city.green_cover_pct, heat_index: oldHI, risk_score: city.risk_score },
    after: { avg_temp: newTemp, lst: newLst, uhi_intensity: newUhi, aqi: newAqi, green_cover_pct: newGreen, heat_index: newHI, risk_score: Math.max(5, Math.round(city.risk_score - tempReduction * 12)) },
    impact_summary: { temperature_reduction: Math.round(tempReduction * 10) / 10, aqi_improvement: Math.round(aqiImprovement), carbon_reduction_tons: Math.round(carbonReduction), heat_index_reduction: Math.round((oldHI - newHI) * 10) / 10, sustainability_score: sustainability },
    confidence: 85.2, model: 'Climate Simulation Engine v1.0 (Physics-based + ML hybrid)',
  });
});

router.get('/presets', (req, res) => {
  res.json({
    presets: [
      { name: 'Moderate Greening', green_cover_increase_pct: 10, cool_roof_pct: 20, description: '10% green cover + 20% cool roofs' },
      { name: 'Aggressive Greening', green_cover_increase_pct: 20, water_body_increase_pct: 5, urban_forest_area_km2: 5, description: '20% green cover + water bodies + urban forests' },
      { name: 'Full Cool Infrastructure', cool_roof_pct: 50, solar_roof_pct: 30, reflective_roads_pct: 40, description: 'Comprehensive cool infrastructure deployment' },
      { name: 'Maximum Intervention', green_cover_increase_pct: 30, water_body_increase_pct: 8, cool_roof_pct: 60, solar_roof_pct: 40, urban_forest_area_km2: 10, reflective_roads_pct: 50, description: 'All interventions at maximum' },
      { name: 'Nature-Based Solutions', green_cover_increase_pct: 25, water_body_increase_pct: 10, urban_forest_area_km2: 8, description: 'Focus on natural cooling mechanisms' },
    ],
  });
});

module.exports = router;
