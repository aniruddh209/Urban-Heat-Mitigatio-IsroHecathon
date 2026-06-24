/**
 * UrbanHeat AI — Express Server
 * Climate Intelligence Platform Backend
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// ─── API Routes ──────────────────────────────────────────────
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/cities', require('./routes/cities'));
app.use('/api/v1/weather', require('./routes/weather'));
app.use('/api/v1/predictions', require('./routes/predictions'));
app.use('/api/v1/analytics', require('./routes/analytics'));
app.use('/api/v1/maps', require('./routes/maps'));
app.use('/api/v1/simulation', require('./routes/simulation'));
app.use('/api/v1/assistant', require('./routes/assistant'));
app.use('/api/v1/alerts', require('./routes/alerts'));
app.use('/api/v1/recommendations', require('./routes/recommendations'));
app.use('/api/v1/reports', require('./routes/reports'));
app.use('/api/v1/admin', require('./routes/admin'));

// ─── Root Landing ────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    platform: 'UrbanHeat AI',
    tagline: 'AI-Powered Urban Heat Island Detection & Mitigation',
    version: '2.0.0',
    hackathon: 'ISRO Bharatiya Antariksh Hackathon 2026',
    status: 'operational',
    services: {
      api_gateway: 'http://localhost:3001',
      ml_engine: 'http://localhost:8000',
      frontend: 'http://localhost:5173',
    },
    api_docs: '/api',
  });
});

// ─── API Root Directory ──────────────────────────────────────
app.get('/api', (req, res) => {
  res.json({
    status: 'healthy',
    platform: 'UrbanHeat AI',
    version: '2.0.0',
    endpoints: {
      auth:            '/api/v1/auth          — POST /login, /signup, /forgot-password, /verify-otp',
      cities:          '/api/v1/cities        — GET /, /search, /top-risk, /vulnerability-summary, /states, /:city_id',
      weather:         '/api/v1/weather       — GET /current/:id, /monthly/:id, /yearly-trend/:id, /heatwave-status',
      predictions:     '/api/v1/predictions   — GET /uhi/:id, /forecast/:id, /risk-ranking, /cooling-plan/:id, /tree-estimation/:id',
      analytics:       '/api/v1/analytics     — GET /summary, /trends, /state-comparison, /sdg-impact',
      maps:            '/api/v1/maps          — GET /cities-geojson, /heat-layer, /aqi-layer, /vegetation-layer',
      simulation:      '/api/v1/simulation    — POST /run, GET /presets',
      assistant:       '/api/v1/assistant     — POST /chat, GET /suggested-queries',
      alerts:          '/api/v1/alerts        — GET /active, /history',
      recommendations: '/api/v1/recommendations — GET /:city_id',
      reports:         '/api/v1/reports       — GET /generate/:id, /templates, /bulk-summary',
      admin:           '/api/v1/admin         — GET /dashboard, /users, /logs',
      ml_engine:       '/api/v1/ml            — POST /predict, /simulate, /hotspots, /explain, /optimize',
      health:          '/api/health           — GET system health check',
    },
    live_weather: !!process.env.OPENWEATHER_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// ─── Health Check ────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    platform: 'UrbanHeat AI',
    version: '2.0.0',
    runtime: 'Node.js + Express',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    live_data: !!process.env.OPENWEATHER_API_KEY,
  });
});

// ─── ML Engine Proxy (forwards to FastAPI on port 8000) ─────
const axios = require('axios');
const ML_ENGINE_URL = `http://${process.env.ML_ENGINE_HOST || 'localhost'}:${process.env.ML_ENGINE_PORT || 8000}`;

app.post('/api/v1/ml/predict', async (req, res) => {
  try {
    const response = await axios.post(`${ML_ENGINE_URL}/api/v1/ml/predict/`, req.body);
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 502).json({ error: 'ML Engine error', detail: err.response?.data || err.message });
  }
});

app.post('/api/v1/ml/simulate', async (req, res) => {
  try {
    const response = await axios.post(`${ML_ENGINE_URL}/api/v1/ml/simulate/`, req.body);
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 502).json({ error: 'ML Engine error', detail: err.response?.data || err.message });
  }
});

app.post('/api/v1/ml/hotspots', async (req, res) => {
  try {
    const response = await axios.post(`${ML_ENGINE_URL}/api/v1/ml/hotspots/`, req.body);
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 502).json({ error: 'ML Engine error', detail: err.response?.data || err.message });
  }
});

app.post('/api/v1/ml/explain', async (req, res) => {
  try {
    const response = await axios.post(`${ML_ENGINE_URL}/api/v1/ml/explain/`, req.body);
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 502).json({ error: 'ML Engine error', detail: err.response?.data || err.message });
  }
});

app.post('/api/v1/ml/optimize', async (req, res) => {
  try {
    const response = await axios.post(`${ML_ENGINE_URL}/api/v1/ml/optimize/`, req.body);
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 502).json({ error: 'ML Engine error', detail: err.response?.data || err.message });
  }
});

app.get('/api/v1/ml/health', async (req, res) => {
  try {
    const response = await axios.get(`${ML_ENGINE_URL}/`);
    res.json({ ...response.data, proxy: true });
  } catch (err) {
    res.status(503).json({ status: 'unreachable', error: 'ML Engine is not running', url: ML_ENGINE_URL });
  }
});

app.get('/api/v1/ml/report/training-report', async (req, res) => {
  try {
    const response = await axios.get(`${ML_ENGINE_URL}/api/v1/ml/report/training-report`);
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 502).json({ error: 'ML Engine error', detail: err.response?.data || err.message });
  }
});

app.get('/api/v1/ml/report/hotspot-report', async (req, res) => {
  try {
    const response = await axios.get(`${ML_ENGINE_URL}/api/v1/ml/report/hotspot-report`);
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 502).json({ error: 'ML Engine error', detail: err.response?.data || err.message });
  }
});

app.get('/api/v1/ml/report/model-info', async (req, res) => {
  try {
    const response = await axios.get(`${ML_ENGINE_URL}/api/v1/ml/report/model-info`);
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 502).json({ error: 'ML Engine error', detail: err.response?.data || err.message });
  }
});

// ─── 404 Handler ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found', path: req.path });
});

// ─── Error Handler ───────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// ─── Start Server ────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🌡️  UrbanHeat AI Backend running on http://localhost:${PORT}`);
  console.log(`📡  Live weather: ${process.env.OPENWEATHER_API_KEY ? 'ENABLED' : 'DISABLED (set OPENWEATHER_API_KEY)'}`);
  console.log(`🌍  Environment: ${process.env.NODE_ENV || 'development'}\n`);
});
