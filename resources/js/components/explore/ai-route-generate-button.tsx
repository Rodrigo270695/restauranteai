import { router } from '@inertiajs/react';
import { MapPinned, Route, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

const RECOMMEND_ROUTE_URL = '/explore/routes/recommend';

type Props = {
    className?: string;
};

export function AiRouteGenerateButton({ className }: Props) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);

    const handleGenerate = () => {
        setLoading(true);

        const postRoute = (data: Record<string, number> = {}) => {
            router.post(RECOMMEND_ROUTE_URL, data, {
                preserveScroll: true,
                onFinish: () => setLoading(false),
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
    };

    return (
        <section
            className={cn(
                'relative overflow-hidden rounded-3xl border border-orange-100/90 bg-linear-to-br from-orange-50/90 via-white to-orange-50/60 p-5 shadow-sm',
                className,
            )}
        >
            {loading && (
                <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-linear-to-r from-transparent via-white/50 to-transparent"
                    style={{
                        animation: 'ai-route-shimmer 1.8s ease-in-out infinite',
                    }}
                />
            )}

            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-100 text-brand-orange">
                            <Route className="h-4 w-4" />
                        </span>
                        <h2 className="text-base font-bold text-gray-900">{t('explore.ai_route_title')}</h2>
                    </div>
                    <p className="text-xs leading-relaxed text-gray-500">{t('explore.ai_route_desc')}</p>
                </div>

                <button
                    type="button"
                    disabled={loading}
                    onClick={handleGenerate}
                    className={cn(
                        'relative w-full shrink-0 overflow-hidden rounded-2xl px-5 py-3.5 text-sm font-semibold text-white shadow-md transition sm:w-auto',
                        'bg-linear-to-r from-brand-orange via-brand-orange-dark to-brand-orange-dark',
                        'hover:shadow-lg hover:brightness-105',
                        'disabled:cursor-wait disabled:opacity-95',
                        loading && 'ring-2 ring-orange-200 ring-offset-2',
                    )}
                >
                    {loading && (
                        <span
                            aria-hidden
                            className="absolute inset-0 rounded-2xl bg-white/10"
                            style={{ animation: 'ai-route-pulse 1.2s ease-in-out infinite' }}
                        />
                    )}
                    <span className="relative flex items-center justify-center gap-2">
                        <Sparkles
                            className={cn('h-4 w-4', loading && 'animate-spin')}
                            style={loading ? { animationDuration: '1.1s' } : undefined}
                        />
                        <MapPinned className={cn('h-4 w-4', loading && 'opacity-80')} />
                        <span>
                            {loading ? t('explore.ai_route_loading') : t('explore.ai_route_generate')}
                        </span>
                    </span>
                </button>
            </div>

            <style>{`
                @keyframes ai-route-shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                @keyframes ai-route-pulse {
                    0%, 100% { opacity: 0.15; }
                    50% { opacity: 0.45; }
                }
            `}</style>
        </section>
    );
}
