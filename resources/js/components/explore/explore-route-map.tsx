import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import L from 'leaflet';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import { useStreetRoutePath } from '@/hooks/use-street-route-path';
import { cn } from '@/lib/utils';
import 'leaflet/dist/leaflet.css';

export type MapMarker = { id: number; slug: string; name: string; lat: number; lng: number };
export type PathPoint = [number, number];

const CHICLAYO: [number, number] = [-6.7766, -79.8442];

const pinIcon = L.divIcon({
    className: 'explore-pin',
    html: '<div style="width:26px;height:26px;border-radius:50%;background:#94a3b8;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.2)"></div>',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
});

function orderStopIcon(position: number, total: number) {
    const isStart = position === 1;
    const isEnd = total > 1 && position === total;
    const bg = isStart ? '#16a34a' : isEnd ? '#E8001A' : '#f59e0b';
    const sub = isStart ? 'INICIO' : isEnd ? 'FIN' : '';
    const size = isStart || isEnd ? 40 : 34;

    const html = `
        <div style="display:flex;flex-direction:column;align-items:center;gap:2px">
            <div style="width:${size - 4}px;height:${size - 4}px;border-radius:50%;background:${bg};color:#fff;font-weight:800;font-size:15px;display:flex;align-items:center;justify-content:center;border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,.25)">${position}</div>
            ${sub ? `<span style="font-size:8px;font-weight:800;color:${bg};background:#fff;padding:1px 5px;border-radius:4px;box-shadow:0 1px 4px rgba(0,0,0,.15)">${sub}</span>` : ''}
        </div>
    `;

    return L.divIcon({
        className: 'route-stop-pin',
        html,
        iconAnchor: [size / 2, sub ? size / 2 + 4 : size / 2],
        iconSize: [size, sub ? size + 10 : size],
    });
}

function FitBounds({ points }: { points: [number, number][] }) {
    const map = useMap();
    useEffect(() => {
        if (points.length < 1) return;
        if (points.length === 1) {
            map.setView(points[0], 15);
            return;
        }
        map.fitBounds(L.latLngBounds(points), { padding: [52, 52], maxZoom: 16 });
    }, [map, points]);

    return null;
}

type Props = {
    markers?: MapMarker[];
    path?: PathPoint[];
    numberedStops?: Array<{ position: number; lat: number; lng: number; name: string }>;
    center?: { lat: number; lng: number };
    height?: string;
    className?: string;
    showLegend?: boolean;
    hideMarkersWhenRouted?: boolean;
};

export function ExploreRouteMap({
    markers = [],
    path: serverPath = [],
    numberedStops = [],
    center,
    height = '280px',
    className = '',
    showLegend = false,
    hideMarkersWhenRouted = true,
}: Props) {
    const { t } = useTranslation();

    const path = useStreetRoutePath(serverPath, numberedStops);
    const totalStops = numberedStops.length;
    const hasRoute = totalStops >= 2 && path.length >= 2;
    const displayMarkers = hideMarkersWhenRouted && totalStops > 0 ? [] : markers;

    const allPoints = useMemo(() => {
        const pts: [number, number][] = [];
        if (path.length) path.forEach(p => pts.push(p));
        numberedStops.forEach(s => pts.push([s.lat, s.lng]));
        displayMarkers.forEach(m => pts.push([m.lat, m.lng]));
        return pts;
    }, [path, numberedStops, displayMarkers]);

    const mapCenter: [number, number] = center
        ? [center.lat, center.lng]
        : allPoints[0] ?? CHICLAYO;

    const useFluidHeight = height === '100%';

    return (
        <div className={cn('flex flex-col', useFluidHeight && 'h-full min-h-0', className)}>
            <div
                className={cn(
                    'explore-map-shell relative isolate z-0 overflow-hidden rounded-2xl border border-orange-100',
                    useFluidHeight && 'h-full min-h-[240px] flex-1',
                )}
                style={useFluidHeight ? undefined : { height }}
            >
                <MapContainer center={mapCenter} zoom={13} className="explore-map-canvas h-full w-full" scrollWheelZoom>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <FitBounds points={allPoints} />

                    {displayMarkers.map(m => (
                        <Marker key={m.id} position={[m.lat, m.lng]} icon={pinIcon}>
                            <Popup>
                                <span className="text-sm font-semibold">{m.name}</span>
                            </Popup>
                        </Marker>
                    ))}

                    {numberedStops.map(s => (
                        <Marker
                            key={`${s.position}-${s.lat}`}
                            position={[s.lat, s.lng]}
                            icon={orderStopIcon(s.position, totalStops)}
                            zIndexOffset={1000 + s.position}
                        >
                            <Popup>
                                <div className="text-sm">
                                    <p className="font-bold">
                                        {t('explore.route_stop_order', { n: s.position })}
                                        {s.position === 1 && ` · ${t('explore.route_start')}`}
                                        {s.position === totalStops && totalStops > 1 && ` · ${t('explore.route_end')}`}
                                    </p>
                                    <p className="text-gray-600">{s.name}</p>
                                </div>
                            </Popup>
                        </Marker>
                    ))}

                    {hasRoute && (
                        <>
                            <Polyline
                                positions={path}
                                pathOptions={{
                                    color: '#ffffff',
                                    weight: 10,
                                    opacity: 0.95,
                                    lineCap: 'round',
                                    lineJoin: 'round',
                                }}
                            />
                            <Polyline
                                positions={path}
                                pathOptions={{
                                    color: '#E8001A',
                                    weight: 6,
                                    opacity: 0.9,
                                    lineCap: 'round',
                                    lineJoin: 'round',
                                }}
                            />
                        </>
                    )}
                </MapContainer>
            </div>

            {(showLegend || hasRoute) && totalStops > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl bg-white/90 px-3 py-2 text-[10px] font-medium text-gray-600 ring-1 ring-orange-100">
                    <span className="flex items-center gap-1">
                        <span className="flex size-4 items-center justify-center rounded-full bg-green-600 text-[9px] font-bold text-white">1</span>
                        {t('explore.route_start')}
                    </span>
                    {totalStops > 2 && (
                        <span className="text-gray-400">→ 2 … {totalStops - 1} →</span>
                    )}
                    {totalStops > 1 && (
                        <span className="flex items-center gap-1">
                            <span className="flex size-4 items-center justify-center rounded-full bg-[#E8001A] text-[9px] font-bold text-white">
                                {totalStops}
                            </span>
                            {t('explore.route_end')}
                        </span>
                    )}
                    {hasRoute && path.length > totalStops + 2 && (
                        <span className="ml-auto text-green-700">{t('explore.route_street_path')}</span>
                    )}
                </div>
            )}
        </div>
    );
}
