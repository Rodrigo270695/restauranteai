import { Head, router, useForm, usePage } from '@inertiajs/react';
import { MessageSquare, MessageSquareReply, Search, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FormSection, STAT_COLORS } from '@/components/app/owner/form-section';
import {
    ReviewResponseModal,
    type ReviewResponseFormData,
} from '@/components/app/owner/review-response-modal';
import { StarRating } from '@/components/app/owner/star-rating';
import { PageHeader, type StatBadge } from '@/components/shared/page-header';
import { PaginationLinks, type PaginationMeta } from '@/components/shared/pagination-links';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCan } from '@/hooks/use-can';
import { useOwnerReadOnly } from '@/hooks/use-owner-read-only';
import { cn } from '@/lib/utils';

export type ReviewRow = {
    id: number;
    rating: number;
    comment: string | null;
    user_name: string;
    created_at: string;
    owner_response: string | null;
    owner_responded_at: string | null;
    has_response: boolean;
};

type Props = {
    restaurant: { id: number; name: string };
    owner: { name: string; business_name?: string | null };
    reviews: PaginationMeta & { data: ReviewRow[] };
    stats: { total: number; pending: number; answered: number; avg_rating: number };
    distribution: Record<string, number>;
    filters: { search: string; rating: number | null; filter: 'all' | 'pending' | 'answered' };
};

const FILTER_TABS: { key: Props['filters']['filter']; label: string }[] = [
    { key: 'all', label: 'Todas' },
    { key: 'pending', label: 'Sin responder' },
    { key: 'answered', label: 'Respondidas' },
];

export function RestaurantReviewsPage({
    restaurant,
    owner,
    reviews,
    stats,
    distribution,
    filters,
}: Props) {
    const can = useCan();
    const readOnly = useOwnerReadOnly();
    const canRespond = can('reviews.view') && !readOnly;
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;
    const [search, setSearch] = useState(filters.search);
    const [respondTarget, setRespondTarget] = useState<ReviewRow | null>(null);

    const responseForm = useForm<ReviewResponseFormData>({ owner_response: '' });

    useEffect(() => {
        if (!flash?.success && !flash?.error) return;
        import('sonner').then(({ toast }) => {
            if (flash.success) toast.success(flash.success);
            if (flash.error) toast.error(flash.error);
        });
    }, [flash]);

    const displayName = owner.business_name || restaurant.name;
    const maxDist = Math.max(...Object.values(distribution), 1);

    const statBadges: StatBadge[] = [
        {
            icon: <MessageSquare className="size-3.5" />,
            label: 'Total',
            value: stats.total,
            color: STAT_COLORS.violet,
        },
        {
            icon: <Star className="size-3.5" />,
            label: 'Promedio',
            value: stats.avg_rating.toFixed(1),
            color: STAT_COLORS.amber,
        },
        {
            icon: <MessageSquareReply className="size-3.5" />,
            label: 'Pendientes',
            value: stats.pending,
            color: stats.pending > 0 ? STAT_COLORS.orange : STAT_COLORS.emerald,
        },
        {
            icon: <MessageSquare className="size-3.5" />,
            label: 'Local',
            value: displayName,
            color: STAT_COLORS.sky,
        },
    ];

    const applyFilters = (patch: Partial<Props['filters']>) => {
        router.get(
            '/app/reviews',
            {
                search: patch.search ?? filters.search,
                rating: patch.rating !== undefined ? patch.rating : filters.rating,
                filter: patch.filter ?? filters.filter,
                per_page: reviews.per_page,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const openRespond = (review: ReviewRow) => {
        setRespondTarget(review);
        responseForm.setData('owner_response', review.owner_response ?? '');
    };

    const submitResponse = (e: React.FormEvent) => {
        e.preventDefault();
        if (!respondTarget) return;
        responseForm.put(`/app/reviews/${respondTarget.id}/respond`, {
            preserveScroll: true,
            onSuccess: () => {
                setRespondTarget(null);
                responseForm.reset();
            },
        });
    };

    return (
        <>
            <Head title="Reseñas" />

            <div className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                <PageHeader
                    title="Reseñas"
                    description="Opiniones de turistas. Responde para generar confianza en tu ficha pública."
                    stats={statBadges}
                />

                <div className="grid gap-5 lg:grid-cols-3">
                    <FormSection
                        title="Distribución"
                        description="Cantidad por estrellas."
                        icon={<Star className="size-4" />}
                        palette={STAT_COLORS.amber}
                        contentClassName="p-4"
                        className="lg:col-span-1"
                    >
                        {stats.total === 0 ? (
                            <p className="text-muted-foreground py-4 text-center text-xs">Sin datos</p>
                        ) : (
                            <div className="space-y-2">
                                {[5, 4, 3, 2, 1].map((star) => (
                                    <div key={star} className="flex items-center gap-2">
                                        <span className="w-6 text-xs">{star}★</span>
                                        <div className="h-1.5 flex-1 rounded-full bg-muted/60">
                                            <div
                                                className="h-full rounded-full bg-amber-400"
                                                style={{
                                                    width: `${((distribution[String(star)] ?? 0) / maxDist) * 100}%`,
                                                }}
                                            />
                                        </div>
                                        <span className="w-5 text-right text-[11px] tabular-nums">
                                            {distribution[String(star)] ?? 0}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </FormSection>

                    <FormSection
                        title="Listado"
                        description="Filtra y responde cada reseña."
                        icon={<MessageSquare className="size-4" />}
                        palette={STAT_COLORS.violet}
                        contentClassName="p-4 md:p-5"
                        className="lg:col-span-2"
                    >
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                            <div className="relative max-w-xs flex-1">
                                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar por turista o comentario…"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && applyFilters({ search })}
                                    className="h-9 pl-8 text-sm"
                                />
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="cursor-pointer"
                                onClick={() => applyFilters({ search })}
                            >
                                Buscar
                            </Button>
                        </div>

                        <div className="mb-4 flex flex-wrap gap-1.5">
                            {FILTER_TABS.map((tab) => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => applyFilters({ filter: tab.key })}
                                    className={cn(
                                        'cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                                        filters.filter === tab.key
                                            ? 'border-[#cc0010]/30 bg-red-50 text-[#cc0010]'
                                            : 'border-border/60 hover:bg-muted/40',
                                    )}
                                >
                                    {tab.label}
                                </button>
                            ))}
                            {[5, 4, 3, 2, 1].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() =>
                                        applyFilters({
                                            rating: filters.rating === star ? null : star,
                                        })
                                    }
                                    className={cn(
                                        'cursor-pointer rounded-full border px-2.5 py-1 text-xs transition-colors',
                                        filters.rating === star
                                            ? 'border-amber-300 bg-amber-50 text-amber-900'
                                            : 'border-border/60 hover:bg-muted/40',
                                    )}
                                >
                                    {star}★
                                </button>
                            ))}
                        </div>

                        {reviews.data.length === 0 ? (
                            <div
                                className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-14 text-center"
                                style={{
                                    borderColor: STAT_COLORS.violet.border,
                                    background: STAT_COLORS.violet.bg,
                                }}
                            >
                                <MessageSquare className="size-10 text-muted-foreground/40" />
                                <p className="text-sm font-medium">No hay reseñas con estos filtros</p>
                            </div>
                        ) : (
                            <ul className="space-y-3">
                                {reviews.data.map((review) => (
                                    <li
                                        key={review.id}
                                        className={cn(
                                            'rounded-xl border bg-white p-4 shadow-sm',
                                            !review.has_response && 'border-amber-200/70',
                                        )}
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold">{review.user_name}</span>
                                                    <StarRating rating={review.rating} size="md" />
                                                </div>
                                                <p className="text-muted-foreground mt-0.5 text-[11px]">
                                                    {review.created_at}
                                                </p>
                                            </div>
                                            {review.has_response ? (
                                                <Badge className="border-emerald-200 bg-emerald-50 text-emerald-800">
                                                    Respondida
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-amber-800">
                                                    Pendiente
                                                </Badge>
                                            )}
                                        </div>
                                        {review.comment && (
                                            <p className="mt-2 text-sm leading-relaxed">{review.comment}</p>
                                        )}
                                        {review.owner_response && (
                                            <div className="mt-3 rounded-lg border border-border/50 bg-muted/20 px-3 py-2">
                                                <p className="text-[11px] font-medium text-[#cc0010]">
                                                    Tu respuesta · {review.owner_responded_at}
                                                </p>
                                                <p className="text-muted-foreground mt-1 text-sm">
                                                    {review.owner_response}
                                                </p>
                                            </div>
                                        )}
                                        {canRespond && (
                                            <div className="mt-3 flex justify-end">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="cursor-pointer text-[11px] text-violet-700 hover:border-violet-200 hover:bg-violet-50"
                                                    onClick={() => openRespond(review)}
                                                >
                                                    <MessageSquareReply className="size-3.5" />
                                                    {review.has_response ? 'Editar respuesta' : 'Responder'}
                                                </Button>
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}

                        {reviews.last_page > 1 && (
                            <div className="mt-4 border-t pt-4">
                                <PaginationLinks meta={reviews} only={['reviews', 'stats', 'distribution', 'filters']} />
                            </div>
                        )}
                    </FormSection>
                </div>
            </div>

            {respondTarget && (
                <ReviewResponseModal
                    open={!!respondTarget}
                    onClose={() => setRespondTarget(null)}
                    reviewerName={respondTarget.user_name}
                    rating={respondTarget.rating}
                    comment={respondTarget.comment}
                    existingResponse={respondTarget.owner_response}
                    form={responseForm}
                    onSubmit={submitResponse}
                />
            )}
        </>
    );
}

export default RestaurantReviewsPage;
