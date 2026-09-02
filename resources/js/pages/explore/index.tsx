import { Head, Link, router } from '@inertiajs/react';
import {
    CheckCircle2,
    ClipboardList,
    Heart,
    MapPin,
    Sparkles,
    Star,
    Tag,
    ThumbsDown,
    ThumbsUp,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { AiRecommendationCard, type AiRecRestaurant } from '@/components/explore/ai-recommendation-card';
import { AiRecommendationsPreparing } from '@/components/explore/ai-recommendations-preparing';
import { useUserGeolocation } from '@/hooks/use-user-geolocation';
import { cn } from '@/lib/utils';
import TouristExploreLayout from '@/layouts/tourist-explore-layout';
import { recommend as exploreRecommend, tamSurvey } from '@/routes/explore';

const MASCOT = encodeURI('/ChatGPT Image 1 sept 2026, 04_03_03 a.m.png');

type FilterKey = 'for_you' | 'nearby' | 'rated' | 'new' | 'budget';
type SortKey = 'relevant' | 'distance' | 'rating' | 'price';

type RecommendationMeta = {
    algorithm: string;
    cold_start: boolean;
    ml_available: boolean;
    request_id: number | null;
};

type Props = {
    tamCompleted: boolean;
    recommendations: AiRecRestaurant[];
    recommendationMeta?: RecommendationMeta;
};

const FILTERS: { key: FilterKey; icon: typeof Heart; labelKey: string }[] = [
    { key: 'for_you', icon: Heart, labelKey: 'explore.rec_filter_for_you' },
    { key: 'nearby', icon: MapPin, labelKey: 'explore.rec_filter_nearby' },
    { key: 'rated', icon: Star, labelKey: 'explore.rec_filter_rated' },
    { key: 'new', icon: Sparkles, labelKey: 'explore.rec_filter_new' },
    { key: 'budget', icon: Tag, labelKey: 'explore.rec_filter_budget' },
];

function ExploreIndex({ tamCompleted, recommendations = [], recommendationMeta }: Props) {
    const { t } = useTranslation();
    const syncedGeoRef = useRef(false);
    const [filter, setFilter] = useState<FilterKey>('for_you');
    const [sort, setSort] = useState<SortKey>('relevant');
    const [favoriteSlug, setFavoriteSlug] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
    const [items, setItems] = useState(recommendations);
    const [preparing, setPreparing] = useState(true);
    const finishPrep = useCallback(() => setPreparing(false), []);

    useEffect(() => {
        setItems(recommendations);
    }, [recommendations]);

    const { coords } = useUserGeolocation({
        onCoordinates: (lat, lng) => {
            if (syncedGeoRef.current) {
                return;
            }
            syncedGeoRef.current = true;
            router.get('/explore', { lat, lng }, { preserveState: true, replace: true, only: ['recommendations'] });
        },
    });

    const listed = useMemo(() => {
        let next = [...items];

        if (filter === 'budget') {
            next = next.filter((r) => r.price_range === 'economico');
        }

        next.sort((a, b) => {
            if (filter === 'new') {
                return b.rank - a.rank;
            }
            if (sort === 'distance' || filter === 'nearby') {
                return (a.distance_km ?? 999) - (b.distance_km ?? 999);
            }
            if (sort === 'rating' || filter === 'rated') {
                return b.avg_rating - a.avg_rating;
            }
            if (sort === 'price') {
                return (a.avg_price_per_person ?? 999) - (b.avg_price_per_person ?? 999);
            }

            return a.rank - b.rank;
        });

        return next;
    }, [items, filter, sort]);

    const toggleFavorite = (slug: string, currentlyFavorited: boolean) => {
        setFavoriteSlug(slug);
        setItems((current) =>
            current.map((r) => (r.slug === slug ? { ...r, is_favorited: !currentlyFavorited } : r)),
        );
        router.post(
            `/explore/restaurants/${slug}/interactions`,
            { interaction_type: currentlyFavorited ? 'unsave' : 'save' },
            {
                preserveScroll: true,
                onSuccess: () => toast.success(t(currentlyFavorited ? 'explore.unfavorited_toast' : 'explore.favorited_toast')),
                onError: () => setItems(recommendations),
                onFinish: () => setFavoriteSlug(null),
            },
        );
    };

    const sendFeedback = (value: 'up' | 'down') => {
        setFeedback(value);
        toast.success(value === 'up' ? t('explore.rec_feedback_thanks_up') : t('explore.rec_feedback_thanks_down'));
    };

    return (
        <>
            <Head title={t('nav.ai')} />
            {preparing ? (
                <AiRecommendationsPreparing onDone={finishPrep} />
            ) : (
            <div className="bg-[#f4f6fb] pb-28">
                <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                    <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_12px_40px_rgba(0,35,102,0.08)] sm:p-7">
                        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <Sparkles className="size-6 text-brand-orange" />
                                    <h1 className="text-2xl font-bold text-brand-blue sm:text-3xl">
                                        {t('explore.ai_recs_title')}
                                    </h1>
                                    <span className="rounded-full bg-brand-blue px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-white">
                                        BETA
                                    </span>
                                </div>
                                <p className="mt-2 max-w-xl text-sm text-gray-500">{t('explore.ai_recs_subtitle')}</p>
                                <div className="mt-4 flex max-w-lg items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/80 px-4 py-3">
                                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                                    <p className="text-sm text-gray-700">
                                        <span className="font-bold text-brand-blue">{t('explore.ai_recs_ready_title')} </span>
                                        {t('explore.ai_recs_ready_body')}
                                    </p>
                                </div>
                            </div>
                            <img
                                src={MASCOT}
                                alt=""
                                className="mx-auto hidden h-36 w-auto -scale-x-100 object-contain lg:block"
                            />
                        </div>
                    </section>

                    <div className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-sm font-bold text-brand-blue">{t('explore.tam_card_title')}</h2>
                                <p className="mt-0.5 text-xs text-gray-500">{t('explore.tam_card_desc')}</p>
                            </div>
                            <Link
                                href={tamSurvey.url()}
                                className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-orange-50 px-4 text-sm font-semibold text-brand-orange ring-1 ring-orange-100 hover:bg-orange-100"
                            >
                                <ClipboardList className="size-4" />
                                {tamCompleted ? t('explore.tam_card_view') : t('explore.tam_card_cta')}
                                {tamCompleted && (
                                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                        {t('explore.tam_card_done')}
                                    </span>
                                )}
                            </Link>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {FILTERS.map((item) => {
                            const Icon = item.icon;
                            const active = filter === item.key;

                            return (
                                <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => setFilter(item.key)}
                                    className={cn(
                                        'inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold ring-1 transition',
                                        active
                                            ? 'bg-white text-brand-orange ring-brand-orange'
                                            : 'bg-white text-gray-600 ring-gray-200 hover:ring-brand-orange/40',
                                    )}
                                >
                                    <Icon className="size-3.5" />
                                    {t(item.labelKey)}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600">
                            <Sparkles className="size-3.5 text-brand-orange" />
                            {t('explore.ai_recs_count', { count: listed.length })}
                        </p>
                        <div className="flex items-center gap-2">
                            {recommendationMeta && (
                                <span
                                    className={cn(
                                        'rounded-full px-2.5 py-1 text-[10px] font-semibold',
                                        recommendationMeta.ml_available
                                            ? 'bg-emerald-50 text-emerald-700'
                                            : 'bg-red-50 text-red-700',
                                    )}
                                >
                                    {recommendationMeta.ml_available
                                        ? t('explore.ml_engine_active')
                                        : t('explore.ml_engine_unavailable')}
                                </span>
                            )}
                            <button
                                type="button"
                                disabled={recommendationMeta?.ml_available === false}
                                onClick={() =>
                                    router.post(
                                        exploreRecommend.url(),
                                        coords ? { lat: coords.lat, lng: coords.lng } : {},
                                    )
                                }
                                className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-semibold text-brand-orange hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {t('explore.refresh_recommendations')}
                            </button>
                            <select
                                value={sort}
                                onChange={(e) => setSort(e.target.value as SortKey)}
                                className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-600"
                            >
                                <option value="relevant">{t('explore.rec_sort_relevant')}</option>
                                <option value="distance">{t('explore.rec_sort_distance')}</option>
                                <option value="rating">{t('explore.rec_sort_rating')}</option>
                                <option value="price">{t('explore.rec_sort_price')}</option>
                            </select>
                        </div>
                    </div>

                    {listed.length > 0 ? (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {listed.map((r) => (
                                <AiRecommendationCard
                                    key={r.id}
                                    restaurant={r}
                                    filter={filter}
                                    requestId={recommendationMeta?.request_id}
                                    favoriteBusy={favoriteSlug === r.slug}
                                    onToggleFavorite={() => toggleFavorite(r.slug, r.is_favorited === true)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-orange-200 bg-white px-6 py-12 text-center">
                            <Sparkles className="mx-auto mb-2 size-7 text-brand-orange/70" />
                            <p className="text-sm font-medium text-gray-600">
                                {recommendationMeta?.ml_available === false
                                    ? t('explore.ml_recommendations_unavailable')
                                    : t('explore.no_recommendations')}
                            </p>
                        </div>
                    )}

                    <div className="flex flex-col gap-3 rounded-2xl bg-brand-blue px-5 py-4 text-white sm:flex-row sm:items-center sm:justify-between">
                        <p className="inline-flex items-start gap-2 text-sm">
                            <Sparkles className="mt-0.5 size-4 shrink-0 text-brand-orange" />
                            {t('explore.rec_feedback_prompt')}
                        </p>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => sendFeedback('down')}
                                className={cn(
                                    'inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-brand-blue',
                                    feedback === 'down' && 'ring-2 ring-brand-orange',
                                )}
                            >
                                <ThumbsDown className="size-4" />
                                {t('explore.rec_feedback_down')}
                            </button>
                            <button
                                type="button"
                                onClick={() => sendFeedback('up')}
                                className={cn(
                                    'inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-brand-orange px-4 text-sm font-semibold text-white',
                                    feedback === 'up' && 'ring-2 ring-white',
                                )}
                            >
                                <ThumbsUp className="size-4" />
                                {t('explore.rec_feedback_up')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            )}
        </>
    );
}

ExploreIndex.layout = (page: React.ReactNode) => <TouristExploreLayout>{page}</TouristExploreLayout>;

export default ExploreIndex;
