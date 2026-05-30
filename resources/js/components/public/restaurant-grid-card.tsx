import { Link, usePage } from '@inertiajs/react';
import { ChevronRight, MapPin, Navigation, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { show as exploreRestaurantShow } from '@/routes/explore/restaurants';
import type { RestaurantCardData } from '@/components/explore/restaurant-card';
import { RestaurantHoursStatus } from '@/components/explore/restaurant-hours-status';
import { formatAvgPriceSoles, priceRangeLabel } from '@/lib/restaurant-price';

export function RestaurantGridCard({ restaurant }: { restaurant: RestaurantCardData & { is_featured?: boolean } }) {
    const { t } = useTranslation();
    const { auth } = usePage().props as { auth?: { roles?: string[] } };
    const isTourist = auth?.roles?.includes('tourist');

    const primaryCuisine = restaurant.cuisines.find(c => c.is_primary)?.name ?? restaurant.cuisines[0]?.name;
    const tierLabel = restaurant.price_range_label ?? priceRangeLabel(restaurant.price_range);
    const avgPrice = formatAvgPriceSoles(restaurant.avg_price_per_person);
    const detailHref = isTourist
        ? exploreRestaurantShow.url(restaurant.slug)
        : `/restaurantes/${restaurant.slug}`;

    return (
        <article className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl">
            <Link href={detailHref} className="relative block aspect-[5/4] overflow-hidden bg-gray-100">
                {restaurant.cover_url ? (
                    <img
                        src={restaurant.cover_url}
                        alt={restaurant.name}
                        className="size-full object-cover transition duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex size-full items-center justify-center bg-gradient-to-br from-orange-50 to-gray-100 text-sm text-gray-400">
                        {t('welcome.browse_no_photo')}
                    </div>
                )}

                <span className="absolute right-3 top-3 flex flex-col items-end rounded-lg bg-white/95 px-2.5 py-1 text-right shadow-sm backdrop-blur-sm">
                    {avgPrice && (
                        <span className="text-sm font-extrabold text-brand-orange">{avgPrice}</span>
                    )}
                    <span className="text-[10px] font-semibold text-gray-600">{tierLabel}</span>
                </span>

                {primaryCuisine && (
                    <span className="absolute bottom-3 left-3 rounded-lg bg-brand-orange px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-md">
                        {primaryCuisine}
                    </span>
                )}

                {restaurant.is_featured && (
                    <span className="absolute left-3 top-3 rounded-lg bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-amber-950">
                        {t('welcome.browse_featured')}
                    </span>
                )}

                <RestaurantHoursStatus hours={restaurant.hours} variant="badge" className="left-auto right-3 top-auto bottom-3" />
            </Link>

            <div className="flex flex-1 flex-col p-4">
                {primaryCuisine && (
                    <p className="text-[10px] font-bold uppercase tracking-wider text-brand-orange">
                        {primaryCuisine}
                    </p>
                )}

                <div className="mt-1 flex items-start justify-between gap-2">
                    <Link href={detailHref} className="min-w-0 flex-1">
                        <h3 className="line-clamp-1 text-lg font-bold text-gray-900 transition group-hover:text-brand-orange">
                            {restaurant.name}
                        </h3>
                    </Link>
                    <span className="flex shrink-0 items-center gap-1 rounded-lg bg-amber-50 px-2 py-0.5 text-sm font-bold text-amber-800">
                        <Star className="size-3.5 fill-amber-500 text-amber-500" />
                        {restaurant.avg_rating}
                    </span>
                </div>

                {restaurant.short_description && (
                    <p className="mt-1 line-clamp-2 text-sm leading-snug text-gray-500">
                        {restaurant.short_description}
                    </p>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                    <span className="flex min-w-0 items-center gap-1.5">
                        <MapPin className="size-3.5 shrink-0 text-brand-orange" />
                        <span className="truncate">
                            {restaurant.district ? `${restaurant.district}, Chiclayo` : 'Chiclayo, Lambayeque'}
                        </span>
                    </span>
                    {restaurant.distance_km != null && (
                        <span className="flex shrink-0 items-center gap-1 font-semibold text-emerald-700">
                            <Navigation className="size-3.5" />
                            {t('welcome.browse_distance_km', { km: restaurant.distance_km })}
                        </span>
                    )}
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-gray-50 pt-3">
                    <div className="text-xs text-gray-500">
                        {avgPrice ? (
                            <span className="font-semibold text-gray-700">
                                {t('welcome.browse_avg_price', { price: avgPrice })}
                            </span>
                        ) : (
                            <span className="text-gray-400">{tierLabel}</span>
                        )}
                        {restaurant.total_reviews > 0 && (
                            <span className="mt-0.5 block text-gray-400">
                                {t('welcome.browse_reviews', { count: restaurant.total_reviews })}
                            </span>
                        )}
                        {restaurant.total_reviews === 0 && (
                            <span className="mt-0.5 block text-gray-400">{t('welcome.browse_new_listing')}</span>
                        )}
                    </div>
                    <Link
                        href={detailHref}
                        className="flex items-center gap-0.5 text-sm font-semibold text-brand-orange transition hover:gap-1"
                    >
                        {t('welcome.browse_view_detail')}
                        <ChevronRight className="size-4" />
                    </Link>
                </div>
            </div>
        </article>
    );
}
