import { Link, usePage } from '@inertiajs/react';
import { BadgeCheck, Heart, MapPin, Minus, Plus, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { CuisineBadge } from '@/components/explore/cuisine-badges';
import { RestaurantHoursStatus, type RestaurantHoursData } from '@/components/explore/restaurant-hours-status';
import { formatDistanceKm } from '@/lib/geo-distance';
import { PRICE_AVG_LIMITS, type PriceRangeValue } from '@/lib/restaurant-price';
import { cn } from '@/lib/utils';
import { show as restaurantShow } from '@/routes/explore/restaurants';

export type RestaurantListItemData = {
    id: number;
    name: string;
    slug: string;
    short_description?: string | null;
    price_range: string;
    price_range_label?: string | null;
    avg_price_per_person?: number | null;
    avg_rating: number;
    total_reviews: number;
    cover_url?: string | null;
    district?: string | null;
    environments?: string[];
    ambiance?: string | null;
    party_types?: string[];
    distance_km?: number | null;
    latitude?: number | null;
    longitude?: number | null;
    cuisines: CuisineBadge[];
    hours?: RestaurantHoursData | null;
    is_favorited?: boolean;
};

type Props = {
    restaurant: RestaurantListItemData;
    routePosition?: number | null;
    routeTotal?: number;
    isBusy?: boolean;
    onToggleRoute?: () => void;
    onToggleFavorite?: () => void;
    favoriteBusy?: boolean;
    detailed?: boolean;
};

function pricePerPerson(priceRange: string, avg: number | null | undefined): string {
    if (avg != null && !Number.isNaN(avg)) {
        const rounded = Math.round(avg);
        const spread = Math.max(10, Math.round(rounded * 0.25));
        return `S/ ${Math.max(5, rounded - spread)} - S/ ${rounded + spread}`;
    }

    const key = (priceRange === 'premium' ? 'caro' : priceRange) as PriceRangeValue;
    const limits = PRICE_AVG_LIMITS[key];
    if (!limits) {
        return priceRange;
    }
    if ('max' in limits && 'min' in limits) {
        return `S/ ${limits.min} - S/ ${limits.max}`;
    }
    if ('max' in limits) {
        return `S/ ${limits.max}`;
    }
    if ('min' in limits) {
        return `S/ ${limits.min}+`;
    }
    return limits.label;
}

export function RestaurantListItem({
    restaurant,
    routePosition = null,
    routeTotal: _routeTotal = 0,
    isBusy = false,
    onToggleRoute,
    onToggleFavorite,
    favoriteBusy = false,
    detailed = false,
}: Props) {
    const { t } = useTranslation();
    const { auth } = usePage().props as { auth?: { user?: unknown | null } };
    const detailHref = auth?.user
        ? restaurantShow.url(restaurant.slug)
        : `/restaurantes/${restaurant.slug}`;
    const inRoute = routePosition != null && routePosition > 0;
    const canAddToRoute =
        !restaurant.hours
        || restaurant.hours.label === 'Horario no disponible'
        || restaurant.hours.is_open;
    const favorited = restaurant.is_favorited === true;

    if (detailed) {
        return (
            <article className="group overflow-hidden rounded-2xl border border-gray-100 bg-white p-3 shadow-sm transition hover:border-sky-100 hover:shadow-md">
                <Link href={detailHref} className="flex cursor-pointer gap-4">
                    <div className="relative h-[8.5rem] w-[9.5rem] shrink-0 overflow-hidden rounded-2xl bg-gray-100 sm:h-36 sm:w-40">
                        {restaurant.cover_url ? (
                            <img src={restaurant.cover_url} alt="" className="size-full object-cover transition duration-300 group-hover:scale-105" />
                        ) : (
                            <div className="flex size-full items-center justify-center text-xs text-gray-400">Sin foto</div>
                        )}
                        <RestaurantHoursStatus hours={restaurant.hours} variant="badge" className="top-2.5 left-2.5 rounded-full px-2 py-0.5" />
                        {onToggleFavorite && (
                            <button
                                type="button"
                                title={favorited ? t('explore.unfavorite') : t('explore.favorite')}
                                disabled={favoriteBusy}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onToggleFavorite();
                                }}
                                className={cn(
                                    'absolute top-2.5 right-2.5 flex size-8 cursor-pointer items-center justify-center rounded-full bg-white/90 shadow-sm transition disabled:cursor-not-allowed',
                                    favorited ? 'text-red-500' : 'text-gray-400 hover:text-red-500',
                                )}
                            >
                                <Heart className={cn('size-4', favorited && 'fill-red-500')} />
                            </button>
                        )}
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col justify-center py-0.5 pr-1">
                        <div className="flex min-w-0 items-center gap-1.5">
                                <h3 className="truncate text-lg font-bold tracking-tight text-brand-blue">
                                    {restaurant.name}
                                </h3>
                                <BadgeCheck className="size-4 shrink-0 text-brand-blue" />
                                {onToggleFavorite && (
                                    <button
                                        type="button"
                                        title={favorited ? t('explore.unfavorite') : t('explore.favorite')}
                                        disabled={favoriteBusy}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            onToggleFavorite();
                                        }}
                                        className={cn(
                                            'hidden size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-gray-300 transition hover:bg-gray-50 sm:flex',
                                            favorited && 'text-red-500',
                                        )}
                                    >
                                        <Heart className={cn('size-4', favorited && 'fill-red-500')} />
                                    </button>
                                )}
                            </div>

                        {restaurant.hours && !restaurant.hours.is_open && restaurant.hours.label !== 'Horario no disponible' && (
                            <RestaurantHoursStatus hours={restaurant.hours} variant="inline" className="mt-1 text-xs" />
                        )}
                        {restaurant.hours?.is_open && restaurant.hours.closes_soon && (
                            <RestaurantHoursStatus hours={restaurant.hours} variant="inline" className="mt-1 text-xs" />
                        )}

                        {restaurant.cuisines.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                                {restaurant.cuisines.slice(0, 3).map((c) => (
                                    <span
                                        key={c.name}
                                        className="rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] font-semibold text-sky-700"
                                    >
                                        {c.name}
                                    </span>
                                ))}
                            </div>
                        )}

                        <div className="mt-2 flex flex-wrap items-center gap-x-2 text-sm text-gray-600">
                            <span className="inline-flex items-center gap-1 font-semibold text-gray-800">
                                <Star className="size-3.5 fill-amber-400 text-amber-400" />
                                {restaurant.avg_rating}
                                <span className="font-normal text-gray-400">({restaurant.total_reviews})</span>
                            </span>
                            <span className="hidden text-gray-300 sm:inline">|</span>
                            <span>
                                {pricePerPerson(restaurant.price_range, restaurant.avg_price_per_person)}{' '}
                                {t('explore.per_person')}
                            </span>
                            {restaurant.distance_km != null && (
                                <>
                                    <span className="hidden text-gray-300 sm:inline">|</span>
                                    <span className="inline-flex items-center gap-1">
                                        <MapPin className="size-3.5 text-brand-orange" />
                                        {formatDistanceKm(restaurant.distance_km)} km
                                    </span>
                                </>
                            )}
                        </div>

                        {restaurant.short_description && (
                            <p className="mt-1.5 line-clamp-1 text-sm text-gray-500">{restaurant.short_description}</p>
                        )}

                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                            {restaurant.party_types?.slice(0, 2).map((name) => (
                                <span
                                    key={name}
                                    className={cn(
                                        'rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                                        name.toLowerCase().includes('pareja')
                                            ? 'bg-pink-50 text-pink-700'
                                            : 'bg-emerald-50 text-emerald-700',
                                    )}
                                >
                                    {name}
                                </span>
                            ))}
                            {restaurant.ambiance && (
                                <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] font-semibold text-sky-700">
                                    {restaurant.ambiance}
                                </span>
                            )}
                            {restaurant.environments?.slice(0, 2).map((name) => (
                                <span key={name} className="rounded-full bg-violet-50 px-2.5 py-0.5 text-[11px] font-semibold text-violet-700">
                                    {name}
                                </span>
                            ))}
                        </div>
                    </div>
                </Link>
            </article>
        );
    }

    return (
        <article
            className={cn(
                'group relative flex gap-2.5 rounded-xl border bg-white p-2 shadow-sm transition-all',
                inRoute ? 'border-orange-200' : 'border-gray-100 hover:border-sky-200 hover:shadow-md',
            )}
        >
            <Link href={detailHref} className="flex min-w-0 flex-1 cursor-pointer gap-2.5">
                <div className="relative h-[6.25rem] w-[6.5rem] shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    {restaurant.cover_url ? (
                        <img src={restaurant.cover_url} alt="" className="size-full object-cover transition group-hover:scale-105" />
                    ) : (
                        <div className="flex size-full items-center justify-center text-[10px] text-gray-400">Sin foto</div>
                    )}
                    <RestaurantHoursStatus hours={restaurant.hours} variant="badge" className="top-1 left-1" />
                    {onToggleFavorite && (
                        <button
                            type="button"
                            title={favorited ? t('explore.unfavorite') : t('explore.favorite')}
                            disabled={favoriteBusy}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onToggleFavorite();
                            }}
                            className={cn(
                                'absolute top-1 right-1 flex size-6 cursor-pointer items-center justify-center rounded-full bg-white/90 shadow-sm transition disabled:cursor-not-allowed',
                                favorited ? 'text-brand-orange' : 'text-gray-400 hover:text-brand-orange',
                            )}
                        >
                            <Heart className={cn('size-3', favorited && 'fill-brand-orange')} />
                        </button>
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-1">
                        <h3 className="line-clamp-1 text-sm font-bold text-brand-blue group-hover:text-brand-orange">
                            {restaurant.name}
                        </h3>
                        <BadgeCheck className="mt-0.5 size-3.5 shrink-0 text-brand-blue" />
                    </div>
                    <RestaurantHoursStatus
                        hours={restaurant.hours}
                        variant="inline"
                        className="mt-0.5 text-[11px] font-semibold"
                    />
                    <div className="mt-0.5 flex flex-wrap gap-1">
                        {restaurant.cuisines.slice(0, 2).map((c) => (
                            <span key={c.name} className="text-[10px] font-medium text-sky-700">
                                {c.name}
                            </span>
                        ))}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-gray-500">
                        <span className="inline-flex items-center gap-0.5 font-semibold text-amber-700">
                            <Star className="size-3 fill-amber-400 text-amber-400" />
                            {restaurant.avg_rating}
                            <span className="font-normal text-gray-400">
                                ({restaurant.total_reviews})
                            </span>
                        </span>
                        <span>
                            {pricePerPerson(restaurant.price_range, restaurant.avg_price_per_person)}{' '}
                            {t('explore.per_person')}
                        </span>
                        {restaurant.distance_km != null && (
                            <span className="inline-flex items-center gap-0.5 font-medium text-gray-600">
                                <MapPin className="size-3 text-brand-orange" />
                                {formatDistanceKm(restaurant.distance_km)} km
                            </span>
                        )}
                    </div>
                    {detailed && restaurant.short_description && (
                        <p className="mt-1 line-clamp-2 text-xs leading-snug text-gray-500">{restaurant.short_description}</p>
                    )}
                    <div className="mt-1 flex flex-wrap gap-1">
                        {restaurant.party_types?.slice(0, 1).map((name) => (
                            <span key={name} className="rounded-full bg-emerald-50 px-1.5 py-px text-[9px] font-semibold text-emerald-700">
                                {name}
                            </span>
                        ))}
                        {restaurant.ambiance && (
                            <span className="rounded-full bg-sky-50 px-1.5 py-px text-[9px] font-semibold text-sky-700">
                                {restaurant.ambiance}
                            </span>
                        )}
                        {restaurant.environments?.slice(0, 1).map((name) => (
                            <span key={name} className="rounded-full bg-violet-50 px-1.5 py-px text-[9px] font-semibold text-violet-700">
                                {name}
                            </span>
                        ))}
                    </div>
                </div>
            </Link>

            {onToggleRoute && (
                <button
                    type="button"
                    title={
                        inRoute
                            ? t('explore.remove_from_route')
                            : canAddToRoute
                              ? t('explore.add_to_route')
                              : t('explore.closed_no_route')
                    }
                    disabled={isBusy || (!inRoute && !canAddToRoute)}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onToggleRoute();
                    }}
                    className={cn(
                        'mt-auto mb-0.5 flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md shadow-sm transition disabled:cursor-not-allowed',
                        inRoute
                            ? 'bg-white text-brand-orange ring-2 ring-orange-200 hover:bg-orange-50'
                            : canAddToRoute
                              ? 'bg-brand-orange text-white hover:brightness-105'
                              : 'cursor-not-allowed bg-gray-200 text-gray-400',
                        isBusy && 'opacity-60',
                    )}
                >
                    {inRoute ? <Minus className="size-4" /> : <Plus className="size-4" />}
                </button>
            )}
        </article>
    );
}
