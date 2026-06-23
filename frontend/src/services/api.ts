import axios from 'axios';

const API_BASE = '/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor for auth
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API methods
export const authAPI = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  signup: (data: { email: string; name: string; password: string; role: string }) => api.post('/auth/signup', data),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  verifyOTP: (email: string, otp: string) => api.post('/auth/verify-otp', { email, otp }),
};

export const citiesAPI = {
  list: (params?: Record<string, string | number>) => api.get('/cities/', { params }),
  search: (q: string) => api.get('/cities/search', { params: { q } }),
  getById: (id: string) => api.get(`/cities/${id}`),
  topRisk: (n = 20) => api.get('/cities/top-risk', { params: { n } }),
  vulnerabilitySummary: () => api.get('/cities/vulnerability-summary'),
  states: () => api.get('/cities/states'),
};

export const weatherAPI = {
  current: (cityId: string) => api.get(`/weather/current/${cityId}`),
  monthly: (cityId: string) => api.get(`/weather/monthly/${cityId}`),
  yearlyTrend: (cityId: string) => api.get(`/weather/yearly-trend/${cityId}`),
  heatwaveStatus: () => api.get('/weather/heatwave-status'),
};

export const predictionsAPI = {
  uhi: (cityId: string) => api.get(`/predictions/uhi/${cityId}`),
  forecast: (cityId: string) => api.get(`/predictions/forecast/${cityId}`),
  riskRanking: (limit = 100) => api.get('/predictions/risk-ranking', { params: { limit } }),
  coolingPlan: (cityId: string) => api.get(`/predictions/cooling-plan/${cityId}`),
  treeEstimation: (cityId: string) => api.get(`/predictions/tree-estimation/${cityId}`),
};

export const analyticsAPI = {
  summary: () => api.get('/analytics/summary'),
  trends: () => api.get('/analytics/trends'),
  stateComparison: () => api.get('/analytics/state-comparison'),
  sdgImpact: () => api.get('/analytics/sdg-impact'),
};

export const mapsAPI = {
  citiesGeoJSON: () => api.get('/maps/cities-geojson'),
  heatLayer: () => api.get('/maps/heat-layer'),
  aqiLayer: () => api.get('/maps/aqi-layer'),
  vegetationLayer: () => api.get('/maps/vegetation-layer'),
};

export const simulationAPI = {
  run: (params: {
    city_id: string;
    green_cover_increase_pct?: number;
    water_body_increase_pct?: number;
    cool_roof_pct?: number;
    solar_roof_pct?: number;
    urban_forest_area_km2?: number;
    reflective_roads_pct?: number;
  }) => api.post('/simulation/run', params),
  presets: () => api.get('/simulation/presets'),
};

export const assistantAPI = {
  chat: (message: string, city?: string) => api.post('/assistant/chat', { message, city }),
  suggestedQueries: () => api.get('/assistant/suggested-queries'),
};

export const alertsAPI = {
  active: () => api.get('/alerts/active'),
  history: () => api.get('/alerts/history'),
};

export const recommendationsAPI = {
  get: (cityId: string) => api.get(`/recommendations/${cityId}`),
};

export const reportsAPI = {
  generate: (cityId: string, type?: string) => api.get(`/reports/generate/${cityId}`, { params: { report_type: type } }),
  templates: () => api.get('/reports/templates'),
  bulkSummary: () => api.get('/reports/bulk-summary'),
};

export const adminAPI = {
  dashboard: () => api.get('/admin/dashboard'),
  users: () => api.get('/admin/users'),
  logs: () => api.get('/admin/logs'),
};

export default api;
