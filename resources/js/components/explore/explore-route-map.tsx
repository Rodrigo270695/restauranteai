import { memo, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import L from 'leaflet';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import { useRoutePaths } from '@/hooks/use-street-route-path';
import { BRAND_MAP_ACCESS, BRAND_MAP_END } from '@/lib/brand-styles';
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

const userLocationIcon = L.divIcon({
    className: 'user-location-pin',
    html: `<div style="width:20px;height:20px;border-radius:50%;background:${BRAND_MAP_ACCESS};border:3px solid #fff;box-shadow:0 0 0 7px rgba(7,53,119,0.22),0 2px 10px rgba(0,0,0,.28)"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
});

function orderStopIcon(position: number, total: number) {
    const isStart = position === 1;
    const isEnd = total > 1 && position === total;
    const bg = isStart ? '#16a34a' : isEnd ? BRAND_MAP_END : '#f59e0b';
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
    const pointsKey = useMemo(() => points.map(p => `${p[0].toFixed(5)},${p[1].toFixed(5)}`).join('|'), [points]);
    const lastKeyRef = useRef('');

    useEffect(() => {
        if (points.length < 1 || pointsKey === lastKeyRef.current) {
            return;
        }
        lastKeyRef.current = pointsKey;

        if (points.length === 1) {
            map.setView(points[0], 15);
            return;
        }
        map.fitBounds(L.latLngBounds(points), { padding: [52, 52], maxZoom: 16 });
    }, [map, points, pointsKey]);

    return null;
}

function RoutePolyline({ path, color }: { path: PathPoint[]; color: string }) {
    return (
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
                    color,
                    weight: 6,
                    opacity: 0.9,
                    lineCap: 'round',
                    lineJoin: 'round',
                }}
            />
        </>
    );
}

type Props = {
    markers?: MapMarker[];
    path?: PathPoint[];
    numberedStops?: Array<{ position: number; lat: number; lng: number; name: string }>;
    userLocation?: { lat: number; lng: number } | null;
    center?: { lat: number; lng: number };
    height?: string;
    className?: string;
    showLegend?: boolean;
    hideMarkersWhenRouted?: boolean;
};

export const ExploreRouteMap = memo(function ExploreRouteMap({
    markers = [],
    path: serverPath = [],
    numberedStops = [],
    userLocation = null,
    center,
    height = '280px',
    className = '',
    showLegend = false,
    hideMarkersWhenRouted = true,
}: Props) {
    const { t } = useTranslation();

    const { mainPath, accessPath } = useRoutePaths(serverPath, numberedStops, userLocation);
    const totalStops = numberedStops.length;
    const hasMainRoute = totalStops >= 2 && mainPath.length >= 2;
    const hasAccessRoute = Boolean(userLocation && totalStops >= 1 && accessPath && accessPath.length >= 2);
    const displayMarkers = hideMarkersWhenRouted && totalStops > 0 ? [] : markers;

    const fitPoints = useMemo((): [number, number][] => {
        if (totalStops > 0) {
            const pts: [number, number][] = [];
            if (userLocation) {
                pts.push([userLocation.lat, userLocation.lng]);
            }
            numberedStops.forEach(s => pts.push([s.lat, s.lng]));
            return pts;
        }

        if (displayMarkers.length > 40) {
            return userLocation
                ? [[userLocation.lat, userLocation.lng]]
                : center
                  ? [[center.lat, center.lng]]
                  : [CHICLAYO];
        }

        const pts: [number, number][] = displayMarkers.map(m => [m.lat, m.lng]);
        if (userLocation) {
            pts.push([userLocation.lat, userLocation.lng]);
        }

        return pts;
    }, [totalStops, numberedStops, userLocation, displayMarkers, center]);

    const mapCenter: [number, number] = center
        ? [center.lat, center.lng]
        : fitPoints[0] ?? CHICLAYO;

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
                    <FitBounds points={fitPoints} />

                    {displayMarkers.map(m => (
                        <Marker key={m.id} position={[m.lat, m.lng]} icon={pinIcon}>
                            <Popup>
                                <span className="text-sm font-semibold">{m.name}</span>
                            </Popup>
                        </Marker>
                    ))}

                    {userLocation && (
                        <Marker
                            position={[userLocation.lat, userLocation.lng]}
                            icon={userLocationIcon}
                            zIndexOffset={2000}
                        >
                            <Popup>
                                <span className="text-sm font-semibold">{t('explore.route_your_location')}</span>
                            </Popup>
                        </Marker>
                    )}

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

                    {hasAccessRoute && accessPath && <RoutePolyline path={accessPath} color={BRAND_MAP_ACCESS} />}
                    {hasMainRoute && <RoutePolyline path={mainPath} color={BRAND_MAP_END} />}
                </MapContainer>
            </div>

            {(showLegend || hasMainRoute || hasAccessRoute) && totalStops > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl bg-white/90 px-3 py-2 text-[10px] font-medium text-gray-600 ring-1 ring-orange-100">
                    {hasAccessRoute && (
                        <>
                            <span className="flex items-center gap-1">
                                <span
                                    className="size-3 rounded-full ring-2 ring-white"
                                    style={{ background: BRAND_MAP_ACCESS, boxShadow: '0 0 0 2px rgba(7,53,119,0.2)' }}
                                />
                                {t('explore.route_your_location')}
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="h-0.5 w-4 rounded-full" style={{ background: BRAND_MAP_ACCESS }} />
                                {t('explore.route_access_path')}
                            </span>
                        </>
                    )}
                    <span className="flex items-center gap-1">
                        <span className="flex size-4 items-center justify-center rounded-full bg-green-600 text-[9px] font-bold text-white">1</span>
                        {t('explore.route_start')}
                    </span>
                    {totalStops > 2 && (
                        <span className="text-gray-400">→ 2 … {totalStops - 1} →</span>
                    )}
                    {totalStops > 1 && (
                        <span className="flex items-center gap-1">
                            <span className="flex size-4 items-center justify-center rounded-full bg-brand-orange text-[9px] font-bold text-white">
                                {totalStops}
                            </span>
                            {t('explore.route_end')}
                        </span>
                    )}
                    {hasMainRoute && mainPath.length > totalStops + 2 && (
                        <span className="ml-auto text-green-700">{t('explore.route_street_path')}</span>
                    )}
                </div>
            )}
        </div>
    );
});
