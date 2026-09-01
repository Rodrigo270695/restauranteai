import { Link } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    BadgeCheck,
    Crown,
    Heart,
    History,
    Map,
    MapPin,
    Pencil,
    Search,
    Sparkles,
    Star,
    UtensilsCrossed,
    Wallet,
    Users,
    Trees,
} from 'lucide-react';
import { useMemo, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { RestaurantCardData } from '@/components/explore/restaurant-card';
import { useUserGeolocation } from '@/hooks/use-user-geolocation';
import { exploreFavoritesDiscoverUrl, exploreSearchUrl } from '@/lib/explore-discover-url';
import { formatDistanceKm, kmBetween } from '@/lib/geo-distance';
import { formatAvgPriceSoles, priceRangeLabel } from '@/lib/restaurant-price';
import { type Budget, normalizeBudgets } from '@/lib/tourist-budget';
import { cn } from '@/lib/utils';
import { profile as exploreProfile } from '@/routes/explore';
import { show as restaurantShow } from '@/routes/explore/restaurants';

type Profile = {
    city: string | null;
    preferred_cuisines: string[];
    budget_preference: Budget[] | null;
    completed: boolean;
};

type MlPreference = {
    ambiance: string | null;
    party_types: string[];
    restaurant_environments: string[];
    price_range: string | null;
} | null;

type Rec = RestaurantCardData & { rank: number; recommendation_score: number };

type CuisineType = { id: number; name: string; slug: string };

type Props = {
    userName: string;
    profile: Profile | null;
    mlPreference: MlPreference;
    recommendations: Rec[];
    recommendationMeta?: { request_id: number | null; ml_available: boolean };
    cuisineTypes: CuisineType[];
};

const HERO_IMAGE = '/tourist-home-hero-chiclayo.png';

function cuisineName(slug: string, types: CuisineType[]): string {
    return types.find((c) => c.slug === slug)?.name ?? slug;
}

function PrefColumn({
    icon,
    label,
    values,
}: {
    icon: ReactNode;
    label: string;
    values: string[];
}) {
    return (
        <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2 text-brand-orange">
                {icon}
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
            </div>
            <p className="text-sm font-medium leading-snug text-brand-blue">
                {values.length > 0 ? values.join(', ') : '—'}
            </p>
        </div>
    );
}

export function TouristHome({
    userName,
    profile,
    mlPreference,
    recommendations,
    recommendationMeta,
    cuisineTypes,
}: Props) {
    const { t } = useTranslation();
    const firstName = userName.split(' ')[0];
    const scroller = useRef<HTMLDivElement>(null);
    const { coords } = useUserGeolocation();

    const budgets = normalizeBudgets(profile?.budget_preference ?? null);
    const budgetLabels: Record<Budget, string> = {
        low: `${t('explore.budget_low')} (${t('setup.budget_low_desc')})`,
        medium: `${t('explore.budget_medium')} (${t('setup.budget_medium_desc')})`,
        high: `${t('explore.budget_high')} (${t('setup.budget_high_desc')})`,
    };

    const cuisineLabels = (profile?.preferred_cuisines ?? []).map((s) => cuisineName(s, cuisineTypes));

    const featured = useMemo(() => {
        return recommendations.slice(0, 6).map((r) => {
            if (coords && r.latitude != null && r.longitude != null) {
                return {
                    ...r,
                    distance_km: kmBetween(coords.lat, coords.lng, r.latitude, r.longitude),
                };
            }

            return r;
        });
    }, [recommendations, coords]);

    const scrollByCard = (direction: -1 | 1) => {
        scroller.current?.scrollBy({ left: direction * 340, behavior: 'smooth' });
    };

    return (
        <div className="bg-[#f4f6fb] pb-10">
            <section className="relative">
                <div className="relative min-h-[17rem] overflow-hidden bg-white pt-[4.625rem] sm:min-h-[20rem] lg:min-h-[22rem]">
                    <img
                        src={HERO_IMAGE}
                        alt="Catedral de Chiclayo y ceviche norteño"
                        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-[80%_center]"
                    />
                    <div className="pointer-events-none absolute inset-y-0 left-0 w-[78%] bg-gradient-to-r from-white via-white/90 to-transparent sm:w-[68%] lg:w-[56%]" />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white/80 to-transparent" />

                    <div className="relative mx-auto max-w-7xl px-4 pb-28 pt-10 sm:px-6 sm:pb-32 sm:pt-12 lg:px-8 lg:pb-36 lg:pt-14">
                        <h1 className="text-3xl font-bold tracking-tight text-brand-blue sm:text-4xl lg:text-5xl">
                            {t('home.hello', { name: firstName })} 👋
                        </h1>
                        <p className="mt-2 max-w-lg text-base text-gray-500 sm:text-lg">{t('home.hello_sub')}</p>
                    </div>
                </div>

                <div className="relative z-10 mx-auto -mt-20 max-w-7xl px-4 sm:-mt-24 sm:px-6 lg:px-8">
                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_12px_40px_rgba(0,35,102,0.08)] sm:p-6">
                        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                            <h2 className="text-lg font-bold text-brand-blue">{t('home.your_prefs')}</h2>
                            <Link
                                href={exploreProfile.url()}
                                className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-orange hover:underline"
                            >
                                <Pencil className="size-3.5" />
                                {t('home.edit_prefs')}
                            </Link>
                        </div>
                        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                            <PrefColumn
                                icon={<UtensilsCrossed className="size-4" />}
                                label={t('home.pref_cuisines')}
                                values={cuisineLabels.slice(0, 4)}
                            />
                            <PrefColumn
                                icon={<Wallet className="size-4" />}
                                label={t('home.pref_budget')}
                                values={budgets.map((b) => budgetLabels[b])}
                            />
                            <PrefColumn
                                icon={<Sparkles className="size-4" />}
                                label={t('home.pref_ambiance')}
                                values={mlPreference?.ambiance ? [mlPreference.ambiance] : []}
                            />
                            <PrefColumn
                                icon={<Trees className="size-4" />}
                                label={t('home.pref_environment')}
                                values={mlPreference?.restaurant_environments ?? []}
                            />
                            <PrefColumn
                                icon={<Users className="size-4" />}
                                label={t('home.pref_party')}
                                values={mlPreference?.party_types ?? []}
                            />
                            <PrefColumn
                                icon={<MapPin className="size-4" />}
                                label={t('home.pref_location')}
                                values={[profile?.city || t('home.location_fallback')]}
                            />
                        </div>
                    </div>
                </div>
            </section>

            <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
                <section>
                    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <h2 className="flex items-center gap-2 text-xl font-bold text-brand-blue">
                                <Sparkles className="size-5 text-brand-orange" />
                                {t('explore.recommendations_title')}
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">{t('home.recs_sub')}</p>
                        </div>
                        <Link
                            href="/explore"
                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-orange hover:underline"
                        >
                            {t('home.see_all_recs')}
                            <ArrowRight className="size-4" />
                        </Link>
                    </div>

                    {featured.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-orange-200 bg-white px-6 py-10 text-center">
                            <p className="text-sm text-gray-600">{t('explore.no_recommendations')}</p>
                            <Link
                                href={exploreProfile.url()}
                                className="mt-3 inline-flex text-sm font-semibold text-brand-orange hover:underline"
                            >
                                {t('explore.complete_profile_btn')}
                            </Link>
                        </div>
                    ) : (
                        <div className="relative">
                            <div
                                ref={scroller}
                                className="flex gap-4 overflow-x-auto pb-2 scroll-smooth [scrollbar-width:none] lg:px-12 [&::-webkit-scrollbar]:hidden"
                            >
                                {featured.map((r, i) => {
                                    const href = recommendationMeta?.request_id
                                        ? restaurantShow.url(r.slug, {
                                              query: {
                                                  from_recommendation: '1',
                                                  request_id: recommendationMeta.request_id,
                                              },
                                          })
                                        : restaurantShow.url(r.slug, { query: { from_recommendation: '1' } });
                                    const avgPrice = formatAvgPriceSoles(r.avg_price_per_person);
                                    const familyEnv = r.environments?.find((e) => /famil/i.test(e));
                                    const familyHint = familyEnv ? t('home.ideal_families') : r.environments?.[0];

                                    return (
                                        <article
                                            key={r.id}
                                            className="relative w-[min(100%,18.5rem)] shrink-0 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
                                        >
                                            <Link href={href} className="block">
                                                <div className="relative aspect-[16/10] bg-gray-100">
                                                    {r.cover_url ? (
                                                        <img src={r.cover_url} alt="" className="h-full w-full object-cover" />
                                                    ) : (
                                                        <div className="flex h-full items-center justify-center text-xs text-gray-400">
                                                            Sin foto
                                                        </div>
                                                    )}
                                                    <span className="absolute top-3 left-0 flex items-center gap-1 rounded-r-full bg-brand-orange px-2.5 py-1 text-xs font-bold text-white shadow">
                                                        <Crown className="size-3.5" />
                                                        {r.rank || i + 1}
                                                    </span>
                                                </div>
                                                <div className="p-3.5">
                                                    <div className="flex items-start gap-1.5">
                                                        <h3 className="min-w-0 flex-1 font-bold text-brand-blue">{r.name}</h3>
                                                        <BadgeCheck className="mt-0.5 size-4 shrink-0 text-brand-blue" />
                                                    </div>
                                                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                                                        {r.cuisines.slice(0, 3).map((c) => (
                                                            <span
                                                                key={c.id}
                                                                className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600"
                                                            >
                                                                {c.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                                                        <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                                                            <Star className="size-3.5 fill-amber-400 text-amber-400" />
                                                            {r.avg_rating}
                                                            <span className="font-normal text-gray-400">
                                                                ({r.total_reviews})
                                                            </span>
                                                        </span>
                                                        <span>
                                                            {avgPrice
                                                                ? `${avgPrice} / pers.`
                                                                : r.price_range_label ?? priceRangeLabel(r.price_range)}
                                                        </span>
                                                        {r.distance_km != null && (
                                                            <span className="inline-flex items-center gap-0.5">
                                                                <MapPin className="size-3" />
                                                                {t('welcome.browse_distance_km', {
                                                                    km: formatDistanceKm(r.distance_km),
                                                                })}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="mt-3 flex items-center justify-between gap-2">
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {r.hours?.is_open && (
                                                                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                                                    {t('home.open_now')}
                                                                </span>
                                                            )}
                                                            {familyHint && (
                                                                <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
                                                                    {familyHint}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <Heart className="size-5 text-gray-300" />
                                                    </div>
                                                </div>
                                            </Link>
                                        </article>
                                    );
                                })}
                            </div>
                            {featured.length > 2 && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => scrollByCard(-1)}
                                        className="absolute top-1/2 left-0 z-10 hidden size-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white text-brand-blue shadow-lg lg:flex"
                                        aria-label={t('home.carousel_prev')}
                                    >
                                        <ArrowLeft className="size-5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => scrollByCard(1)}
                                        className="absolute top-1/2 right-0 z-10 hidden size-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white text-brand-blue shadow-lg lg:flex"
                                        aria-label={t('home.carousel_next')}
                                    >
                                        <ArrowRight className="size-5" />
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </section>

                <section>
                    <h2 className="mb-4 text-lg font-bold text-brand-blue">{t('home.quick_access')}</h2>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {[
                            {
                                href: exploreSearchUrl(),
                                icon: Search,
                                title: t('home.qa_explore'),
                                desc: t('home.qa_explore_desc'),
                                tone: 'bg-orange-50 text-brand-orange',
                            },
                            {
                                href: '/explore/routes',
                                icon: Map,
                                title: t('nav.gastro_routes'),
                                desc: t('home.qa_routes_desc'),
                                tone: 'bg-sky-50 text-sky-700',
                            },
                            {
                                href: exploreFavoritesDiscoverUrl(),
                                icon: Heart,
                                title: t('nav.favorites'),
                                desc: t('home.qa_favs_desc'),
                                tone: 'bg-pink-50 text-pink-600',
                            },
                            {
                                href: '/explore/routes?tab=history',
                                icon: History,
                                title: t('nav.history'),
                                desc: t('home.qa_history_desc'),
                                tone: 'bg-indigo-50 text-indigo-700',
                            },
                        ].map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="group relative flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:border-orange-200 hover:shadow-md"
                            >
                                <span className={cn('flex size-12 shrink-0 items-center justify-center rounded-full', item.tone)}>
                                    <item.icon className="size-5" />
                                </span>
                                <div className="min-w-0 pr-4">
                                    <p className="font-bold text-brand-blue">{item.title}</p>
                                    <p className="mt-0.5 text-xs text-gray-500">{item.desc}</p>
                                </div>
                                <ArrowRight className="absolute right-4 bottom-4 size-4 text-brand-blue opacity-60 transition group-hover:translate-x-0.5" />
                            </Link>
                        ))}
                    </div>
                </section>
            </div>

            <section className="mx-4 mt-4 rounded-2xl bg-brand-blue px-5 py-5 sm:mx-6 lg:mx-auto lg:max-w-7xl lg:px-8">
                <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
                    <div className="flex items-start gap-3">
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-orange/20 text-brand-orange">
                            <Sparkles className="size-5" />
                        </span>
                        <p className="max-w-3xl text-sm leading-relaxed text-white/90">{t('home.ai_learn')}</p>
                    </div>
                    <Link href="/explore" className="shrink-0 text-sm font-semibold text-brand-orange hover:underline">
                        {t('home.ai_how')} →
                    </Link>
                </div>
            </section>
        </div>
    );
}
