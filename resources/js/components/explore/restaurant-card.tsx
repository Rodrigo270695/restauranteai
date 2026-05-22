import { Link } from '@inertiajs/react';
import { Clock, MapPin, Star } from 'lucide-react';
import { CuisineBadges, type CuisineBadge } from '@/components/explore/cuisine-badges';
import { show as restaurantShow } from '@/routes/explore/restaurants';

export type RestaurantCardData = {
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
    distance_km?: number | null;
    cuisines: CuisineBadge[];
};

const PRICE: Record<string, string> = {
    economico: '$',
    moderado: '$$',
    premium: '$$$',
};

export function RestaurantCard({ restaurant }: { restaurant: RestaurantCardData }) {
    return (
        <Link
            href={restaurantShow.url(restaurant.slug)}
            className="block overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
            <div className="relative aspect-[4/3] bg-gray-100">
                {restaurant.cover_url ? (
                    <img src={restaurant.cover_url} alt="" className="h-full w-full object-cover" />
                ) : (
                    <div className="flex h-full items-center justify-center text-gray-300">Sin foto</div>
                )}
                <span className="absolute left-2 top-2 rounded-full bg-green-600 px-2 py-0.5 text-[10px] font-bold text-white">
                    Abierto
                </span>
                <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-xs font-bold text-white">
                    <Star className="size-3 fill-amber-400 text-amber-400" />
                    {restaurant.avg_rating}
                </span>
            </div>
            <div className="p-3">
                <CuisineBadges cuisines={restaurant.cuisines} size="xs" />
                <h3 className="mt-2 font-bold text-gray-900">{restaurant.name}</h3>
                {restaurant.short_description && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{restaurant.short_description}</p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span className="font-semibold text-orange-700">{PRICE[restaurant.price_range] ?? restaurant.price_range}</span>
                    {restaurant.district && (
                        <span className="flex items-center gap-0.5">
                            <MapPin className="size-3" />
                            {restaurant.district}
                        </span>
                    )}
                    {restaurant.distance_km != null && (
                        <span className="flex items-center gap-0.5">
                            <Clock className="size-3" />
                            {restaurant.distance_km} km
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}
