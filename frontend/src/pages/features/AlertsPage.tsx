import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Shield, MapPin, Users, Building, Heart } from 'lucide-react';
import { alertsAPI } from '../../services/api';

const CARD = { background: 'rgba(17,24,39,0.6)', border: '1px solid rgba(255,255,255,0.05)' };
const HEADER = { background: 'rgba(3,7,18,0.85)', backdropFilter: 'blur(30px)', borderBottom: '1px solid rgba(255,255,255,0.04)' };

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    alertsAPI.active().then(res => { setAlerts(res.data); setLoading(false); });
  }, []);

  const filtered = alerts?.alerts?.filter((a: any) =>
    filter === 'all' ? true : a.severity.toLowerCase() === filter
  ) || [];

  return (
    <div className="min-h-screen" style={{ background: '#030712' }}>
      <header className="sticky top-0 z-30" style={HEADER}>
        <div className="max-w-7xl mx-auto flex items-center gap-4" style={{ padding: '0 24px', height: 60 }}>
          <Link to="/dashboard" className="text-[#475569] hover:text-[#3B82F6] transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-[15px] font-semibold text-white">Emergency Heatwave Alerts</h1>
          <div className="ml-auto flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-pulse" />
            <span className="text-[11px] text-[#EF4444] font-semibold">{alerts?.total_alerts || 0} Active</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-5 sm:py-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
          {[
            { label: 'Total Alerts', count: alerts?.total_alerts || 0, color: '#FFFFFF', filter: 'all' },
            { label: 'Extreme', count: alerts?.extreme_count || 0, color: '#EF4444', filter: 'extreme' },
            { label: 'Severe', count: alerts?.severe_count || 0, color: '#F97316', filter: 'severe' },
            { label: 'High / Moderate', count: (alerts?.total_alerts || 0) - (alerts?.extreme_count || 0) - (alerts?.severe_count || 0), color: '#EAB308', filter: 'high' },
          ].map((s, i) => (
            <button key={i} onClick={() => setFilter(s.filter)}
              className={`rounded-2xl text-center transition-all hover:-translate-y-0.5 ${filter === s.filter ? 'ring-1 ring-[#3B82F6]/30' : ''}`}
              style={{ ...CARD, padding: 20 }}>
              <div className="text-[28px] font-bold" style={{ color: s.color }}>{s.count}</div>
              <div className="text-[11px] text-[#475569]" style={{ marginTop: 4 }}>{s.label}</div>
            </button>
          ))}
        </div>

        {/* Alert Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {filtered.map((alert: any, i: number) => {
            const borderColor = alert.severity === 'Extreme' ? '#EF4444' : alert.severity === 'Severe' ? '#F97316' : '#EAB308';
            return (
              <div key={i} className="rounded-2xl transition-all hover:-translate-y-0.5"
                style={{ ...CARD, padding: 20, borderLeft: `3px solid ${borderColor}` }}>
                <div className="flex items-start justify-between" style={{ marginBottom: 14 }}>
                  <div>
                    <h3 className="font-semibold text-white text-[13px] flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#475569]" /> {alert.city}
                    </h3>
                    <p className="text-[10px] text-[#475569] mt-0.5">{alert.state}</p>
                  </div>
                  <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full ${
                    alert.severity === 'Extreme' ? 'badge-critical' : alert.severity === 'Severe' ? 'badge-high' : 'badge-moderate'
                  }`}>{alert.severity}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                  <div className="flex items-center gap-1.5 text-[10px] text-[#94A3B8]">
                    <AlertTriangle className="w-3 h-3 text-[#F97316]" />
                    LST: <span className="font-bold text-[#F97316]">{alert.lst}°C</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-[#94A3B8]">
                    <Users className="w-3 h-3 text-[#EF4444]" />
                    At Risk: <span className="font-bold text-white">{alert.population_at_risk?.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-[#94A3B8]">
                    <Building className="w-3 h-3" />
                    Hospitals: <span className="font-bold text-white">{alert.hospitals_at_risk}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-[#94A3B8]">
                    <Heart className="w-3 h-3 text-[#EF4444]" />
                    Seniors: <span className="font-bold text-white">{alert.senior_citizens_at_risk?.toLocaleString()}</span>
                  </div>
                </div>

                <p className="text-[10px] text-[#64748B] leading-relaxed" style={{ marginBottom: 12 }}>{alert.advisory}</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {alert.recommendations?.slice(0, 3).map((rec: string, j: number) => (
                    <div key={j} className="text-[9px] text-[#475569] flex items-start gap-1.5">
                      <Shield className="w-3 h-3 text-[#3B82F6] shrink-0 mt-0.5" /> {rec}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
