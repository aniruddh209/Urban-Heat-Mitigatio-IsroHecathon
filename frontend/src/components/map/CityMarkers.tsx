import { Link } from 'react-router-dom';
import { CircleMarker, Popup } from 'react-leaflet';

/* ═══════════════════════════════════════════════════════════
   City Markers — Rich popups with data-driven styling
   ═══════════════════════════════════════════════════════════ */

interface CityMarkersProps {
  cities: any[];
  selectedLayer: string;
}

function getMarkerColor(props: any, layer: string): string {
  if (layer === 'aqi') return props.aqi > 200 ? '#EF4444' : props.aqi > 150 ? '#F97316' : props.aqi > 100 ? '#EAB308' : '#10B981';
  if (layer === 'ndvi') return props.green_cover_pct > 25 ? '#10B981' : props.green_cover_pct > 15 ? '#EAB308' : '#EF4444';
  return props.risk_score > 85 ? '#EF4444' : props.risk_score > 70 ? '#F97316' : props.risk_score > 50 ? '#EAB308' : '#10B981';
}

export default function CityMarkers({ cities, selectedLayer }: CityMarkersProps) {
  return (
    <>
      {cities.map((c: any) => {
        const p = c.properties;
        const pos: [number, number] = [c.geometry.coordinates[1], c.geometry.coordinates[0]];
        const r = Math.max(3, Math.min(8, (p.population || 1000000) / 4000000));
        const hot = p.risk_score > 88 || p.lst > 42;
        const riskColor = getMarkerColor(p, selectedLayer);

        return (
          <CircleMarker
            key={p.id}
            center={pos}
            radius={r}
            fillColor="rgba(255,255,255,0.9)"
            fillOpacity={0.85}
            color={hot ? '#EF4444' : 'rgba(255,255,255,0.6)'}
            weight={hot ? 2 : 1.2}
            opacity={0.9}
          >
            <Popup>
              <div style={{ fontFamily: 'Inter, sans-serif', minWidth: 230 }}>
                {/* Header */}
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-[14px] text-white">{p.name}</span>
                  {hot && (
                    <span style={{
                      background: 'rgba(239,68,68,0.12)',
                      color: '#f87171',
                      border: '1px solid rgba(239,68,68,0.2)',
                      padding: '2px 8px',
                      borderRadius: 20,
                      fontSize: 9,
                      fontWeight: 700,
                    }}>🔥 Heatwave</span>
                  )}
                </div>
                <div className="text-[10px] text-[#94A3B8] mb-3">
                  {p.state} · <span style={{ color: riskColor, fontWeight: 600 }}>{p.vulnerability}</span>
                </div>

                {/* Key metrics grid */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="text-center rounded-lg" style={{ background: 'rgba(239,68,68,0.06)', padding: '6px 4px' }}>
                    <p className="text-[16px] font-bold text-[#EF4444]">{p.lst}°</p>
                    <p className="text-[7px] text-[#64748B] uppercase font-semibold">LST</p>
                  </div>
                  <div className="text-center rounded-lg" style={{ background: 'rgba(249,115,22,0.06)', padding: '6px 4px' }}>
                    <p className="text-[16px] font-bold text-[#F97316]">+{p.uhi_intensity}°</p>
                    <p className="text-[7px] text-[#64748B] uppercase font-semibold">UHI</p>
                  </div>
                  <div className="text-center rounded-lg" style={{ background: `${riskColor}10`, padding: '6px 4px' }}>
                    <p className="text-[16px] font-bold" style={{ color: riskColor }}>{p.risk_score}</p>
                    <p className="text-[7px] text-[#64748B] uppercase font-semibold">Risk</p>
                  </div>
                </div>

                {/* Detail rows */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px] mb-3">
                  <span className="text-[#64748B]">AQI</span>
                  <span className="font-semibold text-right">{p.aqi}</span>
                  <span className="text-[#64748B]">Green Cover</span>
                  <span className="font-semibold text-[#10B981] text-right">{p.green_cover_pct}%</span>
                  <span className="text-[#64748B]">NDVI</span>
                  <span className="font-semibold text-[#10B981] text-right">{p.ndvi}</span>
                  <span className="text-[#64748B]">Humidity</span>
                  <span className="font-semibold text-right">{p.humidity}%</span>
                  <span className="text-[#64748B]">Rainfall</span>
                  <span className="font-semibold text-right">{p.rainfall_mm}mm</span>
                </div>

                {/* Action button */}
                <Link
                  to={`/city?id=${p.id}`}
                  className="block w-full text-center text-[10px] font-semibold py-1.5 rounded-lg transition-all"
                  style={{
                    background: 'rgba(59,130,246,0.1)',
                    color: '#60A5FA',
                    border: '1px solid rgba(59,130,246,0.15)',
                  }}
                >
                  View Full Analysis →
                </Link>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
}
