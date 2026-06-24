/**
 * Reports Routes — Generate city reports
 */
const express = require('express');
const router = express.Router();
const { getCityById, INDIAN_CITIES } = require('../data/citiesData');

router.get('/generate/:city_id', (req, res) => {
  const city = getCityById(req.params.city_id);
  if (!city) return res.status(404).json({ error: 'City not found' });
  const type = req.query.report_type || 'comprehensive';

  res.json({
    report_id: `RPT_${city.id}_${Date.now()}`, city: city.name, state: city.state,
    report_type: type, generated_at: new Date().toISOString(),
    summary: {
      risk_score: city.risk_score, vulnerability: city.vulnerability,
      uhi_intensity: city.uhi_intensity, lst: city.lst, aqi: city.aqi,
      green_cover_pct: city.green_cover_pct, population: city.population,
    },
    key_findings: [
      `${city.name} has a UHI intensity of ${city.uhi_intensity}°C, classified as ${city.vulnerability} risk`,
      `Land Surface Temperature is ${city.lst}°C ${city.lst > 42 ? '(exceeds safe threshold)' : ''}`,
      `Green cover at ${city.green_cover_pct}% ${city.green_cover_pct < 15 ? 'is critically low' : 'needs improvement'}`,
      `Built-up area covers ${city.built_up_pct}% of the city`,
      `AQI at ${city.aqi} ${city.aqi > 150 ? 'poses health concerns' : 'is within moderate range'}`,
    ],
    recommendations: [
      `Increase green cover by at least ${Math.round(25 - city.green_cover_pct)}%`,
      'Implement cool roof policy for all new buildings',
      `Plant approximately ${Math.round(city.population * 0.8 + city.area_km2 * 500).toLocaleString()} trees`,
      'Establish early warning system for heat events',
    ],
  });
});

router.get('/templates', (req, res) => {
  res.json({
    templates: [
      { id: 'comprehensive', name: 'Comprehensive City Report', description: 'Full analysis with all metrics' },
      { id: 'executive', name: 'Executive Summary', description: 'Quick overview for decision makers' },
      { id: 'technical', name: 'Technical Analysis', description: 'Detailed satellite data analysis' },
      { id: 'action_plan', name: 'Action Plan Report', description: 'Focused cooling strategy report' },
    ],
  });
});

router.get('/bulk-summary', (req, res) => {
  const critical = INDIAN_CITIES.filter(c => c.vulnerability === 'Critical');
  const high = INDIAN_CITIES.filter(c => c.vulnerability === 'High');
  res.json({
    total_cities: INDIAN_CITIES.length, critical_count: critical.length, high_count: high.length,
    avg_risk: Math.round(INDIAN_CITIES.reduce((s, c) => s + c.risk_score, 0) / INDIAN_CITIES.length),
    reports_available: INDIAN_CITIES.length,
    last_updated: new Date().toISOString(),
  });
});

module.exports = router;
