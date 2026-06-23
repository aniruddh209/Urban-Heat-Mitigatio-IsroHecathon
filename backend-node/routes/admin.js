/**
 * Admin Routes — Dashboard, Users, Logs
 */
const express = require('express');
const router = express.Router();
const { INDIAN_CITIES } = require('../data/citiesData');

router.get('/dashboard', (req, res) => {
  res.json({
    metrics: { total_users: 156, active_users: 89, api_calls_today: 12450, predictions_today: 3421, reports_generated_today: 67 },
    database: { cities: INDIAN_CITIES.length, predictions: 15847, alerts: 329, reports: 2341, users: 156 },
    ai_models: {
      uhi_detector: { name: 'UHI Detector', status: 'active', accuracy: 94.2, last_trained: '2026-06-01', version: 'v2.1' },
      temp_forecaster: { name: 'Temperature Forecaster', status: 'active', accuracy: 88.5, last_trained: '2026-05-28', version: 'v1.0' },
      risk_scorer: { name: 'Risk Scorer', status: 'active', accuracy: 91.8, last_trained: '2026-06-05', version: 'v2.0' },
      aqi_predictor: { name: 'AQI Predictor', status: 'active', accuracy: 86.3, last_trained: '2026-05-25', version: 'v1.2' },
    },
    recent_activity: [
      { action: 'UHI Prediction', target: 'Delhi', user: 'researcher@urbanheat.ai', timestamp: new Date(Date.now() - 300000).toISOString() },
      { action: 'Simulation Run', target: 'Mumbai', user: 'admin@urbanheat.ai', timestamp: new Date(Date.now() - 600000).toISOString() },
      { action: 'Report Generated', target: 'Ahmedabad', user: 'demo@urbanheat.ai', timestamp: new Date(Date.now() - 900000).toISOString() },
      { action: 'Alert Triggered', target: 'Jaipur', user: 'system', timestamp: new Date(Date.now() - 1200000).toISOString() },
      { action: 'Tree Estimation', target: 'Chennai', user: 'researcher@urbanheat.ai', timestamp: new Date(Date.now() - 1800000).toISOString() },
    ],
  });
});

router.get('/users', (req, res) => {
  res.json({
    users: [
      { name: 'Admin User', email: 'admin@urbanheat.ai', role: 'admin', status: 'active', last_login: new Date(Date.now() - 3600000).toISOString() },
      { name: 'Dr. Priya Sharma', email: 'researcher@urbanheat.ai', role: 'researcher', status: 'active', last_login: new Date(Date.now() - 7200000).toISOString() },
      { name: 'Rajesh Kumar', email: 'planner@urbanheat.ai', role: 'government_planner', status: 'active', last_login: new Date(Date.now() - 14400000).toISOString() },
      { name: 'Demo User', email: 'demo@urbanheat.ai', role: 'public', status: 'active', last_login: new Date(Date.now() - 86400000).toISOString() },
    ],
  });
});

router.get('/logs', (req, res) => {
  const levels = ['INFO', 'INFO', 'INFO', 'WARNING', 'INFO', 'ERROR', 'INFO', 'INFO', 'WARNING', 'INFO'];
  const msgs = [
    'API request: GET /api/v1/cities/', 'UHI prediction computed for Delhi',
    'Weather data cached for 15 cities', 'High memory usage: 78%',
    'Alert triggered for Ahmedabad (LST > 44°C)', 'Failed to fetch live AQI for Bikaner',
    'Report generated: RPT_c001_comprehensive', 'New user registered: test@example.com',
    'Rate limit approaching for OpenWeatherMap API', 'Simulation engine: 3 scenarios computed',
  ];
  res.json({
    logs: msgs.map((message, i) => ({
      id: `log_${i}`, level: levels[i], message, source: 'backend-node',
      timestamp: new Date(Date.now() - i * 180000).toISOString(),
    })),
  });
});

module.exports = router;
