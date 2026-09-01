import { router } from '@inertiajs/react';
import { useCallback, useState } from 'react';

const RECOMMEND_ROUTE_URL = '/explore/routes/recommend';
const MIN_MODAL_MS = 2800;

export function useGenerateAiRoute() {
    const [open, setOpen] = useState(false);

    const generate = useCallback(() => {
        setOpen(true);
        const started = Date.now();

        const closeAfterMin = () => {
            const wait = Math.max(0, MIN_MODAL_MS - (Date.now() - started));
            window.setTimeout(() => setOpen(false), wait);
        };

        const postRoute = (data: Record<string, number> = {}) => {
            router.post(RECOMMEND_ROUTE_URL, data, {
                preserveScroll: true,
                onFinish: closeAfterMin,
            });
        };

        if (typeof navigator !== 'undefined' && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) =>
                    postRoute({
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                    }),
                () => postRoute(),
                { enableHighAccuracy: false, timeout: 8000, maximumAge: 120_000 },
            );
        } else {
            postRoute();
        }
    }, []);

    return { open, generate, setOpen };
}
