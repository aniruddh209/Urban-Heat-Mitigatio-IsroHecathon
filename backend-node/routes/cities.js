/**
 * Cities Routes — CRUD, search, filtering for Indian cities
 */
const express = require('express');
const router = express.Router();
const { INDIAN_CITIES, getCityById, getCitiesByState, getTopRiskCities, getVulnerabilitySummary } = require('../data/citiesData');

router.get('/', (req, res) => {
  let cities = [...INDIAN_CITIES];
  const { state, vulnerability, sort_by = 'risk_score', order = 'desc', limit = 100, offset = 0 } = req.query;

  if (state) cities = cities.filter(c => c.state.toLowerCase() === state.toLowerCase());
  if (vulnerability) cities = cities.filter(c => c.vulnerability.toLowerCase() === vulnerability.toLowerCase());

  cities.sort((a, b) => order === 'desc' ? (b[sort_by] || 0) - (a[sort_by] || 0) : (a[sort_by] || 0) - (b[sort_by] || 0));
  const total = cities.length;
  cities = cities.slice(+offset, +offset + +limit);
  res.json({ total, cities, limit: +limit, offset: +offset });
});

router.get('/search', (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  const results = INDIAN_CITIES.filter(c => c.name.toLowerCase().includes(q));
  res.json({ results, count: results.length });
});

router.get('/top-risk', (req, res) => {
  res.json({ cities: getTopRiskCities(+(req.query.n || 20)) });
});

router.get('/vulnerability-summary', (req, res) => {
  const summary = getVulnerabilitySummary();
  res.json({ summary, total_cities: INDIAN_CITIES.length, critical_count: summary.Critical || 0, high_count: summary.High || 0 });
});

router.get('/states', (req, res) => {
  const stateMap = {};
  INDIAN_CITIES.forEach(c => {
    if (!stateMap[c.state]) stateMap[c.state] = [];
    stateMap[c.state].push(c);
  });
  const states = Object.entries(stateMap).map(([name, cities]) => ({
    name, city_count: cities.length,
    avg_risk_score: Math.round(cities.reduce((s, c) => s + c.risk_score, 0) / cities.length * 10) / 10,
  })).sort((a, b) => a.name.localeCompare(b.name));
  res.json({ states });
});

router.get('/:city_id', (req, res) => {
  const city = getCityById(req.params.city_id);
  if (!city) return res.status(404).json({ error: 'City not found' });
  res.json(city);
});

module.exports = router;
