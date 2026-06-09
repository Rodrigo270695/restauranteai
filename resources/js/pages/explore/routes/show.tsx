import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Calendar, CheckCircle2, Footprints, MapPin, Navigation, Route } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfirmModal } from '@/components/modals/confirm-modal';
import { ExploreRouteMap } from '@/components/explore/explore-route-map';
import { RouteJourneyTimeline } from '@/components/explore/route-journey-timeline';
import type { RouteReservation } from '@/components/explore/route-stop-reservation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatPeruDateOnly, peruLocale } from '@/lib/peru-datetime';
import TouristExploreLayout from '@/layouts/tourist-explore-layout';
import { index as routesIndex } from '@/routes/explore/routes';

type RouteData = {
    id: number;
    name: string;
    slug: string;
    description?: string | null;
    route_date: string | null;
    completed_at: string | null;
    is_completed: boolean;
    stops_count: number;
    total_distance_km: number | null;
    estimated_minutes: number | null;
    path_coordinates: [number, number][];
    stops: Array<{
        stop_id: number;
        position: number;
        reservation: RouteReservation | null;
        restaurant: {
            id: number;
            name: string;
            slug: string;
            address?: string | null;
            district?: string | null;
            avg_rating: number;
            latitude: number | null;
            longitude: number | null;
            cuisines: Array<{ name: string; is_primary?: boolean }>;
        };
    }>;
};

type Props = {
    route: RouteData;
    mapCenter: { lat: number; lng: number };
};

function RouteShow({ route: routeData, mapCenter }: Props) {
    const { t, i18n } = useTranslation();
    const [completeOpen, setCompleteOpen] = useState(false);
    const [completing, setCompleting] = useState(false);

    const numberedStops = routeData.stops
        .filter(s => s.restaurant.latitude && s.restaurant.longitude)
        .map(s => ({
            position: s.position,
            lat: s.restaurant.latitude!,
            lng: s.restaurant.longitude!,
            name: s.restaurant.name,
        }));

    const googleMultiStop =
        numberedStops.length >= 2
            ? `https://www.google.com/maps/dir/${numberedStops.map(s => `${s.lat},${s.lng}`).join('/')}`
            : null;

    const dateLabel = routeData.route_date
        ? formatPeruDateOnly(routeData.route_date, peruLocale(i18n.language))
        : null;

    const visitedCount = routeData.stops.filter(s => s.reservation?.status === 'visited').length;

    return (
        <>
            <Head title={routeData.name} />
            <div className="min-h-screen bg-gradient-to-b from-orange-50/40 via-gray-50 to-gray-100 pb-28">
                <div className="sticky top-14 z-[90] border-b border-orange-100/80 bg-white/90 px-4 py-3 backdrop-blur-md">
                    <div className="flex items-center gap-2">
                        <Link
                            href={routesIndex.url()}
                            className="cursor-pointer rounded-xl p-2 text-gray-700 transition hover:bg-orange-50"
                        >
                            <ArrowLeft className="size-5" />
                        </Link>
                        <div className="min-w-0 flex-1">
                            <h1 className="truncate text-lg font-bold tracking-tight text-gray-900">
                                {routeData.name}
                            </h1>
                            {dateLabel && (
                                <p className="flex items-center gap-1 text-xs text-gray-500">
                                    <Calendar className="size-3 text-brand-orange" />
                                    {dateLabel}
                                </p>
                            )}
                        </div>
                        {routeData.is_completed ? (
                            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-800">
                                {t('explore.route_done')}
                            </span>
                        ) : (
                            <span className="rounded-full bg-orange-100 px-2.5 py-1 text-[10px] font-bold text-brand-orange-dark">
                                {visitedCount}/{routeData.stops_count}
                            </span>
                        )}
                    </div>
                </div>

                <div className="relative z-0 space-y-5 p-4">
                    <div className="overflow-hidden rounded-2xl shadow-md ring-1 ring-black/5">
                        <ExploreRouteMap
                            path={routeData.path_coordinates}
                            numberedStops={numberedStops}
                            center={mapCenter}
                            height="min(32vh, 260px)"
                            showLegend
                            hideMarkersWhenRouted
                        />
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <div className="flex min-w-[4.5rem] flex-1 items-center gap-2 rounded-2xl bg-white px-3 py-2.5 shadow-sm ring-1 ring-gray-100">
                            <Route className="size-4 shrink-0 text-brand-orange" />
                            <div>
                                <p className="text-[10px] font-medium uppercase text-gray-400">
                                    {t('explore.stops_label')}
                                </p>
                                <p className="text-sm font-bold text-gray-900">{routeData.stops_count}</p>
                            </div>
                        </div>
                        {routeData.total_distance_km != null && (
                            <div className="flex min-w-[4.5rem] flex-1 items-center gap-2 rounded-2xl bg-white px-3 py-2.5 shadow-sm ring-1 ring-gray-100">
                                <MapPin className="size-4 shrink-0 text-sky-500" />
                                <div>
                                    <p className="text-[10px] font-medium uppercase text-gray-400">km</p>
                                    <p className="text-sm font-bold text-gray-900">{routeData.total_distance_km}</p>
                                </div>
                            </div>
                        )}
                        {routeData.estimated_minutes != null && (
                            <div className="flex min-w-[4.5rem] flex-1 items-center gap-2 rounded-2xl bg-white px-3 py-2.5 shadow-sm ring-1 ring-gray-100">
                                <Footprints className="size-4 shrink-0 text-emerald-500" />
                                <div>
                                    <p className="text-[10px] font-medium uppercase text-gray-400">min</p>
                                    <p className="text-sm font-bold text-gray-900">~{routeData.estimated_minutes}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {(googleMultiStop || !routeData.is_completed) && (
                        <div className="flex gap-2">
                            {googleMultiStop && (
                                <Button
                                    className="h-12 min-w-0 flex-1 cursor-pointer rounded-2xl bg-gray-900 text-white shadow-lg hover:bg-gray-800"
                                    asChild
                                >
                                    <a
                                        href={googleMultiStop}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="cursor-pointer"
                                    >
                                        <Navigation className="mr-2 size-4 shrink-0" />
                                        <span className="truncate">{t('explore.open_in_maps')}</span>
                                    </a>
                                </Button>
                            )}
                            {!routeData.is_completed && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className={cn(
                                        'h-12 min-w-0 cursor-pointer rounded-2xl border-2 border-dashed border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50',
                                        googleMultiStop ? 'flex-1' : 'w-full',
                                    )}
                                    onClick={() => setCompleteOpen(true)}
                                >
                                    <CheckCircle2 className="mr-2 size-4 shrink-0" />
                                    <span className="truncate">{t('explore.complete_route')}</span>
                                </Button>
                            )}
                        </div>
                    )}

                    <RouteJourneyTimeline
                        routeSlug={routeData.slug}
                        stops={routeData.stops}
                        isCompleted={routeData.is_completed}
                    />
                </div>
            </div>

            <ConfirmModal
                open={completeOpen}
                onClose={() => setCompleteOpen(false)}
                onConfirm={() => {
                    setCompleting(true);
                    router.post(`/explore/routes/${routeData.slug}/complete`, {}, {
                        onFinish: () => {
                            setCompleting(false);
                            setCompleteOpen(false);
                        },
                    });
                }}
                title={t('explore.complete_route')}
                description={t('explore.confirm_complete_route')}
                itemLabel={routeData.name}
                confirmLabel={t('explore.complete_route_confirm')}
                cancelLabel={t('explore.cancel')}
                variant="brand"
                tone="success"
                isProcessing={completing}
            />
        </>
    );
}

RouteShow.layout = (page: React.ReactNode) => <TouristExploreLayout>{page}</TouristExploreLayout>;

export default RouteShow;
