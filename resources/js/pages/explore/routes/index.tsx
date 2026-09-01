import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Calendar,
    CheckCircle2,
    ChevronRight,
    Footprints,
    Heart,
    History,
    MapPin,
    Plus,
    Route,
    Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AiRouteGenerateButton } from '@/components/explore/ai-route-generate-button';
import { ExplorePageHeader } from '@/components/explore/explore-page-header';
import { RouteDraftStudio } from '@/components/explore/route-draft-studio';
import type { RouteDraftStop } from '@/components/explore/route-draft-stop-list';
import { Button } from '@/components/ui/button';
import { exploreDiscoverUrl, exploreSearchUrl } from '@/lib/explore-discover-url';
import { formatPeruDateOnly, peruLocale } from '@/lib/peru-datetime';
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
    favoritedRouteIds?: number[];
    draftRoute: {
        stops_count: number;
        generated_by_ai?: boolean;
        total_distance_km?: number | null;
        estimated_minutes?: number | null;
        path_coordinates?: [number, number][];
        stops: RouteDraftStop[];
    };
};

function formatDate(iso: string | null, locale: string) {
    if (!iso) return '—';
    try {
        return formatPeruDateOnly(iso.length === 10 ? iso : iso.slice(0, 10), peruLocale(locale));
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
    isFavorited = false,
}: {
    route: RouteItem;
    variant: 'active' | 'history';
    locale: string;
    t: (key: string, opts?: Record<string, unknown>) => string;
    compact?: boolean;
    isFavorited?: boolean;
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
                            <div className="flex shrink-0 items-center">
                            <button
                                type="button"
                                className="cursor-pointer rounded-lg p-1.5 text-gray-400 transition hover:bg-orange-50 hover:text-brand-orange"
                                aria-label={isFavorited ? t('explore.unfavorite') : t('explore.favorite')}
                                onClick={() => router.post(`/explore/favorites/routes/${route.slug}`)}
                            >
                                <Heart className={cn('size-4', isFavorited && 'fill-red-500 text-red-500')} />
                            </button>
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

function RoutesIndex({ activeRoutes, historyRoutes, draftRoute, favoritedRouteIds = [] }: Props) {
    const { t, i18n } = useTranslation();
    const { url } = usePage();
    const tab: 'active' | 'history' = url.includes('tab=history') ? 'history' : 'active';
    const [routeName, setRouteName] = useState('Mi ruta en Chiclayo');
    const [routeDate, setRouteDate] = useState(new Date().toISOString().slice(0, 10));
    const [stops, setStops] = useState<RouteDraftStop[]>(draftRoute.stops);
    const [removingSlug, setRemovingSlug] = useState<string | null>(null);

    useEffect(() => {
        setStops(draftRoute.stops);
    }, [draftRoute.stops]);

    const setTab = (next: 'active' | 'history') => {
        router.get(
            '/explore/routes',
            next === 'history' ? { tab: 'history' } : {},
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const list = tab === 'active' ? activeRoutes : historyRoutes;
    const totalActive = activeRoutes.length;
    const totalHistory = historyRoutes.length;
    const isHistory = tab === 'history';

    return (
        <>
            <Head title={isHistory ? t('explore.routes_history') : t('explore.nav_routes')} />
            <div className="bg-[#f4f6fb] pb-28">
                <div className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
                    <ExplorePageHeader
                        title={isHistory ? t('explore.routes_history') : t('explore.nav_routes')}
                        subtitle={
                            isHistory
                                ? t('explore.routes_history_subtitle')
                                : t('explore.routes_subtitle')
                        }
                        backHref={isHistory ? '/explore/routes' : exploreSearchUrl()}
                    />

                    {!isHistory && (
                        <>
                    <AiRouteGenerateButton />

                    {stops.length > 0 && (
                        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_12px_40px_rgba(0,35,102,0.08)] sm:p-6">
                            <RouteDraftStudio
                                stops={stops}
                                generatedByAi={Boolean(draftRoute.generated_by_ai)}
                                totalKm={draftRoute.total_distance_km}
                                totalMin={draftRoute.estimated_minutes}
                                path={draftRoute.path_coordinates ?? []}
                                routeName={routeName}
                                setRouteName={setRouteName}
                                routeDate={routeDate}
                                setRouteDate={setRouteDate}
                                removingSlug={removingSlug}
                                onPublish={() => {
                                    router.post(publishRoute.url(), { name: routeName, route_date: routeDate });
                                }}
                                onMove={(slug, direction) => {
                                    const from = stops.findIndex(s => s.restaurant.slug === slug);
                                    const to = from + direction;
                                    if (from < 0 || to < 0 || to >= stops.length) {
                                        return;
                                    }
                                    const next = [...stops];
                                    const [item] = next.splice(from, 1);
                                    next.splice(to, 0, item);
                                    const ordered = next.map((s, index) => ({ ...s, position: index + 1 }));
                                    setStops(ordered);
                                    router.put(
                                        '/explore/routes/stops/order',
                                        { slugs: ordered.map(s => s.restaurant.slug) },
                                        { preserveScroll: true, only: ['draftRoute'] },
                                    );
                                }}
                                onRemove={(slug) => {
                                    setRemovingSlug(slug);
                                    setStops(
                                        stops
                                            .filter(s => s.restaurant.slug !== slug)
                                            .map((s, index) => ({ ...s, position: index + 1 })),
                                    );
                                    router.delete(`/explore/routes/stops/${slug}`, {
                                        preserveScroll: true,
                                        only: ['draftRoute'],
                                        onFinish: () => setRemovingSlug(null),
                                    });
                                }}
                            />
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
                        </>
                    )}

                    {!isHistory && (
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
                    )}

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
                                    isFavorited={favoritedRouteIds.includes(r.id)}
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
