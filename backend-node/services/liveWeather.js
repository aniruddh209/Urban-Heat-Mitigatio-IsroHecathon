/**
 * Live Weather Service — OpenWeatherMap + AQICN integration
 */
const axios = require('axios');
const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: parseInt(process.env.WEATHER_CACHE_TTL) || 900 });

async function getCurrentWeather(lat, lng) {
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) return null;

  const cacheKey = `weather_${lat}_${lng}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const [weatherRes, aqiRes] = await Promise.all([
      axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${key}&units=metric`),
      axios.get(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lng}&appid=${key}`),
    ]);

    const w = weatherRes.data;
    const aqi = aqiRes.data?.list?.[0];

    const result = {
      temperature: Math.round(w.main.temp * 10) / 10,
      feels_like: Math.round(w.main.feels_like * 10) / 10,
      humidity: w.main.humidity,
      wind_speed_kmh: Math.round(w.wind.speed * 3.6 * 10) / 10,
      wind_direction: degToCompass(w.wind.deg),
      pressure_hpa: w.main.pressure,
      visibility_km: Math.round((w.visibility || 10000) / 1000 * 10) / 10,
      conditions: w.weather?.[0]?.main || 'Clear',
      description: w.weather?.[0]?.description || '',
      icon: w.weather?.[0]?.icon || '',
      clouds_pct: w.clouds?.all || 0,
      aqi_index: aqi?.main?.aqi || null,
      aqi_pm25: aqi?.components?.pm2_5 || null,
      aqi_pm10: aqi?.components?.pm10 || null,
      is_live: true,
      timestamp: new Date().toISOString(),
    };

    cache.set(cacheKey, result);
    return result;
  } catch (err) {
    console.error('Live weather API error:', err.message);
    return null;
  }
}

function degToCompass(deg) {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
}

// Convert OpenWeatherMap AQI (1-5) to Indian AQI scale (0-500 approx)
function convertAQI(owmAqi) {
  const map = { 1: 40, 2: 80, 3: 150, 4: 250, 5: 400 };
  return map[owmAqi] || 100;
}

module.exports = { getCurrentWeather, convertAQI };
