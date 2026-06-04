import { router } from '@inertiajs/react';
import { Filter, LocateFixed, MapPin, Search, SlidersHorizontal, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RestaurantGridCard } from '@/components/public/restaurant-grid-card';
import type { RestaurantCardData } from '@/components/explore/restaurant-card';
import { PaginationLinks, type PaginationMeta } from '@/components/shared/pagination-links';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUserGeolocation } from '@/hooks/use-user-geolocation';
import { cn } from '@/lib/utils';
import { priceRangeLabel } from '@/lib/restaurant-price';

type Filters = {
    search?: string;
    cuisine_type_id?: number | null;
    price_range?: string | null;
    district_id?: number | null;
    ambiance_id?: number | null;
    min_rating?: number | null;
    open_now?: boolean;
    featured_only?: boolean;
    max_distance_km?: number | null;
    sort?: string;
    lat?: number | null;
    lng?: number | null;
    location_active?: boolean;
};

const RATING_OPTIONS = [3, 3.5, 4, 4.5] as const;
const DISTANCE_KM_OPTIONS = [5, 10, 25, 50] as const;

type PriceRangeOption = { value: string; label: string; name: string };

type PaginatedRestaurants = PaginationMeta & {
    data: (RestaurantCardData & { is_featured?: boolean })[];
};

type Props = {
    mode: 'catalog' | 'nearby';
    listPath: string;
    restaurants: PaginatedRestaurants;
    cuisineTypes: { id: number; name: string; slug?: string }[];
    districts: { id: number; name: string }[];
    ambiances: { id: number; name: string }[];
    priceRanges: PriceRangeOption[];
    filters: Filters;
    titleKey?: string;
    subtitleKey?: string;
    sectionId?: string;
};

const PAGINATION_ONLY = ['restaurants', 'cuisineTypes', 'districts', 'ambiances', 'priceRanges', 'filters'] as const;
const PUBLIC_PER_PAGE = [9, 12, 15, 24];

function coordsFromFilters(filters: Filters): { lat: number; lng: number } | null {
    if (filters.lat != null && filters.lng != null) {
        return { lat: filters.lat, lng: filters.lng };
    }
    return null;
}

export function WelcomeRestaurantsBrowse({
    mode,
    listPath,
    restaurants,
    cuisineTypes,
    districts,
    ambiances,
    priceRanges,
    filters,
    titleKey = 'welcome.browse_title',
    subtitleKey = 'welcome.browse_subtitle',
    sectionId = 'restaurantes',
}: Props) {
    const { t } = useTranslation();
    const isNearby = mode === 'nearby';
    const rows = restaurants.data ?? [];
    const totalCount = restaurants.total ?? 0;

    const [search, setSearch] = useState(filters.search ?? '');
    const [mobileFilters, setMobileFilters] = useState(false);
    const syncedGeoRef = useRef(false);

    const serverCoords = isNearby ? coordsFromFilters(filters) : null;

    const navigateWithCoords = useCallback(
        (lat: number, lng: number) => {
            router.get(
                listPath,
                {
                    lat,
                    lng,
                    sort: 'nearby',
                    search: filters.search || undefined,
                    cuisine_type_id: filters.cuisine_type_id || undefined,
                    price_range: filters.price_range || undefined,
                    district_id: filters.district_id || undefined,
                    ambiance_id: filters.ambiance_id || undefined,
                    min_rating: filters.min_rating ?? undefined,
                    open_now: filters.open_now ? 1 : undefined,
                    featured_only: filters.featured_only ? 1 : undefined,
                    max_distance_km: filters.max_distance_km ?? undefined,
                    per_page: restaurants.per_page,
                },
                { preserveState: true, preserveScroll: true, replace: true },
            );
        },
        [filters, listPath, restaurants.per_page],
    );

    const { status, request, isActive, isBlocked } = useUserGeolocation({
        serverCoords: isNearby ? serverCoords : null,
        onCoordinates: isNearby
            ? (lat, lng) => {
                  if (syncedGeoRef.current || serverCoords) {
                      return;
                  }
                  syncedGeoRef.current = true;
                  navigateWithCoords(lat, lng);
              }
            : undefined,
    });

    const buildQuery = useCallback(
        (overrides: Partial<Filters> = {}) => {
            const merged = { ...filters, ...overrides };
            const params: Record<string, string | number | undefined> = {
                search: search || undefined,
                cuisine_type_id: merged.cuisine_type_id || undefined,
                price_range: merged.price_range || undefined,
                district_id: merged.district_id || undefined,
                ambiance_id: merged.ambiance_id || undefined,
                min_rating: merged.min_rating ?? undefined,
                open_now: merged.open_now ? 1 : undefined,
                featured_only: merged.featured_only ? 1 : undefined,
                max_distance_km: merged.max_distance_km ?? undefined,
                sort: isNearby ? 'nearby' : merged.sort || 'featured',
                per_page: restaurants.per_page,
                page: 1,
            };
            if (isNearby && serverCoords) {
                params.lat = serverCoords.lat;
                params.lng = serverCoords.lng;
            }
            return params;
        },
        [filters, search, isNearby, serverCoords, restaurants.per_page],
    );

    const apply = (overrides: Partial<Filters> = {}) => {
        router.get(listPath, buildQuery(overrides), { preserveState: true, preserveScroll: true });
    };

    const clearAll = () => {
        setSearch('');
        const params: Record<string, string | number | undefined> = {
            sort: isNearby ? 'nearby' : 'featured',
            per_page: restaurants.per_page,
        };
        if (isNearby && serverCoords) {
            params.lat = serverCoords.lat;
            params.lng = serverCoords.lng;
        }
        router.get(listPath, params, { preserveState: true });
    };

    useEffect(() => {
        if (serverCoords) {
            syncedGeoRef.current = true;
        }
    }, [serverCoords]);

    const priceLabel = (value: string) =>
        priceRanges.find(p => p.value === value)?.name ??
        priceRanges.find(p => p.value === value)?.label ??
        priceRangeLabel(value);

    const activeTags: Array<{ key: string; label: string; clear: () => void }> = [];

    if (filters.cuisine_type_id) {
        const c = cuisineTypes.find(x => x.id === filters.cuisine_type_id);
        if (c) {
            activeTags.push({
                key: 'cuisine',
                label: c.name,
                clear: () => apply({ cuisine_type_id: undefined }),
            });
        }
    }
    if (filters.price_range) {
        activeTags.push({
            key: 'price',
            label: priceLabel(filters.price_range),
            clear: () => apply({ price_range: undefined }),
        });
    }
    if (filters.district_id) {
        const d = districts.find(x => x.id === filters.district_id);
        if (d) {
            activeTags.push({
                key: 'district',
                label: d.name,
                clear: () => apply({ district_id: undefined }),
            });
        }
    }
    if (filters.ambiance_id) {
        const a = ambiances.find(x => x.id === filters.ambiance_id);
        if (a) {
            activeTags.push({
                key: 'ambiance',
                label: a.name,
                clear: () => apply({ ambiance_id: undefined }),
            });
        }
    }
    if (filters.min_rating != null) {
        activeTags.push({
            key: 'rating',
            label: t('welcome.browse_rating_min', { rating: filters.min_rating }),
            clear: () => apply({ min_rating: undefined }),
        });
    }
    if (filters.open_now) {
        activeTags.push({
            key: 'open',
            label: t('welcome.browse_open_now'),
            clear: () => apply({ open_now: false }),
        });
    }
    if (filters.featured_only) {
        activeTags.push({
            key: 'featured',
            label: t('welcome.browse_featured_only'),
            clear: () => apply({ featured_only: false }),
        });
    }
    if (isNearby && filters.max_distance_km != null) {
        activeTags.push({
            key: 'distance',
            label: t('welcome.browse_max_distance', { km: filters.max_distance_km }),
            clear: () => apply({ max_distance_km: undefined }),
        });
    }

    const locationBanner = () => {
        if (!isNearby) {
            return null;
        }
        if (status === 'loading') {
            return (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-orange-100 bg-orange-50/80 px-4 py-3 text-sm text-orange-900">
                    <LocateFixed className="size-4 shrink-0 animate-pulse text-brand-orange" />
                    {t('welcome.browse_geo_loading')}
                </div>
            );
        }
        if ((status === 'denied' || status === 'blocked' || status === 'error' || status === 'unsupported') && !isActive && !filters.location_active) {
            return (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                    <div className="flex items-start gap-2">
                        <MapPin className="mt-0.5 size-4 shrink-0 text-amber-700" />
                        <div className="min-w-0 flex-1 space-y-2">
                            <p className="font-semibold">
                                {isBlocked
                                    ? t('welcome.browse_geo_blocked_title')
                                    : t('welcome.browse_geo_denied')}
                            </p>
                            {isBlocked && (
                                <ol className="list-decimal space-y-1 pl-4 text-xs text-amber-900/90 sm:text-sm">
                                    <li>{t('welcome.browse_geo_blocked_step1')}</li>
                                    <li>{t('welcome.browse_geo_blocked_step2')}</li>
                                    <li>{t('welcome.browse_geo_blocked_step3')}</li>
                                </ol>
                            )}
                        </div>
                    </div>
                </div>
            );
        }
        if (isActive || filters.location_active) {
            return (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-900">
                    <span className="relative flex size-2.5">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                        <span className="relative inline-flex size-2.5 rounded-full bg-emerald-600" />
                    </span>
                    {t('welcome.browse_geo_active_nearby')}
                </div>
            );
        }
        return null;
    };

    const filterSidebar = (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
                    <Filter className="size-4 text-brand-orange" />
                    {t('welcome.browse_filters')}
                </h3>
                {activeTags.length > 0 && (
                    <button
                        type="button"
                        onClick={clearAll}
                        className="cursor-pointer text-xs font-medium text-brand-orange hover:underline"
                    >
                        {t('welcome.browse_clear_all')}
                    </button>
                )}
            </div>

            {cuisineTypes.length > 0 && (
                <div>
                    <p className="mb-2 text-xs font-semibold text-gray-700">{t('welcome.browse_cuisine')}</p>
                    <div className="max-h-36 space-y-2 overflow-y-auto scrollbar-thin pr-1">
                        {cuisineTypes.map(c => (
                            <label
                                key={c.id}
                                className="flex cursor-pointer items-center gap-2 text-sm text-gray-600"
                            >
                                <input
                                    type="checkbox"
                                    checked={filters.cuisine_type_id === c.id}
                                    onChange={() =>
                                        apply({
                                            cuisine_type_id:
                                                filters.cuisine_type_id === c.id ? undefined : c.id,
                                        })
                                    }
                                    className="size-4 rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
                                />
                                {c.name}
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {priceRanges.length > 0 && (
                <div>
                    <p className="mb-2 text-xs font-semibold text-gray-700">{t('welcome.browse_price')}</p>
                    <div className={cn('flex gap-2', priceRanges.length > 3 && 'flex-wrap')}>
                        {priceRanges.map(p => (
                            <button
                                key={p.value}
                                type="button"
                                title={p.name}
                                onClick={() =>
                                    apply({
                                        price_range: filters.price_range === p.value ? undefined : p.value,
                                    })
                                }
                                className={cn(
                                    'min-w-12 flex-1 cursor-pointer rounded-xl border px-2 py-2 text-sm font-bold transition',
                                    filters.price_range === p.value
                                        ? 'border-brand-orange bg-orange-50 text-brand-orange'
                                        : 'border-gray-200 bg-white text-gray-600 hover:border-orange-200',
                                )}
                            >
                                <span className="block text-sm font-extrabold text-brand-orange">{p.label}</span>
                                <span className="mt-0.5 block text-[9px] font-medium normal-case text-gray-500">
                                    {p.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div>
                <p className="mb-2 text-xs font-semibold text-gray-700">{t('welcome.browse_rating')}</p>
                <div className="flex flex-wrap gap-2">
                    {RATING_OPTIONS.map(rating => (
                        <button
                            key={rating}
                            type="button"
                            onClick={() =>
                                apply({
                                    min_rating: filters.min_rating === rating ? undefined : rating,
                                })
                            }
                            className={cn(
                                'cursor-pointer rounded-xl border px-2.5 py-1.5 text-xs font-bold transition',
                                filters.min_rating === rating
                                    ? 'border-brand-orange bg-orange-50 text-brand-orange'
                                    : 'border-gray-200 bg-white text-gray-600 hover:border-orange-200',
                            )}
                        >
                            ★ {rating}+
                        </button>
                    ))}
                </div>
            </div>

            {districts.length > 0 && (
                <div>
                    <p className="mb-2 text-xs font-semibold text-gray-700">{t('welcome.browse_district')}</p>
                    <div className="max-h-32 space-y-2 overflow-y-auto scrollbar-thin pr-1">
                        {districts.map(d => (
                            <label
                                key={d.id}
                                className="flex cursor-pointer items-center gap-2 text-sm text-gray-600"
                            >
                                <input
                                    type="checkbox"
                                    checked={filters.district_id === d.id}
                                    onChange={() =>
                                        apply({
                                            district_id: filters.district_id === d.id ? undefined : d.id,
                                        })
                                    }
                                    className="size-4 rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
                                />
                                {d.name}
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {ambiances.length > 0 && (
                <div>
                    <p className="mb-2 text-xs font-semibold text-gray-700">{t('welcome.browse_ambiance')}</p>
                    <div className="max-h-32 space-y-2 overflow-y-auto scrollbar-thin pr-1">
                        {ambiances.map(a => (
                            <label
                                key={a.id}
                                className="flex cursor-pointer items-center gap-2 text-sm text-gray-600"
                            >
                                <input
                                    type="checkbox"
                                    checked={filters.ambiance_id === a.id}
                                    onChange={() =>
                                        apply({
                                            ambiance_id: filters.ambiance_id === a.id ? undefined : a.id,
                                        })
                                    }
                                    className="size-4 rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
                                />
                                {a.name}
                            </label>
                        ))}
                    </div>
                </div>
            )}

            <div className="space-y-2 border-t border-gray-100 pt-4">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                    <input
                        type="checkbox"
                        checked={!!filters.open_now}
                        onChange={() => apply({ open_now: !filters.open_now })}
                        className="size-4 rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
                    />
                    {t('welcome.browse_open_now')}
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                    <input
                        type="checkbox"
                        checked={!!filters.featured_only}
                        onChange={() => apply({ featured_only: !filters.featured_only })}
                        className="size-4 rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
                    />
                    {t('welcome.browse_featured_only')}
                </label>
            </div>

            {isNearby && (
                <div>
                    <p className="mb-2 text-xs font-semibold text-gray-700">{t('welcome.browse_max_distance_label')}</p>
                    <div className="flex flex-wrap gap-2">
                        {DISTANCE_KM_OPTIONS.map(km => (
                            <button
                                key={km}
                                type="button"
                                onClick={() =>
                                    apply({
                                        max_distance_km: filters.max_distance_km === km ? undefined : km,
                                    })
                                }
                                className={cn(
                                    'cursor-pointer rounded-xl border px-3 py-1.5 text-xs font-bold transition',
                                    filters.max_distance_km === km
                                        ? 'border-brand-orange bg-orange-50 text-brand-orange'
                                        : 'border-gray-200 bg-white text-gray-600 hover:border-orange-200',
                                )}
                            >
                                {km} km
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <section id={sectionId} className="scroll-mt-20 border-t border-orange-100/80 bg-gray-50/90 py-10 lg:py-12">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
                            {t(titleKey)}
                        </h2>
                        <p className="mt-1 text-sm text-gray-600 sm:text-base">
                            {t(subtitleKey, { count: totalCount })}
                        </p>
                    </div>

                    <div className="flex w-full max-w-lg items-center gap-2">
                    <form
                        className="flex flex-1 items-center gap-2"
                        onSubmit={e => {
                            e.preventDefault();
                            apply({ search: search.trim() || undefined });
                        }}
                    >
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder={t('welcome.browse_search')}
                                className="h-11 rounded-xl border-gray-200 bg-white pl-10 shadow-sm"
                                aria-label={t('welcome.browse_search')}
                            />
                        </div>
                        <Button
                            type="submit"
                            className="h-11 shrink-0 cursor-pointer rounded-xl bg-brand-orange px-4 text-white hover:bg-brand-orange-dark"
                        >
                            <Search className="size-4" />
                        </Button>
                    </form>
                    <Button
                        type="button"
                        variant="outline"
                        className="h-11 shrink-0 cursor-pointer rounded-xl bg-white lg:hidden"
                        onClick={() => setMobileFilters(v => !v)}
                    >
                        <SlidersHorizontal className="size-4" />
                    </Button>
                    </div>
                </div>

                {locationBanner()}

                {activeTags.length > 0 && (
                    <div className="mb-5 flex flex-wrap gap-2">
                        {activeTags.map(tag => (
                            <button
                                key={tag.key}
                                type="button"
                                onClick={tag.clear}
                                className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-200 transition hover:ring-brand-orange"
                            >
                                {tag.label}
                                <X className="size-3" />
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
                    <aside
                        className={cn(
                            'shrink-0 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm lg:block lg:w-60 xl:w-64',
                            mobileFilters ? 'block' : 'hidden',
                        )}
                    >
                        {filterSidebar}
                    </aside>

                    <div className="min-w-0 flex-1">
                        {!isNearby && (
                            <div className="mb-4 flex items-center justify-end">
                                <select
                                    value={filters.sort ?? 'featured'}
                                    onChange={e => apply({ sort: e.target.value })}
                                    className="cursor-pointer rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm"
                                >
                                    <option value="featured">{t('welcome.browse_sort_featured')}</option>
                                    <option value="rating">{t('welcome.browse_sort_rating')}</option>
                                    <option value="name">{t('welcome.browse_sort_name')}</option>
                                </select>
                            </div>
                        )}

                        {rows.length > 0 ? (
                            <>
                                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                                    {rows.map(r => (
                                        <RestaurantGridCard key={r.id} restaurant={r} />
                                    ))}
                                </div>
                                <PaginationLinks
                                    meta={restaurants}
                                    only={[...PAGINATION_ONLY]}
                                    perPageOptions={PUBLIC_PER_PAGE}
                                    className="mt-8"
                                />
                            </>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-8 py-14 text-center">
                                <p className="text-lg font-semibold text-gray-800">{t('welcome.browse_empty')}</p>
                                <p className="mt-2 text-sm text-gray-500">
                                    {isNearby && (isActive || filters.location_active)
                                        ? t('welcome.browse_empty_nearby')
                                        : t('welcome.browse_empty_hint')}
                                </p>
                                <Button variant="outline" className="mt-4 rounded-xl" onClick={clearAll}>
                                    {t('welcome.browse_clear_all')}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
