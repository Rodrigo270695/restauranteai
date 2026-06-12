import { router } from '@inertiajs/react';
import { Crosshair, DotsThree, MagnifyingGlass } from '@phosphor-icons/react';
import { FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CuisineTypeIcon } from '@/components/public/cuisine-type-icon';
import { cn } from '@/lib/utils';

const EXPLORE_PATH = '/restaurantes-cercanos';

type CuisineType = { id: number; name: string; slug?: string };

type Props = {
    cuisineTypes: CuisineType[];
};

export function WelcomeHeroSearch({ cuisineTypes }: Props) {
    const { t } = useTranslation();
    const [query, setQuery] = useState('');
    const [locating, setLocating] = useState(false);

    const visibleCuisines = cuisineTypes.slice(0, 5);
    const hasMoreCuisines = cuisineTypes.length > 5;

    const goExplore = (params: Record<string, string | number | undefined>) => {
        router.get(EXPLORE_PATH, params);
    };

    const handleSearch = (event?: FormEvent) => {
        event?.preventDefault();
        const trimmed = query.trim();
        if (!trimmed) {
            goExplore({});
            return;
        }
        goExplore({ search: trimmed });
    };

    const handleMyLocation = () => {
        if (locating) {
            return;
        }

        if (!navigator.geolocation) {
            goExplore({ location_active: 1, sort: 'nearby' });
            return;
        }

        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            position => {
                setLocating(false);
                goExplore({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    location_active: 1,
                    sort: 'nearby',
                });
            },
            () => {
                setLocating(false);
                goExplore({ location_active: 1, sort: 'nearby' });
            },
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
        );
    };

    const handleCuisine = (id: number) => {
        goExplore({ cuisine_type_id: id });
    };

    return (
        <section className="relative z-20 -mt-5 bg-white pb-4 pt-2 sm:-mt-7 sm:pb-6 sm:pt-3">
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                <form
                    onSubmit={handleSearch}
                    className="overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-[0_4px_28px_rgba(7,53,119,0.07)] ring-1 ring-black/[0.03] sm:rounded-[1.75rem]"
                >
                    <div className="flex flex-col sm:flex-row sm:items-stretch">
                        <div className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3.5 sm:px-5 sm:py-4">
                            <button
                                type="submit"
                                className="shrink-0 text-gray-400 transition hover:text-brand-blue"
                                aria-label={t('welcome.hero_search_submit')}
                            >
                                <MagnifyingGlass size={22} weight="regular" />
                            </button>
                            <input
                                type="search"
                                value={query}
                                onChange={event => setQuery(event.target.value)}
                                placeholder={t('welcome.hero_search_placeholder')}
                                className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 sm:text-[0.95rem]"
                            />
                        </div>

                        <div className="flex items-stretch border-t border-gray-100 sm:border-t-0 sm:border-l">
                            <button
                                type="button"
                                onClick={handleMyLocation}
                                disabled={locating}
                                className={cn(
                                    'flex w-full cursor-pointer items-center justify-center gap-2.5 px-5 py-3.5 text-sm font-semibold text-brand-blue transition hover:bg-slate-50 sm:w-auto sm:px-6 sm:py-4 sm:text-[0.95rem]',
                                    locating && 'opacity-70',
                                )}
                            >
                                <Crosshair
                                    size={20}
                                    weight="duotone"
                                    color="#073577"
                                    className={cn(locating && 'animate-pulse')}
                                />
                                {locating ? t('welcome.hero_search_locating') : t('welcome.hero_search_my_location')}
                            </button>
                        </div>
                    </div>
                </form>

                {cuisineTypes.length > 0 && (
                    <div className="mt-4 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:mt-5 [&::-webkit-scrollbar]:hidden">
                        <div className="mx-auto flex w-max min-w-full flex-nowrap items-center justify-center gap-2 sm:gap-2.5">
                            {visibleCuisines.map(cuisine => (
                                <button
                                    key={cuisine.id}
                                    type="button"
                                    onClick={() => handleCuisine(cuisine.id)}
                                    className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-gray-100 bg-white px-3.5 py-2 shadow-[0_2px_14px_rgba(7,53,119,0.06)] transition hover:-translate-y-0.5 hover:border-brand-blue/10 hover:shadow-[0_6px_20px_rgba(7,53,119,0.1)] sm:rounded-2xl sm:px-4 sm:py-2.5"
                                >
                                    <CuisineTypeIcon slug={cuisine.slug} size={24} />
                                    <span className="whitespace-nowrap text-xs font-semibold text-[#1e293b] sm:text-sm">
                                        {cuisine.name}
                                    </span>
                                </button>
                            ))}

                            {(hasMoreCuisines || cuisineTypes.length > 0) && (
                                <button
                                    type="button"
                                    onClick={() => goExplore({})}
                                    className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-gray-100 bg-white px-3.5 py-2 shadow-[0_2px_14px_rgba(7,53,119,0.06)] transition hover:-translate-y-0.5 hover:border-brand-blue/10 hover:shadow-[0_6px_20px_rgba(7,53,119,0.1)] sm:rounded-2xl sm:px-4 sm:py-2.5"
                                >
                                    <span className="flex size-6 items-center justify-center rounded-full bg-slate-100 text-slate-500 sm:size-7">
                                        <DotsThree size={20} weight="bold" />
                                    </span>
                                    <span className="whitespace-nowrap text-xs font-semibold text-[#1e293b] sm:text-sm">
                                        {t('welcome.hero_search_more')}
                                    </span>
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
