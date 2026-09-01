import { Link } from '@inertiajs/react';
import { BadgeCheck, Heart, MapPin, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { RestaurantCardData } from '@/components/explore/restaurant-card';
import { PRICE_AVG_LIMITS, type PriceRangeValue } from '@/lib/restaurant-price';
import { cn } from '@/lib/utils';
import { show as restaurantShow } from '@/routes/explore/restaurants';

export type AiRecRestaurant = RestaurantCardData & {
    rank: number;
    is_favorited?: boolean;
};

type BadgeKind = 'for_you' | 'ideal' | 'new' | 'budget';

function overlayBadge(restaurant: AiRecRestaurant, filter: string): { kind: BadgeKind; className: string } {
    if (filter === 'budget' || restaurant.price_range === 'economico') {
        return { kind: 'budget', className: 'bg-amber-400 text-amber-950' };
    }
    if (filter === 'new' || restaurant.rank > 6) {
        return { kind: 'new', className: 'bg-emerald-500 text-white' };
    }
    if (restaurant.rank <= 2) {
        return { kind: 'for_you', className: 'bg-brand-blue text-white' };
    }

    return { kind: 'ideal', className: 'bg-brand-orange text-white' };
}

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

type Props = {
    restaurant: AiRecRestaurant;
    filter: string;
    requestId?: number | null;
    onToggleFavorite: () => void;
    favoriteBusy?: boolean;
};

export function AiRecommendationCard({
    restaurant,
    filter,
    requestId,
    onToggleFavorite,
    favoriteBusy = false,
}: Props) {
    const { t } = useTranslation();
    const badge = overlayBadge(restaurant, filter);
    const favorited = restaurant.is_favorited === true;
    const href = requestId
        ? restaurantShow.url(restaurant.slug, {
              query: { from_recommendation: '1', request_id: requestId },
          })
        : restaurantShow.url(restaurant.slug, { query: { from_recommendation: '1' } });

    return (
        <article className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md">
            <div className="relative aspect-[16/10] bg-gray-100">
                {restaurant.cover_url ? (
                    <img src={restaurant.cover_url} alt="" className="size-full object-cover" />
                ) : (
                    <div className="flex size-full items-center justify-center text-xs text-gray-400">Sin foto</div>
                )}
                <span className={cn('absolute top-2.5 left-2.5 rounded-full px-2.5 py-1 text-[10px] font-bold shadow-sm', badge.className)}>
                    {t(`explore.rec_badge_${badge.kind}`)}
                </span>
                <button
                    type="button"
                    disabled={favoriteBusy}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onToggleFavorite();
                    }}
                    className={cn(
                        'absolute top-2.5 right-2.5 flex size-8 cursor-pointer items-center justify-center rounded-full bg-white/95 shadow-sm',
                        favorited ? 'text-red-500' : 'text-gray-400 hover:text-red-500',
                    )}
                    aria-label={favorited ? t('explore.unfavorite') : t('explore.favorite')}
                >
                    <Heart className={cn('size-4', favorited && 'fill-red-500')} />
                </button>
            </div>
            <div className="p-3.5">
                <div className="flex items-start gap-1.5">
                    <h3 className="min-w-0 flex-1 truncate font-bold text-brand-blue">{restaurant.name}</h3>
                    <BadgeCheck className="mt-0.5 size-4 shrink-0 text-brand-blue" />
                </div>
                {restaurant.cuisines.length > 0 && (
                    <p className="mt-1 truncate text-xs font-medium text-sky-700">
                        {restaurant.cuisines.slice(0, 3).map((c) => c.name).join(' · ')}
                    </p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                        <Star className="size-3.5 fill-amber-400 text-amber-400" />
                        {restaurant.avg_rating}
                        {restaurant.total_reviews > 0 && (
                            <span className="font-medium text-gray-400">({restaurant.total_reviews})</span>
                        )}
                    </span>
                    <span>
                        {pricePerPerson(restaurant.price_range, restaurant.avg_price_per_person)} {t('explore.per_person')}
                    </span>
                </div>
                <p className="mt-1.5 inline-flex items-center gap-1 text-xs text-gray-500">
                    <MapPin className="size-3.5 text-brand-orange" />
                    {restaurant.distance_km != null ? `${restaurant.distance_km} km` : '—'}
                    {restaurant.district ? ` · ${restaurant.district}` : ''}
                </p>
                <Link
                    href={href}
                    className="mt-3 inline-flex h-9 w-full cursor-pointer items-center justify-center rounded-xl border border-brand-blue/20 text-sm font-semibold text-brand-blue transition hover:bg-brand-blue hover:text-white"
                >
                    {t('explore.view_place')}
                </Link>
            </div>
        </article>
    );
}
