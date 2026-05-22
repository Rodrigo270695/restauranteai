import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'discoverlambo_geo';
const MAX_AGE_MS = 5 * 60 * 1000;

export type GeolocationStatus =
    | 'idle'
    | 'loading'
    | 'granted'
    | 'denied'
    | 'blocked'
    | 'unsupported'
    | 'error';

type StoredCoords = { lat: number; lng: number; ts: number };

type Options = {
    /** Coordenadas ya confirmadas por el servidor (query string). */
    serverCoords?: { lat: number; lng: number } | null;
    onCoordinates?: (lat: number, lng: number) => void;
};

function readStored(): StoredCoords | null {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return null;
        }
        const parsed = JSON.parse(raw) as StoredCoords;
        if (Date.now() - parsed.ts > MAX_AGE_MS) {
            sessionStorage.removeItem(STORAGE_KEY);
            return null;
        }
        return parsed;
    } catch {
        return null;
    }
}

function writeStored(lat: number, lng: number): void {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ lat, lng, ts: Date.now() }));
}

async function queryGeolocationPermission(): Promise<PermissionState | 'unknown'> {
    if (!navigator.permissions?.query) {
        return 'unknown';
    }
    try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        return result.state;
    } catch {
        return 'unknown';
    }
}

export function useUserGeolocation({ serverCoords, onCoordinates }: Options = {}) {
    const [status, setStatus] = useState<GeolocationStatus>(() =>
        serverCoords ? 'granted' : 'idle',
    );
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
        () => serverCoords ?? null,
    );
    const requestedRef = useRef(false);
    const permissionListenerRef = useRef<(() => void) | null>(null);
    const onCoordinatesRef = useRef(onCoordinates);
    onCoordinatesRef.current = onCoordinates;

    const applyCoords = useCallback((lat: number, lng: number) => {
        writeStored(lat, lng);
        setCoords({ lat, lng });
        setStatus('granted');
        onCoordinatesRef.current?.(lat, lng);
    }, []);

    const request = useCallback(() => {
        if (!navigator.geolocation) {
            setStatus('unsupported');
            return;
        }

        setStatus('loading');

        navigator.geolocation.getCurrentPosition(
            position => {
                applyCoords(position.coords.latitude, position.coords.longitude);
            },
            error => {
                if (error.code === error.PERMISSION_DENIED) {
                    setStatus('blocked');
                    return;
                }
                setStatus('error');
            },
            { enableHighAccuracy: true, timeout: 20_000, maximumAge: 60_000 },
        );
    }, [applyCoords]);

    const attachPermissionListener = useCallback(() => {
        if (!navigator.permissions?.query) {
            return;
        }
        navigator.permissions
            .query({ name: 'geolocation' })
            .then(result => {
                permissionListenerRef.current?.();
                const onChange = () => {
                    if (result.state === 'granted') {
                        request();
                    } else if (result.state === 'denied') {
                        setStatus('blocked');
                    }
                };
                result.addEventListener('change', onChange);
                permissionListenerRef.current = () => result.removeEventListener('change', onChange);
            })
            .catch(() => undefined);
    }, [request]);

    useEffect(() => {
        return () => permissionListenerRef.current?.();
    }, []);

    useEffect(() => {
        if (serverCoords) {
            setCoords(serverCoords);
            setStatus('granted');
            return;
        }

        const stored = readStored();
        if (stored) {
            applyCoords(stored.lat, stored.lng);
            return;
        }

        if (requestedRef.current) {
            return;
        }
        requestedRef.current = true;

        void (async () => {
            if (!navigator.geolocation) {
                setStatus('unsupported');
                return;
            }

            const permission = await queryGeolocationPermission();

            if (permission === 'denied') {
                setStatus('blocked');
                attachPermissionListener();
                return;
            }

            attachPermissionListener();

            if (permission === 'granted' || permission === 'prompt' || permission === 'unknown') {
                request();
            }
        })();
    }, [serverCoords, applyCoords, request, attachPermissionListener]);

    const retry = useCallback(() => {
        void (async () => {
            const permission = await queryGeolocationPermission();
            if (permission === 'denied') {
                setStatus('blocked');
                return;
            }
            request();
        })();
    }, [request]);

    return {
        status,
        coords,
        request: retry,
        isActive: status === 'granted' && coords !== null,
        isBlocked: status === 'blocked',
    };
}
