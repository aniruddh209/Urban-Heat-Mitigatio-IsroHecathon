/**
 * Maps Routes — GeoJSON, Heat/AQI/Vegetation Layers, India Boundary
 */
const express = require('express');
const router = express.Router();
const { INDIAN_CITIES } = require('../data/citiesData');

router.get('/cities-geojson', (req, res) => {
  const features = INDIAN_CITIES.map(c => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [c.lng, c.lat] },
    properties: {
      id: c.id, name: c.name, state: c.state, population: c.population,
      risk_score: c.risk_score, vulnerability: c.vulnerability, uhi_intensity: c.uhi_intensity,
      lst: c.lst, aqi: c.aqi, ndvi: c.ndvi, green_cover_pct: c.green_cover_pct,
      humidity: c.humidity, rainfall_mm: c.rainfall_mm, avg_temp: c.avg_temp,
    },
  }));
  res.json({ type: 'FeatureCollection', features });
});

router.get('/heat-layer', (req, res) => {
  const points = INDIAN_CITIES.map(c => ({
    lat: c.lat, lng: c.lng,
    intensity: Math.round(Math.min(1.0, c.lst / 50) * 100) / 100,
    value: c.lst, radius: Math.max(15, Math.min(50, c.population / 500000)),
  }));
  res.json({ points, layer: 'heat', unit: '°C' });
});

router.get('/aqi-layer', (req, res) => {
  const points = INDIAN_CITIES.map(c => ({
    lat: c.lat, lng: c.lng,
    intensity: Math.round(Math.min(1.0, c.aqi / 300) * 100) / 100,
    value: c.aqi,
    category: c.aqi < 50 ? 'Good' : c.aqi < 100 ? 'Moderate' : c.aqi < 200 ? 'Unhealthy' : c.aqi < 300 ? 'Very Unhealthy' : 'Hazardous',
  }));
  res.json({ points, layer: 'aqi' });
});

router.get('/vegetation-layer', (req, res) => {
  const points = INDIAN_CITIES.map(c => ({
    lat: c.lat, lng: c.lng, intensity: Math.round(c.ndvi * 100) / 100, value: c.green_cover_pct,
  }));
  res.json({ points, layer: 'vegetation' });
});

router.get('/india-boundary', (req, res) => {
  res.json({
    type: 'Feature', properties: { name: 'India' },
    geometry: { type: 'Polygon', coordinates: [[[68.1,8.0],[68.5,23.5],[70.5,25.5],[74.0,31.5],[74.8,34.5],[77.0,35.5],[80.0,33.5],[84.0,28.5],[88.0,27.5],[89.0,26.5],[92.0,26.5],[97.0,28.0],[97.5,25.0],[94.5,22.0],[92.0,21.5],[89.5,22.0],[88.5,22.0],[87.0,21.5],[84.5,19.0],[82.5,17.5],[80.0,15.5],[80.5,12.5],[79.8,10.5],[78.5,8.5],[76.5,8.0],[74.5,10.5],[72.5,13.0],[72.5,18.0],[70.0,22.0],[68.5,23.5],[68.1,8.0]]] },
  });
});

module.exports = router;
