/**
 * routing.js — OSRM route calculation
 */

const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

/**
 * Get a driving route between two points.
 * Returns { geojson, distanceKm, durationMins } or null on failure.
 */
export async function getRoute(originLat, originLon, destLat, destLon) {
  const url = `${OSRM_BASE}/${originLon},${originLat};${destLon},${destLat}?overview=full&geometries=geojson`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.routes || data.routes.length === 0) return null;
    const route = data.routes[0];
    return {
      geojson: route.geometry,
      distanceKm: Math.round((route.distance / 1000) * 10) / 10,
      durationMins: Math.round(route.duration / 60),
    };
  } catch {
    return null;
  }
}
