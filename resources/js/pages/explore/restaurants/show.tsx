import { Head, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Heart,
    MapPin,
    Navigation,
    Plus,
    Star,
    Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RestaurantReviewModal } from '@/components/explore/restaurant-review-modal';
import { RouteStopReservation, type RouteReservation } from '@/components/explore/route-stop-reservation';
import { RestaurantHoursStatus, type RestaurantHoursData } from '@/components/explore/restaurant-hours-status';
import { RestaurantMenu, type RestaurantMenuData } from '@/components/explore/restaurant-menu';
import { RestaurantReviews, type RestaurantReviewsData } from '@/components/explore/restaurant-reviews';
import { Button } from '@/components/ui/button';
import { priceRangeLabel } from '@/lib/restaurant-price';
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
    reviews: RestaurantReviewsData;
    routeContext: {
        route_slug: string;
        reservation: RouteReservation | null;
    } | null;
};

function scrollToSection(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function GlassIconButton({
    onClick,
    label,
    children,
    active = false,
}: {
    onClick: () => void;
    label: string;
    children: React.ReactNode;
    active?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={label}
            className={cn(
                'flex size-10 cursor-pointer items-center justify-center rounded-full backdrop-blur-md transition',
                active
                    ? 'bg-white text-brand-orange shadow-lg'
                    : 'bg-black/25 text-white ring-1 ring-white/20 hover:bg-black/35',
            )}
        >
            {children}
        </button>
    );
}

function RestaurantShow({
    restaurant,
    inRoute,
    draftStopsCount,
    isFavorited: initialFavorited,
    canReview,
    hasReview,
    reviews,
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

    const sections = useMemo(
        () =>
            [
                { id: 'overview', label: t('explore.section_overview') },
                restaurant.menu.total_items > 0
                    ? { id: 'menu', label: t('explore.section_menu') }
                    : null,
                { id: 'reviews', label: t('explore.section_reviews') },
            ].filter(Boolean) as Array<{ id: string; label: string }>,
        [restaurant.menu.total_items, t],
    );

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

    const isClosed =
        restaurant.hours != null
        && restaurant.hours.label !== 'Horario no disponible'
        && !restaurant.hours.is_open;

    return (
        <>
            <Head title={restaurant.name} />
            <div className="min-h-screen bg-[#F7F5F2] pb-32">
                {/* Hero editorial */}
                <div className="relative">
                    <div className="aspect-[5/4] max-h-[22rem] w-full overflow-hidden bg-stone-200 sm:aspect-[21/9] sm:max-h-none">
                        {restaurant.images[0]?.url ? (
                            <img
                                src={restaurant.images[0].url}
                                alt=""
                                className="size-full object-cover"
                            />
                        ) : (
                            <div className="flex size-full flex-col items-center justify-center bg-gradient-to-br from-stone-200 via-stone-100 to-stone-300">
                                <span className="font-serif text-sm tracking-[0.2em] text-stone-500 uppercase">
                                    MiskiGO
                                </span>
                                <p className="mt-2 text-xs text-stone-400">{t('explore.menu_no_image')}</p>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/95 via-brand-dark/35 to-brand-dark/10" />
                    </div>

                    <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
                        <GlassIconButton
                            onClick={() => router.visit(exploreDiscover.url())}
                            label={t('explore.back')}
                        >
                            <ArrowLeft className="size-5" />
                        </GlassIconButton>
                        <GlassIconButton
                            onClick={toggleFavorite}
                            label={favorited ? t('explore.unfavorite') : t('explore.favorite')}
                            active={favorited}
                        >
                            <Heart className={cn('size-5', favorited && 'fill-current')} />
                        </GlassIconButton>
                    </div>

                    <div className="absolute inset-x-0 bottom-0 px-5 pb-8 pt-16 sm:px-8">
                        <div className="mx-auto max-w-3xl">
                            {restaurant.cuisines.length > 0 && (
                                <div className="mb-3 flex flex-wrap gap-1.5">
                                    {restaurant.cuisines.map(c => (
                                        <span
                                            key={c.name}
                                            className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-medium tracking-wide text-white/95 ring-1 ring-white/20 backdrop-blur-sm"
                                        >
                                            {c.name}
                                            {c.is_primary ? ' ★' : ''}
                                        </span>
                                    ))}
                                </div>
                            )}
                            <h1 className="font-serif text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                                {restaurant.name}
                            </h1>
                            {restaurant.district && (
                                <p className="mt-2 flex items-center gap-1.5 text-sm text-white/75">
                                    <MapPin className="size-3.5 shrink-0" />
                                    {restaurant.address ?? restaurant.district}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sheet principal */}
                <div className="relative z-10 -mt-6 rounded-t-[2rem] bg-[#F7F5F2] shadow-[0_-12px_40px_rgba(5,42,88,0.08)]">
                    {/* Navegación por secciones */}
                    <div className="sticky top-0 z-20 rounded-t-[2rem] border-b border-stone-200/70 bg-[#F7F5F2]/90 backdrop-blur-xl">
                        <div className="mx-auto flex max-w-3xl gap-1 overflow-x-auto px-4 py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            {sections.map(section => (
                                <button
                                    key={section.id}
                                    type="button"
                                    onClick={() => scrollToSection(section.id)}
                                    className="shrink-0 cursor-pointer rounded-full px-4 py-2 text-xs font-semibold tracking-wide text-stone-500 uppercase transition hover:bg-white hover:text-brand-blue"
                                >
                                    {section.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mx-auto max-w-3xl space-y-12 px-5 py-8 sm:px-8">
                        {/* Overview */}
                        <section id="overview" className="scroll-mt-28 space-y-6">
                            <div className="grid grid-cols-3 divide-x divide-stone-200/80 overflow-hidden rounded-3xl bg-white ring-1 ring-stone-200/70">
                                <div className="px-3 py-5 text-center sm:px-4">
                                    <div className="flex items-center justify-center gap-1">
                                        <Star className="size-4 fill-amber-400 text-amber-400" />
                                        <span className="font-serif text-2xl font-semibold text-stone-900">
                                            {restaurant.avg_rating.toFixed(1)}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-[10px] font-semibold tracking-[0.12em] text-stone-400 uppercase">
                                        {t('explore.stat_rating')}
                                    </p>
                                </div>
                                <div className="px-3 py-5 text-center sm:px-4">
                                    <p className="font-serif text-2xl font-semibold text-stone-900">
                                        {restaurant.total_reviews}
                                    </p>
                                    <p className="mt-1 text-[10px] font-semibold tracking-[0.12em] text-stone-400 uppercase">
                                        {t('explore.menu_reviews')}
                                    </p>
                                </div>
                                <div className="px-3 py-5 text-center sm:px-4">
                                    <p className="font-serif text-lg font-semibold leading-tight text-stone-900 sm:text-2xl">
                                        {priceRangeLabel(restaurant.price_range)}
                                    </p>
                                    <p className="mt-1 text-[10px] font-semibold tracking-[0.12em] text-stone-400 uppercase">
                                        {t('explore.price_range')}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <RestaurantHoursStatus
                                    hours={restaurant.hours}
                                    variant="inline"
                                    className="rounded-2xl bg-white px-4 py-3 ring-1 ring-stone-200/70"
                                />
                                {(restaurant.description ?? restaurant.short_description) && (
                                    <p className="text-[15px] leading-relaxed text-stone-600">
                                        {restaurant.description ?? restaurant.short_description}
                                    </p>
                                )}
                            </div>
                        </section>

                        {restaurant.menu.total_items > 0 && (
                            <RestaurantMenu menu={restaurant.menu} id="menu" />
                        )}

                        <RestaurantReviews
                            id="reviews"
                            avgRating={restaurant.avg_rating}
                            totalReviews={restaurant.total_reviews}
                            reviews={reviews}
                        />

                        {(routeContext || canReview || hasReview) && (
                            <section className="space-y-4 rounded-3xl bg-white p-5 ring-1 ring-stone-200/70">
                                <header>
                                    <p className="text-[11px] font-semibold tracking-[0.18em] text-brand-blue uppercase">
                                        {t('explore.section_visit')}
                                    </p>
                                    <h2 className="mt-1 font-serif text-xl font-semibold text-stone-900">
                                        {t('explore.section_visit_title')}
                                    </h2>
                                </header>

                                {routeContext && (
                                    <RouteStopReservation
                                        routeSlug={routeContext.route_slug}
                                        restaurantSlug={restaurant.slug}
                                        reservation={routeContext.reservation}
                                        variant="panel"
                                        onReviewClick={() => setReviewOpen(true)}
                                        onMarkedVisited={() => setReviewOpen(true)}
                                    />
                                )}

                                {hasReview && (
                                    <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-emerald-100">
                                        {t('explore.review_thanks')}
                                    </p>
                                )}

                                {canReview && (
                                    <Button
                                        type="button"
                                        className="h-12 w-full cursor-pointer rounded-2xl bg-brand-blue text-white shadow-md hover:bg-brand-blue-light"
                                        onClick={() => setReviewOpen(true)}
                                    >
                                        <Star className="mr-2 size-4 fill-amber-300 text-amber-300" />
                                        {t('explore.review_write')}
                                    </Button>
                                )}

                                {inRoute && !routeContext?.reservation && !canReview && !hasReview && (
                                    <p className="text-sm text-stone-500">{t('explore.review_requires_visit')}</p>
                                )}
                            </section>
                        )}
                    </div>
                </div>

                <RestaurantReviewModal
                    open={reviewOpen}
                    onOpenChange={setReviewOpen}
                    restaurantSlug={restaurant.slug}
                    restaurantName={restaurant.name}
                    reloadOnly={['reviews', 'restaurant', 'canReview', 'hasReview']}
                />

                {/* Barra de acción flotante */}
                <div className="fixed inset-x-0 bottom-20 z-30 px-4 md:bottom-0 md:pb-4">
                    <div className="mx-auto flex max-w-3xl gap-3 rounded-2xl border border-white/60 bg-white/85 p-3 shadow-xl shadow-brand-dark/10 backdrop-blur-xl">
                        {mapsUrl && (
                            <Button
                                type="button"
                                variant="outline"
                                className="h-12 shrink-0 cursor-pointer rounded-xl border-stone-200 bg-white px-4 text-stone-700 hover:bg-stone-50"
                                onClick={openMaps}
                            >
                                <Navigation className="mr-1.5 size-4" />
                                <span className="hidden sm:inline">{t('explore.how_to_get')}</span>
                            </Button>
                        )}
                        {inRoute ? (
                            <Button
                                variant="outline"
                                className="h-12 flex-1 cursor-pointer rounded-xl border-stone-200 text-stone-700 hover:bg-stone-50"
                                onClick={() => router.delete(`/explore/routes/stops/${restaurant.slug}`)}
                            >
                                <Trash2 className="mr-1.5 size-4" />
                                {t('explore.remove_from_route')}
                            </Button>
                        ) : (
                            <Button
                                className="h-12 flex-1 cursor-pointer rounded-xl bg-brand-orange text-base font-semibold text-white shadow-lg shadow-brand-orange/25 hover:bg-brand-orange-dark disabled:bg-stone-300 disabled:text-stone-500 disabled:shadow-none"
                                disabled={isClosed}
                                title={isClosed ? t('explore.closed_no_route') : undefined}
                                onClick={() =>
                                    router.post(
                                        `/explore/routes/stops/${restaurant.slug}`,
                                        {},
                                        { preserveScroll: true },
                                    )
                                }
                            >
                                <Plus className="mr-1.5 size-4" />
                                {isClosed ? t('explore.closed_no_route_short') : t('explore.add_to_route')}
                                {draftStopsCount > 0 && !isClosed && (
                                    <span className="ml-1 opacity-80">({draftStopsCount})</span>
                                )}
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
