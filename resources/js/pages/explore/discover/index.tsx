import { Head, Link, router, usePage } from '@inertiajs/react';
import { Calendar, Filter, Heart, Route, Search, UtensilsCrossed } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUserGeolocation } from '@/hooks/use-user-geolocation';
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
    slug: string;
    stops_count: number;
    total_distance_km?: number | null;
    estimated_minutes?: number | null;
    path_coordinates?: [number, number][];
    stops: Array<{
        position: number;
        reservation: { status: string } | null;
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
        favorites_only?: boolean;
        price_range?: string | null;
        view: 'map' | 'list';
        lat?: number | null;
        lng?: number | null;
        location_active?: boolean;
    };
    nearbyLimit?: number;
    favoritesCount?: number;
    draftRoute: DraftRoute;
    draftStopSlugs: string[];
    mapCenter: { lat: number; lng: number };
};

function DraftRoutePanel({
    draftRoute,
    stopsCount,
    routeName,
    setRouteName,
    routeDate,
    setRouteDate,
    isPublishing,
    onPublish,
    t,
    className,
}: {
    draftRoute: DraftRoute;
    stopsCount: number;
    routeName: string;
    setRouteName: (v: string) => void;
    routeDate: string;
    setRouteDate: (v: string) => void;
    isPublishing: boolean;
    onPublish: () => void;
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
                    {draftRoute.stops.some(s => s.reservation) && (
                        <p className="mt-1 text-[11px] text-gray-500">
                            {t('explore.reservation_draft_summary', {
                                booked: draftRoute.stops.filter(s => s.reservation).length,
                                total: stopsCount,
                            })}
                        </p>
                    )}
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

            <form
                className="mt-3 space-y-2"
                onSubmit={e => {
                    e.preventDefault();
                    onPublish();
                }}
            >
                <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                        value={routeName}
                        onChange={e => setRouteName(e.target.value)}
                        placeholder={t('explore.route_name_placeholder')}
                        className="rounded-xl bg-white sm:flex-1"
                        disabled={isPublishing}
                    />
                    <div className="relative sm:w-40">
                        <Calendar className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                        <Input
                            type="date"
                            value={routeDate}
                            onChange={e => setRouteDate(e.target.value)}
                            className="rounded-xl bg-white pl-10"
                            disabled={isPublishing}
                        />
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        type="submit"
                        disabled={isPublishing || !routeName.trim()}
                        className="flex-1 rounded-xl bg-brand-orange text-white hover:bg-brand-orange-dark"
                    >
                        {isPublishing ? t('explore.route_publishing') : t('explore.publish_route')}
                    </Button>
                    <Button variant="outline" className="rounded-xl bg-white px-3" asChild disabled={isPublishing}>
                        <Link href={exploreRoutes.url()}>{t('explore.nav_routes')}</Link>
                    </Button>
                </div>
            </form>
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
    nearbyLimit = 30,
    favoritesCount = 0,
}: Props) {
    const { t } = useTranslation();
    const { flash } = usePage().props as { flash?: { type?: string; message?: string } };
    const syncedGeoRef = useRef(false);

    const serverCoords =
        filters.lat != null && filters.lng != null
            ? { lat: filters.lat, lng: filters.lng }
            : null;

    const navigateWithCoords = useCallback(
        (lat: number, lng: number) => {
            router.get(
                exploreDiscoverUrl({
                    search: filters.search || undefined,
                    cuisine_type_id: filters.cuisine_type_id || undefined,
                    favorites_only: filters.favorites_only,
                    view: 'map',
                    lat,
                    lng,
                }),
                {},
                { preserveState: true, preserveScroll: true, replace: true },
            );
        },
        [filters.search, filters.cuisine_type_id, filters.favorites_only],
    );

    const { coords: userLocation } = useUserGeolocation({
        serverCoords,
        onCoordinates: (lat, lng) => {
            if (syncedGeoRef.current || serverCoords) {
                return;
            }
            syncedGeoRef.current = true;
            navigateWithCoords(lat, lng);
        },
    });

    const geoQuery = useCallback(() => {
        const lat = filters.lat ?? userLocation?.lat;
        const lng = filters.lng ?? userLocation?.lng;
        return lat != null && lng != null ? { lat, lng } : {};
    }, [filters.lat, filters.lng, userLocation]);

    const [search, setSearch] = useState(filters.search ?? '');
    const [cuisineId, setCuisineId] = useState<number | ''>(filters.cuisine_type_id ?? '');
    const [routeName, setRouteName] = useState('Ruta gastronómica Chiclayo');
    const [routeDate, setRouteDate] = useState(new Date().toISOString().slice(0, 10));
    const [isPublishing, setIsPublishing] = useState(false);
    const [addingSlug, setAddingSlug] = useState<string | null>(null);
    const [favoriteSlug, setFavoriteSlug] = useState<string | null>(null);
    const [optimisticDraft, setOptimisticDraft] = useState<DraftRoute | null>(null);

    const activeDraft = optimisticDraft ?? draftRoute;

    const favoritesOnly = filters.favorites_only === true;
    const locationActive = filters.location_active === true;

    const discoverParams = (extra?: {
        search?: string;
        cuisine_type_id?: number | '';
        favorites_only?: boolean;
    }) => ({
        search: (extra?.search ?? search) || undefined,
        cuisine_type_id: (extra?.cuisine_type_id ?? cuisineId) || undefined,
        favorites_only: extra?.favorites_only ?? favoritesOnly,
        view: 'map' as const,
        ...geoQuery(),
    });

    const applyFilters = () => {
        router.get(exploreDiscoverUrl(discoverParams()), {}, { preserveState: true, replace: true });
    };

    const toggleFavorite = (slug: string, currentlyFavorited: boolean) => {
        setFavoriteSlug(slug);
        router.post(
            `/explore/restaurants/${slug}/interactions`,
            { interaction_type: currentlyFavorited ? 'unsave' : 'save' },
            {
                preserveScroll: true,
                onSuccess: () => {
                    import('sonner').then(({ toast }) =>
                        toast.success(
                            t(currentlyFavorited ? 'explore.unfavorited_toast' : 'explore.favorited_toast'),
                        ),
                    );
                    router.reload({ only: ['restaurants', 'markers', 'filters', 'favoritesCount'] });
                },
                onFinish: () => setFavoriteSlug(null),
            },
        );
    };

    const stopsCount = activeDraft.stops_count;

    const stopOrderBySlug = useMemo(
        () => new Map(activeDraft.stops.map(s => [s.restaurant.slug, s.position])),
        [activeDraft.stops],
    );

    const sortedRestaurants = useMemo(() => {
        const orderIndex = new Map(restaurants.map((r, index) => [r.slug, index]));

        return [...restaurants].sort((a, b) => {
            const pa = stopOrderBySlug.get(a.slug);
            const pb = stopOrderBySlug.get(b.slug);
            const aInRoute = pa != null;
            const bInRoute = pb != null;

            if (aInRoute && bInRoute) {
                return pa - pb;
            }
            if (aInRoute) {
                return -1;
            }
            if (bInRoute) {
                return 1;
            }

            return (orderIndex.get(a.slug) ?? 0) - (orderIndex.get(b.slug) ?? 0);
        });
    }, [restaurants, stopOrderBySlug]);

    const nearbyRestaurants = locationActive ? sortedRestaurants.slice(0, nearbyLimit) : [];
    const otherRestaurants = locationActive ? sortedRestaurants.slice(nearbyLimit) : sortedRestaurants;

    const draftNumberedStops = activeDraft.stops
        .filter(s => s.restaurant.latitude != null && s.restaurant.longitude != null)
        .map(s => ({
            position: s.position,
            lat: s.restaurant.latitude!,
            lng: s.restaurant.longitude!,
            name: s.restaurant.name,
        }));

    const draftPath = (activeDraft.path_coordinates ?? []) as [number, number][];

    const routeVisitOptions = {
        preserveScroll: true,
        only: ['draftRoute', 'draftStopSlugs'] as string[],
        onSuccess: () => setOptimisticDraft(null),
        onError: () => setOptimisticDraft(null),
        onFinish: () => setAddingSlug(null),
    };

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
            const stops = activeDraft.stops
                .filter(s => s.restaurant.slug !== slug)
                .map((s, index) => ({ ...s, position: index + 1 }));
            setOptimisticDraft({
                ...activeDraft,
                stops_count: stops.length,
                stops,
                path_coordinates: stops.length >= 2 ? activeDraft.path_coordinates : [],
            });
            router.delete(`/explore/routes/stops/${slug}`, routeVisitOptions);
        } else if (target) {
            const lat = (target as RestaurantListItemData & { latitude?: number | null }).latitude;
            const lng = (target as RestaurantListItemData & { longitude?: number | null }).longitude;
            const stops = [
                ...activeDraft.stops,
                {
                    position: activeDraft.stops.length + 1,
                    reservation: null,
                    restaurant: {
                        name: target.name,
                        slug: target.slug,
                        latitude: lat ?? null,
                        longitude: lng ?? null,
                    },
                },
            ];
            setOptimisticDraft({
                ...activeDraft,
                stops_count: stops.length,
                stops,
                path_coordinates: stops.length >= 2 ? activeDraft.path_coordinates : [],
            });
            router.post(`/explore/routes/stops/${slug}`, {}, routeVisitOptions);
        }
    };

    const publishDraftRoute = () => {
        if (!routeName.trim() || isPublishing) {
            return;
        }

        setIsPublishing(true);
        router.post(
            publishRoute.url(),
            { name: routeName.trim(), route_date: routeDate },
            { onFinish: () => setIsPublishing(false) },
        );
    };

    const draftPanelProps = {
        draftRoute: activeDraft,
        stopsCount,
        routeName,
        setRouteName,
        routeDate,
        setRouteDate,
        isPublishing,
        onPublish: publishDraftRoute,
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
                        router.get(
                            exploreDiscoverUrl(discoverParams({ cuisine_type_id: '', favorites_only: false })),
                            {},
                            { preserveState: true },
                        );
                    }}
                    className={cn(
                        'shrink-0 cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold transition',
                        !cuisineId && !favoritesOnly
                            ? 'bg-brand-orange text-white'
                            : 'bg-white text-gray-600 ring-1 ring-gray-200',
                    )}
                >
                    <UtensilsCrossed className="mr-1 inline size-3" />
                    {t('explore.filter_all')}
                </button>
                <button
                    type="button"
                    onClick={() => {
                        router.get(
                            exploreDiscoverUrl(discoverParams({ favorites_only: !favoritesOnly })),
                            {},
                            { preserveState: true },
                        );
                    }}
                    className={cn(
                        'shrink-0 cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold transition',
                        favoritesOnly
                            ? 'bg-brand-orange text-white'
                            : 'bg-white text-gray-600 ring-1 ring-gray-200',
                    )}
                >
                    <Heart className={cn('mr-1 inline size-3', favoritesOnly && 'fill-white')} />
                    {t('explore.filter_favorites')}
                    {favoritesCount > 0 && (
                        <span
                            className={cn(
                                'ml-1 rounded-full px-1.5 py-px text-[10px] font-bold',
                                favoritesOnly ? 'bg-white/25 text-white' : 'bg-orange-100 text-brand-orange',
                            )}
                        >
                            {favoritesCount}
                        </span>
                    )}
                </button>
                {cuisineTypes.map(c => (
                    <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                            setCuisineId(c.id);
                            router.get(
                                exploreDiscoverUrl(discoverParams({ cuisine_type_id: c.id })),
                                {},
                                { preserveState: true },
                            );
                        }}
                        className={cn(
                            'shrink-0 cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold transition',
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

    const renderRestaurantItems = (items: RestaurantListItemData[]) =>
        items.map(r => (
            <RestaurantListItem
                key={r.id}
                restaurant={r}
                routePosition={stopOrderBySlug.get(r.slug) ?? null}
                routeTotal={stopsCount}
                isBusy={addingSlug === r.slug}
                onToggleRoute={() => toggleRoute(r.slug)}
                onToggleFavorite={() => toggleFavorite(r.slug, r.is_favorited === true)}
                favoriteBusy={favoriteSlug === r.slug}
            />
        ));

    const restaurantList = (
        <div className="space-y-2.5">
            {locationActive ? (
                <>
                    {renderRestaurantItems(nearbyRestaurants)}
                    {otherRestaurants.length > 0 && (
                        <div className="flex items-center gap-2 pt-4 pb-1">
                            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                                {t('explore.more_discoveries')}
                            </p>
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                                {otherRestaurants.length}
                            </span>
                        </div>
                    )}
                    {renderRestaurantItems(otherRestaurants)}
                </>
            ) : (
                renderRestaurantItems(otherRestaurants)
            )}
            {restaurants.length === 0 && (
                <p className="rounded-2xl bg-white p-10 text-center text-sm text-gray-500 ring-1 ring-gray-100">
                    {favoritesOnly ? t('explore.favorites_empty') : t('explore.no_restaurants')}
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
                userLocation={userLocation}
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
                        <div>
                            <h2 className="text-sm font-bold text-gray-900">
                                {favoritesOnly ? t('explore.filter_favorites') : t('explore.near_you')}
                            </h2>
                            {(favoritesOnly || locationActive) && (
                                <p className="text-[10px] font-medium text-gray-500">
                                    {favoritesOnly
                                        ? t('explore.favorites_list_subtitle', { count: favoritesCount })
                                        : t('explore.near_you_subtitle', { count: nearbyRestaurants.length })}
                                </p>
                            )}
                        </div>
                        <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-semibold text-brand-orange">
                            {t('explore.places_count', {
                                count: favoritesOnly
                                    ? restaurants.length
                                    : locationActive
                                      ? nearbyRestaurants.length
                                      : restaurants.length,
                            })}
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
                                <h2 className="text-sm font-bold text-gray-900">
                                    {favoritesOnly ? t('explore.filter_favorites') : t('explore.near_you')}
                                </h2>
                                <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                                    {favoritesOnly
                                        ? t('explore.favorites_list_subtitle', { count: favoritesCount })
                                        : locationActive
                                          ? t('explore.near_you_subtitle', { count: nearbyRestaurants.length })
                                          : t('explore.discoveries_chiclayo')}
                                </p>
                            </div>
                            <span className="rounded-full bg-brand-orange px-2.5 py-1 text-xs font-bold text-white">
                                {favoritesOnly
                                    ? restaurants.length
                                    : locationActive
                                      ? nearbyRestaurants.length
                                      : restaurants.length}
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
                            {stopsCount > 0 && activeDraft.total_distance_km != null && (
                                <p className="text-xs font-medium text-brand-orange">
                                    {t('explore.route_summary', {
                                        count: stopsCount,
                                        km: activeDraft.total_distance_km,
                                        min: activeDraft.estimated_minutes ?? '—',
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
