// Helpers for task locations and approximate (privacy-preserving) coordinates.

export type GeoPoint = { lat: number; lng: number };

// Snap coords to a ~550m grid so we don't reveal a precise address publicly.
// 0.005° latitude ≈ 555m. Longitude varies but at temperate latitudes is similar.
const GRID = 0.005;

export function approximate({ lat, lng }: GeoPoint): GeoPoint {
  return {
    lat: Math.round(lat / GRID) * GRID,
    lng: Math.round(lng / GRID) * GRID,
  };
}

// Public circle radius (meters) shown on the map for non-authorized viewers.
export const APPROX_RADIUS_METERS = 500;

export type NominatimResult = {
  display_name: string;
  lat: string;
  lon: string;
  address?: Record<string, string>;
};

// Forward geocode using the free OpenStreetMap Nominatim service.
// Note: Nominatim asks for a descriptive User-Agent / Referer. Browsers send Referer
// automatically, which is acceptable for low-volume use.
export async function searchAddress(query: string, signal?: AbortSignal): Promise<NominatimResult[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&countrycodes=us&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { signal, headers: { 'Accept-Language': 'en' } });
  if (!res.ok) return [];
  return (await res.json()) as NominatimResult[];
}

// Build a friendly "city, state" label from a Nominatim result.
export function shortLabel(r: NominatimResult): string {
  const a = r.address || {};
  const city = a.city || a.town || a.village || a.hamlet || a.suburb || a.neighbourhood || '';
  const state = a.state_code || a.state || '';
  if (city && state) return `${city}, ${state}`;
  return r.display_name.split(',').slice(0, 2).join(',').trim();
}
