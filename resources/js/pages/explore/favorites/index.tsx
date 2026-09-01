import { Head, router } from '@inertiajs/react';
import { GitFork, Heart, UtensilsCrossed } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
    FavoriteRestaurantCard,
    FavoriteRouteCard,
    type FavoriteRestaurantCardData,
    type FavoriteRouteCardData,
} from '@/components/explore/favorite-cards';
import { cn } from '@/lib/utils';
import TouristExploreLayout from '@/layouts/tourist-explore-layout';
import { exploreSearchUrl } from '@/lib/explore-discover-url';

type Props = {
    tab: 'restaurants' | 'routes';
    sort: string;
    restaurants: FavoriteRestaurantCardData[];
    routes: FavoriteRouteCardData[];
};

function FavoritesPage({ tab, sort, restaurants, routes }: Props) {
    const { t } = useTranslation();

    const visit = (next: { tab?: string; sort?: string }) => {
        router.get(
            '/explore/favorites',
            { tab: next.tab ?? tab, sort: next.sort ?? sort },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const unfavoriteRestaurant = (slug: string) => {
        router.post(
            `/explore/restaurants/${slug}/interactions`,
            { interaction_type: 'unsave' },
            {
                preserveScroll: true,
                onSuccess: () => toast.success(t('explore.unfavorited_toast')),
            },
        );
    };

    const unfavoriteRoute = (slug: string) => {
        router.post(`/explore/favorites/routes/${slug}`, {}, { preserveScroll: true });
    };

    return (
        <>
            <Head title={t('explore.favorites_page_title')} />
            <div className="mx-auto max-w-5xl px-4 py-6 pb-28 md:px-6">
                <div className="mb-5">
                    <h1 className="flex items-center gap-2 text-2xl font-bold text-brand-blue">
                        <Heart className="size-6 text-brand-orange" />
                        {t('explore.favorites_page_title')}
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">{t('explore.favorites_page_subtitle')}</p>
                </div>

                <div className="mb-6 flex justify-center">
                    <div className="inline-flex rounded-2xl bg-white p-1 shadow-sm ring-1 ring-gray-100">
                        <button
                            type="button"
                            onClick={() => visit({ tab: 'restaurants' })}
                            className={cn(
                                'inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold',
                                tab === 'restaurants' ? 'bg-orange-50 text-brand-orange' : 'text-gray-500 hover:bg-gray-50',
                            )}
                        >
                            <UtensilsCrossed className="size-4" />
                            {t('explore.favorites_tab_restaurants')}
                        </button>
                        <button
                            type="button"
                            onClick={() => visit({ tab: 'routes' })}
                            className={cn(
                                'inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold',
                                tab === 'routes' ? 'bg-violet-50 text-violet-700' : 'text-gray-500 hover:bg-gray-50',
                            )}
                        >
                            <GitFork className="size-4" />
                            {t('explore.favorites_tab_routes')}
                        </button>
                    </div>
                </div>

                <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-gray-600">
                        {tab === 'routes'
                            ? t('explore.favorites_routes_count', { count: routes.length })
                            : t('explore.favorites_restaurants_count', { count: restaurants.length })}
                    </p>
                    <select
                        value={sort}
                        onChange={(e) => visit({ sort: e.target.value })}
                        className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-600"
                    >
                        <option value="recent">{t('explore.favorites_sort_recent')}</option>
                        <option value="name">{t('explore.favorites_sort_name')}</option>
                    </select>
                </div>

                <div className="space-y-3">
                    {tab === 'restaurants' &&
                        restaurants.map((restaurant) => (
                            <FavoriteRestaurantCard
                                key={restaurant.id}
                                restaurant={restaurant}
                                onUnfavorite={() => unfavoriteRestaurant(restaurant.slug)}
                            />
                        ))}
                    {tab === 'routes' &&
                        routes.map((route, index) => (
                            <FavoriteRouteCard
                                key={route.id}
                                route={route}
                                index={index}
                                onUnfavorite={() => unfavoriteRoute(route.slug)}
                            />
                        ))}
                    {tab === 'restaurants' && restaurants.length === 0 && (
                        <p className="rounded-2xl bg-white p-10 text-center text-sm text-gray-500 ring-1 ring-gray-100">
                            {t('explore.favorites_empty')}{' '}
                            <button
                                type="button"
                                className="font-semibold text-brand-orange"
                                onClick={() => router.visit(exploreSearchUrl())}
                            >
                                {t('explore.nav_explore')}
                            </button>
                        </p>
                    )}
                    {tab === 'routes' && routes.length === 0 && (
                        <p className="rounded-2xl bg-white p-10 text-center text-sm text-gray-500 ring-1 ring-gray-100">
                            {t('explore.favorites_routes_empty')}
                        </p>
                    )}
                </div>

                <div className="mt-8 flex items-start gap-3 rounded-2xl bg-violet-50 px-4 py-4 text-sm text-violet-900">
                    <Heart className="mt-0.5 size-5 shrink-0 text-violet-600" />
                    <div>
                        <p className="font-bold">{t('explore.favorites_tip_title')}</p>
                        <p className="mt-0.5 text-violet-800/80">{t('explore.favorites_tip_body')}</p>
                    </div>
                </div>
            </div>
        </>
    );
}

FavoritesPage.layout = (page: React.ReactNode) => (
    <TouristExploreLayout>{page}</TouristExploreLayout>
);

export default FavoritesPage;
