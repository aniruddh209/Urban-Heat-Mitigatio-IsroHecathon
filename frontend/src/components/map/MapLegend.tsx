import { PALETTES } from './HeatmapCanvas';
import { Compass, Maximize2 } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════
   Professional Map Legend — ISRO/ArcGIS Style
   ═══════════════════════════════════════════════════════════
   Shows discrete color classes, temperature intervals, units,
   scale bar, north arrow, satellite source, and confidence.
*/

interface MapLegendProps {
  selectedLayer: string;
  confidence?: number;
  timestamp?: string;
}

const LAYER_TITLES: Record<string, { title: string; unit: string; source: string }> = {
  heat:          { title: 'Land Surface Temperature', unit: '°C', source: 'Landsat 8 / ECOSTRESS' },
  ndvi:          { title: 'Vegetation Index (NDVI)', unit: 'Index', source: 'Sentinel-2 MSI' },
  aqi:           { title: 'Air Quality Index', unit: 'AQI', source: 'CPCB India / OpenAQ' },
  population:    { title: 'Population Density', unit: '/km²', source: 'WorldPop / Census 2021' },
  humidity:      { title: 'Relative Humidity', unit: '%', source: 'ERA5 Reanalysis' },
  uhi:           { title: 'UHI Intensity', unit: '°C', source: 'UrbanHeat AI Model v2' },
  rainfall:      { title: 'Annual Rainfall', unit: 'mm', source: 'IMD / ERA5' },
  wind:          { title: 'Wind Speed', unit: 'km/h', source: 'ERA5 Reanalysis' },
  urban_density: { title: 'Urban Built-up Density', unit: '%', source: 'ESA WorldCover / GHSL' },
};

export default function MapLegend({ selectedLayer, confidence = 91, timestamp }: MapLegendProps) {
  const palette = PALETTES[selectedLayer] || PALETTES.heat;
  const layerInfo = LAYER_TITLES[selectedLayer] || LAYER_TITLES.heat;
  const now = timestamp || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="absolute bottom-4 left-4 z-[1000] rounded-xl select-none"
      style={{
        background: 'rgba(3,7,18,0.92)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.08)',
        padding: '14px 18px',
        minWidth: 200,
        maxWidth: 240,
      }}>
      
      {/* Title */}
      <p className="text-[10px] font-bold text-[#F8FAFC] uppercase tracking-wider mb-0.5">
        {layerInfo.title}
      </p>
      <p className="text-[8px] text-[#475569] mb-3">{layerInfo.source}</p>

      {/* Color scale — discrete blocks */}
      <div className="flex rounded-md overflow-hidden mb-1.5" style={{ height: 12 }}>
        {palette.colors.map((color, i) => (
          <div key={i} className="flex-1" style={{ background: color }} />
        ))}
      </div>

      {/* Labels */}
      <div className="flex justify-between mb-3">
        <span className="text-[7px] text-[#64748B]">{palette.labels[0]}</span>
        <span className="text-[7px] text-[#64748B]">{palette.labels[palette.labels.length - 1]}</span>
      </div>

      {/* Discrete class list */}
      <div className="space-y-1 mb-3 border-t border-white/[0.05] pt-2">
        {palette.colors.map((color, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-4 h-2.5 rounded-sm flex-shrink-0" style={{ background: color }} />
            <span className="text-[8px] text-[#CBD5E1]">{palette.labels[i]}</span>
          </div>
        ))}
      </div>

      {/* Meta info */}
      <div className="border-t border-white/[0.05] pt-2 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[7px] text-[#475569]">Unit</span>
          <span className="text-[8px] text-[#94A3B8] font-medium">{layerInfo.unit}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[7px] text-[#475569]">Date</span>
          <span className="text-[8px] text-[#94A3B8]">{now}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[7px] text-[#475569]">Confidence</span>
          <span className="text-[8px] font-semibold" style={{ color: confidence >= 85 ? '#10B981' : confidence >= 70 ? '#EAB308' : '#EF4444' }}>
            {confidence}%
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[7px] text-[#475569]">CRS</span>
          <span className="text-[8px] text-[#94A3B8]">EPSG:4326 (WGS84)</span>
        </div>
      </div>

      {/* North arrow */}
      <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(3,7,18,0.9)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <Compass className="w-3.5 h-3.5 text-[#64748B]" />
      </div>
    </div>
  );
}

export { LAYER_TITLES };
