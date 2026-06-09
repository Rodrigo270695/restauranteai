import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Heart, MapPin, Navigation, Plus, Star, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RestaurantReviewModal } from '@/components/explore/restaurant-review-modal';
import { RouteStopReservation, type RouteReservation } from '@/components/explore/route-stop-reservation';
import { CuisineBadges } from '@/components/explore/cuisine-badges';
import { RestaurantHoursStatus, type RestaurantHoursData } from '@/components/explore/restaurant-hours-status';
import { RestaurantMenu, type RestaurantMenuData } from '@/components/explore/restaurant-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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
        menu: RestaurantMenuData;
        hours?: RestaurantHoursData | null;
    };
    inRoute: boolean;
    draftStopsCount: number;
    isFavorited: boolean;
    canReview: boolean;
    hasReview: boolean;
    routeContext: {
        route_slug: string;
        reservation: RouteReservation | null;
    } | null;
};

function RestaurantShow({
    restaurant,
    inRoute,
    draftStopsCount,
    isFavorited: initialFavorited,
    canReview,
    hasReview,
    routeContext,
}: Props) {
    const { t } = useTranslation();
    const [favorited, setFavorited] = useState(initialFavorited);
    const [reviewOpen, setReviewOpen] = useState(false);
    const interactionsUrl = `/explore/restaurants/${restaurant.slug}/interactions`;

    const mapsUrl =
        restaurant.latitude && restaurant.longitude
            ? `https://www.google.com/maps/dir/?api=1&destination=${restaurant.latitude},${restaurant.longitude}`
            : null;

    const toggleFavorite = () => {
        const next = !favorited;
        setFavorited(next);
        router.post(
            interactionsUrl,
            { interaction_type: next ? 'save' : 'unsave' },
            {
                preserveScroll: true,
                onError: () => setFavorited(!next),
            },
        );
    };

    const openMaps = () => {
        if (!mapsUrl) {
            return;
        }
        router.post(interactionsUrl, { interaction_type: 'click' }, { preserveScroll: true });
        window.open(mapsUrl, '_blank', 'noopener,noreferrer');
    };

    return (
        <>
            <Head title={restaurant.name} />
            <div className="pb-24">
                <div className="flex items-center gap-2 border-b border-orange-100 bg-white px-4 py-3">
                    <button
                        type="button"
                        onClick={() => router.visit(exploreDiscover.url())}
                        className="rounded-full p-2 hover:bg-gray-50"
                    >
                        <ArrowLeft className="size-5" />
                    </button>
                    <h1 className="flex-1 truncate text-lg font-bold">{restaurant.name}</h1>
                    <button
                        type="button"
                        onClick={toggleFavorite}
                        className="rounded-full p-2 hover:bg-orange-50"
                        aria-label={favorited ? t('explore.unfavorite') : t('explore.favorite')}
                    >
                        <Heart
                            className={cn(
                                'size-5',
                                favorited ? 'fill-brand-orange text-brand-orange' : 'text-gray-400',
                            )}
                        />
                    </button>
                </div>

                <div className="aspect-video bg-gray-100">
                    {restaurant.images[0]?.url ? (
                        <img src={restaurant.images[0].url} alt="" className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full items-center justify-center text-gray-400">
                            {t('explore.menu_no_image')}
                        </div>
                    )}
                </div>

                <div className="space-y-5 p-4">
                    <CuisineBadges cuisines={restaurant.cuisines} />
                    <div className="flex items-center gap-2 text-sm">
                        <Star className="size-4 fill-amber-400 text-amber-400" />
                        <span className="font-bold">{restaurant.avg_rating}</span>
                        <span className="text-gray-500">
                            ({restaurant.total_reviews} {t('explore.menu_reviews')})
                        </span>
                    </div>
                    <RestaurantHoursStatus hours={restaurant.hours} variant="inline" />
                    {restaurant.district && (
                        <p className="flex items-center gap-1 text-sm text-gray-600">
                            <MapPin className="size-4 text-brand-orange" />
                            {restaurant.address ?? restaurant.district}
                        </p>
                    )}
                    <p className="text-sm leading-relaxed text-gray-600">
                        {restaurant.description ?? restaurant.short_description}
                    </p>

                    <RestaurantMenu menu={restaurant.menu} />

                    {routeContext && (
                        <RouteStopReservation
                            routeSlug={routeContext.route_slug}
                            restaurantSlug={restaurant.slug}
                            reservation={routeContext.reservation}
                            onReviewClick={() => setReviewOpen(true)}
                            onMarkedVisited={() => setReviewOpen(true)}
                        />
                    )}

                    {hasReview && (
                        <p className="rounded-xl bg-green-50 px-3 py-2 text-sm text-green-800">
                            {t('explore.review_thanks')}
                        </p>
                    )}

                    {canReview && (
                        <Button
                            type="button"
                            className="w-full cursor-pointer rounded-xl bg-brand-orange text-white shadow-sm"
                            onClick={() => setReviewOpen(true)}
                        >
                            <Star className="mr-2 size-4 fill-white" />
                            {t('explore.review_write')}
                        </Button>
                    )}

                    <RestaurantReviewModal
                        open={reviewOpen}
                        onOpenChange={setReviewOpen}
                        restaurantSlug={restaurant.slug}
                        restaurantName={restaurant.name}
                    />

                    {inRoute && !routeContext?.reservation && !canReview && !hasReview && (
                        <p className="text-xs text-gray-500">{t('explore.review_requires_visit')}</p>
                    )}
                </div>

                <div className="fixed bottom-20 left-0 right-0 border-t border-orange-100 bg-white p-4 md:bottom-0">
                    <div className="mx-auto flex max-w-lg gap-2">
                        {mapsUrl && (
                            <Button
                                type="button"
                                variant="outline"
                                className="rounded-xl"
                                onClick={openMaps}
                            >
                                <Navigation className="mr-1 size-4" />
                                {t('explore.how_to_get')}
                            </Button>
                        )}
                        {inRoute ? (
                            <Button
                                variant="outline"
                                className="flex-1 rounded-xl border-orange-200 text-brand-orange-dark"
                                onClick={() => router.delete(`/explore/routes/stops/${restaurant.slug}`)}
                            >
                                <Trash2 className="mr-1 size-4" />
                                {t('explore.remove_from_route')}
                            </Button>
                        ) : (
                            <Button
                                className="flex-1 rounded-xl bg-brand-orange text-white disabled:bg-gray-300 disabled:text-gray-500"
                                disabled={
                                    restaurant.hours != null
                                    && restaurant.hours.label !== 'Horario no disponible'
                                    && !restaurant.hours.is_open
                                }
                                title={
                                    restaurant.hours
                                    && restaurant.hours.label !== 'Horario no disponible'
                                    && !restaurant.hours.is_open
                                        ? t('explore.closed_no_route')
                                        : undefined
                                }
                                onClick={() =>
                                    router.post(`/explore/routes/stops/${restaurant.slug}`, {}, { preserveScroll: true })
                                }
                            >
                                <Plus className="mr-1 size-4" />
                                {restaurant.hours
                                && restaurant.hours.label !== 'Horario no disponible'
                                && !restaurant.hours.is_open
                                    ? t('explore.closed_no_route_short')
                                    : t('explore.add_to_route')}
                                {draftStopsCount > 0
                                && (!restaurant.hours
                                    || restaurant.hours.is_open
                                    || restaurant.hours.label === 'Horario no disponible')
                                    && ` (${draftStopsCount})`}
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
