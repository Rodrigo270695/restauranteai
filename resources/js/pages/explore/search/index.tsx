import { Head, router } from '@inertiajs/react';
import { X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useUserGeolocation } from '@/hooks/use-user-geolocation';
import { DiscoverFiltersSidebar } from '@/components/explore/discover-filters-sidebar';
import { DiscoverToolbar } from '@/components/explore/discover-toolbar';
import { RestaurantListItem, type RestaurantListItemData } from '@/components/explore/restaurant-list-item';
import { exploreSearchUrl } from '@/lib/explore-discover-url';
import { cn } from '@/lib/utils';
import TouristExploreLayout from '@/layouts/tourist-explore-layout';

type CatalogItem = { id: number; name: string };

type Props = {
    restaurants: RestaurantListItemData[];
    catalogs?: {
        cuisineTypes: CatalogItem[];
        priceRanges: { value: string; name: string }[];
        ambiances: CatalogItem[];
        environments: CatalogItem[];
        partyTypes: CatalogItem[];
        districts: CatalogItem[];
    };
    filters: {
        search?: string;
        cuisine_type_ids?: number[];
        price_ranges?: string[];
        ambiance_ids?: number[];
        restaurant_environment_ids?: number[];
        party_type_ids?: number[];
        district_id?: number | null;
        sort?: string;
        page?: number;
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
};

const FILTER_ONLY = ['restaurants', 'filters', 'pagination'] as const;

function SearchPage({ restaurants, catalogs, filters, pagination }: Props) {
    const { t } = useTranslation();
    const syncedGeoRef = useRef(false);
    const catalog = catalogs ?? {
        cuisineTypes: [],
        priceRanges: [],
        ambiances: [],
        environments: [],
        partyTypes: [],
        districts: [],
    };

    const serverCoords =
        filters.lat != null && filters.lng != null
            ? { lat: filters.lat, lng: filters.lng }
            : null;

    const navigateWithCoords = useCallback(
        (lat: number, lng: number) => {
            router.get(
                exploreSearchUrl({
                    search: filters.search || undefined,
                    cuisine_type_ids: filters.cuisine_type_ids,
                    price_ranges: filters.price_ranges,
                    ambiance_ids: filters.ambiance_ids,
                    restaurant_environment_ids: filters.restaurant_environment_ids,
                    party_type_ids: filters.party_type_ids,
                    district_id: filters.district_id,
                    sort: filters.sort,
                    lat,
                    lng,
                }),
                {},
                { preserveState: true, preserveScroll: true, replace: true, only: [...FILTER_ONLY] },
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
    const [filtersLoading, setFiltersLoading] = useState(false);
    const [favoriteSlug, setFavoriteSlug] = useState<string | null>(null);
    const filterTimer = useRef(0);

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
        (extra?: Record<string, unknown>) => ({
            search: ((extra?.search as string | undefined) ?? search) || undefined,
            cuisine_type_ids: (extra?.cuisine_type_ids as number[] | undefined) ?? cuisineIds,
            price_ranges: (extra?.price_ranges as string[] | undefined) ?? priceValues,
            ambiance_ids: (extra?.ambiance_ids as number[] | undefined) ?? ambianceIds,
            restaurant_environment_ids:
                (extra?.restaurant_environment_ids as number[] | undefined) ?? environmentIds,
            party_type_ids: (extra?.party_type_ids as number[] | undefined) ?? partyTypeIds,
            district_id: extra?.district_id !== undefined ? (extra.district_id as number | null) : districtId,
            sort: (extra?.sort as string | undefined) ?? sort,
            page: extra?.page as number | undefined,
            ...geoQuery(),
        }),
        [search, cuisineIds, priceValues, ambianceIds, environmentIds, partyTypeIds, districtId, sort, geoQuery],
    );

    const navigateSearch = useCallback(
        (extra?: Record<string, unknown>) => {
            router.get(exploreSearchUrl(discoverParams(extra)), {}, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: [...FILTER_ONLY],
                onStart: () => setFiltersLoading(true),
                onFinish: () => setFiltersLoading(false),
            });
        },
        [discoverParams],
    );

    const scheduleSearch = useCallback(
        (extra?: Record<string, unknown>, delay = 280) => {
            window.clearTimeout(filterTimer.current);
            filterTimer.current = window.setTimeout(() => {
                navigateSearch({ ...extra, page: extra?.page ?? 1 });
            }, delay);
        },
        [navigateSearch],
    );

    useEffect(() => () => window.clearTimeout(filterTimer.current), []);

    const toggleId = (list: number[], id: number) =>
        list.includes(id) ? list.filter((item) => item !== id) : [...list, id];

    const toggleFavorite = (slug: string, currentlyFavorited: boolean) => {
        setFavoriteSlug(slug);
        router.post(
            `/explore/restaurants/${slug}/interactions`,
            { interaction_type: currentlyFavorited ? 'unsave' : 'save' },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(t(currentlyFavorited ? 'explore.unfavorited_toast' : 'explore.favorited_toast'));
                    router.reload({ only: [...FILTER_ONLY] });
                },
                onFinish: () => setFavoriteSlug(null),
            },
        );
    };

    const total = pagination?.total ?? restaurants.length;
    const currentPage = pagination?.current_page ?? 1;
    const lastPage = pagination?.last_page ?? 1;

    const chipItems = [
        ...cuisineIds.map((id) => ({
            key: `c-${id}`,
            label: catalog.cuisineTypes.find((c) => c.id === id)?.name ?? String(id),
            onRemove: () => {
                const next = cuisineIds.filter((item) => item !== id);
                setCuisineIds(next);
                scheduleSearch({ cuisine_type_ids: next, page: 1 });
            },
        })),
        ...priceValues.map((value) => ({
            key: `p-${value}`,
            label: catalog.priceRanges.find((p) => p.value === value)?.name ?? value,
            onRemove: () => {
                const next = priceValues.filter((item) => item !== value);
                setPriceValues(next);
                scheduleSearch({ price_ranges: next, page: 1 });
            },
        })),
        ...ambianceIds.map((id) => ({
            key: `a-${id}`,
            label: catalog.ambiances.find((c) => c.id === id)?.name ?? String(id),
            onRemove: () => {
                const next = ambianceIds.filter((item) => item !== id);
                setAmbianceIds(next);
                scheduleSearch({ ambiance_ids: next, page: 1 });
            },
        })),
        ...environmentIds.map((id) => ({
            key: `e-${id}`,
            label: catalog.environments.find((c) => c.id === id)?.name ?? String(id),
            onRemove: () => {
                const next = environmentIds.filter((item) => item !== id);
                setEnvironmentIds(next);
                scheduleSearch({ restaurant_environment_ids: next, page: 1 });
            },
        })),
        ...partyTypeIds.map((id) => ({
            key: `t-${id}`,
            label: catalog.partyTypes.find((c) => c.id === id)?.name ?? String(id),
            onRemove: () => {
                const next = partyTypeIds.filter((item) => item !== id);
                setPartyTypeIds(next);
                scheduleSearch({ party_type_ids: next, page: 1 });
            },
        })),
    ];

    const pages = Array.from({ length: lastPage }, (_, i) => i + 1)
        .filter((p) => p === 1 || p === lastPage || Math.abs(p - currentPage) <= 1)
        .reduce<number[]>((acc, p) => {
            if (acc.length && p - (acc[acc.length - 1] ?? 0) > 1) {
                acc.push(-1);
            }
            acc.push(p);
            return acc;
        }, []);

    return (
        <>
            <Head title={t('explore.explore_restaurants')} />
            <div className="px-4 py-6 pb-28 sm:px-6 lg:px-8">
                <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_12px_40px_rgba(0,35,102,0.08)]">
                <div className="space-y-3 border-b border-gray-100 px-4 py-5 sm:px-6">
                    <DiscoverToolbar
                        search={search}
                        onSearchChange={(value) => {
                            setSearch(value);
                            scheduleSearch({ search: value, page: 1 }, 400);
                        }}
                        onSearchSubmit={() => {
                            window.clearTimeout(filterTimer.current);
                            navigateSearch({ page: 1 });
                        }}
                        districts={catalog.districts}
                        districtId={districtId}
                        onDistrictChange={(id) => {
                            setDistrictId(id);
                            navigateSearch({ district_id: id, page: 1 });
                        }}
                        sort={sort}
                        onSortChange={(next) => {
                            setSort(next);
                            navigateSearch({ sort: next, page: 1 });
                        }}
                    />
                </div>

                <div className="flex flex-col md:flex-row">
                    <div className="hidden md:flex">
                        <DiscoverFiltersSidebar
                            className="md:sticky md:top-[5.25rem] md:max-h-[calc(100dvh-6.5rem)]"
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
                                scheduleSearch({ cuisine_type_ids: next, page: 1 });
                            }}
                            onTogglePrice={(value) => {
                                const next = priceValues.includes(value)
                                    ? priceValues.filter((item) => item !== value)
                                    : [...priceValues, value];
                                setPriceValues(next);
                                scheduleSearch({ price_ranges: next, page: 1 });
                            }}
                            onToggleAmbiance={(id) => {
                                const next = toggleId(ambianceIds, id);
                                setAmbianceIds(next);
                                scheduleSearch({ ambiance_ids: next, page: 1 });
                            }}
                            onToggleEnvironment={(id) => {
                                const next = toggleId(environmentIds, id);
                                setEnvironmentIds(next);
                                scheduleSearch({ restaurant_environment_ids: next, page: 1 });
                            }}
                            onToggleParty={(id) => {
                                const next = toggleId(partyTypeIds, id);
                                setPartyTypeIds(next);
                                scheduleSearch({ party_type_ids: next, page: 1 });
                            }}
                            onApply={() => {
                                window.clearTimeout(filterTimer.current);
                                navigateSearch({ page: 1 });
                            }}
                            onClear={() => {
                                setCuisineIds([]);
                                setPriceValues([]);
                                setAmbianceIds([]);
                                setEnvironmentIds([]);
                                setPartyTypeIds([]);
                                navigateSearch({
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
                    </div>

                    <div className="min-w-0 flex-1 px-4 py-4 sm:px-6">
                        {chipItems.length > 0 && (
                            <div className="mb-3 flex flex-wrap gap-1.5">
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
                        )}

                        <div className="space-y-4">
                            {restaurants.map((r) => (
                                <RestaurantListItem
                                    key={r.id}
                                    restaurant={r}
                                    detailed
                                    onToggleFavorite={() => toggleFavorite(r.slug, r.is_favorited === true)}
                                    favoriteBusy={favoriteSlug === r.slug}
                                />
                            ))}
                            {restaurants.length === 0 && (
                                <p className="rounded-2xl bg-white p-10 text-center text-sm text-gray-500 ring-1 ring-gray-100">
                                    {t('explore.no_restaurants')}
                                </p>
                            )}
                        </div>

                        {lastPage > 1 && (
                            <div className="mt-6 flex justify-center gap-1">
                                {pages.map((p, idx) =>
                                    p === -1 ? (
                                        <span key={`e-${idx}`} className="px-1 text-xs text-gray-400">
                                            …
                                        </span>
                                    ) : (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => navigateSearch({ page: p })}
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
                        )}
                    </div>
                </div>
                </div>
            </div>
        </>
    );
}

SearchPage.layout = (page: React.ReactNode) => (
    <TouristExploreLayout>{page}</TouristExploreLayout>
);

export default SearchPage;
