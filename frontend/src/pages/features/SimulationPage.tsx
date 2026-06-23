import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Zap, TreePine, Droplets, Sun, Building, BarChart3, Thermometer, Leaf } from 'lucide-react';
import { simulationAPI, citiesAPI } from '../../services/api';

const CARD = { background: 'rgba(17,24,39,0.6)', border: '1px solid rgba(255,255,255,0.05)' };
const HEADER = { background: 'rgba(3,7,18,0.85)', backdropFilter: 'blur(30px)', borderBottom: '1px solid rgba(255,255,255,0.04)' };
const INPUT = "w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-white text-[13px] focus:outline-none focus:border-[#3B82F6]/30 transition-all";

export default function SimulationPage() {
  const [cities, setCities] = useState<any[]>([]);
  const [selectedCity, setSelectedCity] = useState('c001');
  const [params, setParams] = useState({
    green_cover_increase_pct: 10, water_body_increase_pct: 3, cool_roof_pct: 30,
    solar_roof_pct: 15, urban_forest_area_km2: 3, reflective_roads_pct: 20,
  });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [presets, setPresets] = useState<any[]>([]);

  useEffect(() => {
    citiesAPI.list({ sort_by: 'risk_score', order: 'desc', limit: 50 }).then(res => setCities(res.data.cities || []));
    simulationAPI.presets().then(res => setPresets(res.data.presets || []));
    runSimulation();
  }, []);

  const runSimulation = async () => {
    setLoading(true);
    try { const res = await simulationAPI.run({ city_id: selectedCity, ...params }); setResult(res.data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const applyPreset = (preset: any) => {
    setParams({
      green_cover_increase_pct: preset.green_cover_increase_pct || 0,
      water_body_increase_pct: preset.water_body_increase_pct || 0,
      cool_roof_pct: preset.cool_roof_pct || 0,
      solar_roof_pct: preset.solar_roof_pct || 0,
      urban_forest_area_km2: preset.urban_forest_area_km2 || 0,
      reflective_roads_pct: preset.reflective_roads_pct || 0,
    });
  };

  const sliders = [
    { key: 'green_cover_increase_pct', label: 'Green Cover', icon: TreePine, max: 30, unit: '%', color: '#10B981' },
    { key: 'water_body_increase_pct', label: 'Water Bodies', icon: Droplets, max: 15, unit: '%', color: '#06B6D4' },
    { key: 'cool_roof_pct', label: 'Cool Roofs', icon: Building, max: 80, unit: '%', color: '#94A3B8' },
    { key: 'solar_roof_pct', label: 'Solar Roofs', icon: Sun, max: 60, unit: '%', color: '#EAB308' },
    { key: 'urban_forest_area_km2', label: 'Urban Forest', icon: Leaf, max: 20, unit: 'km²', color: '#10B981' },
    { key: 'reflective_roads_pct', label: 'Reflective Roads', icon: Building, max: 60, unit: '%', color: '#64748B' },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#030712' }}>
      <header className="sticky top-0 z-30" style={HEADER}>
        <div className="max-w-7xl mx-auto flex items-center gap-4" style={{ padding: '0 24px', height: 60 }}>
          <Link to="/dashboard" className="text-[#475569] hover:text-[#3B82F6] transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-[15px] font-semibold text-white">"What If" Climate Simulation</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-5 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4 sm:gap-5">
          {/* Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* City */}
            <div className="rounded-2xl" style={{ ...CARD, padding: 20 }}>
              <h3 className="text-[12px] font-semibold text-[#E2E8F0] mb-3">Select City</h3>
              <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} className={INPUT}>
                {cities.map((c: any) => <option key={c.id} value={c.id}>{c.name} ({c.state}) — Risk: {c.risk_score}</option>)}
              </select>
            </div>

            {/* Presets */}
            <div className="rounded-2xl" style={{ ...CARD, padding: 20 }}>
              <h3 className="text-[12px] font-semibold text-[#E2E8F0] mb-3">Quick Presets</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {presets.map((p: any, i: number) => (
                  <button key={i} onClick={() => applyPreset(p)}
                    className="w-full text-left rounded-xl hover:bg-white/[0.04] transition-all"
                    style={{ padding: '10px 14px', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div className="text-[12px] font-medium text-white">{p.name}</div>
                    <div className="text-[10px] text-[#475569] mt-0.5">{p.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders */}
            <div className="rounded-2xl" style={{ ...CARD, padding: 20 }}>
              <h3 className="text-[12px] font-semibold text-[#E2E8F0] mb-4">Intervention Parameters</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {sliders.map(({ key, label, icon: Icon, max, unit, color }) => (
                  <div key={key}>
                    <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                      <span className="flex items-center gap-2 text-[11px] text-[#94A3B8]">
                        <Icon className="w-3.5 h-3.5" style={{ color }} /> {label}
                      </span>
                      <span className="text-[11px] font-bold text-white">{(params as any)[key]}{unit}</span>
                    </div>
                    <input type="range" min={0} max={max} value={(params as any)[key]}
                      onChange={(e) => setParams({ ...params, [key]: Number(e.target.value) })}
                      className="w-full" />
                  </div>
                ))}
              </div>
              <button onClick={runSimulation} disabled={loading} className="btn-primary w-full" style={{ marginTop: 16 }}>
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Zap className="w-4 h-4" /> Run Simulation</>}
              </button>
            </div>
          </div>

          {/* Results */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {result && (<>
              {/* Impact Summary */}
              <div className="rounded-2xl" style={{ ...CARD, padding: 24 }}>
                <h2 className="text-[14px] font-semibold text-white flex items-center gap-2 mb-5">
                  <BarChart3 className="w-4 h-4 text-[#3B82F6]" /> Results — {result.city}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
                  {[
                    { label: 'Temp Reduction', value: `${result.impact_summary?.temperature_reduction}°C`, color: '#10B981' },
                    { label: 'AQI Improvement', value: `-${result.impact_summary?.aqi_improvement}`, color: '#3B82F6' },
                    { label: 'Carbon Reduced', value: `${result.impact_summary?.carbon_reduction_tons?.toLocaleString()}t`, color: '#34D399' },
                    { label: 'Heat Drop', value: `${result.impact_summary?.heat_index_reduction}°C`, color: '#F97316' },
                    { label: 'Sustainability', value: `${result.impact_summary?.sustainability_score}/100`, color: '#EAB308' },
                  ].map((m, i) => (
                    <div key={i} className="text-center rounded-xl" style={{ padding: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <div className="text-[18px] font-bold" style={{ color: m.color }}>{m.value}</div>
                      <div className="text-[9px] text-[#475569] mt-1">{m.label}</div>
                    </div>
                  ))}
                </div>

                <h3 className="text-[12px] font-semibold text-[#E2E8F0] mb-4">Before vs After</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    { label: 'Avg Temp', before: result.before?.avg_temp, after: result.after?.avg_temp, unit: '°C', color: '#10B981', lower: true },
                    { label: 'LST', before: result.before?.lst, after: result.after?.lst, unit: '°C', color: '#3B82F6', lower: true },
                    { label: 'UHI', before: result.before?.uhi_intensity, after: result.after?.uhi_intensity, unit: '°C', color: '#06B6D4', lower: true },
                    { label: 'AQI', before: result.before?.aqi, after: result.after?.aqi, unit: '', color: '#EAB308', lower: true },
                    { label: 'Green Cover', before: result.before?.green_cover_pct, after: result.after?.green_cover_pct, unit: '%', color: '#10B981', lower: false },
                    { label: 'Risk Score', before: result.before?.risk_score, after: result.after?.risk_score, unit: '', color: '#34D399', lower: true },
                  ].map((r, i) => {
                    const max = Math.max(r.before, r.after) * 1.2;
                    const improved = r.lower ? r.after < r.before : r.after > r.before;
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between text-[11px] mb-2">
                          <span className="text-[#94A3B8]">{r.label}</span>
                          <span className={`font-bold ${improved ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                            {r.before}{r.unit} → {r.after}{r.unit}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1 bg-white/[0.04] rounded-full h-2 overflow-hidden">
                            <div className="h-full rounded-full bg-[#F97316]/50" style={{ width: `${(r.before / max) * 100}%` }} />
                          </div>
                          <div className="flex-1 bg-white/[0.04] rounded-full h-2 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${(r.after / max) * 100}%`, background: r.color }} />
                          </div>
                        </div>
                        <div className="flex justify-between text-[9px] text-[#334155] mt-1"><span>Before</span><span>After</span></div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Interventions */}
              <div className="rounded-2xl" style={{ ...CARD, padding: 24 }}>
                <h3 className="text-[12px] font-semibold text-[#E2E8F0] mb-4">Applied Interventions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {result.interventions?.map((inv: any, i: number) => (
                    <div key={i} className="rounded-xl" style={{ padding: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <div className="text-[12px] font-medium text-white">{inv.type}</div>
                      <div className="text-[11px] text-[#3B82F6] font-bold mt-1">{inv.value}</div>
                      <div className="text-[10px] text-[#10B981] mt-0.5">{inv.temp_effect}°C cooling</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Confidence */}
              <div className="rounded-2xl flex items-center gap-4" style={{ ...CARD, padding: '14px 20px' }}>
                <span className="text-[11px] text-[#475569]">Model: {result.model}</span>
                <span className="text-[11px] text-[#3B82F6] font-bold">Confidence: {result.confidence}%</span>
              </div>
            </>)}
          </div>
        </div>
      </div>
    </div>
  );
}
