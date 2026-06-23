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
