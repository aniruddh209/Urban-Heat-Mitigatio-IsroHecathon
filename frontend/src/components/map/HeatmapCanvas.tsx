import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

/* ═══════════════════════════════════════════════════════════
   GIS-Quality Canvas Heatmap Overlay
   ═══════════════════════════════════════════════════════════
   Renders a discrete-class thermal surface using IDW interpolation
   on an HTML5 Canvas overlay. Matches ISRO/ArcGIS color standards
   with 8 temperature classes and India boundary clipping.
*/

// ─── 8-Class Discrete Color Palettes ───────────────────────
const PALETTES: Record<string, { breaks: number[]; colors: string[]; labels: string[] }> = {
  heat: {
    breaks:  [30, 33, 36, 39, 42, 45, 48, 100],
    colors:  ['#1e3a5f', '#3b82f6', '#10b981', '#84cc16', '#eab308', '#f97316', '#ef4444', '#7f1d1d'],
    labels:  ['<30°C', '30–33°C', '33–36°C', '36–39°C', '39–42°C', '42–45°C', '45–48°C', '>48°C'],
  },
  ndvi: {
    breaks:  [0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5, 1.0],
    colors:  ['#7f1d1d', '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#10b981', '#065f46'],
    labels:  ['<0.10', '0.10–0.15', '0.15–0.20', '0.20–0.25', '0.25–0.30', '0.30–0.40', '0.40–0.50', '>0.50'],
  },
  aqi: {
    breaks:  [50, 100, 150, 200, 250, 300, 400, 999],
    colors:  ['#10b981', '#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444', '#dc2626', '#7f1d1d'],
    labels:  ['Good <50', '50–100', '100–150', '150–200', '200–250', '250–300', '300–400', '>400'],
  },
  population: {
    breaks:  [1000, 3000, 5000, 10000, 15000, 20000, 30000, 100000],
    colors:  ['#1e3a5f', '#3b82f6', '#06b6d4', '#22c55e', '#eab308', '#f97316', '#ef4444', '#7f1d1d'],
    labels:  ['<1K', '1–3K', '3–5K', '5–10K', '10–15K', '15–20K', '20–30K', '>30K'],
  },
  humidity: {
    breaks:  [30, 40, 50, 60, 70, 80, 90, 100],
    colors:  ['#7f1d1d', '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#06b6d4', '#1e3a5f'],
    labels:  ['<30%', '30–40%', '40–50%', '50–60%', '60–70%', '70–80%', '80–90%', '>90%'],
  },
  uhi: {
    breaks:  [1, 2, 3, 4, 5, 6, 7, 20],
    colors:  ['#1e3a5f', '#3b82f6', '#22c55e', '#eab308', '#f97316', '#ef4444', '#dc2626', '#7f1d1d'],
    labels:  ['<1°C', '1–2°C', '2–3°C', '3–4°C', '4–5°C', '5–6°C', '6–7°C', '>7°C'],
  },
  rainfall: {
    breaks:  [400, 600, 800, 1000, 1500, 2000, 3000, 10000],
    colors:  ['#7f1d1d', '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#06b6d4', '#1e3a5f'],
    labels:  ['<400mm', '400–600', '600–800', '800–1000', '1000–1500', '1500–2000', '2000–3000', '>3000'],
  },
  wind: {
    breaks:  [3, 5, 7, 9, 11, 14, 18, 50],
    colors:  ['#1e3a5f', '#3b82f6', '#06b6d4', '#22c55e', '#eab308', '#f97316', '#ef4444', '#7f1d1d'],
    labels:  ['<3', '3–5', '5–7', '7–9', '9–11', '11–14', '14–18', '>18 km/h'],
  },
  urban_density: {
    breaks:  [20, 30, 40, 50, 60, 70, 80, 100],
    colors:  ['#065f46', '#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444', '#dc2626', '#7f1d1d'],
    labels:  ['<20%', '20–30%', '30–40%', '40–50%', '50–60%', '60–70%', '70–80%', '>80%'],
  },
};

// ─── India Boundary Polygon (simplified) ────────────────────
const INDIA_POLY: [number, number][] = [
  [8.0, 68.1], [8.5, 76.5], [10.5, 79.8], [12.5, 80.5], [15.5, 80.0],
  [17.5, 82.5], [19.0, 84.5], [21.0, 87.0], [21.5, 88.5], [22.0, 89.5],
  [22.0, 88.5], [26.5, 89.0], [26.5, 92.0], [28.0, 97.0], [25.0, 97.5],
  [22.0, 94.5], [21.5, 92.0], [28.5, 84.0], [33.5, 80.0], [35.5, 77.0],
  [34.5, 74.8], [31.5, 74.0], [25.5, 70.5], [23.5, 68.5], [22.0, 70.0],
  [21.0, 72.5], [18.0, 72.5], [13.0, 72.5], [10.5, 74.5], [8.0, 76.5],
  [8.0, 68.1],
];

function isInsideIndia(lat: number, lng: number): boolean {
  if (lat < 7 || lat > 36 || lng < 68 || lng > 97.5) return false;
  // Ray-casting point-in-polygon
  let inside = false;
  for (let i = 0, j = INDIA_POLY.length - 1; i < INDIA_POLY.length; j = i++) {
    const [yi, xi] = INDIA_POLY[i];
    const [yj, xj] = INDIA_POLY[j];
    if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

// ─── IDW Interpolation ──────────────────────────────────────
function idwInterpolate(
  lat: number, lng: number,
  points: { lat: number; lng: number; value: number }[],
  power = 2.5, maxDist = 6.0
): number {
  let sumWV = 0, sumW = 0;
  for (const p of points) {
    const d = Math.sqrt((lat - p.lat) ** 2 + (lng - p.lng) ** 2);
    if (d < 0.01) return p.value;
    if (d > maxDist) continue;
    const w = 1 / Math.pow(d, power);
    sumWV += w * p.value;
    sumW += w;
  }
  return sumW > 0 ? sumWV / sumW : 0;
}

// ─── Get value for a city given the selected layer ──────────
function getCityValue(props: any, layer: string): number {
  switch (layer) {
    case 'heat': return props.lst ?? 35;
    case 'ndvi': return props.ndvi ?? 0.2;
    case 'aqi': return props.aqi ?? 100;
    case 'population': return (props.population ?? 1000000) / Math.max(props.area_km2 ?? 500, 1);
    case 'humidity': return props.humidity ?? 50;
    case 'uhi': return props.uhi_intensity ?? 3;
    case 'rainfall': return props.rainfall_mm ?? 800;
    case 'wind': return 8; // Default wind speed
    case 'urban_density': return props.built_up_pct ?? (props.ndbi ? props.ndbi * 100 : 50);
    default: return props.lst ?? 35;
  }
}

// ─── Classify value into discrete color ─────────────────────
function classifyColor(value: number, palette: { breaks: number[]; colors: string[] }): string {
  for (let i = 0; i < palette.breaks.length; i++) {
    if (value < palette.breaks[i]) return palette.colors[i];
  }
  return palette.colors[palette.colors.length - 1];
}

// ─── Hex to RGBA ────────────────────────────────────────────
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ═══════════════════════════════════════════════════════════
//  CANVAS OVERLAY COMPONENT
// ═══════════════════════════════════════════════════════════

interface HeatmapCanvasProps {
  cities: any[];
  selectedLayer: string;
  gridStep?: number;
  opacity?: number;
}

export default function HeatmapCanvas({
  cities,
  selectedLayer,
  gridStep = 0.2,
  opacity = 0.55,
}: HeatmapCanvasProps) {
  const map = useMap();
  const canvasLayerRef = useRef<any>(null);

  useEffect(() => {
    if (!cities.length) return;

    // Remove previous canvas overlay
    if (canvasLayerRef.current) {
      map.removeLayer(canvasLayerRef.current);
    }

    const palette = PALETTES[selectedLayer] || PALETTES.heat;

    // Extract city data points
    const cityData = cities.map((c: any) => ({
      lat: c.geometry.coordinates[1],
      lng: c.geometry.coordinates[0],
      value: getCityValue(c.properties, selectedLayer),
    }));

    // Create Leaflet canvas overlay
    const CanvasOverlay = L.Layer.extend({
      onAdd(mapInstance: L.Map) {
        this._map = mapInstance;
        this._canvas = L.DomUtil.create('canvas', 'leaflet-heatmap-canvas') as HTMLCanvasElement;
        this._canvas.style.position = 'absolute';
        this._canvas.style.pointerEvents = 'none';
        this._canvas.style.opacity = String(opacity);
        this._canvas.style.transition = 'opacity 0.5s ease';

        const pane = mapInstance.getPane('overlayPane');
        if (pane) pane.appendChild(this._canvas);

        mapInstance.on('moveend zoomend resize', this._redraw, this);
        this._redraw();
      },

      onRemove(mapInstance: L.Map) {
        if (this._canvas?.parentNode) {
          this._canvas.parentNode.removeChild(this._canvas);
        }
        mapInstance.off('moveend zoomend resize', this._redraw, this);
      },

      _redraw() {
        const mapEl = this._map;
        if (!mapEl) return;

        const size = mapEl.getSize();
        const canvas = this._canvas;
        canvas.width = size.x;
        canvas.height = size.y;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, size.x, size.y);

        // Position canvas
        const topLeft = mapEl.containerPointToLayerPoint([0, 0]);
        L.DomUtil.setPosition(canvas, topLeft);

        const bounds = mapEl.getBounds();
        const zoom = mapEl.getZoom();

        // Adjust grid step based on zoom level for performance
        const step = zoom >= 7 ? 0.1 : zoom >= 6 ? 0.15 : zoom >= 5 ? 0.2 : 0.3;
        const maxDist = zoom >= 7 ? 3 : zoom >= 6 ? 4 : zoom >= 5 ? 6 : 8;

        // Render each grid cell
        for (let lat = bounds.getSouth(); lat <= bounds.getNorth(); lat += step) {
          for (let lng = bounds.getWest(); lng <= bounds.getEast(); lng += step) {
            if (!isInsideIndia(lat, lng)) continue;

            const value = idwInterpolate(lat, lng, cityData, 2.5, maxDist);
            if (value === 0) continue;

            const color = classifyColor(value, palette);

            // Convert geo coords to pixel coords
            const p1 = mapEl.latLngToContainerPoint([lat + step, lng]);
            const p2 = mapEl.latLngToContainerPoint([lat, lng + step]);
            const w = Math.max(1, p2.x - p1.x);
            const h = Math.max(1, p2.y - p1.y);

            ctx.fillStyle = hexToRgba(color, 0.75);
            ctx.fillRect(p1.x, p1.y, w + 1, h + 1); // +1 to eliminate gaps
          }
        }
      },
    });

    const overlay = new CanvasOverlay();
    overlay.addTo(map);
    canvasLayerRef.current = overlay;

    return () => {
      if (canvasLayerRef.current) {
        map.removeLayer(canvasLayerRef.current);
        canvasLayerRef.current = null;
      }
    };
  }, [cities, selectedLayer, map, gridStep, opacity]);

  return null;
}

export { PALETTES, getCityValue, classifyColor };
