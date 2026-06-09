import { Quote, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatPeruDateTimeShort, peruLocale } from '@/lib/peru-datetime';
import { cn } from '@/lib/utils';

export type RestaurantReviewItem = {
    id: number;
    rating: number;
    comment: string | null;
    author: string;
    created_at: string | null;
    owner_response: string | null;
    owner_responded_at: string | null;
};

export type RestaurantReviewsData = {
    distribution: Record<string, number>;
    items: RestaurantReviewItem[];
};

type Props = {
    avgRating: number;
    totalReviews: number;
    reviews: RestaurantReviewsData;
    className?: string;
    id?: string;
};

function StarRow({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
    const iconClass = size === 'md' ? 'size-3.5' : 'size-3';

    return (
        <span className="inline-flex items-center gap-px" aria-hidden>
            {Array.from({ length: 5 }, (_, index) => (
                <Star
                    key={index}
                    className={cn(
                        iconClass,
                        index < rating ? 'fill-amber-400 text-amber-400' : 'text-stone-200',
                    )}
                />
            ))}
        </span>
    );
}

function authorInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
        return 'T';
    }
    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
    }

    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function ReviewCard({ review, locale }: { review: RestaurantReviewItem; locale: string }) {
    const { t } = useTranslation();

    return (
        <article className="group relative pl-5 before:absolute before:left-0 before:top-1 before:bottom-1 before:w-px before:bg-gradient-to-b before:from-amber-300 before:via-orange-200 before:to-transparent">
            <div className="flex items-start gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-stone-100 text-xs font-semibold tracking-wide text-brand-blue">
                    {authorInitials(review.author)}
                </span>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                        <div>
                            <p className="font-semibold text-stone-900">{review.author}</p>
                            {review.created_at && (
                                <time className="text-[11px] tracking-wide text-stone-400 uppercase">
                                    {formatPeruDateTimeShort(review.created_at, locale)}
                                </time>
                            )}
                        </div>
                        <StarRow rating={review.rating} />
                    </div>

                    {review.comment ? (
                        <p className="mt-3 text-[15px] leading-relaxed text-stone-600">{review.comment}</p>
                    ) : (
                        <p className="mt-3 text-sm text-stone-400 italic">{t('explore.review_no_comment')}</p>
                    )}

                    {review.owner_response && (
                        <div className="relative mt-4 rounded-2xl bg-stone-50 px-4 py-3 ring-1 ring-stone-200/70">
                            <Quote className="absolute -top-2.5 left-3 size-4 fill-stone-200 text-stone-200" />
                            <p className="text-[10px] font-semibold tracking-[0.14em] text-brand-blue uppercase">
                                {t('explore.review_owner_response')}
                            </p>
                            <p className="mt-1.5 text-sm leading-relaxed text-stone-700">
                                {review.owner_response}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </article>
    );
}

export function RestaurantReviews({
    avgRating,
    totalReviews,
    reviews,
    className,
    id = 'reviews',
}: Props) {
    const { t, i18n } = useTranslation();
    const locale = peruLocale(i18n.language);
    const distribution = [5, 4, 3, 2, 1].map(star => ({
        star,
        count: reviews.distribution[String(star)] ?? reviews.distribution[star] ?? 0,
    }));
    const maxCount = Math.max(...distribution.map(row => row.count), 1);

    return (
        <section id={id} className={cn('scroll-mt-28 space-y-6', className)}>
            <header className="flex items-end justify-between gap-4 border-b border-stone-200/80 pb-4">
                <div>
                    <p className="text-[11px] font-semibold tracking-[0.18em] text-brand-blue uppercase">
                        {t('explore.reviews_section_kicker')}
                    </p>
                    <h2 className="mt-1 font-serif text-2xl font-semibold tracking-tight text-stone-900">
                        {t('explore.reviews_section_title')}
                    </h2>
                </div>
                <span className="hidden text-xs text-stone-400 sm:inline">
                    {totalReviews} {t('explore.menu_reviews')}
                </span>
            </header>

            <div className="overflow-hidden rounded-3xl bg-brand-blue p-5 text-white shadow-lg shadow-brand-blue/10 sm:p-6">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                    <div className="flex items-baseline gap-3 sm:flex-col sm:items-start sm:gap-1">
                        <span className="font-serif text-5xl font-light leading-none tracking-tight">
                            {avgRating.toFixed(1)}
                        </span>
                        <div className="space-y-1">
                            <StarRow rating={Math.round(avgRating)} size="md" />
                            <p className="text-xs text-white/70">
                                {totalReviews} {t('explore.menu_reviews')}
                            </p>
                        </div>
                    </div>

                    <div className="flex-1 space-y-2 border-t border-white/10 pt-4 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6">
                        {distribution.map(({ star, count }) => (
                            <div key={star} className="flex items-center gap-3 text-xs">
                                <span className="w-3 font-medium text-white/90">{star}</span>
                                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-amber-300 to-brand-orange transition-all duration-500"
                                        style={{ width: `${(count / maxCount) * 100}%` }}
                                    />
                                </div>
                                <span className="w-4 text-right tabular-nums text-white/60">{count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {reviews.items.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-stone-200 bg-stone-50/80 px-6 py-12 text-center">
                    <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-stone-200/80">
                        <Star className="size-5 text-stone-300" />
                    </div>
                    <p className="mt-4 font-medium text-stone-800">{t('explore.reviews_empty_title')}</p>
                    <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-stone-500">
                        {t('explore.reviews_empty_desc')}
                    </p>
                </div>
            ) : (
                <div className="space-y-8">
                    {reviews.items.map(review => (
                        <ReviewCard key={review.id} review={review} locale={locale} />
                    ))}
                </div>
            )}
        </section>
    );
}
