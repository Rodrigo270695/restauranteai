import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Calendar, CheckCircle2, MapPin, Navigation } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ExploreRouteMap } from '@/components/explore/explore-route-map';
import { CuisineBadges } from '@/components/explore/cuisine-badges';
import { Button } from '@/components/ui/button';
import TouristExploreLayout from '@/layouts/tourist-explore-layout';
import { index as routesIndex } from '@/routes/explore/routes';
import { show as restaurantShow } from '@/routes/explore/restaurants';

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
        position: number;
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
        ? new Date(routeData.route_date + 'T12:00:00').toLocaleDateString(
              i18n.language === 'en' ? 'en-US' : 'es-PE',
              { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
          )
        : null;

    return (
        <>
            <Head title={routeData.name} />
            <div className="pb-28">
                <div className="sticky top-14 z-[90] flex items-center gap-2 border-b border-orange-100 bg-white/95 px-4 py-3 backdrop-blur-md">
                    <Link href={routesIndex.url()} className="rounded-xl p-2 hover:bg-orange-50">
                        <ArrowLeft className="size-5" />
                    </Link>
                    <div className="min-w-0 flex-1">
                        <h1 className="truncate text-lg font-bold">{routeData.name}</h1>
                        {dateLabel && (
                            <p className="flex items-center gap-1 text-xs text-gray-500">
                                <Calendar className="size-3 text-brand-orange" />
                                {dateLabel}
                            </p>
                        )}
                    </div>
                    {routeData.is_completed && (
                        <span className="rounded-full bg-green-50 px-2 py-1 text-[10px] font-bold text-green-700">
                            {t('explore.route_done')}
                        </span>
                    )}
                </div>

                <div className="relative z-0 space-y-4 p-4">
                    <ExploreRouteMap
                        path={routeData.path_coordinates}
                        numberedStops={numberedStops}
                        center={mapCenter}
                        height="min(40vh, 340px)"
                        showLegend
                        hideMarkersWhenRouted
                    />

                    <div className="rounded-2xl border border-orange-200 bg-white p-4 shadow-sm">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                            {t('explore.route_stats')}
                        </p>
                        <p className="mt-1 text-sm text-gray-700">
                            {routeData.stops_count} {t('explore.stops_label')}
                            {routeData.total_distance_km != null && ` · ${routeData.total_distance_km} km`}
                            {routeData.estimated_minutes != null && ` · ~${routeData.estimated_minutes} min`}
                        </p>
                        <h2 className="mt-3 text-sm font-bold text-gray-900">{t('explore.follow_route')}</h2>
                        <p className="mt-1 text-xs text-gray-500">{t('explore.follow_route_desc')}</p>
                        {googleMultiStop && (
                            <Button className="mt-3 w-full rounded-xl bg-brand-orange text-white" asChild>
                                <a href={googleMultiStop} target="_blank" rel="noreferrer">
                                    <Navigation className="mr-2 size-4" />
                                    {t('explore.open_in_maps')}
                                </a>
                            </Button>
                        )}
                        {!routeData.is_completed && (
                            <Button
                                type="button"
                                variant="outline"
                                className="mt-2 w-full rounded-xl border-green-200 text-green-700 hover:bg-green-50"
                                onClick={() => {
                                    if (confirm(t('explore.confirm_complete_route'))) {
                                        router.post(`/explore/routes/${routeData.slug}/complete`);
                                    }
                                }}
                            >
                                <CheckCircle2 className="mr-2 size-4" />
                                {t('explore.complete_route')}
                            </Button>
                        )}
                    </div>

                    <ol className="space-y-3">
                        {routeData.stops.map(stop => (
                            <li key={stop.position}>
                                <Link
                                    href={restaurantShow.url(stop.restaurant.slug)}
                                    className="flex gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm transition hover:border-orange-200"
                                >
                                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-500 text-sm font-bold text-white shadow-sm">
                                        {stop.position}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-semibold text-gray-900">{stop.restaurant.name}</p>
                                        <CuisineBadges cuisines={stop.restaurant.cuisines} size="xs" />
                                        <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                                            <MapPin className="size-3 shrink-0" />
                                            {stop.restaurant.district ?? stop.restaurant.address}
                                        </p>
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ol>
                </div>
            </div>
        </>
    );
}

RouteShow.layout = (page: React.ReactNode) => <TouristExploreLayout>{page}</TouristExploreLayout>;

export default RouteShow;
