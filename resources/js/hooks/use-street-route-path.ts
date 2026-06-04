import { useEffect, useMemo, useState } from 'react';
import type { PathPoint } from '@/components/explore/explore-route-map';

type Stop = { position: number; lat: number; lng: number };

type LatLng = { lat: number; lng: number };

async function fetchOsrmPath(
    points: LatLng[],
    signal: AbortSignal,
): Promise<PathPoint[] | null> {
    if (points.length < 2) {
        return null;
    }

    const coords = points.map(p => `${p.lng},${p.lat}`).join(';');

    for (const profile of ['foot', 'walking', 'driving']) {
        const res = await fetch(
            `https://router.project-osrm.org/route/v1/${profile}/${coords}?overview=full&geometries=geojson`,
            { signal },
        );
        if (!res.ok) {
            continue;
        }

        const data = await res.json();
        const geometry = data?.routes?.[0]?.geometry?.coordinates as [number, number][] | undefined;

        if (geometry && geometry.length >= 2) {
            return geometry.map(([lng, lat]) => [lat, lng] as PathPoint);
        }
    }

    return null;
}

/** Si el servidor devolvió líneas rectas, pide geometría por calles a OSRM en el cliente. */
export function useStreetRoutePath(serverPath: PathPoint[], stops: Stop[]): PathPoint[] {
    const [clientPath, setClientPath] = useState<PathPoint[] | null>(null);

    const sorted = useMemo(() => [...stops].sort((a, b) => a.position - b.position), [stops]);
    const stopsKey = sorted.map(s => `${s.position}:${s.lat},${s.lng}`).join('|');

    useEffect(() => {
        setClientPath(null);

        if (sorted.length < 2) {
            return;
        }

        const looksStraight =
            serverPath.length <= sorted.length + 1 || serverPath.length < 8;

        if (!looksStraight && serverPath.length > 0) {
            return;
        }

        const controller = new AbortController();

        void fetchOsrmPath(sorted, controller.signal)
            .then(path => {
                if (path) {
                    setClientPath(path);
                }
            })
            .catch(() => {
                /* ignore abort / network */
            });

        return () => controller.abort();
    }, [stopsKey, serverPath.length, sorted]);

    if (clientPath && clientPath.length >= 2) {
        return clientPath;
    }

    return serverPath;
}

/** Ruta principal entre paradas + tramo de acceso desde la ubicación del usuario al primer local. */
export function useRoutePaths(
    serverPath: PathPoint[],
    stops: Stop[],
    userLocation: LatLng | null,
): { mainPath: PathPoint[]; accessPath: PathPoint[] | null } {
    const mainPath = useStreetRoutePath(serverPath, stops);
    const [accessPath, setAccessPath] = useState<PathPoint[] | null>(null);

    const sorted = useMemo(() => [...stops].sort((a, b) => a.position - b.position), [stops]);
    const firstStop = sorted[0] ?? null;
    const accessKey =
        userLocation && firstStop
            ? `${userLocation.lat},${userLocation.lng}|${firstStop.lat},${firstStop.lng}`
            : '';

    useEffect(() => {
        setAccessPath(null);

        if (!userLocation || !firstStop) {
            return;
        }

        const controller = new AbortController();

        void fetchOsrmPath([userLocation, firstStop], controller.signal)
            .then(path => {
                if (path) {
                    setAccessPath(path);
                }
            })
            .catch(() => {
                /* ignore abort / network */
            });

        return () => controller.abort();
    }, [accessKey]);

    return { mainPath, accessPath };
}
