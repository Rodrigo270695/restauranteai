import { Link } from '@inertiajs/react';
import { Clock, Heart, MapPin, Minus, Plus, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CuisineBadges, type CuisineBadge } from '@/components/explore/cuisine-badges';
import type { RestaurantHoursData } from '@/components/explore/restaurant-hours-status';
import { cn } from '@/lib/utils';
import { show as restaurantShow } from '@/routes/explore/restaurants';

export type RestaurantListItemData = {
    id: number;
    name: string;
    slug: string;
    short_description?: string | null;
    price_range: string;
    avg_rating: number;
    total_reviews: number;
    cover_url?: string | null;
    district?: string | null;
    distance_km?: number | null;
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
};

export function RestaurantListItem({
    restaurant,
    routePosition = null,
    routeTotal = 0,
    isBusy = false,
    onToggleRoute,
    onToggleFavorite,
    favoriteBusy = false,
}: Props) {
    const { t } = useTranslation();
    const inRoute = routePosition != null && routePosition > 0;
    const canAddToRoute =
        !restaurant.hours
        || restaurant.hours.label === 'Horario no disponible'
        || restaurant.hours.is_open;
    const isStart = routePosition === 1;
    const isEnd = routeTotal > 1 && routePosition === routeTotal;
    const favorited = restaurant.is_favorited === true;

    return (
        <article
            className={cn(
                'group relative flex gap-3 rounded-2xl border bg-white p-3 shadow-sm transition-all',
                inRoute ? 'border-orange-200 bg-orange-50/40 ring-1 ring-orange-100' : 'border-gray-100 hover:border-orange-200 hover:shadow-md',
            )}
        >
            {inRoute && (
                <div
                    className={cn(
                        'flex w-11 shrink-0 flex-col items-center justify-center rounded-xl text-center',
                        isStart && 'bg-green-600 text-white',
                        isEnd && !isStart && 'bg-brand-orange text-white',
                        !isStart && !isEnd && 'bg-amber-500 text-white',
                    )}
                >
                    <span className="text-lg font-black leading-none">{routePosition}</span>
                    <span className="mt-0.5 text-[8px] font-bold uppercase leading-tight">
                        {isStart ? t('explore.route_start_short') : isEnd ? t('explore.route_end_short') : t('explore.route_stop_short')}
                    </span>
                </div>
            )}

            <Link href={restaurantShow.url(restaurant.slug)} className="flex min-w-0 flex-1 gap-3">
                <div className="relative size-[4.5rem] shrink-0 overflow-hidden rounded-xl bg-gray-100">
                    {restaurant.cover_url ? (
                        <img src={restaurant.cover_url} alt="" className="size-full object-cover transition group-hover:scale-105" />
                    ) : (
                        <div className="flex size-full items-center justify-center text-[10px] text-gray-400">Sin foto</div>
                    )}
                    <span className="absolute bottom-1 right-1 flex items-center gap-0.5 rounded-md bg-black/65 px-1 py-0.5 text-[10px] font-bold text-white">
                        <Star className="size-2.5 fill-amber-400 text-amber-400" />
                        {restaurant.avg_rating}
                    </span>
                </div>

                <div className="min-w-0 flex-1 py-0.5">
                    <CuisineBadges cuisines={restaurant.cuisines} size="xs" />
                    <h3 className="mt-1 line-clamp-1 text-sm font-bold text-gray-900 group-hover:text-brand-orange">
                        {restaurant.name}
                    </h3>
                    {restaurant.short_description && (
                        <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-gray-500">{restaurant.short_description}</p>
                    )}
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-gray-500">
                        {restaurant.district && (
                            <span className="flex items-center gap-0.5">
                                <MapPin className="size-3 shrink-0 text-brand-orange/70" />
                                <span className="truncate">{restaurant.district}</span>
                            </span>
                        )}
                        {restaurant.distance_km != null && (
                            <span className="flex items-center gap-0.5">
                                <Clock className="size-3" />
                                {restaurant.distance_km} km
                            </span>
                        )}
                        {restaurant.hours && !canAddToRoute && (
                            <span className="font-semibold text-red-600">
                                {restaurant.hours.label}
                            </span>
                        )}
                    </div>
                </div>
            </Link>

            <div className="flex shrink-0 flex-col items-center justify-center gap-1.5 self-center">
                {onToggleFavorite && (
                    <button
                        type="button"
                        title={favorited ? t('explore.unfavorite') : t('explore.favorite')}
                        disabled={favoriteBusy}
                        onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            onToggleFavorite();
                        }}
                        className={cn(
                            'flex size-9 cursor-pointer items-center justify-center rounded-xl ring-1 transition',
                            favorited
                                ? 'bg-orange-50 text-brand-orange ring-orange-200'
                                : 'bg-white text-gray-400 ring-gray-200 hover:bg-orange-50 hover:text-brand-orange',
                            favoriteBusy && 'opacity-60',
                        )}
                    >
                        <Heart className={cn('size-4', favorited && 'fill-brand-orange')} />
                    </button>
                )}
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
                        onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            onToggleRoute();
                        }}
                        className={cn(
                            'flex size-9 cursor-pointer items-center justify-center rounded-xl shadow-md transition',
                            inRoute
                                ? 'bg-white text-brand-orange-dark ring-2 ring-orange-200 hover:bg-orange-50'
                                : canAddToRoute
                                  ? 'bg-brand-orange text-white hover:scale-105 active:scale-95'
                                  : 'cursor-not-allowed bg-gray-200 text-gray-400',
                            isBusy && 'opacity-60',
                        )}
                    >
                        {inRoute ? <Minus className="size-4" /> : <Plus className="size-4" />}
                    </button>
                )}
            </div>
        </article>
    );
}
