import { Head, router, usePage } from '@inertiajs/react';
import { PanelRightOpen, Route, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useUserGeolocation } from '@/hooks/use-user-geolocation';
import { DiscoverFiltersSidebar } from '@/components/explore/discover-filters-sidebar';
import { DiscoverRoutePanel, DiscoverRouteSheet } from '@/components/explore/discover-route-sheet';
import { DiscoverToolbar } from '@/components/explore/discover-toolbar';
import { ExplorePageHeader } from '@/components/explore/explore-page-header';
import { ExploreRouteMap, type MapMarker } from '@/components/explore/explore-route-map';
import { RestaurantListItem, type RestaurantListItemData } from '@/components/explore/restaurant-list-item';
import { exploreDiscoverUrl } from '@/lib/explore-discover-url';
import { cn } from '@/lib/utils';
import TouristExploreLayout from '@/layouts/tourist-explore-layout';
import { publish as publishRoute } from '@/routes/explore/routes';

type DraftRoute = {
    slug: string;
    stops_count: number;
    generated_by_ai?: boolean;
    total_distance_km?: number | null;
    estimated_minutes?: number | null;
    path_coordinates?: [number, number][];
    stops: Array<{
        position: number;
        reservation: { status: string } | null;
        restaurant: {
            name: string;
            slug: string;
            latitude?: number | null;
            longitude?: number | null;
            cover_url?: string | null;
            avg_rating?: number;
            cuisines?: Array<{ name: string }>;
        };
    }>;
};

type CatalogItem = { id: number; name: string };

type Props = {
    restaurants: RestaurantListItemData[];
    markers: MapMarker[];
    cuisineTypes?: CatalogItem[];
    catalogs?: {
        cuisineTypes: CatalogItem[];
        priceRanges: { value: string; name: string; label?: string }[];
        ambiances: CatalogItem[];
        environments: CatalogItem[];
        partyTypes: CatalogItem[];
        districts: CatalogItem[];
    };
    filters: {
        search?: string;
        cuisine_type_id?: number | null;
        cuisine_type_ids?: number[];
        favorites_only?: boolean;
        price_range?: string | null;
        price_ranges?: string[];
        ambiance_ids?: number[];
        restaurant_environment_ids?: number[];
        party_type_ids?: number[];
        district_id?: number | null;
        open_now?: boolean;
        sort?: string;
        page?: number;
        view: 'map' | 'list';
        lat?: number | null;
        lng?: number | null;
        location_active?: boolean;
    };
    pagination?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    nearbyLimit?: number;
    favoritesCount?: number;
    draftRoute: DraftRoute;
    draftStopSlugs: string[];
    mapCenter: { lat: number; lng: number };
};

const DISCOVER_FILTER_ONLY = ['restaurants', 'markers', 'filters', 'favoritesCount', 'pagination'] as const;

function DiscoverPage({
    restaurants,
    markers,
    cuisineTypes = [],
    catalogs,
    filters,
    pagination,
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

    const catalog = catalogs ?? {
        cuisineTypes,
        priceRanges: [],
        ambiances: [],
        environments: [],
        partyTypes: [],
        districts: [],
    };

    const navigateWithCoords = useCallback(
        (lat: number, lng: number) => {
            router.get(
                exploreDiscoverUrl({
                    search: filters.search || undefined,
                    cuisine_type_ids: filters.cuisine_type_ids,
                    favorites_only: filters.favorites_only,
                    price_ranges: filters.price_ranges,
                    ambiance_ids: filters.ambiance_ids,
                    restaurant_environment_ids: filters.restaurant_environment_ids,
                    party_type_ids: filters.party_type_ids,
                    district_id: filters.district_id,
                    open_now: filters.open_now,
                    sort: filters.sort,
                    lat,
                    lng,
                }),
                {},
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                    only: [...DISCOVER_FILTER_ONLY],
                },
            );
        },
        [filters],
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
    const [cuisineIds, setCuisineIds] = useState<number[]>(filters.cuisine_type_ids ?? []);
    const [priceValues, setPriceValues] = useState<string[]>(filters.price_ranges ?? []);
    const [ambianceIds, setAmbianceIds] = useState<number[]>(filters.ambiance_ids ?? []);
    const [environmentIds, setEnvironmentIds] = useState<number[]>(filters.restaurant_environment_ids ?? []);
    const [partyTypeIds, setPartyTypeIds] = useState<number[]>(filters.party_type_ids ?? []);
    const [districtId, setDistrictId] = useState<number | null>(filters.district_id ?? null);
    const [sort, setSort] = useState(filters.sort ?? 'relevant');
    const [view, setView] = useState<'list' | 'map'>('map');
    const [routePanelOpen, setRoutePanelOpen] = useState(draftRoute.stops_count > 0);
    const [isDesktop, setIsDesktop] = useState(true);
    const filterTimer = useRef<number>(0);
    const [filtersLoading, setFiltersLoading] = useState(false);
    const [routeName, setRouteName] = useState('Ruta gastronómica Chiclayo');
    const [routeDate, setRouteDate] = useState(new Date().toISOString().slice(0, 10));
    const [isPublishing, setIsPublishing] = useState(false);
    const [addingSlug, setAddingSlug] = useState<string | null>(null);
    const [favoriteSlug, setFavoriteSlug] = useState<string | null>(null);
    const [optimisticDraft, setOptimisticDraft] = useState<DraftRoute | null>(null);

    const activeDraft = optimisticDraft ?? draftRoute;

    const favoritesOnly = filters.favorites_only === true;
    const locationActive = filters.location_active === true;

    useEffect(() => {
        const media = window.matchMedia('(min-width: 768px)');
        const sync = () => setIsDesktop(media.matches);
        sync();
        media.addEventListener('change', sync);
        return () => media.removeEventListener('change', sync);
    }, []);

    useEffect(() => {
        setSearch(filters.search ?? '');
        setCuisineIds(filters.cuisine_type_ids ?? []);
        setPriceValues(filters.price_ranges ?? []);
        setAmbianceIds(filters.ambiance_ids ?? []);
        setEnvironmentIds(filters.restaurant_environment_ids ?? []);
        setPartyTypeIds(filters.party_type_ids ?? []);
        setDistrictId(filters.district_id ?? null);
        setSort(filters.sort ?? 'relevant');
    }, [filters]);

    const discoverParams = useCallback(
        (extra?: Partial<{
            search: string;
            cuisine_type_ids: number[];
            favorites_only: boolean;
            price_ranges: string[];
            ambiance_ids: number[];
            restaurant_environment_ids: number[];
            party_type_ids: number[];
            district_id: number | null;
            sort: string;
            page: number;
        }>) => ({
            search: (extra?.search ?? search) || undefined,
            cuisine_type_ids: extra?.cuisine_type_ids ?? cuisineIds,
            favorites_only: extra?.favorites_only ?? favoritesOnly,
            price_ranges: extra?.price_ranges ?? priceValues,
            ambiance_ids: extra?.ambiance_ids ?? ambianceIds,
            restaurant_environment_ids: extra?.restaurant_environment_ids ?? environmentIds,
            party_type_ids: extra?.party_type_ids ?? partyTypeIds,
            district_id: extra?.district_id !== undefined ? extra.district_id : districtId,
            sort: extra?.sort ?? sort,
            page: extra?.page,
            ...geoQuery(),
        }),
        [
            search,
            cuisineIds,
            favoritesOnly,
            priceValues,
            ambianceIds,
            environmentIds,
            partyTypeIds,
            districtId,
            sort,
            geoQuery,
        ],
    );

    const navigateDiscover = useCallback(
        (extra?: Parameters<typeof discoverParams>[0]) => {
            router.get(
                exploreDiscoverUrl(discoverParams(extra)),
                {},
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                    only: [...DISCOVER_FILTER_ONLY],
                    onStart: () => setFiltersLoading(true),
                    onFinish: () => setFiltersLoading(false),
                },
            );
        },
        [discoverParams],
    );

    const scheduleDiscover = useCallback(
        (extra?: Parameters<typeof discoverParams>[0], delay = 280) => {
            window.clearTimeout(filterTimer.current);
            filterTimer.current = window.setTimeout(() => {
                navigateDiscover({ ...extra, page: extra?.page ?? 1 });
            }, delay);
        },
        [navigateDiscover],
    );

    useEffect(() => () => window.clearTimeout(filterTimer.current), []);

    const applyFilters = () => {
        window.clearTimeout(filterTimer.current);
        navigateDiscover({ page: 1 });
    };

    const toggleId = (list: number[], id: number) =>
        list.includes(id) ? list.filter((item) => item !== id) : [...list, id];

    const togglePrice = (value: string) =>
        priceValues.includes(value) ? priceValues.filter((item) => item !== value) : [...priceValues, value];

    const toggleFavorite = (slug: string, currentlyFavorited: boolean) => {
        setFavoriteSlug(slug);
        router.post(
            `/explore/restaurants/${slug}/interactions`,
            { interaction_type: currentlyFavorited ? 'unsave' : 'save' },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        t(currentlyFavorited ? 'explore.unfavorited_toast' : 'explore.favorited_toast'),
                    );
                    router.reload({ only: ['restaurants', 'markers', 'filters', 'favoritesCount', 'pagination'] });
                },
                onFinish: () => setFavoriteSlug(null),
            },
        );
    };

    const stopsCount = activeDraft.stops_count;
    const isAiDraftRoute = Boolean(activeDraft.generated_by_ai) && stopsCount > 0;
    const pageTitle = isAiDraftRoute
        ? t('explore.ai_route_page_title')
        : t('explore.nav_explore');
    const pageSubtitle = isAiDraftRoute
        ? t('explore.ai_route_page_subtitle', { count: stopsCount })
        : t('explore.discoveries_chiclayo');
    const pageHeaderVariant = isAiDraftRoute ? 'ai' : 'default';

    const stopOrderBySlug = useMemo(
        () => new Map(activeDraft.stops.map(s => [s.restaurant.slug, s.position])),
        [activeDraft.stops],
    );

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
            toast.error(t('explore.closed_no_route'));
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
                        cover_url: target.cover_url,
                        avg_rating: target.avg_rating,
                        cuisines: target.cuisines,
                    },
                },
            ];
            setOptimisticDraft({
                ...activeDraft,
                stops_count: stops.length,
                stops,
                path_coordinates: stops.length >= 2 ? activeDraft.path_coordinates : [],
            });
            if (activeDraft.stops.length === 0) {
                setRoutePanelOpen(true);
            }
            toast.success(t('explore.added_to_list', { name: target.name }));
            router.post(`/explore/routes/stops/${slug}`, {}, routeVisitOptions);
        }
    };

    const moveStop = (slug: string, direction: -1 | 1) => {
        const current = [...activeDraft.stops];
        const from = current.findIndex((s) => s.restaurant.slug === slug);
        const to = from + direction;
        if (from < 0 || to < 0 || to >= current.length) {
            return;
        }

        const swapped = [...current];
        const [item] = swapped.splice(from, 1);
        swapped.splice(to, 0, item);
        const stops = swapped.map((s, index) => ({ ...s, position: index + 1 }));

        setOptimisticDraft({
            ...activeDraft,
            stops,
            path_coordinates: stops.length >= 2 ? activeDraft.path_coordinates : [],
        });

        router.put(
            '/explore/routes/stops/order',
            { slugs: stops.map((s) => s.restaurant.slug) },
            routeVisitOptions,
        );
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

    const total = pagination?.total ?? restaurants.length;
    const currentPage = pagination?.current_page ?? 1;
    const lastPage = pagination?.last_page ?? 1;

    const chipItems: { key: string; label: string; onRemove: () => void }[] = [
        ...cuisineIds.map((id) => ({
            key: `c-${id}`,
            label: catalog.cuisineTypes.find((c) => c.id === id)?.name ?? String(id),
            onRemove: () => {
                const next = cuisineIds.filter((item) => item !== id);
                setCuisineIds(next);
                scheduleDiscover({ cuisine_type_ids: next, page: 1 });
            },
        })),
        ...priceValues.map((value) => ({
            key: `p-${value}`,
            label: catalog.priceRanges.find((p) => p.value === value)?.name ?? value,
            onRemove: () => {
                const next = priceValues.filter((item) => item !== value);
                setPriceValues(next);
                scheduleDiscover({ price_ranges: next, page: 1 });
            },
        })),
        ...ambianceIds.map((id) => ({
            key: `a-${id}`,
            label: catalog.ambiances.find((c) => c.id === id)?.name ?? String(id),
            onRemove: () => {
                const next = ambianceIds.filter((item) => item !== id);
                setAmbianceIds(next);
                scheduleDiscover({ ambiance_ids: next, page: 1 });
            },
        })),
        ...environmentIds.map((id) => ({
            key: `e-${id}`,
            label: catalog.environments.find((c) => c.id === id)?.name ?? String(id),
            onRemove: () => {
                const next = environmentIds.filter((item) => item !== id);
                setEnvironmentIds(next);
                scheduleDiscover({ restaurant_environment_ids: next, page: 1 });
            },
        })),
        ...partyTypeIds.map((id) => ({
            key: `t-${id}`,
            label: catalog.partyTypes.find((c) => c.id === id)?.name ?? String(id),
            onRemove: () => {
                const next = partyTypeIds.filter((item) => item !== id);
                setPartyTypeIds(next);
                scheduleDiscover({ party_type_ids: next, page: 1 });
            },
        })),
    ];

    const sidebar = (
        <DiscoverFiltersSidebar
            cuisineTypes={catalog.cuisineTypes}
            priceRanges={catalog.priceRanges}
            ambiances={catalog.ambiances}
            environments={catalog.environments}
            partyTypes={catalog.partyTypes}
            cuisineIds={cuisineIds}
            priceValues={priceValues}
            ambianceIds={ambianceIds}
            environmentIds={environmentIds}
            partyTypeIds={partyTypeIds}
            onToggleCuisine={(id) => {
                const next = toggleId(cuisineIds, id);
                setCuisineIds(next);
                scheduleDiscover({ cuisine_type_ids: next, page: 1 });
            }}
            onTogglePrice={(value) => {
                const next = togglePrice(value);
                setPriceValues(next);
                scheduleDiscover({ price_ranges: next, page: 1 });
            }}
            onToggleAmbiance={(id) => {
                const next = toggleId(ambianceIds, id);
                setAmbianceIds(next);
                scheduleDiscover({ ambiance_ids: next, page: 1 });
            }}
            onToggleEnvironment={(id) => {
                const next = toggleId(environmentIds, id);
                setEnvironmentIds(next);
                scheduleDiscover({ restaurant_environment_ids: next, page: 1 });
            }}
            onToggleParty={(id) => {
                const next = toggleId(partyTypeIds, id);
                setPartyTypeIds(next);
                scheduleDiscover({ party_type_ids: next, page: 1 });
            }}
            onApply={applyFilters}
            onClear={() => {
                setCuisineIds([]);
                setPriceValues([]);
                setAmbianceIds([]);
                setEnvironmentIds([]);
                setPartyTypeIds([]);
                navigateDiscover({
                    cuisine_type_ids: [],
                    price_ranges: [],
                    ambiance_ids: [],
                    restaurant_environment_ids: [],
                    party_type_ids: [],
                    page: 1,
                });
            }}
            total={total}
            loading={filtersLoading}
        />
    );

    const toolbar = (
        <DiscoverToolbar
            search={search}
            onSearchChange={(value) => {
                setSearch(value);
                scheduleDiscover({ search: value, page: 1 }, 400);
            }}
            onSearchSubmit={applyFilters}
            districts={catalog.districts}
            districtId={districtId}
            onDistrictChange={(id) => {
                setDistrictId(id);
                navigateDiscover({ district_id: id, page: 1 });
            }}
            sort={sort}
            onSortChange={(next) => {
                setSort(next);
                navigateDiscover({ sort: next, page: 1 });
            }}
            view={view}
            onViewChange={setView}
            routePanelOpen={routePanelOpen}
            onToggleRoutePanel={() => setRoutePanelOpen((open) => !open)}
            routeStopsCount={stopsCount}
        />
    );

    const chipsBar =
        chipItems.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5">
                {chipItems.map((chip) => (
                    <button
                        key={chip.key}
                        type="button"
                        onClick={chip.onRemove}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-800"
                    >
                        {chip.label}
                        <X className="size-3" />
                    </button>
                ))}
            </div>
        ) : null;

    const paginationBar =
        lastPage > 1 ? (
            <div className="flex items-center justify-center gap-1 pt-2">
                {Array.from({ length: lastPage }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === lastPage || Math.abs(p - currentPage) <= 1)
                    .reduce<number[]>((acc, p, idx, arr) => {
                        if (idx > 0 && p - arr[idx - 1] > 1) {
                            acc.push(-1);
                        }
                        acc.push(p);
                        return acc;
                    }, [])
                    .map((p, idx) =>
                        p === -1 ? (
                            <span key={`e-${idx}`} className="px-1 text-xs text-gray-400">
                                …
                            </span>
                        ) : (
                            <button
                                key={p}
                                type="button"
                                onClick={() => navigateDiscover({ page: p })}
                                className={cn(
                                    'size-8 cursor-pointer rounded-lg text-xs font-semibold',
                                    p === currentPage
                                        ? 'bg-brand-blue text-white'
                                        : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50',
                                )}
                            >
                                {p}
                            </button>
                        ),
                    )}
            </div>
        ) : null;

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
        <div className="space-y-2">
            {renderRestaurantItems(restaurants)}
            {restaurants.length === 0 && (
                <p className="rounded-2xl bg-white p-10 text-center text-sm text-gray-500 ring-1 ring-gray-100">
                    {favoritesOnly ? t('explore.favorites_empty') : t('explore.no_restaurants')}
                </p>
            )}
            {paginationBar}
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

    const routePanel = (
        <DiscoverRoutePanel
            stops={activeDraft.stops}
            routeName={routeName}
            setRouteName={setRouteName}
            routeDate={routeDate}
            setRouteDate={setRouteDate}
            isPublishing={isPublishing}
            onPublish={publishDraftRoute}
            onRemove={toggleRoute}
            onMove={moveStop}
            removingSlug={addingSlug}
            totalKm={activeDraft.total_distance_km}
            totalMin={activeDraft.estimated_minutes}
            onClose={() => setRoutePanelOpen(false)}
        />
    );

    return (
        <>
            <Head title={t('explore.explore_restaurants')} />

            <div className="flex flex-col md:hidden">
                <div className="space-y-3 border-b border-gray-100 bg-white p-4 pb-3">
                    {toolbar}
                    {chipsBar}
                    {flash?.message && !isAiDraftRoute && (
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
                </div>

                {view === 'map' && (
                    <div className="sticky top-14 z-[50] h-[38vh] min-h-[220px] border-b border-gray-100 bg-white p-3 shadow-sm">
                        {mapBlock}
                    </div>
                )}

                <div className="flex flex-col p-4 pb-32">
                    {restaurantList}
                </div>
            </div>

            <div className="hidden h-full md:flex md:flex-col">
                <div className="shrink-0 space-y-3 border-b border-gray-100 bg-white px-5 py-4 lg:px-6">
                    {isAiDraftRoute && (
                        <ExplorePageHeader
                            title={pageTitle}
                            subtitle={pageSubtitle}
                            variant={pageHeaderVariant}
                            showHome
                        />
                    )}
                    {toolbar}
                    {flash?.message && !isAiDraftRoute && (
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
                </div>

                <div className="flex min-h-0 flex-1 overflow-hidden bg-[#f4f6fb]">
                    {sidebar}

                    <aside className={cn(
                        'flex shrink-0 flex-col border-r border-gray-100 bg-[#f8fafc]',
                        view === 'map' ? 'min-w-[18rem] w-[30%] max-w-[26rem]' : 'min-w-0 w-auto flex-1',
                    )}>
                        <div className="space-y-2 border-b border-gray-50 bg-white/90 px-3 py-2.5">
                            {chipsBar}
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-bold text-brand-blue">
                                    {favoritesOnly ? t('explore.filter_favorites') : t('explore.near_you')}
                                </h2>
                                <span className="rounded-full bg-brand-blue px-2 py-0.5 text-[11px] font-bold text-white">
                                    {total}
                                </span>
                            </div>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2.5 py-2.5 scrollbar-thin">
                            {restaurantList}
                        </div>
                    </aside>

                    {view === 'map' && (
                    <section className="relative flex min-w-0 flex-1 flex-col">
                        <div className="min-h-0 flex-1">
                            {mapBlock}
                        </div>
                        <div className="pointer-events-none absolute bottom-4 left-4 rounded-xl bg-white/95 px-3 py-2 text-[11px] shadow-md ring-1 ring-gray-100">
                            <p className="font-semibold text-brand-blue">
                                {t('explore.map_in_area', { count: total })}
                            </p>
                            {locationActive && (
                                <p className="text-gray-500">{t('explore.map_radius')}</p>
                            )}
                        </div>
                    </section>
                    )}

                    {routePanelOpen ? (
                        <aside className="flex w-[22rem] shrink-0 flex-col border-l border-gray-100">
                            {routePanel}
                        </aside>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setRoutePanelOpen(true)}
                            className="flex w-11 shrink-0 cursor-pointer flex-col items-center justify-center gap-2 border-l border-gray-100 bg-white text-brand-orange hover:bg-orange-50"
                            aria-label={t('explore.show_route_panel')}
                        >
                            <PanelRightOpen className="size-5" />
                            <span className="text-[10px] font-bold [writing-mode:vertical-rl]">
                                {t('explore.your_list_fab', { count: stopsCount })}
                            </span>
                        </button>
                    )}
                </div>
            </div>

            {stopsCount > 0 && !routePanelOpen && (
                <button
                    type="button"
                    onClick={() => setRoutePanelOpen(true)}
                    className="fixed right-4 bottom-[5.5rem] z-[80] inline-flex cursor-pointer items-center gap-2 rounded-full bg-brand-orange px-4 py-3 text-sm font-bold text-white shadow-lg hover:bg-brand-orange-dark md:hidden"
                >
                    <Route className="size-4" />
                    {t('explore.your_list_fab', { count: stopsCount })}
                </button>
            )}

            <DiscoverRouteSheet
                open={!isDesktop && routePanelOpen}
                onOpenChange={setRoutePanelOpen}
                stops={activeDraft.stops}
                routeName={routeName}
                setRouteName={setRouteName}
                routeDate={routeDate}
                setRouteDate={setRouteDate}
                isPublishing={isPublishing}
                onPublish={publishDraftRoute}
                onRemove={toggleRoute}
                onMove={moveStop}
                removingSlug={addingSlug}
                totalKm={activeDraft.total_distance_km}
                totalMin={activeDraft.estimated_minutes}
            />
        </>
    );
}

DiscoverPage.layout = (page: React.ReactNode) => (
    <TouristExploreLayout wide>{page}</TouristExploreLayout>
);

export default DiscoverPage;
