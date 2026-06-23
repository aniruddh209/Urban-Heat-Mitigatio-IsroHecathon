/**
 * Recommendations Routes — City-specific action plans
 */
const express = require('express');
const router = express.Router();
const { getCityById } = require('../data/citiesData');

router.get('/:city_id', (req, res) => {
  const city = getCityById(req.params.city_id);
  if (!city) return res.status(404).json({ error: 'City not found' });

  const categories = [];

  // Green Infrastructure
  categories.push({
    name: 'Green Infrastructure', icon: '🌿', priority: city.green_cover_pct < 15 ? 'Critical' : 'High',
    actions: [
      { action: `Increase green cover from ${city.green_cover_pct}% to ${Math.round(city.green_cover_pct + 15)}%`, impact: `${Math.round(city.uhi_intensity * 0.3 * 10) / 10}°C cooling`, cost: '₹50-200 Cr', timeline: '3-5 years' },
      { action: 'Create urban micro-forests in vacant lots', impact: 'Localized 2-4°C cooling', cost: '₹5-20 Cr per forest', timeline: '1-2 years' },
      { action: 'Green corridor connecting major parks', impact: 'Improved biodiversity & cooling', cost: '₹30-80 Cr', timeline: '2-4 years' },
    ],
  });

  // Cool Infrastructure
  categories.push({
    name: 'Cool Infrastructure', icon: '🏗️', priority: city.lst > 42 ? 'Critical' : 'High',
    actions: [
      { action: 'Deploy cool roof coatings on all government buildings', impact: '0.3-0.5°C city-wide', cost: '₹10-30 Cr', timeline: '6-12 months' },
      { action: 'Reflective road coatings on major corridors', impact: '0.5°C surface cooling', cost: '₹15-40 Cr', timeline: '1 year' },
      { action: 'Solar panel mandate for commercial buildings', impact: '0.3°C + energy savings', cost: 'Private sector', timeline: '2-3 years' },
    ],
  });

  // Water Management
  categories.push({
    name: 'Water Management', icon: '💧', priority: city.water_body_pct < 3 ? 'High' : 'Moderate',
    actions: [
      { action: 'Restore and expand existing water bodies', impact: '0.5-1°C micro-cooling', cost: '₹20-50 Cr', timeline: '1-2 years' },
      { action: 'Install mist cooling in public spaces', impact: '2-3°C localized', cost: '₹5-15 Cr', timeline: '3-6 months' },
      { action: 'Rainwater harvesting mandate', impact: 'Groundwater + cooling', cost: 'Minimal', timeline: '1 year' },
    ],
  });

  // Air Quality
  if (city.aqi > 150) {
    categories.push({
      name: 'Air Quality', icon: '🌬️', priority: city.aqi > 200 ? 'Critical' : 'High',
      actions: [
        { action: 'Anti-pollution green belts around industrial zones', impact: `AQI reduction by ${Math.round(city.aqi * 0.15)}`, cost: '₹25-60 Cr', timeline: '2-3 years' },
        { action: 'Electric vehicle promotion & charging infrastructure', impact: '15-20% emission reduction', cost: '₹50-100 Cr', timeline: '3-5 years' },
        { action: 'Dust suppression on construction sites', impact: '10-15% PM reduction', cost: '₹2-5 Cr', timeline: 'Immediate' },
      ],
    });
  }

  res.json({ city: city.name, state: city.state, risk_score: city.risk_score, vulnerability: city.vulnerability, categories, generated_at: new Date().toISOString(), model: 'Recommendation Engine v2.0' });
});

module.exports = router;
