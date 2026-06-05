import { Head, Link, router } from '@inertiajs/react';
import {
    Calendar,
    CheckCircle2,
    ChevronRight,
    Footprints,
    History,
    MapPin,
    Plus,
    Route,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ExplorePageHeader } from '@/components/explore/explore-page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { exploreDiscoverUrl } from '@/lib/explore-discover-url';
import { cn } from '@/lib/utils';
import TouristExploreLayout from '@/layouts/tourist-explore-layout';
import { show as routeShow, publish as publishRoute, destroy as destroyRoute } from '@/routes/explore/routes';

type RouteItem = {
    id: number;
    name: string;
    slug: string;
    stops_count: number;
    visited_count: number;
    stop_previews: string[];
    total_distance_km: number | null;
    estimated_minutes: number | null;
    route_date: string | null;
    completed_at: string | null;
    is_completed: boolean;
};

type Props = {
    activeRoutes: RouteItem[];
    historyRoutes: RouteItem[];
    draftRoute: {
        stops_count: number;
        stops: Array<{ restaurant: { name: string } }>;
    };
};

function formatDate(iso: string | null, locale: string) {
    if (!iso) return '—';
    try {
        return new Date(iso + (iso.length === 10 ? 'T12:00:00' : '')).toLocaleDateString(
            locale === 'en' ? 'en-US' : 'es-PE',
            { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' },
        );
    } catch {
        return iso;
    }
}

function RouteStatChip({
    icon: Icon,
    label,
    value,
    accent,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
    accent?: string;
}) {
    return (
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-gray-50 px-2.5 py-2 ring-1 ring-gray-100">
            <Icon className={cn('size-3.5 shrink-0', accent ?? 'text-brand-orange')} />
            <div className="min-w-0">
                <p className="text-[9px] font-medium uppercase tracking-wide text-gray-400">{label}</p>
                <p className="truncate text-xs font-bold text-gray-900">{value}</p>
            </div>
        </div>
    );
}

function RouteListCard({
    route,
    variant,
    locale,
    t,
    compact = false,
}: {
    route: RouteItem;
    variant: 'active' | 'history';
    locale: string;
    t: (key: string, opts?: Record<string, unknown>) => string;
    compact?: boolean;
}) {
    const progress =
        route.stops_count > 0 ? Math.min(100, (route.visited_count / route.stops_count) * 100) : 0;
    const previews = route.stop_previews?.length
        ? route.stop_previews
        : [];
    const previewText =
        previews.length > 0
            ? previews.slice(0, 3).join(' → ') + (previews.length > 3 ? '…' : '')
            : null;

    return (
        <article
            className={cn(
                'overflow-hidden rounded-2xl bg-white shadow-sm ring-1 transition hover:shadow-md',
                route.is_completed ? 'ring-gray-100' : 'ring-orange-100',
            )}
        >
            <div className={cn('p-4', compact && 'p-3')}>
                <div className="flex items-start gap-2.5">
                    <div
                        className={cn(
                            'flex shrink-0 items-center justify-center rounded-xl',
                            compact ? 'size-9' : 'size-11',
                            route.is_completed
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-gradient-to-br from-brand-orange to-orange-400 text-white',
                        )}
                    >
                        {route.is_completed ? (
                            <CheckCircle2 className="size-5" />
                        ) : (
                            <Route className="size-5" />
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                            <h2
                                className={cn(
                                    'line-clamp-2 font-bold leading-snug text-gray-900',
                                    compact ? 'text-sm' : 'text-base',
                                )}
                            >
                                {route.name}
                            </h2>
                            <button
                                type="button"
                                className="shrink-0 cursor-pointer rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                                aria-label={t('explore.delete_route')}
                                onClick={() => {
                                    if (confirm(t('explore.confirm_delete_route'))) {
                                        router.delete(destroyRoute.url(route.id));
                                    }
                                }}
                            >
                                <Trash2 className="size-4" />
                            </button>
                        </div>
                        <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                            <Calendar className="size-3 shrink-0 text-brand-orange" />
                            {formatDate(
                                variant === 'history' && route.completed_at
                                    ? route.completed_at.slice(0, 10)
                                    : route.route_date,
                                locale,
                            )}
                            {route.is_completed && (
                                <span className="ml-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                    {t('explore.route_done')}
                                </span>
                            )}
                        </p>
                    </div>
                </div>

                {previewText && (
                    <p className="mt-3 line-clamp-2 rounded-xl bg-orange-50/60 px-3 py-2 text-xs text-gray-700 ring-1 ring-orange-100/80">
                        {previewText}
                    </p>
                )}

                <div className={cn('mt-3 flex gap-1.5', compact ? 'flex-col' : 'flex-row')}>
                    <RouteStatChip
                        icon={MapPin}
                        label={t('explore.stops_label')}
                        value={String(route.stops_count)}
                    />
                    {route.total_distance_km != null && route.total_distance_km > 0 && (
                        <RouteStatChip
                            icon={MapPin}
                            label="km"
                            value={String(route.total_distance_km)}
                            accent="text-sky-500"
                        />
                    )}
                    {route.estimated_minutes != null && (
                        <RouteStatChip
                            icon={Footprints}
                            label="min"
                            value={`~${route.estimated_minutes}`}
                            accent="text-emerald-600"
                        />
                    )}
                </div>

                {variant === 'active' && !route.is_completed && route.stops_count > 0 && (
                    <div className="mt-3">
                        <div className="mb-1 flex items-center justify-between text-[10px] font-medium text-gray-500">
                            <span>{t('explore.routes_progress', { visited: route.visited_count, total: route.stops_count })}</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-brand-orange to-amber-400 transition-all"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className={cn('border-t border-gray-50 px-4 py-3', compact && 'px-3 py-2.5')}>
                <Button
                    className={cn(
                        'w-full cursor-pointer rounded-xl bg-gray-900 text-white hover:bg-gray-800',
                        compact ? 'h-9 text-xs' : 'h-11',
                    )}
                    asChild
                >
                    <Link href={routeShow.url(route.slug)} className="cursor-pointer">
                        {variant === 'history' || route.is_completed
                            ? t('explore.routes_view')
                            : t('explore.routes_continue')}
                        <ChevronRight className="ml-auto size-4" />
                    </Link>
                </Button>
            </div>
        </article>
    );
}

function RoutesIndex({ activeRoutes, historyRoutes, draftRoute }: Props) {
    const { t, i18n } = useTranslation();
    const [tab, setTab] = useState<'active' | 'history'>('active');
    const [routeName, setRouteName] = useState('Mi ruta en Chiclayo');
    const [routeDate, setRouteDate] = useState(new Date().toISOString().slice(0, 10));

    const list = tab === 'active' ? activeRoutes : historyRoutes;
    const totalActive = activeRoutes.length;
    const totalHistory = historyRoutes.length;

    return (
        <>
            <Head title={t('explore.nav_routes')} />
            <div className="min-h-screen bg-gradient-to-b from-orange-50/50 via-gray-50 to-gray-100 pb-28">
                <div className="space-y-5 p-4">
                    <ExplorePageHeader
                        title={t('explore.nav_routes')}
                        subtitle={t('explore.routes_subtitle')}
                        backHref={exploreDiscoverUrl()}
                    />

                    {draftRoute.stops_count > 0 && (
                        <div className="overflow-hidden rounded-2xl border-2 border-dashed border-orange-300 bg-gradient-to-br from-orange-50 via-white to-orange-50/30 shadow-sm">
                            <div className="border-b border-orange-100/80 bg-white/60 px-4 py-3">
                                <p className="text-sm font-bold text-gray-900">
                                    {t('explore.route_draft', { count: draftRoute.stops_count })}
                                </p>
                                <p className="mt-1 line-clamp-2 text-xs text-gray-600">
                                    {draftRoute.stops.map(s => s.restaurant.name).join(' → ')}
                                </p>
                            </div>
                            <form
                                className="space-y-2 p-4"
                                onSubmit={e => {
                                    e.preventDefault();
                                    router.post(publishRoute.url(), { name: routeName, route_date: routeDate });
                                }}
                            >
                                <Input
                                    value={routeName}
                                    onChange={e => setRouteName(e.target.value)}
                                    className="rounded-xl border-orange-100 bg-white"
                                    placeholder={t('explore.route_name_placeholder')}
                                />
                                <Input
                                    type="date"
                                    value={routeDate}
                                    onChange={e => setRouteDate(e.target.value)}
                                    className="rounded-xl border-orange-100 bg-white"
                                />
                                <Button
                                    type="submit"
                                    className="h-11 w-full cursor-pointer rounded-xl bg-brand-orange text-white shadow-md hover:bg-brand-orange-dark"
                                >
                                    {t('explore.publish_route')}
                                </Button>
                            </form>
                        </div>
                    )}

                    <Button
                        className="h-12 w-full cursor-pointer rounded-2xl bg-gray-900 text-white shadow-lg hover:bg-gray-800"
                        asChild
                    >
                        <Link href={exploreDiscoverUrl()} className="cursor-pointer">
                            <Plus className="mr-2 size-4" />
                            {t('explore.create_route_cta')}
                        </Link>
                    </Button>

                    <div className="flex rounded-2xl bg-white p-1 shadow-sm ring-1 ring-orange-100">
                        <button
                            type="button"
                            onClick={() => setTab('active')}
                            className={cn(
                                'flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition',
                                tab === 'active'
                                    ? 'bg-brand-orange text-white shadow-sm'
                                    : 'text-gray-600 hover:bg-orange-50',
                            )}
                        >
                            <Route className="size-4" />
                            {t('explore.routes_active')} ({totalActive})
                        </button>
                        <button
                            type="button"
                            onClick={() => setTab('history')}
                            className={cn(
                                'flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition',
                                tab === 'history'
                                    ? 'bg-brand-orange text-white shadow-sm'
                                    : 'text-gray-600 hover:bg-orange-50',
                            )}
                        >
                            <History className="size-4" />
                            {t('explore.routes_history')} ({totalHistory})
                        </button>
                    </div>

                    {list.length === 0 ? (
                        <div className="col-span-2 rounded-2xl bg-white px-6 py-10 text-center shadow-sm ring-1 ring-gray-100">
                            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-orange-50 text-brand-orange">
                                {tab === 'active' ? <Route className="size-7" /> : <History className="size-7" />}
                            </div>
                            <p className="mt-4 text-sm font-bold text-gray-900">
                                {tab === 'active'
                                    ? t('explore.routes_empty_active_title')
                                    : t('explore.routes_empty_history_title')}
                            </p>
                            <p className="mt-2 text-sm text-gray-500">
                                {tab === 'active'
                                    ? t('explore.routes_empty_active_hint')
                                    : t('explore.no_route_history')}
                            </p>
                            {tab === 'active' && (
                                <Button className="mt-5 rounded-xl bg-brand-orange text-white" asChild>
                                    <Link href={exploreDiscoverUrl()}>{t('explore.create_route_cta')}</Link>
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {list.map(r => (
                                <RouteListCard
                                    key={r.id}
                                    route={r}
                                    variant={tab}
                                    locale={i18n.language}
                                    t={t}
                                    compact
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

RoutesIndex.layout = (page: React.ReactNode) => <TouristExploreLayout>{page}</TouristExploreLayout>;

export default RoutesIndex;
