import { Link } from '@inertiajs/react';
import { Clock3, Footprints, GitFork, Heart, MapPin, Trash2, UtensilsCrossed } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FavoriteMiniMap } from '@/components/explore/favorite-mini-map';
import { cn } from '@/lib/utils';
import { formatPeruDateOnly, peruLocale } from '@/lib/peru-datetime';
import { show as restaurantShow } from '@/routes/explore/restaurants';
import { show as routeShow } from '@/routes/explore/routes';

const ACCENTS = [
    { badge: 'bg-violet-600', btn: 'border-violet-200 text-violet-700 hover:bg-violet-50', accent: '#7c3aed', tag: 'bg-violet-50 text-violet-700' },
    { badge: 'bg-brand-orange', btn: 'border-orange-200 text-brand-orange hover:bg-orange-50', accent: '#FF8C00', tag: 'bg-orange-50 text-brand-orange' },
    { badge: 'bg-emerald-600', btn: 'border-emerald-200 text-emerald-700 hover:bg-emerald-50', accent: '#059669', tag: 'bg-emerald-50 text-emerald-700' },
] as const;

export type FavoriteRouteCardData = {
    id: number;
    name: string;
    slug: string;
    description?: string | null;
    stops_count: number;
    total_distance_km: number | null;
    estimated_minutes: number | null;
    generated_by_ai?: boolean;
    saved_at?: string | null;
    cover_urls: string[];
    cuisine_tags: string[];
    path_coordinates: [number, number][];
    numbered_stops: Array<{ position: number; lat: number; lng: number; name: string }>;
};

export function FavoriteRouteCard({
    route,
    index,
    onUnfavorite,
}: {
    route: FavoriteRouteCardData;
    index: number;
    onUnfavorite: () => void;
}) {
    const { t, i18n } = useTranslation();
    const theme = ACCENTS[index % ACCENTS.length];
    const covers = route.cover_urls.slice(0, 4);

    return (
        <article className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm md:flex-row">
            <div className="relative h-40 w-full shrink-0 md:h-auto md:w-44">
                <div className={cn('grid size-full gap-0.5 bg-gray-100', covers.length > 1 ? 'grid-cols-2 grid-rows-2' : 'grid-cols-1')}>
                    {(covers.length > 0 ? covers : [null]).map((url, i) => (
                        <div key={i} className="min-h-0 overflow-hidden bg-gray-200">
                            {url ? (
                                <img src={url} alt="" className="size-full object-cover" />
                            ) : (
                                <div className="flex size-full items-center justify-center text-[10px] text-gray-400">Sin foto</div>
                            )}
                        </div>
                    ))}
                </div>
                <span className={cn('absolute top-2 left-2 rounded-md px-2 py-0.5 text-[10px] font-bold text-white', theme.badge)}>
                    {t('explore.places_count', { count: route.stops_count })}
                </span>
                <button
                    type="button"
                    onClick={onUnfavorite}
                    className="absolute top-2 right-2 flex size-8 cursor-pointer items-center justify-center rounded-full bg-white shadow-sm"
                    aria-label={t('explore.unfavorite')}
                >
                    <Heart className="size-4 fill-red-500 text-red-500" />
                </button>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
                <div className="flex items-start gap-2">
                    <GitFork className="mt-0.5 size-4 shrink-0 text-violet-500" />
                    <div className="min-w-0">
                        <h3 className="line-clamp-1 text-base font-bold text-brand-blue">{route.name}</h3>
                        {route.description && (
                            <p className="mt-0.5 line-clamp-2 text-sm text-gray-500">{route.description}</p>
                        )}
                    </div>
                </div>
                <div className="flex flex-wrap gap-3 text-xs font-medium text-gray-600">
                    <span className="inline-flex items-center gap-1">
                        <UtensilsCrossed className="size-3.5 text-brand-orange" />
                        {route.stops_count}
                    </span>
                    {route.total_distance_km != null && (
                        <span className="inline-flex items-center gap-1">
                            <MapPin className="size-3.5 text-sky-500" />
                            {route.total_distance_km} km
                        </span>
                    )}
                    {route.estimated_minutes != null && (
                        <span className="inline-flex items-center gap-1">
                            <Footprints className="size-3.5 text-emerald-600" />
                            ~{route.estimated_minutes} min
                        </span>
                    )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {route.cuisine_tags.slice(0, 3).map((tag) => (
                        <span key={tag} className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', theme.tag)}>
                            {tag}
                        </span>
                    ))}
                    {route.generated_by_ai && (
                        <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                            IA
                        </span>
                    )}
                </div>
                {route.saved_at && (
                    <p className="text-[11px] text-gray-400">
                        {t('explore.saved_on', { date: formatPeruDateOnly(route.saved_at, peruLocale(i18n.language)) })}
                    </p>
                )}
            </div>

            <div className="hidden w-36 shrink-0 overflow-hidden border-l border-gray-50 lg:block">
                <FavoriteMiniMap
                    path={route.path_coordinates}
                    stops={route.numbered_stops}
                    accent={theme.accent}
                />
            </div>

            <div className="flex shrink-0 items-center gap-2 border-t border-gray-50 p-3 md:flex-col md:justify-center md:border-t-0 md:border-l md:px-4">
                <Link
                    href={routeShow.url(route.slug)}
                    className={cn('inline-flex h-9 items-center justify-center rounded-xl border px-3 text-xs font-semibold', theme.btn)}
                >
                    {t('explore.routes_view')}
                </Link>
                <button
                    type="button"
                    className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-red-100 px-3 text-xs font-semibold text-red-600 hover:bg-red-50"
                    onClick={onUnfavorite}
                >
                    <Trash2 className="size-3.5" />
                    {t('explore.delete_route')}
                </button>
            </div>
        </article>
    );
}

export type FavoriteRestaurantCardData = {
    id: number;
    name: string;
    slug: string;
    cover_url?: string | null;
    cuisines: Array<{ name: string }>;
    avg_rating: number;
    total_reviews: number;
    price_range_label?: string | null;
    district?: string | null;
    saved_at?: string | null;
    hours?: { is_open: boolean; label: string } | null;
};

export function FavoriteRestaurantCard({
    restaurant,
    onUnfavorite,
}: {
    restaurant: FavoriteRestaurantCardData;
    onUnfavorite: () => void;
}) {
    const { t, i18n } = useTranslation();

    return (
        <article className="flex overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="relative h-32 w-36 shrink-0 bg-gray-100 md:h-auto md:w-44">
                {restaurant.cover_url ? (
                    <img src={restaurant.cover_url} alt="" className="size-full object-cover" />
                ) : (
                    <div className="flex size-full items-center justify-center text-xs text-gray-400">Sin foto</div>
                )}
                <button
                    type="button"
                    onClick={onUnfavorite}
                    className="absolute top-2 right-2 flex size-8 cursor-pointer items-center justify-center rounded-full bg-white shadow-sm"
                    aria-label={t('explore.unfavorite')}
                >
                    <Heart className="size-4 fill-red-500 text-red-500" />
                </button>
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 p-4">
                <h3 className="line-clamp-1 text-base font-bold text-brand-blue">{restaurant.name}</h3>
                <p className="text-sm text-sky-700">{restaurant.cuisines.map((c) => c.name).join(' · ')}</p>
                <p className="text-xs text-gray-500">
                    ★ {restaurant.avg_rating} ({restaurant.total_reviews})
                    {restaurant.district ? ` · ${restaurant.district}` : ''}
                </p>
                {restaurant.hours?.label && restaurant.hours.label !== 'Horario no disponible' && (
                    <p className={cn('text-xs font-semibold', restaurant.hours.is_open ? 'text-emerald-700' : 'text-gray-500')}>
                        <Clock3 className="mr-1 inline size-3" />
                        {restaurant.hours.label}
                    </p>
                )}
                {restaurant.saved_at && (
                    <p className="text-[11px] text-gray-400">
                        {t('explore.saved_on', {
                            date: formatPeruDateOnly(restaurant.saved_at.slice(0, 10), peruLocale(i18n.language)),
                        })}
                    </p>
                )}
            </div>
            <div className="flex items-center p-3">
                <Link
                    href={restaurantShow.url(restaurant.slug)}
                    className="inline-flex h-9 items-center rounded-xl border border-brand-blue/20 px-3 text-xs font-semibold text-brand-blue hover:bg-sky-50"
                >
                    {t('explore.view_place')}
                </Link>
            </div>
        </article>
    );
}
