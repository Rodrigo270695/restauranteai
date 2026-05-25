import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, MapPin, Navigation, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CuisineBadges } from '@/components/explore/cuisine-badges';
import { RestaurantMenu, type RestaurantMenuData } from '@/components/explore/restaurant-menu';
import { Button } from '@/components/ui/button';
import { formatAvgPriceSoles, priceRangeLabel } from '@/lib/restaurant-price';
import { home } from '@/routes';
import { register } from '@/routes';

type Props = {
    restaurant: {
        name: string;
        slug: string;
        description?: string | null;
        short_description?: string | null;
        address?: string | null;
        price_range: string;
        price_range_label?: string | null;
        avg_price_per_person?: number | null;
        avg_rating: number;
        total_reviews: number;
        phone?: string | null;
        district?: string | null;
        latitude?: number | null;
        longitude?: number | null;
        cuisines: Array<{ name: string; is_primary?: boolean }>;
        images: Array<{ url: string | null; alt?: string | null }>;
        menu: RestaurantMenuData;
    };
};

export default function PublicRestaurantShow({ restaurant }: Props) {
    const { t } = useTranslation();
    const avgPrice = formatAvgPriceSoles(restaurant.avg_price_per_person);
    const tierLabel = restaurant.price_range_label ?? priceRangeLabel(restaurant.price_range);
    const mapsUrl =
        restaurant.latitude && restaurant.longitude
            ? `https://www.google.com/maps/dir/?api=1&destination=${restaurant.latitude},${restaurant.longitude}`
            : null;

    return (
        <>
            <Head title={restaurant.name} />
            <div className="bg-[#FFF8F2] pb-16 pt-24">
                <div className="mx-auto max-w-4xl px-4">
                    <Link
                        href={`${home.url()}#restaurantes`}
                        className="mb-6 inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-100 hover:bg-orange-50"
                    >
                        <ArrowLeft className="size-4" />
                        {t('welcome.browse_back')}
                    </Link>

                    <div className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-orange-100">
                        <div className="aspect-[21/9] bg-gray-100">
                            {restaurant.images[0]?.url ? (
                                <img
                                    src={restaurant.images[0].url}
                                    alt=""
                                    className="size-full object-cover"
                                />
                            ) : (
                                <div className="flex size-full items-center justify-center text-gray-400">
                                    Sin imagen
                                </div>
                            )}
                        </div>

                        <div className="p-6 lg:p-8">
                            <CuisineBadges cuisines={restaurant.cuisines} />
                            <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
                                <h1 className="text-3xl font-extrabold text-gray-900">{restaurant.name}</h1>
                                <span className="flex items-center gap-1 rounded-xl bg-amber-50 px-3 py-1.5 text-lg font-bold text-amber-800">
                                    <Star className="size-5 fill-amber-500 text-amber-500" />
                                    {restaurant.avg_rating}
                                    <span className="text-sm font-normal text-gray-500">
                                        ({restaurant.total_reviews})
                                    </span>
                                </span>
                            </div>

                            <div className="mt-3 flex flex-wrap items-center gap-3">
                                {avgPrice && (
                                    <span className="rounded-xl bg-red-50 px-3 py-1.5 text-base font-extrabold text-[#E8001A]">
                                        {t('welcome.browse_avg_price', { price: avgPrice })}
                                    </span>
                                )}
                                <span className="rounded-xl bg-gray-100 px-3 py-1.5 text-sm font-semibold text-gray-700">
                                    {tierLabel}
                                </span>
                            </div>

                            {restaurant.district && (
                                <p className="mt-2 flex items-center gap-2 text-gray-600">
                                    <MapPin className="size-4 text-[#E8001A]" />
                                    {restaurant.address ?? restaurant.district}
                                </p>
                            )}

                            <p className="mt-4 text-gray-600 leading-relaxed">
                                {restaurant.description ?? restaurant.short_description}
                            </p>

                            <RestaurantMenu menu={restaurant.menu} className="mt-8" />

                            <div className="mt-8 flex flex-wrap gap-3">
                                {mapsUrl && (
                                    <Button className="rounded-xl bg-[#E8001A] text-white" asChild>
                                        <a href={mapsUrl} target="_blank" rel="noreferrer">
                                            <Navigation className="mr-2 size-4" />
                                            {t('explore.how_to_get')}
                                        </a>
                                    </Button>
                                )}
                                <Button variant="outline" className="rounded-xl" asChild>
                                    <Link href={register()}>{t('welcome.cta_register')}</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
