import { Head, Link } from '@inertiajs/react';
import { BarChart3, Building2, Eye, MessageSquareText, Star, Store } from 'lucide-react';
import { PageHeader, STAT_COLORS, type StatBadge } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { APP_HREF } from '@/config/app-sidebar-nav';
import { appBreadcrumbs } from '@/lib/app-breadcrumbs';
type TopRestaurant = {
    id: number;
    name: string;
    owner_name: string | null;
    total_views: number;
    total_reviews: number;
    avg_rating: number;
    is_active: boolean;
    is_verified: boolean;
};

type Props = {
    stats: {
        restaurants_total: number;
        restaurants_active: number;
        reviews_total: number;
        views_total: number;
        views_last_days: number;
        avg_rating: number;
    };
    views_chart: { labels: string[]; values: number[] };
    top_restaurants: TopRestaurant[];
};

function Page({ stats, views_chart, top_restaurants }: Props) {
    const maxViews = Math.max(...views_chart.values, 1);
    const badges: StatBadge[] = [
        { icon: <Store className="size-3.5" />, label: 'Restaurantes', value: stats.restaurants_total, color: STAT_COLORS.violet },
        { icon: <Building2 className="size-3.5" />, label: 'Activos', value: stats.restaurants_active, color: STAT_COLORS.emerald },
        { icon: <Eye className="size-3.5" />, label: 'Vistas totales', value: stats.views_total, color: STAT_COLORS.sky },
        { icon: <MessageSquareText className="size-3.5" />, label: 'Reseñas', value: stats.reviews_total, color: STAT_COLORS.rose },
        { icon: <Star className="size-3.5" />, label: 'Promedio', value: stats.avg_rating.toFixed(1), color: STAT_COLORS.amber },
    ];

    return (
        <>
            <Head title="Estadísticas global" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title="Estadísticas de la plataforma"
                    description="Métricas agregadas de todos los restaurantes."
                    stats={badges}
                />

                <section className="rounded-xl border bg-white p-5 shadow-sm">
                    <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                        <BarChart3 className="size-4 text-sky-600" />
                        Vistas (últimos {views_chart.labels.length} días)
                    </h2>
                    <p className="text-muted-foreground mb-4 text-xs">
                        {stats.views_last_days} interacciones de tipo «view» en el periodo.
                    </p>
                    <div className="flex h-32 items-end gap-1">
                        {views_chart.values.map((v, i) => (
                            <div key={views_chart.labels[i]} className="flex flex-1 flex-col items-center gap-1">
                                <div
                                    className="w-full rounded-t bg-sky-400/80"
                                    style={{ height: `${(v / maxViews) * 100}%`, minHeight: v > 0 ? 4 : 0 }}
                                    title={`${v} vistas`}
                                />
                                <span className="text-[9px] text-muted-foreground">{views_chart.labels[i]}</span>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="rounded-xl border bg-white p-5 shadow-sm">
                    <h2 className="mb-4 text-sm font-semibold">Top restaurantes por vistas</h2>
                    <ul className="divide-y">
                        {top_restaurants.map((r, idx) => (
                            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                                <div className="flex items-center gap-3">
                                    <span className="text-muted-foreground w-5 text-xs tabular-nums">{idx + 1}</span>
                                    <div>
                                        <Link
                                            href={`${APP_HREF.adminRestaurants}/${r.id}`}
                                            className="font-medium hover:underline"
                                        >
                                            {r.name}
                                        </Link>
                                        {r.owner_name && (
                                            <p className="text-muted-foreground text-xs">{r.owner_name}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                    <span className="tabular-nums">{r.total_views} vistas</span>
                                    <span className="tabular-nums">{r.avg_rating}★</span>
                                    {r.is_active && <Badge variant="outline">Activo</Badge>}
                                    {r.is_verified && <Badge variant="secondary">Verificado</Badge>}
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>
            </div>
        </>
    );
}

export default Page;
Page.layout = { breadcrumbs: appBreadcrumbs('Estadísticas global', APP_HREF.adminAnalytics) };
