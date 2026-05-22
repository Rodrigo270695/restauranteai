import { useEffect, useState } from 'react';
import type { PathPoint } from '@/components/explore/explore-route-map';

type Stop = { position: number; lat: number; lng: number };

/** Si el servidor devolvió líneas rectas, pide geometría por calles a OSRM en el cliente. */
export function useStreetRoutePath(
    serverPath: PathPoint[],
    stops: Stop[],
): PathPoint[] {
    const [clientPath, setClientPath] = useState<PathPoint[] | null>(null);

    const sorted = [...stops].sort((a, b) => a.position - b.position);
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

        const coords = sorted.map(s => `${s.lng},${s.lat}`).join(';');
        const controller = new AbortController();

        (async () => {
            try {
                for (const profile of ['foot', 'walking', 'driving']) {
                    const res = await fetch(
                        `https://router.project-osrm.org/route/v1/${profile}/${coords}?overview=full&geometries=geojson`,
                        { signal: controller.signal },
                    );
                    if (!res.ok) continue;

                    const data = await res.json();
                    const geometry = data?.routes?.[0]?.geometry?.coordinates as
                        | [number, number][]
                        | undefined;

                    if (geometry && geometry.length >= 2) {
                        setClientPath(geometry.map(([lng, lat]) => [lat, lng] as PathPoint));
                        return;
                    }
                }
            } catch {
                /* ignore abort / network */
            }
        })();

        return () => controller.abort();
    }, [stopsKey, serverPath.length, sorted.length]);

    if (clientPath && clientPath.length >= 2) {
        return clientPath;
    }

    return serverPath;
}
