/**
 * Analytics Routes — Summary, Trends, State Comparison, SDG Impact
 */
const express = require('express');
const router = express.Router();
const { INDIAN_CITIES } = require('../data/citiesData');

router.get('/summary', (req, res) => {
  const totalPop = INDIAN_CITIES.reduce((s, c) => s + c.population, 0);
  const critical = INDIAN_CITIES.filter(c => c.vulnerability === 'Critical');
  const high = INDIAN_CITIES.filter(c => c.vulnerability === 'High');
  res.json({
    total_cities_monitored: INDIAN_CITIES.length,
    total_population_covered: totalPop,
    critical_cities: critical.length,
    high_risk_cities: high.length,
    avg_uhi_intensity: Math.round(INDIAN_CITIES.reduce((s, c) => s + c.uhi_intensity, 0) / INDIAN_CITIES.length * 10) / 10,
    avg_aqi: Math.round(INDIAN_CITIES.reduce((s, c) => s + c.aqi, 0) / INDIAN_CITIES.length),
    avg_green_cover: Math.round(INDIAN_CITIES.reduce((s, c) => s + c.green_cover_pct, 0) / INDIAN_CITIES.length * 10) / 10,
    avg_lst: Math.round(INDIAN_CITIES.reduce((s, c) => s + c.lst, 0) / INDIAN_CITIES.length * 10) / 10,
    predictions_generated: 15847, alerts_active: critical.length + high.length,
    reports_generated: 2341, ai_models_active: 8,
  });
});

router.get('/trends', (req, res) => {
  const years = Array.from({ length: 11 }, (_, i) => 2015 + i);
  res.json({
    temperature_trend: years.map(y => ({ year: y, avg_temp: Math.round((25.2 + (y - 2015) * 0.18 + (Math.random() - 0.5) * 0.6) * 10) / 10 })),
    aqi_trend: years.map(y => ({ year: y, avg_aqi: Math.round(120 + (y - 2015) * 5 + (Math.random() - 0.5) * 20) })),
    green_cover_trend: years.map(y => ({ year: y, avg_pct: Math.round((20.5 - (y - 2015) * 0.3 + (Math.random() - 0.5)) * 10) / 10 })),
    uhi_trend: years.map(y => ({ year: y, avg_intensity: Math.round((3.2 + (y - 2015) * 0.08 + (Math.random() - 0.5) * 0.2) * 10) / 10 })),
    rainfall_trend: years.map(y => ({ year: y, avg_mm: Math.round(1100 - (y - 2015) * 8 + (Math.random() - 0.5) * 100) })),
  });
});

router.get('/state-comparison', (req, res) => {
  const stateMap = {};
  INDIAN_CITIES.forEach(c => { if (!stateMap[c.state]) stateMap[c.state] = []; stateMap[c.state].push(c); });
  const comparisons = Object.entries(stateMap).map(([state, cities]) => {
    const n = cities.length;
    return {
      state, city_count: n,
      avg_risk_score: Math.round(cities.reduce((s, c) => s + c.risk_score, 0) / n * 10) / 10,
      avg_uhi: Math.round(cities.reduce((s, c) => s + c.uhi_intensity, 0) / n * 10) / 10,
      avg_aqi: Math.round(cities.reduce((s, c) => s + c.aqi, 0) / n),
      avg_green_cover: Math.round(cities.reduce((s, c) => s + c.green_cover_pct, 0) / n * 10) / 10,
      avg_lst: Math.round(cities.reduce((s, c) => s + c.lst, 0) / n * 10) / 10,
      total_population: cities.reduce((s, c) => s + c.population, 0),
    };
  }).sort((a, b) => b.avg_risk_score - a.avg_risk_score);
  res.json({ comparisons });
});

router.get('/sdg-impact', (req, res) => {
  res.json({
    sdg_11: { name: 'Sustainable Cities and Communities', score: 78, metrics: { cities_with_cooling_plans: 45, green_infrastructure_projects: 128, urban_heat_reduction_achieved: '1.2°C avg' } },
    sdg_13: { name: 'Climate Action', score: 82, metrics: { carbon_offset_potential_tons: 45000, tree_plantation_target: 5000000, renewable_energy_coverage: '34%' } },
    sdg_3: { name: 'Good Health and Well-being', score: 65, metrics: { heat_related_illness_reduction: '18%', air_quality_improvement_cities: 32, population_protected: 45000000 } },
  });
});

module.exports = router;
