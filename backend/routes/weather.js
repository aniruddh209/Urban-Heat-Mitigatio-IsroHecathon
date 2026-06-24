/**
 * Weather Routes — Current (LIVE), Monthly, Yearly, Heatwave
 */
const express = require('express');
const router = express.Router();
const { INDIAN_CITIES, getCityById } = require('../data/citiesData');
const { getCurrentWeather, convertAQI } = require('../services/liveWeather');

// Seeded random for consistent generated data
function seededRandom(seed) {
  let s = 0;
  for (let i = 0; i < seed.length; i++) s = ((s << 5) - s + seed.charCodeAt(i)) | 0;
  s = Math.abs(s) || 1;
  return () => { s = (s * 16807) % 2147483647; return (s & 2147483647) / 2147483647; };
}

function generateMonthlyData(city) {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const tempP = [-4,-2,2,6,9,7,3,2,1,-1,-3,-5];
  const rainP = [0.2,0.3,0.4,0.5,0.8,2.5,3.5,3.2,2.0,1.2,0.5,0.2];
  const humidP = [-8,-6,-2,2,5,12,18,16,10,2,-4,-8];
  const rng = seededRandom(city.id);
  const baseRain = city.rainfall_mm / 12;

  return months.map((month, i) => {
    const temp = Math.round((city.avg_temp + tempP[i] + (rng() - 0.5)) * 10) / 10;
    return {
      month, month_num: i + 1,
      avg_temp: temp,
      max_temp: Math.round((temp + 8 + rng() * 3) * 10) / 10,
      min_temp: Math.round((temp - 6 + (rng() - 1) * 2) * 10) / 10,
      humidity: Math.round(Math.min(95, Math.max(20, city.humidity + humidP[i] + (rng() - 0.5) * 4)) * 10) / 10,
      rainfall_mm: Math.round(Math.max(0, baseRain * rainP[i] + (rng() - 0.5) * 10) * 10) / 10,
      aqi: Math.round(Math.max(20, city.aqi + (rng() - 0.5) * 60 + ([10,11,0].includes(i) ? 20 : [6,7,8].includes(i) ? -15 : 0))),
      wind_speed_kmh: Math.round((8 + (rng() - 0.3) * 11 + ([5,6].includes(i) ? 5 : 0)) * 10) / 10,
      uv_index: Math.round(Math.min(12, Math.max(3, 7 + Math.sin(Math.PI * (i - 2) / 6) * 4 + (rng() - 0.5))) * 10) / 10,
    };
  });
}

function generateYearlyTrend(city) {
  const rng = seededRandom(city.id + 'yearly');
  const base = city.avg_temp - 1.5;
  return Array.from({ length: 11 }, (_, i) => {
    const year = 2015 + i;
    const warming = i * 0.15 + (rng() - 0.5) * 0.4;
    return {
      year, avg_temp: Math.round((base + warming) * 10) / 10,
      max_temp: Math.round((city.max_temp - 2 + warming + (rng() - 0.5) * 2) * 10) / 10,
      aqi: Math.round(Math.max(30, city.aqi - 20 + i * 5 + (rng() - 0.5) * 20)),
      green_cover_pct: Math.round(Math.max(3, city.green_cover_pct + 2 - i * 0.3 + (rng() - 0.5)) * 10) / 10,
      uhi_intensity: Math.round(Math.max(0.2, city.uhi_intensity - 0.5 + i * 0.08 + (rng() - 0.5) * 0.2) * 10) / 10,
    };
  });
}

// GET /current/:city_id — LIVE weather if API key set, else generated
router.get('/current/:city_id', async (req, res) => {
  const city = getCityById(req.params.city_id);
  if (!city) return res.status(404).json({ error: 'City not found' });

  // Try live data first
  const live = await getCurrentWeather(city.lat, city.lng);
  if (live) {
    return res.json({
      city: city.name, state: city.state,
      temperature: live.temperature, feels_like: live.feels_like,
      humidity: live.humidity, wind_speed_kmh: live.wind_speed_kmh,
      wind_direction: live.wind_direction, aqi: live.aqi_pm25 ? Math.round(live.aqi_pm25 * 2) : city.aqi,
      uv_index: 8, visibility_km: live.visibility_km,
      pressure_hpa: live.pressure_hpa, lst: city.lst,
      conditions: live.conditions, is_live: true,
    });
  }

  // Fallback to generated data
  const rng = seededRandom(city.id + Date.now().toString().slice(0, -4));
  res.json({
    city: city.name, state: city.state,
    temperature: Math.round((city.avg_temp + (rng() - 0.4) * 7) * 10) / 10,
    feels_like: Math.round((city.avg_temp + rng() * 8) * 10) / 10,
    humidity: city.humidity, wind_speed_kmh: Math.round((8 + (rng() - 0.2) * 15) * 10) / 10,
    wind_direction: ['N','NE','E','SE','S','SW','W','NW'][Math.floor(rng() * 8)],
    aqi: city.aqi + Math.floor((rng() - 0.5) * 40),
    uv_index: Math.round((5 + rng() * 6) * 10) / 10,
    visibility_km: Math.round((2 + rng() * 8) * 10) / 10,
    pressure_hpa: Math.round((1013 + (rng() - 0.5) * 20) * 10) / 10,
    lst: city.lst,
    conditions: ['Clear','Partly Cloudy','Hazy','Sunny','Hot'][Math.floor(rng() * 5)],
    is_live: false,
  });
});

router.get('/monthly/:city_id', (req, res) => {
  const city = getCityById(req.params.city_id);
  if (!city) return res.status(404).json({ error: 'City not found' });
  res.json({ city: city.name, monthly_data: generateMonthlyData(city) });
});

router.get('/yearly-trend/:city_id', (req, res) => {
  const city = getCityById(req.params.city_id);
  if (!city) return res.status(404).json({ error: 'City not found' });
  res.json({ city: city.name, yearly_trend: generateYearlyTrend(city) });
});

router.get('/heatwave-status', (req, res) => {
  const alerts = INDIAN_CITIES.filter(c => c.lst > 42).map(c => ({
    city: c.name, state: c.state, lst: c.lst,
    severity: c.lst > 45 ? 'Extreme' : c.lst > 43 ? 'Severe' : 'Moderate',
    population_at_risk: Math.round(c.population * (0.2 + Math.random() * 0.3)),
    advisory: `Extreme heat advisory for ${c.name}. Stay indoors between 11 AM - 4 PM.`,
  })).sort((a, b) => b.lst - a.lst);
  res.json({ total_alerts: alerts.length, alerts });
});

module.exports = router;
