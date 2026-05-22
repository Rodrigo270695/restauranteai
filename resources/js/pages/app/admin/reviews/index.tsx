import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Building2, MessageSquare, MessageSquareReply, Search, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    ReviewResponseModal,
    type ReviewResponseFormData,
} from '@/components/app/owner/review-response-modal';
import { StarRating } from '@/components/app/owner/star-rating';
import { PageHeader, STAT_COLORS, type StatBadge } from '@/components/shared/page-header';
import { PaginationLinks, type PaginationMeta } from '@/components/shared/pagination-links';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { APP_HREF } from '@/config/app-sidebar-nav';
import { useCan } from '@/hooks/use-can';
import { appBreadcrumbs } from '@/lib/app-breadcrumbs';
import { cn } from '@/lib/utils';

type ReviewRow = {
    id: number;
    rating: number;
    comment: string | null;
    user_name: string;
    restaurant_id: number;
    restaurant_name: string;
    created_at: string;
    owner_response: string | null;
    owner_responded_at: string | null;
    has_response: boolean;
};

type Props = {
    reviews: PaginationMeta & { data: ReviewRow[] };
    restaurants: { id: number; name: string }[];
    stats: { total: number; pending: number; avg_rating: number };
    filters: {
        search: string;
        rating: number | null;
        filter: 'all' | 'pending' | 'answered';
        restaurant_id: number | null;
    };
};

const BASE = APP_HREF.adminReviews;
const FILTER_TABS: { key: Props['filters']['filter']; label: string }[] = [
    { key: 'all', label: 'Todas' },
    { key: 'pending', label: 'Sin responder' },
    { key: 'answered', label: 'Respondidas' },
];

function Page({ reviews, restaurants, stats, filters }: Props) {
    const can = useCan();
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

    const statBadges: StatBadge[] = [
        { icon: <MessageSquare className="size-3.5" />, label: 'Total', value: stats.total, color: STAT_COLORS.violet },
        { icon: <Star className="size-3.5" />, label: 'Promedio', value: stats.avg_rating.toFixed(1), color: STAT_COLORS.amber },
        { icon: <MessageSquareReply className="size-3.5" />, label: 'Pendientes', value: stats.pending, color: STAT_COLORS.orange },
    ];

    const applyFilters = (patch: Partial<Props['filters']>) => {
        router.get(
            BASE,
            {
                search: patch.search ?? filters.search,
                rating: patch.rating !== undefined ? patch.rating : filters.rating,
                filter: patch.filter ?? filters.filter,
                restaurant_id: patch.restaurant_id !== undefined ? patch.restaurant_id : filters.restaurant_id,
                per_page: reviews.per_page,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const submitResponse = (e: React.FormEvent) => {
        e.preventDefault();
        if (!respondTarget) return;
        responseForm.put(`${BASE}/${respondTarget.id}/respond`, {
            preserveScroll: true,
            onSuccess: () => {
                setRespondTarget(null);
                responseForm.reset();
            },
        });
    };

    return (
        <>
            <Head title="Reseñas (plataforma)" />
            <div className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                <PageHeader
                    title="Reseñas de la plataforma"
                    description="Todas las opiniones de turistas. Puedes responder en nombre del restaurante."
                    stats={statBadges}
                />

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                    <div className="relative max-w-xs flex-1">
                        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Buscar…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters({ search })}
                            className="h-9 pl-8 text-sm"
                        />
                    </div>
                    <select
                        className="h-9 rounded-md border px-2 text-sm"
                        value={filters.restaurant_id ?? ''}
                        onChange={(e) =>
                            applyFilters({
                                restaurant_id: e.target.value ? Number(e.target.value) : null,
                            })
                        }
                    >
                        <option value="">Todos los restaurantes</option>
                        {restaurants.map((r) => (
                            <option key={r.id} value={r.id}>
                                {r.name}
                            </option>
                        ))}
                    </select>
                    <Button type="button" variant="outline" size="sm" onClick={() => applyFilters({ search })}>
                        Buscar
                    </Button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                    {FILTER_TABS.map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => applyFilters({ filter: tab.key })}
                            className={cn(
                                'cursor-pointer rounded-full border px-3 py-1 text-xs font-medium',
                                filters.filter === tab.key
                                    ? 'border-[#cc0010]/30 bg-red-50 text-[#cc0010]'
                                    : 'border-border/60 hover:bg-muted/40',
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <ul className="space-y-3">
                    {reviews.data.length === 0 ? (
                        <li className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
                            Sin reseñas con estos filtros.
                        </li>
                    ) : (
                        reviews.data.map((review) => (
                            <li key={review.id} className="rounded-xl border bg-white p-4 shadow-sm">
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold">{review.user_name}</span>
                                            <StarRating rating={review.rating} size="md" />
                                        </div>
                                        <p className="text-muted-foreground mt-0.5 flex items-center gap-1 text-[11px]">
                                            <Building2 className="size-3" />
                                            {review.restaurant_name} · {review.created_at}
                                        </p>
                                    </div>
                                    {review.has_response ? (
                                        <Badge className="bg-emerald-50 text-emerald-800">Respondida</Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-amber-800">
                                            Pendiente
                                        </Badge>
                                    )}
                                </div>
                                {review.comment && <p className="mt-2 text-sm">{review.comment}</p>}
                                {review.owner_response && (
                                    <div className="mt-3 rounded-lg border bg-muted/20 px-3 py-2 text-sm">
                                        <p className="text-[11px] font-medium text-[#cc0010]">
                                            Respuesta · {review.owner_responded_at}
                                        </p>
                                        <p className="text-muted-foreground mt-1">{review.owner_response}</p>
                                    </div>
                                )}
                                {can('reviews.view') && (
                                    <div className="mt-3 flex justify-end">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="cursor-pointer text-xs"
                                            onClick={() => {
                                                setRespondTarget(review);
                                                responseForm.setData('owner_response', review.owner_response ?? '');
                                            }}
                                        >
                                            {review.has_response ? 'Editar respuesta' : 'Responder'}
                                        </Button>
                                    </div>
                                )}
                            </li>
                        ))
                    )}
                </ul>

                {reviews.last_page > 1 && (
                    <PaginationLinks meta={reviews} only={['reviews', 'stats', 'filters', 'restaurants']} />
                )}
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

export default Page;
Page.layout = { breadcrumbs: appBreadcrumbs('Reseñas (plataforma)', BASE) };
