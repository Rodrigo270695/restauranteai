import { Head, Link, router, usePage } from '@inertiajs/react';
import { Calendar, Filter, Route, Search, UtensilsCrossed } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ExplorePageHeader } from '@/components/explore/explore-page-header';
import { ExploreRouteMap, type MapMarker } from '@/components/explore/explore-route-map';
import { RestaurantListItem, type RestaurantListItemData } from '@/components/explore/restaurant-list-item';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { exploreDiscoverUrl } from '@/lib/explore-discover-url';
import { cn } from '@/lib/utils';
import TouristExploreLayout from '@/layouts/tourist-explore-layout';
import { index as exploreRoutes, publish as publishRoute } from '@/routes/explore/routes';

type DraftRoute = {
    stops_count: number;
    total_distance_km?: number | null;
    estimated_minutes?: number | null;
    path_coordinates?: [number, number][];
    stops: Array<{
        position: number;
        restaurant: { name: string; slug: string; latitude?: number | null; longitude?: number | null };
    }>;
};

type Props = {
    restaurants: RestaurantListItemData[];
    markers: MapMarker[];
    cuisineTypes: { id: number; name: string }[];
    filters: {
        search?: string;
        cuisine_type_id?: number | null;
        price_range?: string | null;
        view: 'map' | 'list';
    };
    draftRoute: DraftRoute;
    draftStopSlugs: string[];
    mapCenter: { lat: number; lng: number };
};

function DraftRoutePanel({
    draftRoute,
    stopsCount,
    showPublish,
    setShowPublish,
    routeName,
    setRouteName,
    routeDate,
    setRouteDate,
    t,
    className,
}: {
    draftRoute: DraftRoute;
    stopsCount: number;
    showPublish: boolean;
    setShowPublish: (v: boolean) => void;
    routeName: string;
    setRouteName: (v: string) => void;
    routeDate: string;
    setRouteDate: (v: string) => void;
    t: (key: string, opts?: Record<string, unknown>) => string;
    className?: string;
}) {
    if (stopsCount === 0) return null;

    return (
        <div
            className={cn(
                'shrink-0 border-t border-orange-100 bg-gradient-to-b from-orange-50/80 to-white p-4',
                className,
            )}
        >
            <div className="flex items-start gap-3">
                <div className="rounded-xl bg-white p-2 shadow-sm ring-1 ring-orange-100">
                    <Route className="size-5 text-brand-orange" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-900">
                        {t('explore.route_draft', { count: stopsCount })}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-gray-600">
                        {draftRoute.stops.map(s => s.restaurant.name).join(' → ')}
                    </p>
                    {draftRoute.total_distance_km != null && (
                        <p className="mt-1 text-[11px] font-medium text-brand-orange">
                            {t('explore.route_summary', {
                                count: stopsCount,
                                km: draftRoute.total_distance_km,
                                min: draftRoute.estimated_minutes ?? '—',
                            })}
                        </p>
                    )}
                </div>
            </div>

            {!showPublish ? (
                <div className="mt-3 flex gap-2">
                    <Button
                        className="flex-1 rounded-xl bg-brand-orange text-white hover:bg-brand-orange-dark"
                        onClick={() => setShowPublish(true)}
                    >
                        {t('explore.save_route')}
                    </Button>
                    <Button variant="outline" className="rounded-xl bg-white" asChild>
                        <Link href={exploreRoutes.url()}>{t('explore.nav_routes')}</Link>
                    </Button>
                </div>
            ) : (
                <form
                    className="mt-3 space-y-2"
                    onSubmit={e => {
                        e.preventDefault();
                        router.post(publishRoute.url(), { name: routeName, route_date: routeDate });
                    }}
                >
                    <Input
                        value={routeName}
                        onChange={e => setRouteName(e.target.value)}
                        placeholder={t('explore.route_name_placeholder')}
                        className="rounded-xl bg-white"
                    />
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                        <Input
                            type="date"
                            value={routeDate}
                            onChange={e => setRouteDate(e.target.value)}
                            className="rounded-xl bg-white pl-10"
                        />
                    </div>
                    <Button type="submit" className="w-full rounded-xl bg-brand-orange text-white">
                        {t('explore.publish_route')}
                    </Button>
                </form>
            )}
        </div>
    );
}

function DiscoverPage({
    restaurants,
    markers,
    cuisineTypes,
    filters,
    draftRoute,
    draftStopSlugs,
    mapCenter,
}: Props) {
    const { t } = useTranslation();
    const { flash } = usePage().props as { flash?: { type?: string; message?: string } };

    const [search, setSearch] = useState(filters.search ?? '');
    const [cuisineId, setCuisineId] = useState<number | ''>(filters.cuisine_type_id ?? '');
    const [showPublish, setShowPublish] = useState(false);
    const [routeName, setRouteName] = useState('Ruta gastronómica Chiclayo');
    const [routeDate, setRouteDate] = useState(new Date().toISOString().slice(0, 10));
    const [addingSlug, setAddingSlug] = useState<string | null>(null);

    const applyFilters = () => {
        router.get(
            exploreDiscoverUrl({
                search: search || undefined,
                cuisine_type_id: cuisineId || undefined,
                view: 'map',
            }),
            {},
            { preserveState: true, replace: true },
        );
    };

    const stopsCount = draftRoute.stops_count;

    const stopOrderBySlug = new Map(
        draftRoute.stops.map(s => [s.restaurant.slug, s.position]),
    );

    const sortedRestaurants = [...restaurants].sort((a, b) => {
        const pa = stopOrderBySlug.get(a.slug) ?? 999;
        const pb = stopOrderBySlug.get(b.slug) ?? 999;
        if (pa !== pb) return pa - pb;
        return a.name.localeCompare(b.name);
    });

    const draftNumberedStops = draftRoute.stops
        .filter(s => s.restaurant.latitude != null && s.restaurant.longitude != null)
        .map(s => ({
            position: s.position,
            lat: s.restaurant.latitude!,
            lng: s.restaurant.longitude!,
            name: s.restaurant.name,
        }));

    const draftPath = (draftRoute.path_coordinates ?? []) as [number, number][];

    const toggleRoute = (slug: string) => {
        const inRoute = stopOrderBySlug.has(slug);
        const target = restaurants.find(r => r.slug === slug);

        if (
            !inRoute
            && target?.hours
            && target.hours.label !== 'Horario no disponible'
            && !target.hours.is_open
        ) {
            import('sonner').then(({ toast }) => toast.error(t('explore.closed_no_route')));
            return;
        }

        setAddingSlug(slug);

        if (inRoute) {
            router.delete(`/explore/routes/stops/${slug}`, {
                preserveScroll: true,
                onFinish: () => setAddingSlug(null),
            });
        } else {
            router.post(`/explore/routes/stops/${slug}`, {}, {
                preserveScroll: true,
                onFinish: () => setAddingSlug(null),
            });
        }
    };

    const draftPanelProps = {
        draftRoute,
        stopsCount,
        showPublish,
        setShowPublish,
        routeName,
        setRouteName,
        routeDate,
        setRouteDate,
        t,
    };

    const filtersBar = (
        <>
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                    <Input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && applyFilters()}
                        placeholder={t('explore.search_today')}
                        className="h-10 rounded-xl border-orange-100 bg-white pl-10 text-sm shadow-sm"
                    />
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-10 shrink-0 rounded-xl border-orange-200 bg-white"
                    onClick={() => applyFilters()}
                >
                    <Filter className="size-4" />
                </Button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-thin">
                <button
                    type="button"
                    onClick={() => {
                        setCuisineId('');
                        router.get(exploreDiscoverUrl({ search, view: 'map' }), {}, { preserveState: true });
                    }}
                    className={cn(
                        'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition',
                        !cuisineId ? 'bg-brand-orange text-white' : 'bg-white text-gray-600 ring-1 ring-gray-200',
                    )}
                >
                    <UtensilsCrossed className="mr-1 inline size-3" />
                    {t('explore.filter_all')}
                </button>
                {cuisineTypes.map(c => (
                    <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                            setCuisineId(c.id);
                            router.get(
                                exploreDiscoverUrl({ search, cuisine_type_id: c.id, view: 'map' }),
                                {},
                                { preserveState: true },
                            );
                        }}
                        className={cn(
                            'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition',
                            cuisineId === c.id
                                ? 'bg-brand-orange text-white'
                                : 'bg-white text-gray-600 ring-1 ring-gray-200',
                        )}
                    >
                        {c.name}
                    </button>
                ))}
            </div>
        </>
    );

    const restaurantList = (
        <div className="space-y-2.5">
            {sortedRestaurants.map(r => (
                <RestaurantListItem
                    key={r.id}
                    restaurant={r}
                    routePosition={stopOrderBySlug.get(r.slug) ?? null}
                    routeTotal={stopsCount}
                    isBusy={addingSlug === r.slug}
                    onToggleRoute={() => toggleRoute(r.slug)}
                />
            ))}
            {restaurants.length === 0 && (
                <p className="rounded-2xl bg-white p-10 text-center text-sm text-gray-500 ring-1 ring-gray-100">
                    {t('explore.no_restaurants')}
                </p>
            )}
        </div>
    );

    const mapBlock = (
        <div className="flex h-full min-h-0 flex-col">
            <ExploreRouteMap
                markers={markers}
                path={stopsCount > 0 ? draftPath : []}
                numberedStops={draftNumberedStops}
                center={mapCenter}
                height="100%"
                className="min-h-[280px] flex-1 md:min-h-0"
                showLegend={stopsCount > 0}
                hideMarkersWhenRouted={stopsCount > 0}
            />
        </div>
    );

    return (
        <>
            <Head title={t('explore.nav_explore')} />

            {/* ── Móvil: columna (mapa arriba, lista abajo) ── */}
            <div className="flex flex-col md:hidden">
                <div className="space-y-3 border-b border-orange-100 bg-[#FFF8F2] p-4 pb-3">
                    <ExplorePageHeader
                        title={t('explore.nav_explore')}
                        subtitle={t('explore.discoveries_chiclayo')}
                        showHome
                    />
                    {flash?.message && (
                        <div
                            className={cn(
                                'rounded-xl px-3 py-2 text-sm font-medium',
                                flash.type === 'error'
                                    ? 'bg-orange-50 text-red-800'
                                    : 'bg-green-50 text-green-800',
                            )}
                        >
                            {flash.message}
                        </div>
                    )}
                    {filtersBar}
                </div>

                <div className="sticky top-14 z-[50] h-[38vh] min-h-[220px] border-b border-orange-100 bg-white p-3 shadow-sm">
                    {mapBlock}
                </div>

                <div className="flex flex-col p-4 pb-32">
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-sm font-bold text-gray-900">{t('explore.near_you')}</h2>
                        <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-semibold text-brand-orange">
                            {t('explore.places_count', { count: restaurants.length })}
                        </span>
                    </div>
                    {restaurantList}
                </div>

                <DraftRoutePanel {...draftPanelProps} className="fixed bottom-[4.5rem] left-0 right-0 z-[90] shadow-[0_-8px_30px_rgba(0,0,0,0.08)]" />
            </div>

            {/* ── Tablet/Desktop: lista izquierda + mapa derecha ── */}
            <div className="hidden md:flex md:h-[calc(100dvh-3.5rem)] md:flex-col">
                <div className="shrink-0 space-y-3 border-b border-orange-100 bg-[#FFF8F2] px-5 py-4 lg:px-6">
                    <ExplorePageHeader
                        title={t('explore.nav_explore')}
                        subtitle={t('explore.discoveries_chiclayo')}
                        showHome
                    />
                    {flash?.message && (
                        <div
                            className={cn(
                                'max-w-2xl rounded-xl px-4 py-2 text-sm font-medium',
                                flash.type === 'error'
                                    ? 'bg-orange-50 text-red-800 ring-1 ring-red-100'
                                    : 'bg-green-50 text-green-800 ring-1 ring-green-100',
                            )}
                        >
                            {flash.message}
                        </div>
                    )}
                    <div className="max-w-3xl">{filtersBar}</div>
                </div>

                <div className="flex min-h-0 flex-1 overflow-hidden">
                    {/* Panel izquierdo — restaurantes con scroll */}
                    <aside className="flex w-[min(100%,420px)] shrink-0 flex-col border-r border-orange-100 bg-[#FFFCF8] lg:w-[440px]">
                        <div className="flex shrink-0 items-center justify-between border-b border-orange-50 bg-white/80 px-4 py-3 backdrop-blur-sm">
                            <div>
                                <h2 className="text-sm font-bold text-gray-900">{t('explore.near_you')}</h2>
                                <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                                    {t('explore.discoveries_chiclayo')}
                                </p>
                            </div>
                            <span className="rounded-full bg-brand-orange px-2.5 py-1 text-xs font-bold text-white">
                                {restaurants.length}
                            </span>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 scrollbar-thin">
                            {restaurantList}
                        </div>

                        <DraftRoutePanel {...draftPanelProps} />
                    </aside>

                    {/* Panel derecho — mapa fijo */}
                    <section className="relative flex min-w-0 flex-1 flex-col bg-gradient-to-br from-orange-50/40 to-white p-4 lg:p-5">
                        <div className="mb-2 flex shrink-0 items-center justify-between">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                {t('explore.map_panel_title')}
                            </p>
                            {stopsCount > 0 && draftRoute.total_distance_km != null && (
                                <p className="text-xs font-medium text-brand-orange">
                                    {t('explore.route_summary', {
                                        count: stopsCount,
                                        km: draftRoute.total_distance_km,
                                        min: draftRoute.estimated_minutes ?? '—',
                                    })}
                                </p>
                            )}
                        </div>
                        <div className="min-h-0 flex-1 overflow-hidden rounded-2xl shadow-lg ring-1 ring-orange-100/80">
                            {mapBlock}
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}

DiscoverPage.layout = (page: React.ReactNode) => (
    <TouristExploreLayout wide>{page}</TouristExploreLayout>
);

export default DiscoverPage;
