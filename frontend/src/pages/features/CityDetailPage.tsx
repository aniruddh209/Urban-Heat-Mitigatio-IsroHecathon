import { useState, useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ArrowLeft, Thermometer, Droplets, Wind, TreePine, MapPin, Brain, Shield, Zap, Activity, AlertTriangle, TrendingUp, Eye, Info, ChevronRight, Download, Leaf, Building, Sun, Users } from 'lucide-react';
import { predictionsAPI, weatherAPI, recommendationsAPI, citiesAPI } from '../../services/api';

export default function CityDetailPage() {
  const [searchParams] = useSearchParams();
  const cityId = searchParams.get('id') || 'c001';

  const [city, setCity] = useState<any>(null);
  const [uhi, setUhi] = useState<any>(null);
  const [weather, setWeather] = useState<any>(null);
  const [monthly, setMonthly] = useState<any>(null);
  const [forecast, setForecast] = useState<any>(null);
  const [coolingPlan, setCoolingPlan] = useState<any>(null);
  const [treeData, setTreeData] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [yearlyTrend, setYearlyTrend] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadCityData();
  }, [cityId]);

  const loadCityData = async () => {
    setLoading(true);
    try {
      const [cityRes, uhiRes, weatherRes, monthlyRes, forecastRes, coolingRes, treeRes, recRes, yearlyRes] = await Promise.all([
        citiesAPI.getById(cityId),
        predictionsAPI.uhi(cityId),
        weatherAPI.current(cityId),
        weatherAPI.monthly(cityId),
        predictionsAPI.forecast(cityId),
        predictionsAPI.coolingPlan(cityId),
        predictionsAPI.treeEstimation(cityId),
        recommendationsAPI.get(cityId),
        weatherAPI.yearlyTrend(cityId),
      ]);
      setCity(cityRes.data);
      setUhi(uhiRes.data);
      setWeather(weatherRes.data);
      setMonthly(monthlyRes.data);
      setForecast(forecastRes.data);
      setCoolingPlan(coolingRes.data);
      setTreeData(treeRes.data);
      setRecommendations(recRes.data);
      setYearlyTrend(yearlyRes.data);
    } catch (err) {
      console.error('Error loading city data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-cyan-glow/20 border-t-cyan-glow rounded-full animate-spin mx-auto" />
          <p className="text-[#94A3B8] font-semibold text-sm">Analyzing city data...</p>
        </div>
      </div>
    );
  }

  if (!city) return null;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'xai', label: 'Explainable AI', icon: Brain },
    { id: 'weather', label: 'Weather', icon: Thermometer },
    { id: 'forecast', label: 'Forecast', icon: TrendingUp },
    { id: 'cooling', label: 'Cooling Plan', icon: Leaf },
    { id: 'trees', label: 'Tree Planner', icon: TreePine },
    { id: 'recommendations', label: 'Actions', icon: Shield },
  ];

  const riskColor = city.risk_score > 85 ? '#EF4444' : city.risk_score > 70 ? '#F97316' : city.risk_score > 50 ? '#EAB308' : '#10B981';

  // Radar chart data for overview
  const radarData = [
    { subject: 'Heat Risk', value: city.risk_score, fullMark: 100 },
    { subject: 'UHI', value: Math.min(100, city.uhi_intensity * 15), fullMark: 100 },
    { subject: 'Air Quality', value: Math.min(100, city.aqi / 3), fullMark: 100 },
    { subject: 'Urbanization', value: city.built_up_pct, fullMark: 100 },
    { subject: 'Green Deficit', value: 100 - city.green_cover_pct, fullMark: 100 },
    { subject: 'Water Deficit', value: 100 - city.water_body_pct * 10, fullMark: 100 },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#030712" }}>
      {/* Header */}
      <header style={{ background: "rgba(3,7,18,0.85)", backdropFilter: "blur(40px)", borderBottom: "1px solid rgba(255,255,255,0.04)" }} className=" sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-4">
          <Link to="/dashboard" className="text-[#475569] hover:text-[#3B82F6] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 flex items-center gap-3">
            <MapPin className="w-5 h-5 text-[#F97316]" />
            <div>
              <h1 className="text-lg font-bold font-semibold text-white">{city.name}</h1>
              <p className="text-[10px] text-[#475569]">{city.state} • {city.lat?.toFixed(2)}°N, {city.lng?.toFixed(2)}°E</p>
            </div>
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${
            city.vulnerability === 'Critical' ? 'badge-critical' :
            city.vulnerability === 'High' ? 'badge-high' :
            city.vulnerability === 'Moderate' ? 'badge-moderate' : 'badge-low'
          }`}>{city.vulnerability}</span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id ? 'bg-[#3B82F6]/10 text-[#3B82F6] border border-cyan-glow/30' : 'text-[#475569] hover:text-[#94A3B8] border border-transparent'
              }`}>
              <tab.icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          ))}
        </div>

        {/* ========== OVERVIEW TAB ========== */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[
                { label: 'Risk Score', value: city.risk_score, unit: '/100', color: riskColor, icon: AlertTriangle },
                { label: 'UHI Intensity', value: city.uhi_intensity, unit: '°C', color: '#F97316', icon: Thermometer },
                { label: 'LST', value: city.lst, unit: '°C', color: '#EF4444', icon: Sun },
                { label: 'AQI', value: city.aqi, unit: '', color: '#EAB308', icon: Wind },
                { label: 'Green Cover', value: city.green_cover_pct, unit: '%', color: '#10B981', icon: TreePine },
                { label: 'Population', value: `${(city.population / 1000000).toFixed(1)}`, unit: 'M', color: '#3B82F6', icon: Users },
              ].map((m, i) => (
                <div key={i} className="metric-card text-center">
                  <m.icon className="w-5 h-5 mx-auto mb-2" style={{ color: m.color }} />
                  <div className="text-xl font-bold font-semibold" style={{ color: m.color }}>
                    {m.value}<span className="text-xs text-[#475569] ml-0.5">{m.unit}</span>
                  </div>
                  <div className="text-[10px] text-[#475569] mt-1">{m.label}</div>
                </div>
              ))}
            </div>

            {/* Radar + Satellite Indices */}
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="glass-card p-5">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#3B82F6]" /> Risk Profile
                </h3>
                <div className="h-[280px]">
                  <ResponsiveContainer>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#1e3a5f" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 9 }} />
                      <Radar name="Risk" dataKey="value" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.15} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-card p-5">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#F97316]" /> Satellite Analysis
                </h3>
                <div className="space-y-4">
                  {[
                    { label: 'NDVI (Vegetation)', value: city.ndvi, max: 1, color: '#10B981', desc: city.ndvi > 0.3 ? 'Good vegetation' : city.ndvi > 0.2 ? 'Moderate' : 'Low vegetation' },
                    { label: 'NDBI (Built-up)', value: city.ndbi, max: 1, color: '#F97316', desc: city.ndbi > 0.6 ? 'High urbanization' : 'Moderate urbanization' },
                    { label: 'Green Cover', value: city.green_cover_pct, max: 100, color: '#10B981', desc: `${city.green_cover_pct}% of city area` },
                    { label: 'Built-up Area', value: city.built_up_pct, max: 100, color: '#EF4444', desc: `${city.built_up_pct}% impervious surface` },
                    { label: 'Water Bodies', value: city.water_body_pct, max: 20, color: '#06B6D4', desc: `${city.water_body_pct}% water coverage` },
                  ].map((idx, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#94A3B8]">{idx.label}</span>
                        <span className="font-bold" style={{ color: idx.color }}>{idx.value}{idx.max === 1 ? '' : '%'}</span>
                      </div>
                      <div className="w-full bg-white/[0.03] rounded-full h-2 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-1000" style={{
                          width: `${(idx.value / idx.max) * 100}%`,
                          background: idx.color,
                        }} />
                      </div>
                      <p className="text-[10px] text-[#475569] mt-0.5">{idx.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Current Weather */}
            {weather && (
              <div className="glass-card p-5">
                <h3 className="text-sm font-semibold text-white mb-4">Current Conditions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                  {[
                    { label: 'Temperature', value: `${weather.temperature}°C`, sub: `Feels ${weather.feels_like}°C` },
                    { label: 'Humidity', value: `${weather.humidity}%`, sub: 'Relative' },
                    { label: 'Wind', value: `${weather.wind_speed_kmh} km/h`, sub: weather.wind_direction },
                    { label: 'AQI', value: weather.aqi, sub: weather.aqi > 200 ? 'Unhealthy' : weather.aqi > 100 ? 'Moderate' : 'Good' },
                    { label: 'UV Index', value: weather.uv_index, sub: weather.uv_index > 8 ? 'Very High' : 'High' },
                    { label: 'Visibility', value: `${weather.visibility_km} km`, sub: '' },
                    { label: 'Conditions', value: weather.conditions, sub: `LST: ${weather.lst}°C` },
                  ].map((w, i) => (
                    <div key={i} className="text-center p-3 rounded-xl bg-white/[0.03]/30">
                      <div className="text-lg font-bold text-white">{w.value}</div>
                      <div className="text-[10px] text-[#475569]">{w.label}</div>
                      {w.sub && <div className="text-[9px] text-[#475569] mt-0.5">{w.sub}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========== EXPLAINABLE AI TAB ========== */}
        {activeTab === 'xai' && uhi && (
          <div className="space-y-6">
            <div className="glass-card p-6">
              <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Brain className="w-5 h-5 text-[#3B82F6]" /> Explainable AI — UHI Analysis
              </h2>
              <p className="text-xs text-[#475569] mb-1">Model: {uhi.prediction_model} | Confidence: {uhi.confidence}%</p>
              <div className="glow-line my-4" />

              {/* Natural language explanation */}
              <div className="p-4 rounded-xl bg-[#3B82F6]/5 border border-cyan-glow/10 mb-6">
                <p className="text-sm text-white leading-relaxed">{uhi.explanation}</p>
              </div>

              {/* AI Reasoning steps */}
              <h3 className="text-sm font-semibold text-white mb-3">🧠 AI Reasoning Chain</h3>
              <div className="space-y-2 mb-6">
                {uhi.ai_reasoning?.map((step: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03]/30">
                    <span className="w-6 h-6 rounded-full bg-[#3B82F6]/10 text-[#3B82F6] text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                    <p className="text-sm text-[#94A3B8]">{step}</p>
                  </div>
                ))}
              </div>

              {/* Risk factors */}
              {uhi.risk_factors?.length > 0 && (
                <>
                  <h3 className="text-sm font-semibold text-white mb-3">⚠️ Risk Factors Identified</h3>
                  <div className="grid sm:grid-cols-2 gap-2 mb-6">
                    {uhi.risk_factors.map((rf: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-[#EF4444]/5 border border-danger-red/10">
                        <AlertTriangle className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
                        <p className="text-xs text-[#94A3B8]">{rf}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Feature Importance Chart */}
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-white mb-4">📊 SHAP Feature Importance</h3>
              <div className="h-[300px]">
                <ResponsiveContainer>
                  <BarChart data={Object.entries(uhi.feature_importance || {}).map(([k, v]) => ({
                    name: k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    value: v as number,
                  })).sort((a, b) => b.value - a.value)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                    <XAxis type="number" stroke="#64748b" fontSize={11} />
                    <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={10} width={160} />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e3a5f', borderRadius: 12, fontSize: 12 }} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} name="Importance (%)">
                      {Object.entries(uhi.feature_importance || {}).map(([, v], i) => (
                        <Cell key={i} fill={i === 0 ? '#3B82F6' : i === 1 ? '#F97316' : i === 2 ? '#EAB308' : '#10B981'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ========== WEATHER TAB ========== */}
        {activeTab === 'weather' && monthly && (
          <div className="space-y-6">
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Monthly Temperature Profile</h3>
              <div className="h-[300px]">
                <ResponsiveContainer>
                  <AreaChart data={monthly.monthly_data}>
                    <defs>
                      <linearGradient id="tempG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e3a5f', borderRadius: 12, fontSize: 12 }} />
                    <Area type="monotone" dataKey="max_temp" stroke="#EF4444" fill="none" strokeWidth={1.5} name="Max (°C)" strokeDasharray="5 5" />
                    <Area type="monotone" dataKey="avg_temp" stroke="#F97316" fill="url(#tempG)" strokeWidth={2} name="Avg (°C)" />
                    <Area type="monotone" dataKey="min_temp" stroke="#06B6D4" fill="none" strokeWidth={1.5} name="Min (°C)" strokeDasharray="5 5" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <div className="glass-card p-5">
                <h3 className="text-sm font-semibold text-white mb-4">Monthly Rainfall</h3>
                <div className="h-[250px]">
                  <ResponsiveContainer>
                    <BarChart data={monthly.monthly_data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                      <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e3a5f', borderRadius: 12, fontSize: 12 }} />
                      <Bar dataKey="rainfall_mm" fill="#06B6D4" radius={[4, 4, 0, 0]} name="Rainfall (mm)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-card p-5">
                <h3 className="text-sm font-semibold text-white mb-4">Monthly AQI</h3>
                <div className="h-[250px]">
                  <ResponsiveContainer>
                    <BarChart data={monthly.monthly_data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                      <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e3a5f', borderRadius: 12, fontSize: 12 }} />
                      <Bar dataKey="aqi" radius={[4, 4, 0, 0]} name="AQI">
                        {monthly.monthly_data.map((d: any, i: number) => (
                          <Cell key={i} fill={d.aqi > 200 ? '#EF4444' : d.aqi > 150 ? '#F97316' : d.aqi > 100 ? '#EAB308' : '#10B981'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========== FORECAST TAB ========== */}
        {activeTab === 'forecast' && forecast && yearlyTrend && (
          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(forecast.forecasts || {}).map(([key, f]: [string, any]) => {
                const label = key.replace(/_/g, ' ').replace('year', 'Year');
                return (
                  <div key={key} className="glass-card p-5">
                    <div className="text-xs text-[#3B82F6] font-bold uppercase mb-2">{label}</div>
                    <div className="text-2xl font-bold font-semibold text-[#F97316]">
                      {f.predicted_avg_temp}°C
                    </div>
                    <div className="text-xs text-[#475569] mt-1">+{f.temp_increase}°C increase</div>
                    <div className="mt-3 space-y-1 text-[10px]">
                      <div className="flex justify-between text-[#475569]">
                        <span>Max Temp</span><span className="text-[#EF4444]">{f.predicted_max_temp}°C</span>
                      </div>
                      <div className="flex justify-between text-[#475569]">
                        <span>UHI</span><span className="text-[#F97316]">{f.predicted_uhi}°C</span>
                      </div>
                      <div className="flex justify-between text-[#475569]">
                        <span>AQI</span><span>{f.predicted_aqi}</span>
                      </div>
                      <div className="flex justify-between text-[#475569]">
                        <span>Confidence</span><span className="text-[#3B82F6]">{f.confidence}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-white mb-4">10-Year Temperature Trend</h3>
              <div className="h-[300px]">
                <ResponsiveContainer>
                  <LineChart data={yearlyTrend.yearly_trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                    <XAxis dataKey="year" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e3a5f', borderRadius: 12, fontSize: 12 }} />
                    <Line type="monotone" dataKey="avg_temp" stroke="#F97316" strokeWidth={2} dot={{ fill: '#F97316', r: 4 }} name="Avg Temp (°C)" />
                    <Line type="monotone" dataKey="max_temp" stroke="#EF4444" strokeWidth={1.5} strokeDasharray="5 5" name="Max Temp (°C)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Green Cover vs UHI Intensity Trend</h3>
              <div className="h-[250px]">
                <ResponsiveContainer>
                  <LineChart data={yearlyTrend.yearly_trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                    <XAxis dataKey="year" stroke="#64748b" fontSize={11} />
                    <YAxis yAxisId="left" stroke="#10B981" fontSize={11} />
                    <YAxis yAxisId="right" orientation="right" stroke="#F97316" fontSize={11} />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e3a5f', borderRadius: 12, fontSize: 12 }} />
                    <Line yAxisId="left" type="monotone" dataKey="green_cover_pct" stroke="#10B981" strokeWidth={2} name="Green Cover (%)" />
                    <Line yAxisId="right" type="monotone" dataKey="uhi_intensity" stroke="#F97316" strokeWidth={2} name="UHI (°C)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ========== COOLING PLAN TAB ========== */}
        {activeTab === 'cooling' && coolingPlan && (
          <div className="space-y-6">
            <div className="glass-card p-6">
              <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#3B82F6]" /> AI Cooling Action Plan — {coolingPlan.city}
              </h2>
              <p className="text-xs text-[#475569] mb-4">Auto-generated by UrbanHeat AI Recommendation Engine</p>

              {/* Budget Summary */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
                {Object.entries(coolingPlan.budget_estimate || {}).map(([k, v]: [string, any]) => (
                  <div key={k} className="text-center p-3 rounded-xl bg-white/[0.03]/30">
                    <div className="text-lg font-bold text-[#EAB308] font-semibold">₹{v}Cr</div>
                    <div className="text-[10px] text-[#475569] capitalize">{k.replace(/_/g, ' ')}</div>
                  </div>
                ))}
              </div>

              {/* Timeline strategies */}
              {[
                { key: 'immediate_actions', label: '🚨 Immediate Actions (0-6 months)', color: '#EF4444' },
                { key: 'one_year_strategy', label: '📅 1-Year Strategy', color: '#F97316' },
                { key: 'five_year_strategy', label: '🗓️ 5-Year Strategy', color: '#EAB308' },
                { key: 'ten_year_strategy', label: '🎯 10-Year Transformation', color: '#10B981' },
              ].map(({ key, label, color }) => (
                <div key={key} className="mb-6">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                    {label}
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {(coolingPlan[key] || []).map((action: any, i: number) => (
                      <div key={i} className="p-3 rounded-xl bg-white/[0.03]/20 border border-white/[0.06]/10">
                        <p className="text-sm text-white mb-1">{action.action}</p>
                        <div className="flex flex-wrap gap-3 text-[10px] text-[#475569]">
                          <span className="text-[#10B981] font-medium">Impact: {action.impact}</span>
                          {action.cost_crores !== undefined && <span>Cost: ₹{action.cost_crores}Cr</span>}
                          {action.timeline && <span>Timeline: {action.timeline}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Expected Outcomes */}
              <div className="p-4 rounded-xl bg-[#10B981]/5 border border-success-green/10">
                <h4 className="text-sm font-semibold text-[#10B981] mb-2">Expected 10-Year Outcomes</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div><span className="text-[#475569]">Temp Reduction:</span> <span className="text-[#10B981] font-bold">{coolingPlan.expected_outcomes?.temperature_reduction_10yr}°C</span></div>
                  <div><span className="text-[#475569]">Carbon Offset:</span> <span className="font-bold">{coolingPlan.expected_outcomes?.carbon_reduction_tons?.toLocaleString()} tons</span></div>
                  <div><span className="text-[#475569]">AQI Improvement:</span> <span className="font-bold">{coolingPlan.expected_outcomes?.aqi_improvement} points</span></div>
                  <div><span className="text-[#475569]">Green Cover:</span> <span className="text-[#10B981] font-bold">+{coolingPlan.expected_outcomes?.green_cover_increase_pct}%</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========== TREE PLANNER TAB ========== */}
        {activeTab === 'trees' && treeData && (
          <div className="space-y-6">
            <div className="glass-card p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <TreePine className="w-5 h-5 text-[#10B981]" /> AI Tree Plantation Estimator
              </h2>

              {/* Summary */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 rounded-xl bg-[#10B981]/5 border border-success-green/10">
                  <div className="text-2xl font-bold text-[#10B981] font-semibold">{treeData.total_trees_required?.toLocaleString()}</div>
                  <div className="text-[10px] text-[#475569]">Trees Required</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-[#3B82F6]/5 border border-cyan-glow/10">
                  <div className="text-2xl font-bold text-[#3B82F6] font-semibold">{treeData.expected_cooling_effect_c}°C</div>
                  <div className="text-[10px] text-[#475569]">Expected Cooling</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-[#EAB308]/5 border border-solar-gold/10">
                  <div className="text-2xl font-bold text-[#EAB308] font-semibold">₹{treeData.total_cost_crores}Cr</div>
                  <div className="text-[10px] text-[#475569]">Estimated Cost</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-[#F97316]/5 border border-isro-orange/10">
                  <div className="text-2xl font-bold text-[#F97316] font-semibold">{treeData.carbon_absorption_tons_year?.toLocaleString()}t</div>
                  <div className="text-[10px] text-[#475569]">CO₂ Absorbed/Year</div>
                </div>
              </div>

              {/* Recommended Species */}
              <h3 className="text-sm font-semibold text-white mb-3">Recommended Tree Species</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                {treeData.suitable_species?.map((sp: any, i: number) => (
                  <div key={i} className="p-4 rounded-xl bg-white/[0.03]/20 border border-white/[0.06]/10">
                    <h4 className="text-sm font-semibold text-white">{sp.name}</h4>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-[10px] text-[#475569]">
                      <span>Cooling: <b className="text-[#10B981]">{sp.cooling_effect_c}°C</b></span>
                      <span>CO₂: <b>{sp.carbon_kg_year} kg/yr</b></span>
                      <span>Water: <b>{sp.water_liters_day} L/day</b></span>
                      <span>Cost: <b>₹{sp.cost_inr}</b></span>
                      <span>Growth: <b>{sp.growth_rate}</b></span>
                      <span>Zones: <b>{sp.suitable_zones?.join(', ')}</b></span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Plantation Zones */}
              <h3 className="text-sm font-semibold text-white mb-3">Plantation Zones</h3>
              <div className="space-y-2">
                {treeData.plantation_zones?.map((zone: any, i: number) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.03]/20">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      zone.priority === 'Critical' ? 'bg-[#EF4444]/10 text-[#EF4444]' :
                      zone.priority === 'High' ? 'bg-[#F97316]/10 text-[#F97316]' : 'bg-[#EAB308]/10 text-[#EAB308]'
                    }`}>{zone.priority}</span>
                    <div className="flex-1">
                      <p className="text-sm text-white">{zone.name}</p>
                      <p className="text-[10px] text-[#475569]">{zone.area_hectares} hectares</p>
                    </div>
                    <span className="text-sm font-bold text-[#10B981]">{zone.trees?.toLocaleString()} trees</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========== RECOMMENDATIONS TAB ========== */}
        {activeTab === 'recommendations' && recommendations && (
          <div className="space-y-4">
            {recommendations.categories?.map((cat: any, i: number) => (
              <div key={i} className="glass-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <span className="text-lg">{cat.icon}</span> {cat.name}
                  </h3>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    cat.priority === 'Critical' ? 'badge-critical' :
                    cat.priority === 'High' ? 'badge-high' : 'badge-moderate'
                  }`}>{cat.priority}</span>
                </div>
                <div className="space-y-2">
                  {cat.actions?.map((action: any, j: number) => (
                    <div key={j} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03]/20">
                      <ChevronRight className="w-4 h-4 text-[#3B82F6] shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-white">{action.action}</p>
                        <div className="flex flex-wrap gap-3 mt-1 text-[10px] text-[#475569]">
                          <span className="text-[#10B981]">Impact: {action.impact}</span>
                          <span>Cost: {action.cost}</span>
                          <span>Timeline: {action.timeline}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
