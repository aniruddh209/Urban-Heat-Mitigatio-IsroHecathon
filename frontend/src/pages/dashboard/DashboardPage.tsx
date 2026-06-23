import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import type { LatLngBoundsExpression } from 'leaflet';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Globe, Thermometer, Wind, TreePine, AlertTriangle, Brain, Activity,
  Shield, BarChart3, Menu, Layers, Zap, MessageSquare, Settings, LogOut,
  Bell, Search, TrendingUp, MapPin, ChevronRight, Sparkles
} from 'lucide-react';
import { analyticsAPI, citiesAPI, mapsAPI, alertsAPI } from '../../services/api';
import 'leaflet/dist/leaflet.css';

/* India-only map bounds */
const INDIA_BOUNDS: LatLngBoundsExpression = [[6, 68], [37, 98]];

/* ================================================================
   LAYOUT CONSTANTS
   ================================================================ */
const SIDEBAR_W = 240;
const SIDEBAR_COLLAPSED_W = 64;
const TOPBAR_H = 60;

/* ================================================================
   SIDEBAR
   ================================================================ */
function Sidebar({ active, onNav, collapsed, onToggle }: {
  active: string; onNav: (v: string) => void; collapsed: boolean; onToggle: () => void;
}) {
  const nav1 = [
    { id: 'overview', icon: Activity, label: 'Overview' },
    { id: 'map', icon: Globe, label: 'Heat Map' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics' },
    { id: 'predictions', icon: Brain, label: 'AI Insights' },
  ];
  const nav2 = [
    { id: '/simulation', icon: Zap, label: 'Simulation', isLink: true },
    { id: '/vulnerability', icon: Shield, label: 'Rankings', isLink: true },
    { id: '/assistant', icon: MessageSquare, label: 'AI Chat', isLink: true },
    { id: '/alerts', icon: Bell, label: 'Alerts', isLink: true },
    { id: '/admin', icon: Settings, label: 'Admin', isLink: true },
  ];

  const w = collapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_W;

  const NavItem = ({ item, isActive }: { item: any; isActive?: boolean }) => {
    const cls = `w-full flex items-center rounded-lg text-[13px] font-medium transition-all duration-200 ${
      isActive
        ? 'bg-white/[0.06] text-white'
        : 'text-[#64748B] hover:text-[#CBD5E1] hover:bg-white/[0.03]'
    }`;
    const style = { padding: collapsed ? '9px 0' : '9px 12px', justifyContent: collapsed ? 'center' as const : 'flex-start' as const, gap: 10 };
    const inner = (
      <>
        <item.icon className={`w-[17px] h-[17px] shrink-0 ${isActive ? 'text-[#3B82F6]' : ''}`} />
        {!collapsed && <span className="truncate">{item.label}</span>}
        {isActive && !collapsed && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />}
      </>
    );
    if (item.isLink) return <Link to={item.id} className={cls} style={style} title={collapsed ? item.label : undefined}>{inner}</Link>;
    return <button onClick={() => onNav(item.id)} className={cls} style={style} title={collapsed ? item.label : undefined}>{inner}</button>;
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 z-40 flex flex-col overflow-hidden"
      style={{
        width: w, minWidth: w,
        background: '#070c1a',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        transition: 'width 0.35s ease, min-width 0.35s ease',
      }}>
      {/* Header */}
      <div className="flex items-center shrink-0" style={{ height: TOPBAR_H, padding: collapsed ? '0 12px' : '0 14px', gap: 10 }}>
        <button onClick={onToggle} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#475569] hover:text-white hover:bg-white/[0.04] transition-all shrink-0">
          <Menu className="w-4 h-4" />
        </button>
        {!collapsed && (
          <Link to="/" className="flex items-center gap-2 overflow-hidden">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#3B82F6] to-[#6366F1] flex items-center justify-center shrink-0">
              <Globe className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-[13px] font-bold text-white whitespace-nowrap">UrbanHeat<span className="text-[#3B82F6]">AI</span></span>
          </Link>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ padding: collapsed ? '12px 6px' : '12px 8px' }}>
        <p className="text-[9px] font-bold text-[#334155] uppercase tracking-[0.15em] mb-2"
          style={{ padding: collapsed ? '0' : '0 12px', textAlign: collapsed ? 'center' : 'left' }}>
          {collapsed ? '' : 'DASHBOARD'}
        </p>
        <div className="space-y-0.5 mb-6">
          {nav1.map((item) => <NavItem key={item.id} item={item} isActive={active === item.id} />)}
        </div>

        <p className="text-[9px] font-bold text-[#334155] uppercase tracking-[0.15em] mb-2"
          style={{ padding: collapsed ? '0' : '0 12px', textAlign: collapsed ? 'center' : 'left' }}>
          {collapsed ? '' : 'FEATURES'}
        </p>
        <div className="space-y-0.5">
          {nav2.map((item) => <NavItem key={item.id} item={item} />)}
        </div>
      </div>

      {/* Footer */}
      {!collapsed && (
        <div className="shrink-0 p-2 border-t border-white/[0.04]">
          <button onClick={() => { localStorage.clear(); window.location.href = '/'; }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] text-[#475569] hover:text-[#EF4444] hover:bg-red-500/[0.05] transition-all">
            <LogOut className="w-4 h-4 shrink-0" /> Sign Out
          </button>
        </div>
      )}
    </aside>
  );
}

/* ================================================================
   STAT CARD — clean, minimal
   ================================================================ */
function StatCard({ icon: Icon, label, value, unit, trend, color }: {
  icon: React.ElementType; label: string; value: string | number; unit?: string; trend?: string; color: string;
}) {
  return (
    <div className="rounded-2xl transition-all duration-300 hover:-translate-y-0.5"
      style={{ background: 'rgba(17,24,39,0.6)', border: '1px solid rgba(255,255,255,0.05)', padding: '20px 22px' }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}10` }}>
          <Icon className="w-[18px] h-[18px]" style={{ color }} />
        </div>
        {trend && (
          <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${
            trend.startsWith('-') ? 'text-emerald-400 bg-emerald-400/10' : 'text-rose-400 bg-rose-400/10'
          }`}>{trend}</span>
        )}
      </div>
      <p className="text-[24px] font-bold text-white leading-none">
        {value}{unit && <span className="text-[12px] text-[#475569] ml-1 font-normal">{unit}</span>}
      </p>
      <p className="text-[11px] text-[#64748B]" style={{ marginTop: 6 }}>{label}</p>
    </div>
  );
}

/* ================================================================
   SATELLITE MAP with heatwave markers
   ================================================================ */
function CityMap({ cities, selectedLayer }: { cities: any[]; selectedLayer: string }) {
  const getColor = (c: any) => {
    const p = c.properties;
    if (selectedLayer === 'aqi') return p.aqi > 200 ? '#EF4444' : p.aqi > 150 ? '#F97316' : p.aqi > 100 ? '#EAB308' : '#10B981';
    if (selectedLayer === 'vegetation') return p.green_cover_pct > 25 ? '#10B981' : p.green_cover_pct > 15 ? '#EAB308' : '#EF4444';
    return p.risk_score > 85 ? '#EF4444' : p.risk_score > 70 ? '#F97316' : p.risk_score > 50 ? '#EAB308' : '#10B981';
  };

  return (
    <MapContainer center={[22.5, 79.5]} zoom={5} className="w-full h-full" zoomControl scrollWheelZoom
      style={{ background: '#030712' }}
      maxBounds={INDIA_BOUNDS} maxBoundsViscosity={1.0} minZoom={4}>
      <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" maxZoom={18} />
      <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}" maxZoom={18} />
      {cities.map((c: any) => {
        const p = c.properties;
        const pos: [number, number] = [c.geometry.coordinates[1], c.geometry.coordinates[0]];
        const r = Math.max(4, Math.min(14, p.population / 2500000));
        const hot = p.risk_score > 88 || p.lst > 42;
        return (
          <React.Fragment key={p.id}>
            {hot && <CircleMarker center={pos} radius={r + 8} fillColor="#EF4444" fillOpacity={0.06} stroke color="#EF4444" weight={0.8} opacity={0.2} className="animate-ping-marker" />}
            <CircleMarker center={pos} radius={r} fillColor={getColor(c)} fillOpacity={0.75} stroke color="rgba(255,255,255,0.7)" weight={1.5} opacity={0.9}>
              <Popup>
                <div style={{ fontFamily: 'Inter, sans-serif', minWidth: 180 }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[13px] text-white">{p.name}</span>
                    {hot && <span style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', padding: '1px 6px', borderRadius: 20, fontSize: 9, fontWeight: 600 }}>🔥 Heatwave</span>}
                  </div>
                  <div className="text-[10px] text-[#94A3B8] mb-2">{p.state} · {p.vulnerability}</div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
                    <span className="text-[#64748B]">Risk</span><span className="font-semibold" style={{ color: getColor(c) }}>{p.risk_score}</span>
                    <span className="text-[#64748B]">UHI</span><span className="font-semibold text-[#F97316]">+{p.uhi_intensity}°C</span>
                    <span className="text-[#64748B]">LST</span><span className="font-semibold text-[#EF4444]">{p.lst}°C</span>
                    <span className="text-[#64748B]">AQI</span><span className="font-semibold">{p.aqi}</span>
                    <span className="text-[#64748B]">Green</span><span className="font-semibold text-[#10B981]">{p.green_cover_pct}%</span>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          </React.Fragment>
        );
      })}
    </MapContainer>
  );
}

/* ================================================================
   CHART TOOLTIP
   ================================================================ */
const TT: React.CSSProperties = {
  background: 'rgba(3,7,18,0.95)', border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 10, fontSize: 11, padding: '8px 12px', boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
};

/* ================================================================
   PANEL WRAPPER — consistent card
   ================================================================ */
function Panel({ title, icon: Icon, iconColor, rightEl, children, className = '' }: {
  title: string; icon: React.ElementType; iconColor: string; rightEl?: React.ReactNode; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`rounded-2xl overflow-hidden ${className}`}
      style={{ background: 'rgba(17,24,39,0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="flex items-center justify-between border-b border-white/[0.04]" style={{ padding: '14px 20px' }}>
        <h2 className="text-[13px] font-semibold text-[#E2E8F0] flex items-center gap-2.5">
          <Icon className="w-4 h-4" style={{ color: iconColor }} /> {title}
        </h2>
        {rightEl}
      </div>
      {children}
    </div>
  );
}

/* ================================================================
   MAIN DASHBOARD
   ================================================================ */
export default function DashboardPage() {
  const [collapsed, setCollapsed] = useState(false);
  const [view, setView] = useState('overview');
  const [cities, setCities] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [trends, setTrends] = useState<any>(null);
  const [alerts, setAlerts] = useState<any>(null);
  const [layer, setLayer] = useState('heat');
  const [topRisk, setTopRisk] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      mapsAPI.citiesGeoJSON(), analyticsAPI.summary(), analyticsAPI.trends(), alertsAPI.active(), citiesAPI.topRisk(10),
    ]).then(([c, s, t, a, r]) => {
      setCities(c.data.features || []);
      setSummary(s.data);
      setTrends(t.data);
      setAlerts(a.data);
      setTopRisk(r.data.cities || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const sw = collapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_W;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#030712' }}>
      <div className="text-center animate-fade-in">
        <div className="w-8 h-8 border-2 border-[#3B82F6]/20 border-t-[#3B82F6] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[12px] text-[#64748B]">Loading satellite data...</p>
      </div>
    </div>
  );

  const LayerSwitch = () => (
    <div className="flex gap-1">
      {[{ k: 'heat', l: 'Heat' }, { k: 'aqi', l: 'AQI' }, { k: 'vegetation', l: 'Green' }].map(({ k, l }) => (
        <button key={k} onClick={() => setLayer(k)}
          className={`text-[10px] px-2.5 py-1 rounded-md font-medium transition-all ${
            layer === k ? 'bg-white/[0.08] text-white' : 'text-[#475569] hover:text-[#94A3B8]'
          }`}>{l}</button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: '#030712' }}>
      <Sidebar active={view} onNav={setView} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

      <div style={{ marginLeft: sw, transition: 'margin-left 0.35s ease' }}>
        {/* ===== TOP BAR ===== */}
        <header className="sticky top-0 z-30 flex items-center justify-between"
          style={{ height: TOPBAR_H, padding: '0 24px', background: 'rgba(3,7,18,0.85)', backdropFilter: 'blur(30px)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
            <span className="text-[9px] text-[#475569] font-bold uppercase tracking-wider">Live</span>
            <span className="text-[#1E293B] mx-0.5">|</span>
            <h1 className="text-[14px] font-semibold text-white">
              {view === 'overview' ? 'Mission Control' : view === 'map' ? 'Satellite Intelligence' : view === 'analytics' ? 'Climate Analytics' : 'AI Predictions'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative hidden md:block">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#334155]" />
              <input type="text" placeholder="Search..."
                className="bg-white/[0.03] border border-white/[0.05] rounded-lg pl-9 pr-3 py-1.5 text-[11px] text-white w-40 focus:outline-none focus:border-[#3B82F6]/20 placeholder:text-[#334155]" />
            </div>
            <Link to="/alerts" className="relative p-2 rounded-lg hover:bg-white/[0.04] transition-colors">
              <Bell className="w-4 h-4 text-[#475569]" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#EF4444] rounded-full" />
            </Link>
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#3B82F6] to-[#6366F1] flex items-center justify-center text-[10px] font-bold text-white">U</div>
          </div>
        </header>

        {/* ===== OVERVIEW ===== */}
        {view === 'overview' && (
          <div style={{ padding: '20px 20px 20px 20px' }} className="animate-fade-in sm:p-6">
            {/* Stats row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
              <StatCard icon={Globe} label="Cities Monitored" value={summary?.total_cities_monitored || 100} color="#3B82F6" />
              <StatCard icon={AlertTriangle} label="Critical Alerts" value={summary?.critical_cities || 24} color="#EF4444" trend="+12%" />
              <StatCard icon={Thermometer} label="Avg UHI" value={`${summary?.avg_uhi_intensity || '3.2'}`} unit="°C" color="#F97316" trend="+0.3°C" />
              <StatCard icon={TreePine} label="Green Cover" value={`${summary?.avg_green_cover || '19'}`} unit="%" color="#10B981" trend="-1.2%" />
            </div>

            {/* Map + Risk Cities */}
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-4 mb-5">
              <Panel title="India Satellite View" icon={MapPin} iconColor="#3B82F6" rightEl={<LayerSwitch />}>
                <div style={{ height: 400 }}><CityMap cities={cities} selectedLayer={layer} /></div>
              </Panel>

              <Panel title="Top Risk Cities" icon={AlertTriangle} iconColor="#EF4444"
                rightEl={<Link to="/vulnerability" className="text-[10px] text-[#3B82F6] font-medium flex items-center gap-0.5 hover:text-[#60A5FA]">View All<ChevronRight className="w-3 h-3" /></Link>}>
                <div style={{ height: 400, overflowY: 'auto', padding: '6px 8px' }}>
                  {topRisk.map((c: any, i: number) => (
                    <Link key={c.id} to={`/city?id=${c.id}`}
                      className="flex items-center gap-3 rounded-xl hover:bg-white/[0.03] transition-all group" style={{ padding: '10px 14px' }}>
                      <span className={`w-5 h-5 rounded text-[9px] font-bold flex items-center justify-center shrink-0 ${
                        i < 3 ? 'bg-[#EF4444]/10 text-[#EF4444]' : 'bg-white/[0.04] text-[#475569]'
                      }`}>{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-medium text-[#CBD5E1] truncate group-hover:text-white">{c.name}</div>
                        <div className="text-[9px] text-[#475569]">{c.state}</div>
                      </div>
                      <span className={`text-[12px] font-bold tabular-nums ${c.risk_score > 90 ? 'text-[#EF4444]' : c.risk_score > 75 ? 'text-[#F97316]' : 'text-[#EAB308]'}`}>{c.risk_score}</span>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${c.vulnerability === 'Critical' ? 'badge-critical' : 'badge-high'}`}>{c.vulnerability}</span>
                    </Link>
                  ))}
                </div>
              </Panel>
            </div>

            {/* Charts — 2 columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
              <Panel title="Temperature Trend" icon={TrendingUp} iconColor="#F97316"
                rightEl={<span className="text-[9px] text-[#334155]">2015–2025</span>}>
                <div style={{ padding: 20, height: 230 }}>
                  <ResponsiveContainer>
                    <AreaChart data={trends?.temperature_trend || []}>
                      <defs><linearGradient id="tG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#F97316" stopOpacity={0.15} /><stop offset="100%" stopColor="#F97316" stopOpacity={0} /></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                      <XAxis dataKey="year" stroke="#334155" fontSize={9} tickLine={false} axisLine={false} />
                      <YAxis stroke="#334155" fontSize={9} tickLine={false} axisLine={false} domain={['dataMin - 0.3', 'dataMax + 0.3']} />
                      <Tooltip contentStyle={TT} />
                      <Area type="monotone" dataKey="avg_temp" stroke="#F97316" fill="url(#tG)" strokeWidth={2} dot={{ fill: '#F97316', r: 2.5, strokeWidth: 0 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Panel>

              <Panel title="AQI Trend" icon={Wind} iconColor="#EAB308"
                rightEl={<span className="text-[9px] text-[#334155]">2015–2025</span>}>
                <div style={{ padding: 20, height: 230 }}>
                  <ResponsiveContainer>
                    <BarChart data={trends?.aqi_trend || []}>
                      <defs><linearGradient id="aG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#EAB308" stopOpacity={0.6} /><stop offset="100%" stopColor="#EAB308" stopOpacity={0.2} /></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                      <XAxis dataKey="year" stroke="#334155" fontSize={9} tickLine={false} axisLine={false} />
                      <YAxis stroke="#334155" fontSize={9} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={TT} />
                      <Bar dataKey="avg_aqi" fill="url(#aG)" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Panel>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
              <Panel title="Green Cover Decline" icon={TreePine} iconColor="#10B981"
                rightEl={<span className="text-[9px] text-[#334155]">2015–2025</span>}>
                <div style={{ padding: 20, height: 230 }}>
                  <ResponsiveContainer>
                    <AreaChart data={trends?.green_cover_trend || []}>
                      <defs><linearGradient id="gG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10B981" stopOpacity={0.15} /><stop offset="100%" stopColor="#10B981" stopOpacity={0} /></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                      <XAxis dataKey="year" stroke="#334155" fontSize={9} tickLine={false} axisLine={false} />
                      <YAxis stroke="#334155" fontSize={9} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={TT} />
                      <Area type="monotone" dataKey="avg_pct" stroke="#10B981" fill="url(#gG)" strokeWidth={2} dot={{ fill: '#10B981', r: 2.5, strokeWidth: 0 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Panel>

              <Panel title="UHI Intensity Trend" icon={Activity} iconColor="#06B6D4"
                rightEl={<span className="text-[9px] text-[#334155]">2015–2025</span>}>
                <div style={{ padding: 20, height: 230 }}>
                  <ResponsiveContainer>
                    <LineChart data={trends?.uhi_trend || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                      <XAxis dataKey="year" stroke="#334155" fontSize={9} tickLine={false} axisLine={false} />
                      <YAxis stroke="#334155" fontSize={9} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={TT} />
                      <Line type="monotone" dataKey="avg_intensity" stroke="#06B6D4" strokeWidth={2} dot={{ fill: '#06B6D4', r: 3, strokeWidth: 2, stroke: '#030712' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Panel>
            </div>
          </div>
        )}

        {/* ===== FULL MAP ===== */}
        {view === 'map' && (
          <div className="p-5 sm:p-6 animate-fade-in">
            <Panel title="Satellite Intelligence Map" icon={Layers} iconColor="#3B82F6" rightEl={<LayerSwitch />}>
              <div style={{ height: 'calc(100vh - 140px)' }}><CityMap cities={cities} selectedLayer={layer} /></div>
            </Panel>
          </div>
        )}

        {/* ===== ANALYTICS ===== */}
        {view === 'analytics' && (
          <div className="p-5 sm:p-6 animate-fade-in">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
              <StatCard icon={Thermometer} label="Avg Temperature" value={summary?.avg_lst || '38.5'} unit="°C" color="#F97316" />
              <StatCard icon={Wind} label="Avg AQI" value={summary?.avg_aqi || '132'} color="#EAB308" />
              <StatCard icon={TreePine} label="Avg Green Cover" value={summary?.avg_green_cover || '19'} unit="%" color="#10B981" />
              <StatCard icon={Brain} label="Predictions" value={(summary?.predictions_generated || 15847).toLocaleString()} color="#8B5CF6" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Panel title="Temperature vs Green Cover" icon={TrendingUp} iconColor="#F97316">
                <div style={{ padding: 20, height: 260 }}>
                  <ResponsiveContainer>
                    <LineChart data={trends?.temperature_trend?.map((t: any, i: number) => ({ ...t, green: trends?.green_cover_trend?.[i]?.avg_pct || 0 })) || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                      <XAxis dataKey="year" stroke="#334155" fontSize={9} tickLine={false} axisLine={false} />
                      <YAxis stroke="#334155" fontSize={9} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={TT} />
                      <Line type="monotone" dataKey="avg_temp" stroke="#F97316" strokeWidth={2} dot={{ fill: '#F97316', r: 2.5 }} name="Temp" />
                      <Line type="monotone" dataKey="green" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981', r: 2.5 }} name="Green %" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Panel>
              <Panel title="Rainfall Trend" icon={Wind} iconColor="#06B6D4">
                <div style={{ padding: 20, height: 260 }}>
                  <ResponsiveContainer>
                    <BarChart data={trends?.rainfall_trend || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                      <XAxis dataKey="year" stroke="#334155" fontSize={9} tickLine={false} axisLine={false} />
                      <YAxis stroke="#334155" fontSize={9} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={TT} />
                      <Bar dataKey="avg_mm" fill="#06B6D4" radius={[3, 3, 0, 0]} opacity={0.7} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Panel>
            </div>
          </div>
        )}

        {/* ===== AI PREDICTIONS ===== */}
        {view === 'predictions' && (
          <div className="p-5 sm:p-6 animate-fade-in">
            <Panel title="AI Prediction Models" icon={Brain} iconColor="#8B5CF6">
              <div className="p-4 sm:p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {[
                    { name: 'UHI Detector', model: 'XGBoost', acc: 94.2, c: '#3B82F6' },
                    { name: 'Temp Forecast', model: 'LSTM', acc: 88.5, c: '#F97316' },
                    { name: 'Risk Scorer', model: 'Ensemble', acc: 91.8, c: '#EF4444' },
                    { name: 'Clustering', model: 'KMeans', acc: 89.3, c: '#8B5CF6' },
                    { name: 'Green Analyzer', model: 'RF', acc: 92.1, c: '#10B981' },
                    { name: 'Recommender', model: 'Rule+ML', acc: 87.6, c: '#EAB308' },
                    { name: 'XAI Engine', model: 'SHAP', acc: 95.0, c: '#EC4899' },
                    { name: 'Simulation', model: 'Physics', acc: 85.2, c: '#06B6D4' },
                  ].map((m, i) => (
                    <div key={i} className="rounded-xl" style={{ padding: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <Sparkles className="w-3.5 h-3.5" style={{ color: m.c }} />
                        <span className="text-[8px] font-bold text-[#10B981] bg-[#10B981]/10 px-1.5 py-0.5 rounded">Active</span>
                      </div>
                      <p className="font-semibold text-white text-[12px]">{m.name}</p>
                      <p className="text-[10px] text-[#475569]">{m.model}</p>
                      <div className="mt-3 flex items-center justify-between text-[9px] mb-1">
                        <span className="text-[#475569]">Accuracy</span>
                        <span className="font-bold" style={{ color: m.c }}>{m.acc}%</span>
                      </div>
                      <div className="w-full bg-white/[0.04] rounded-full h-1 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${m.acc}%`, background: m.c }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>

            <div className="mt-5">
            <Panel title="Active Heat Alerts" icon={AlertTriangle} iconColor="#EF4444">
              <div className="p-4 sm:p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {alerts?.alerts?.slice(0, 6).map((a: any, i: number) => (
                    <div key={i} className="rounded-xl" style={{ padding: 16,
                      background: a.severity === 'Extreme' ? 'rgba(239,68,68,0.04)' : 'rgba(249,115,22,0.04)',
                      border: `1px solid ${a.severity === 'Extreme' ? 'rgba(239,68,68,0.1)' : 'rgba(249,115,22,0.1)'}`,
                    }}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-[12px] text-white">{a.city}</span>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${a.severity === 'Extreme' ? 'badge-critical' : 'badge-high'}`}>{a.severity}</span>
                      </div>
                      <p className="text-[10px] text-[#64748B]">LST: <span className="text-white">{a.lst}°C</span> · Pop: <span className="text-white">{a.population_at_risk?.toLocaleString()}</span></p>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
