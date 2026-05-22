import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, MapPin, Navigation, Plus, Star, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CuisineBadges } from '@/components/explore/cuisine-badges';
import { Button } from '@/components/ui/button';
import TouristExploreLayout from '@/layouts/tourist-explore-layout';
import { index as exploreDiscover } from '@/routes/explore';

type Props = {
    restaurant: {
        id: number;
        name: string;
        slug: string;
        description?: string | null;
        short_description?: string | null;
        address?: string | null;
        price_range: string;
        avg_rating: number;
        total_reviews: number;
        district?: string | null;
        latitude?: number | null;
        longitude?: number | null;
        cuisines: Array<{ name: string; is_primary?: boolean }>;
        images: Array<{ url: string | null; alt?: string | null }>;
        dishes: Array<{ name: string; price: number; category?: string | null }>;
    };
    inRoute: boolean;
    draftStopsCount: number;
};

function RestaurantShow({ restaurant, inRoute, draftStopsCount }: Props) {
    const { t } = useTranslation();
    const mapsUrl =
        restaurant.latitude && restaurant.longitude
            ? `https://www.google.com/maps/dir/?api=1&destination=${restaurant.latitude},${restaurant.longitude}`
            : null;

    return (
        <>
            <Head title={restaurant.name} />
            <div className="pb-24">
                <div className="flex items-center gap-2 border-b border-orange-100 bg-white px-4 py-3">
                    <button type="button" onClick={() => router.visit(exploreDiscover.url())} className="rounded-full p-2 hover:bg-gray-50">
                        <ArrowLeft className="size-5" />
                    </button>
                    <h1 className="flex-1 truncate text-lg font-bold">{restaurant.name}</h1>
                </div>

                <div className="aspect-video bg-gray-100">
                    {restaurant.images[0]?.url ? (
                        <img src={restaurant.images[0].url} alt="" className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full items-center justify-center text-gray-400">Sin imagen</div>
                    )}
                </div>

                <div className="space-y-4 p-4">
                    <CuisineBadges cuisines={restaurant.cuisines} />
                    <div className="flex items-center gap-2 text-sm">
                        <Star className="size-4 fill-amber-400 text-amber-400" />
                        <span className="font-bold">{restaurant.avg_rating}</span>
                        <span className="text-gray-500">({restaurant.total_reviews} reseñas)</span>
                    </div>
                    {restaurant.district && (
                        <p className="flex items-center gap-1 text-sm text-gray-600">
                            <MapPin className="size-4 text-[#E8001A]" />
                            {restaurant.address ?? restaurant.district}
                        </p>
                    )}
                    <p className="text-sm text-gray-600">{restaurant.description ?? restaurant.short_description}</p>

                    {restaurant.dishes.length > 0 && (
                        <div>
                            <h2 className="mb-2 text-sm font-bold">{t('explore.signature_dishes')}</h2>
                            <ul className="space-y-2">
                                {restaurant.dishes.map(d => (
                                    <li key={d.name} className="flex justify-between rounded-xl bg-orange-50/50 px-3 py-2 text-sm">
                                        <span>
                                            {d.name}
                                            {d.category && <span className="ml-1 text-xs text-gray-400">· {d.category}</span>}
                                        </span>
                                        <span className="font-semibold">S/ {d.price.toFixed(2)}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <div className="fixed bottom-20 left-0 right-0 border-t border-orange-100 bg-white p-4 md:bottom-0">
                    <div className="mx-auto flex max-w-lg gap-2">
                        {mapsUrl && (
                            <Button variant="outline" className="rounded-xl" asChild>
                                <a href={mapsUrl} target="_blank" rel="noreferrer">
                                    <Navigation className="mr-1 size-4" />
                                    {t('explore.how_to_get')}
                                </a>
                            </Button>
                        )}
                        {inRoute ? (
                            <Button
                                variant="outline"
                                className="flex-1 rounded-xl border-red-200 text-red-600"
                                onClick={() => router.delete(`/explore/routes/stops/${restaurant.slug}`)}
                            >
                                <Trash2 className="mr-1 size-4" />
                                {t('explore.remove_from_route')}
                            </Button>
                        ) : (
                            <Button
                                className="flex-1 rounded-xl bg-[#E8001A] text-white"
                                onClick={() =>
                                    router.post(`/explore/routes/stops/${restaurant.slug}`, {}, { preserveScroll: true })
                                }
                            >
                                <Plus className="mr-1 size-4" />
                                {t('explore.add_to_route')}
                                {draftStopsCount > 0 && ` (${draftStopsCount})`}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

RestaurantShow.layout = (page: React.ReactNode) => <TouristExploreLayout>{page}</TouristExploreLayout>;

export default RestaurantShow;
