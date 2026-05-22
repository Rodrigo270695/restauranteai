import { Head, Link, usePage } from '@inertiajs/react';
import {
    BarChart3,
    Eye,
    ImageIcon,
    MessageSquareText,
    Star,
    Tag,
    TrendingUp,
    UtensilsCrossed,
} from 'lucide-react';
import { useEffect } from 'react';
import { FormSection, STAT_COLORS } from '@/components/app/owner/form-section';
import { StarRating } from '@/components/app/owner/star-rating';
import { PageHeader, type StatBadge } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AdminPanelBanner } from '@/components/layout/admin-panel-banner';
import { APP_HREF } from '@/config/app-sidebar-nav';
import type { PanelContext } from '@/lib/scoped-app-path';
import { cn } from '@/lib/utils';

type RecentReview = {
    id: number;
    rating: number;
    comment: string | null;
    user_name: string;
    created_at: string;
    has_response: boolean;
};

type Props = {
    restaurant: { id: number; name: string };
    owner: { name: string; business_name?: string | null };
    stats: {
        total_views: number;
        views_last_days: number;
        total_reviews: number;
        avg_rating: number;
        pending_responses: number;
        dishes_count: number;
        promotions_active: number;
        gallery_count: number;
        services_count: number;
        languages_count: number;
    };
    views_chart: { labels: string[]; values: number[] };
    rating_distribution: { stars: number; count: number }[];
    recent_reviews: RecentReview[];
    panel?: PanelContext;
};

function MetricCard({
    label,
    value,
    sub,
    palette,
}: {
    label: string;
    value: string | number;
    sub?: string;
    palette: (typeof STAT_COLORS)[keyof typeof STAT_COLORS];
}) {
    return (
        <div
            className="rounded-xl border p-4 shadow-sm"
            style={{ borderColor: palette.border, background: palette.bg }}
        >
            <p className="text-xs font-medium" style={{ color: palette.text }}>
                {label}
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{value}</p>
            {sub && <p className="text-muted-foreground mt-0.5 text-[11px]">{sub}</p>}
        </div>
    );
}

export function RestaurantAnalyticsPage({
    restaurant,
    owner,
    stats,
    views_chart,
    rating_distribution,
    recent_reviews,
    panel,
}: Props) {
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;
    const reviewsHref =
        panel?.mode === 'admin'
            ? `${APP_HREF.adminReviews}?restaurant_id=${restaurant.id}&filter=pending`
            : `${APP_HREF.reviews}?filter=pending`;
    const displayName = owner.business_name || restaurant.name;
    const maxViews = Math.max(...views_chart.values, 1);
    const maxRatingCount = Math.max(...rating_distribution.map((d) => d.count), 1);

    useEffect(() => {
        if (!flash?.success && !flash?.error) return;
        import('sonner').then(({ toast }) => {
            if (flash.success) toast.success(flash.success);
            if (flash.error) toast.error(flash.error);
        });
    }, [flash]);

    const statBadges: StatBadge[] = [
        { icon: <Eye className="size-3.5" />, label: 'Vistas totales', value: stats.total_views, color: STAT_COLORS.sky },
        {
            icon: <TrendingUp className="size-3.5" />,
            label: 'Vistas (14 días)',
            value: stats.views_last_days,
            color: STAT_COLORS.emerald,
        },
        {
            icon: <Star className="size-3.5" />,
            label: 'Rating',
            value: stats.avg_rating.toFixed(1),
            color: stats.avg_rating >= 4 ? STAT_COLORS.amber : STAT_COLORS.orange,
        },
        {
            icon: <MessageSquareText className="size-3.5" />,
            label: 'Reseñas',
            value: stats.total_reviews,
            color: STAT_COLORS.violet,
        },
    ];

    return (
        <>
            <Head title="Estadísticas" />
            <AdminPanelBanner panel={panel} restaurantName={restaurant.name} />

            <div className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                <PageHeader
                    title="Estadísticas"
                    description={`Rendimiento de ${displayName}: visitas, reseñas y contenido publicado.`}
                    stats={statBadges}
                    actions={
                        <Button variant="outline" size="sm" className="cursor-pointer" asChild>
                            <Link href={panel?.mode === 'admin' ? `${APP_HREF.adminReviews}?restaurant_id=${restaurant.id}` : APP_HREF.reviews}>
                                Ver reseñas
                            </Link>
                        </Button>
                    }
                />

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricCard label="Platos en carta" value={stats.dishes_count} palette={STAT_COLORS.violet} />
                    <MetricCard
                        label="Promos en vigencia"
                        value={stats.promotions_active}
                        palette={STAT_COLORS.orange}
                    />
                    <MetricCard label="Fotos en galería" value={stats.gallery_count} palette={STAT_COLORS.rose} />
                    <MetricCard
                        label="Sin responder"
                        value={stats.pending_responses}
                        sub="Reseñas pendientes"
                        palette={stats.pending_responses > 0 ? STAT_COLORS.amber : STAT_COLORS.emerald}
                    />
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                    <FormSection
                        title="Vistas (últimos 14 días)"
                        description="Interacciones tipo “view” registradas en la plataforma."
                        icon={<BarChart3 className="size-4" />}
                        palette={STAT_COLORS.sky}
                        contentClassName="p-4 md:p-5"
                    >
                        {stats.views_last_days === 0 ? (
                            <p className="py-8 text-center text-sm text-muted-foreground">
                                Aún no hay vistas registradas en este periodo.
                            </p>
                        ) : (
                            <div className="flex items-end justify-between gap-1" style={{ minHeight: 140 }}>
                                {views_chart.values.map((v, i) => (
                                    <div key={i} className="flex flex-1 flex-col items-center gap-1">
                                        <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
                                            {v > 0 ? v : ''}
                                        </span>
                                        <div
                                            className="w-full max-w-8 rounded-t-md transition-all"
                                            style={{
                                                height: `${Math.max((v / maxViews) * 120, v > 0 ? 6 : 2)}px`,
                                                background:
                                                    v > 0
                                                        ? 'linear-gradient(180deg,#0ea5e9,#0369a1)'
                                                        : '#e2e8f0',
                                            }}
                                            title={`${views_chart.labels[i]}: ${v}`}
                                        />
                                        <span className="text-muted-foreground max-w-full truncate text-[9px]">
                                            {views_chart.labels[i]}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </FormSection>

                    <FormSection
                        title="Distribución de estrellas"
                        description="Basado en reseñas visibles de turistas."
                        icon={<Star className="size-4" />}
                        palette={STAT_COLORS.amber}
                        contentClassName="p-4 md:p-5"
                    >
                        {stats.total_reviews === 0 ? (
                            <p className="py-8 text-center text-sm text-muted-foreground">
                                Sin reseñas aún. Cuando lleguen, verás el detalle aquí.
                            </p>
                        ) : (
                            <div className="space-y-2.5">
                                {[...rating_distribution].reverse().map((row) => (
                                    <div key={row.stars} className="flex items-center gap-2">
                                        <span className="w-8 text-xs font-medium">{row.stars}★</span>
                                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted/60">
                                            <div
                                                className="h-full rounded-full bg-amber-400 transition-all"
                                                style={{
                                                    width: `${(row.count / maxRatingCount) * 100}%`,
                                                }}
                                            />
                                        </div>
                                        <span className="w-6 text-right text-xs tabular-nums text-muted-foreground">
                                            {row.count}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </FormSection>
                </div>

                <FormSection
                    title="Resumen del perfil"
                    description="Servicios e idiomas configurados en tu local."
                    icon={<UtensilsCrossed className="size-4" />}
                    palette={STAT_COLORS.emerald}
                    contentClassName="p-4 md:p-5"
                >
                    <div className="flex flex-wrap gap-3">
                        <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
                            <ImageIcon className="size-3.5" />
                            {stats.gallery_count} fotos
                        </Badge>
                        <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
                            <Tag className="size-3.5" />
                            {stats.services_count} servicios
                        </Badge>
                        <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
                            {stats.languages_count} idiomas
                        </Badge>
                    </div>
                </FormSection>

                <FormSection
                    title="Últimas reseñas"
                    description="Vista rápida. Responde desde la sección Comunidad → Reseñas."
                    icon={<MessageSquareText className="size-4" />}
                    palette={STAT_COLORS.violet}
                    contentClassName="p-4 md:p-5"
                >
                    {recent_reviews.length === 0 ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">No hay reseñas todavía.</p>
                    ) : (
                        <ul className="space-y-3">
                            {recent_reviews.map((r) => (
                                <li
                                    key={r.id}
                                    className={cn(
                                        'rounded-xl border border-border/60 bg-white/80 px-4 py-3',
                                        !r.has_response && 'border-amber-200/80 bg-amber-50/30',
                                    )}
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">{r.user_name}</span>
                                            <StarRating rating={r.rating} />
                                        </div>
                                        <span className="text-muted-foreground text-[11px]">{r.created_at}</span>
                                    </div>
                                    {r.comment && (
                                        <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">{r.comment}</p>
                                    )}
                                    {!r.has_response && (
                                        <Badge variant="outline" className="mt-2 text-[10px] text-amber-800">
                                            Pendiente de respuesta
                                        </Badge>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                    {stats.pending_responses > 0 && (
                        <div className="mt-4 flex justify-end">
                            <Button variant="brand" size="sm" className="cursor-pointer" asChild>
                                <Link href={reviewsHref}>
                                    Responder {stats.pending_responses} pendiente
                                    {stats.pending_responses !== 1 ? 's' : ''}
                                </Link>
                            </Button>
                        </div>
                    )}
                </FormSection>
            </div>
        </>
    );
}

export default RestaurantAnalyticsPage;
