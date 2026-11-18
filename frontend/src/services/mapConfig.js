/**
 * mapConfig.js — Leaflet default icon fix for Vite + React-Leaflet
 * Import this once in main.jsx or any component that uses Leaflet.
 */
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Vite doesn't bundle Leaflet's default marker images correctly.
// Override with CDN URLs to avoid broken icon markers.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/** Custom coloured marker icon factory */
export function createColorIcon(color = '#2563EB') {
  return L.divIcon({
    html: `
      <div style="
        width:28px;height:28px;
        background:${color};
        border:3px solid white;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        box-shadow:0 2px 8px rgba(0,0,0,0.3);
      "></div>
    `,
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -30],
  });
}

export const PICKUP_ICON = createColorIcon('#2563EB');   // Royal Blue
export const DESTINATION_ICON = createColorIcon('#DC2626'); // Red
export const RIDE_ICON = createColorIcon('#16A34A');     // Green

export default L;
