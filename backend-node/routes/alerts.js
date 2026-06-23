/**
 * Alerts Routes — Active alerts & history
 */
const express = require('express');
const router = express.Router();
const { INDIAN_CITIES } = require('../data/citiesData');

router.get('/active', (req, res) => {
  const alerts = INDIAN_CITIES.filter(c => c.risk_score > 70).map((c, i) => ({
    id: `alert_${c.id}_${Date.now()}`, city: c.name, state: c.state,
    severity: c.risk_score > 90 ? 'Extreme' : c.risk_score > 80 ? 'Severe' : 'Moderate',
    type: c.lst > 44 ? 'Extreme Heat' : c.aqi > 200 ? 'Air Quality' : 'Heat Advisory',
    temperature: c.lst, aqi: c.aqi, uhi_intensity: c.uhi_intensity,
    population_at_risk: Math.round(c.population * c.risk_score / 200),
    message: `${c.risk_score > 90 ? '🔴 CRITICAL' : '🟠 WARNING'}: ${c.name} — LST ${c.lst}°C, AQI ${c.aqi}. ${c.lst > 44 ? 'Extreme heat advisory in effect.' : 'Elevated heat risk detected.'}`,
    issued_at: new Date(Date.now() - Math.random() * 86400000).toISOString(),
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    actions: ['Stay hydrated', 'Avoid outdoor activity 11AM-4PM', 'Check on elderly neighbors'],
  })).sort((a, b) => b.temperature - a.temperature);
  res.json({ total: alerts.length, alerts });
});

router.get('/history', (req, res) => {
  const history = INDIAN_CITIES.filter(c => c.risk_score > 60).slice(0, 30).map((c, i) => ({
    id: `hist_${i}`, city: c.name, state: c.state,
    severity: c.risk_score > 85 ? 'Extreme' : 'Severe',
    type: 'Heat Advisory', resolved: true,
    issued_at: new Date(Date.now() - (i + 1) * 86400000 * 3).toISOString(),
    resolved_at: new Date(Date.now() - i * 86400000 * 3).toISOString(),
    max_temperature: c.lst + Math.round(Math.random() * 3),
  }));
  res.json({ total: history.length, alerts: history });
});

module.exports = router;
