import { useEffect } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { APPROX_RADIUS_METERS } from '@/lib/geo';

// Fix default marker icons (Vite doesn't bundle Leaflet's default png paths correctly).
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-expect-error _getIconUrl is internal
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

export type MapTask = {
  id: string;
  title: string;
  category: string;
  location: string;
  approx_lat: number | null;
  approx_lng: number | null;
};

interface Props {
  tasks: MapTask[];
  center?: { lat: number; lng: number } | null;
  height?: number | string;
  onTaskClick?: (taskId: string) => void;
}

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 13);
      return;
    }
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [points, map]);
  return null;
}

export function TaskMap({ tasks, center, height = 420, onTaskClick }: Props) {
  const valid = tasks.filter(
    (t) => typeof t.approx_lat === 'number' && typeof t.approx_lng === 'number'
  );
  const fallback: [number, number] = center
    ? [center.lat, center.lng]
    : valid[0]
      ? [valid[0].approx_lat!, valid[0].approx_lng!]
      : [42.0884, -87.9806]; // Arlington Heights, IL fallback

  const points: [number, number][] = valid.map((t) => [t.approx_lat!, t.approx_lng!]);
  if (center) points.push([center.lat, center.lng]);

  return (
    <div className="rounded-2xl overflow-hidden border border-border shadow-sm" style={{ height }}>
      <MapContainer
        center={fallback}
        zoom={12}
        scrollWheelZoom
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} />

        {center && (
          <Marker position={[center.lat, center.lng]}>
            <Popup>You are here</Popup>
          </Marker>
        )}

        {valid.map((t) => (
          <Circle
            key={t.id}
            center={[t.approx_lat!, t.approx_lng!]}
            radius={APPROX_RADIUS_METERS}
            pathOptions={{
              color: 'hsl(var(--primary))',
              fillColor: 'hsl(var(--primary))',
              fillOpacity: 0.25,
              weight: 2,
            }}
            eventHandlers={{
              click: () => onTaskClick?.(t.id),
            }}
          >
            <Popup>
              <div className="space-y-1 min-w-[180px]">
                <div className="font-semibold">{t.title}</div>
                <div className="text-xs text-muted-foreground">{t.category} · {t.location}</div>
                <div className="text-[11px] text-muted-foreground">
                  General area only — exact location is shared with the accepted helper.
                </div>
                {onTaskClick && (
                  <button
                    onClick={() => onTaskClick(t.id)}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    View task →
                  </button>
                )}
              </div>
            </Popup>
          </Circle>
        ))}
      </MapContainer>
    </div>
  );
}

interface SingleProps {
  lat: number;
  lng: number;
  precise: boolean;
  label?: string;
  height?: number | string;
}

export function TaskLocationMap({ lat, lng, precise, label, height = 280 }: SingleProps) {
  return (
    <div className="rounded-2xl overflow-hidden border border-border shadow-sm" style={{ height }}>
      <MapContainer
        center={[lat, lng]}
        zoom={precise ? 16 : 13}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {precise ? (
          <Marker position={[lat, lng]}>
            <Popup>{label || 'Task location'}</Popup>
          </Marker>
        ) : (
          <Circle
            center={[lat, lng]}
            radius={APPROX_RADIUS_METERS}
            pathOptions={{
              color: 'hsl(var(--primary))',
              fillColor: 'hsl(var(--primary))',
              fillOpacity: 0.25,
              weight: 2,
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
