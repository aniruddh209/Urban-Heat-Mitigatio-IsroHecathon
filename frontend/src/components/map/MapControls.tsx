import { useState } from 'react';
import {
  Layers, Maximize2, Map, Satellite, Mountain, Download,
  ChevronDown, X
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════
   Map Controls — Layer Switcher, Basemap, Fullscreen, Export
   ═══════════════════════════════════════════════════════════ */

const LAYERS = [
  { id: 'heat', label: 'LST Temperature', icon: '🌡️', group: 'Climate' },
  { id: 'uhi', label: 'UHI Intensity', icon: '🔥', group: 'Climate' },
  { id: 'ndvi', label: 'Vegetation (NDVI)', icon: '🌿', group: 'Environment' },
  { id: 'aqi', label: 'Air Quality', icon: '💨', group: 'Environment' },
  { id: 'humidity', label: 'Humidity', icon: '💧', group: 'Climate' },
  { id: 'rainfall', label: 'Rainfall', icon: '🌧️', group: 'Climate' },
  { id: 'wind', label: 'Wind Speed', icon: '🌬️', group: 'Climate' },
  { id: 'population', label: 'Population Density', icon: '👥', group: 'Urban' },
  { id: 'urban_density', label: 'Urban Built-up', icon: '🏢', group: 'Urban' },
];

const BASEMAPS = [
  { id: 'satellite', label: 'Satellite', icon: Satellite, url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' },
  { id: 'street', label: 'Street', icon: Map, url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' },
  { id: 'terrain', label: 'Terrain', icon: Mountain, url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}' },
];

interface MapControlsProps {
  selectedLayer: string;
  onLayerChange: (layer: string) => void;
  selectedBasemap: string;
  onBasemapChange: (basemap: string) => void;
  onFullscreen?: () => void;
  onExport?: () => void;
}

export default function MapControls({
  selectedLayer,
  onLayerChange,
  selectedBasemap,
  onBasemapChange,
  onFullscreen,
  onExport,
}: MapControlsProps) {
  const [layerPanelOpen, setLayerPanelOpen] = useState(false);
  const [basemapPanelOpen, setBasemapPanelOpen] = useState(false);

  const groups = ['Climate', 'Environment', 'Urban'];

  return (
    <>
      {/* Top-right control buttons */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        {/* Layer switcher button */}
        <button
          onClick={() => { setLayerPanelOpen(!layerPanelOpen); setBasemapPanelOpen(false); }}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105"
          style={{
            background: layerPanelOpen ? 'rgba(59,130,246,0.2)' : 'rgba(3,7,18,0.88)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${layerPanelOpen ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.08)'}`,
          }}
          title="Layer Switcher"
        >
          <Layers className="w-4 h-4 text-[#94A3B8]" />
        </button>

        {/* Basemap button */}
        <button
          onClick={() => { setBasemapPanelOpen(!basemapPanelOpen); setLayerPanelOpen(false); }}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105"
          style={{
            background: basemapPanelOpen ? 'rgba(59,130,246,0.2)' : 'rgba(3,7,18,0.88)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${basemapPanelOpen ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.08)'}`,
          }}
          title="Basemap"
        >
          <Map className="w-4 h-4 text-[#94A3B8]" />
        </button>

        {/* Fullscreen */}
        {onFullscreen && (
          <button
            onClick={onFullscreen}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105"
            style={{
              background: 'rgba(3,7,18,0.88)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
            title="Fullscreen"
          >
            <Maximize2 className="w-4 h-4 text-[#94A3B8]" />
          </button>
        )}

        {/* Export */}
        {onExport && (
          <button
            onClick={onExport}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105"
            style={{
              background: 'rgba(3,7,18,0.88)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
            title="Export Map"
          >
            <Download className="w-4 h-4 text-[#94A3B8]" />
          </button>
        )}
      </div>

      {/* Layer Panel */}
      {layerPanelOpen && (
        <div
          className="absolute top-4 right-14 z-[1000] rounded-xl animate-fade-in"
          style={{
            background: 'rgba(3,7,18,0.94)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '12px',
            width: 220,
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold text-[#F8FAFC] uppercase tracking-wider">Data Layers</p>
            <button onClick={() => setLayerPanelOpen(false)}>
              <X className="w-3.5 h-3.5 text-[#475569] hover:text-white" />
            </button>
          </div>

          {groups.map(group => {
            const groupLayers = LAYERS.filter(l => l.group === group);
            return (
              <div key={group} className="mb-2">
                <p className="text-[8px] font-bold text-[#334155] uppercase tracking-wider mb-1 px-1">{group}</p>
                {groupLayers.map(layer => (
                  <button
                    key={layer.id}
                    onClick={() => { onLayerChange(layer.id); }}
                    className={`w-full flex items-center gap-2 rounded-lg text-[11px] font-medium transition-all ${
                      selectedLayer === layer.id
                        ? 'bg-[#3B82F6]/10 text-white border border-[#3B82F6]/20'
                        : 'text-[#94A3B8] hover:bg-white/[0.03] border border-transparent'
                    }`}
                    style={{ padding: '6px 8px' }}
                  >
                    <span className="text-[12px]">{layer.icon}</span>
                    <span className="truncate">{layer.label}</span>
                    {selectedLayer === layer.id && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
                    )}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Basemap Panel */}
      {basemapPanelOpen && (
        <div
          className="absolute top-16 right-14 z-[1000] rounded-xl animate-fade-in"
          style={{
            background: 'rgba(3,7,18,0.94)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '12px',
            width: 180,
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold text-[#F8FAFC] uppercase tracking-wider">Basemap</p>
            <button onClick={() => setBasemapPanelOpen(false)}>
              <X className="w-3.5 h-3.5 text-[#475569] hover:text-white" />
            </button>
          </div>
          <div className="space-y-1">
            {BASEMAPS.map(bm => (
              <button
                key={bm.id}
                onClick={() => { onBasemapChange(bm.id); }}
                className={`w-full flex items-center gap-2 rounded-lg text-[11px] font-medium transition-all ${
                  selectedBasemap === bm.id
                    ? 'bg-[#3B82F6]/10 text-white border border-[#3B82F6]/20'
                    : 'text-[#94A3B8] hover:bg-white/[0.03] border border-transparent'
                }`}
                style={{ padding: '7px 10px' }}
              >
                <bm.icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{bm.label}</span>
                {selectedBasemap === bm.id && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export { BASEMAPS, LAYERS };
