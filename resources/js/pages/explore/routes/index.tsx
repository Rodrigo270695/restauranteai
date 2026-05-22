import { Head, Link, router } from '@inertiajs/react';
import { Calendar, CheckCircle2, History, MapPin, Plus, Route, Trash2 } from 'lucide-react';
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
        return new Date(iso).toLocaleDateString(locale === 'en' ? 'en-US' : 'es-PE', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    } catch {
        return iso;
    }
}

function RoutesIndex({ activeRoutes, historyRoutes, draftRoute }: Props) {
    const { t, i18n } = useTranslation();
    const [tab, setTab] = useState<'active' | 'history'>('active');
    const [routeName, setRouteName] = useState('Mi ruta en Chiclayo');
    const [routeDate, setRouteDate] = useState(new Date().toISOString().slice(0, 10));

    const list = tab === 'active' ? activeRoutes : historyRoutes;

    return (
        <>
            <Head title={t('explore.nav_routes')} />
            <div className="space-y-4 p-4 pb-24">
                <ExplorePageHeader
                    title={t('explore.nav_routes')}
                    subtitle={t('explore.routes_subtitle')}
                    backHref={exploreDiscoverUrl()}
                />

                {draftRoute.stops_count > 0 && (
                    <div className="rounded-2xl border border-dashed border-orange-300 bg-gradient-to-br from-orange-50 to-white p-4">
                        <p className="text-sm font-bold text-gray-900">
                            {t('explore.route_draft', { count: draftRoute.stops_count })}
                        </p>
                        <p className="mt-1 text-xs text-gray-600">
                            {draftRoute.stops.map(s => s.restaurant.name).join(' → ')}
                        </p>
                        <form
                            className="mt-3 space-y-2"
                            onSubmit={e => {
                                e.preventDefault();
                                router.post(publishRoute.url(), { name: routeName, route_date: routeDate });
                            }}
                        >
                            <Input
                                value={routeName}
                                onChange={e => setRouteName(e.target.value)}
                                className="rounded-xl bg-white"
                                placeholder={t('explore.route_name_placeholder')}
                            />
                            <Input
                                type="date"
                                value={routeDate}
                                onChange={e => setRouteDate(e.target.value)}
                                className="rounded-xl bg-white"
                            />
                            <Button type="submit" className="w-full rounded-xl bg-[#E8001A] text-white">
                                {t('explore.publish_route')}
                            </Button>
                        </form>
                    </div>
                )}

                <Button className="h-12 w-full rounded-2xl bg-[#E8001A] text-white shadow-md" asChild>
                    <Link href={exploreDiscoverUrl()}>
                        <Plus className="mr-2 size-4" />
                        {t('explore.create_route_cta')}
                    </Link>
                </Button>

                <div className="flex rounded-2xl bg-white p-1 shadow-sm ring-1 ring-orange-100">
                    <button
                        type="button"
                        onClick={() => setTab('active')}
                        className={cn(
                            'flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold',
                            tab === 'active' ? 'bg-[#E8001A] text-white' : 'text-gray-600',
                        )}
                    >
                        <Route className="size-4" />
                        {t('explore.routes_active')} ({activeRoutes.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab('history')}
                        className={cn(
                            'flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold',
                            tab === 'history' ? 'bg-[#E8001A] text-white' : 'text-gray-600',
                        )}
                    >
                        <History className="size-4" />
                        {t('explore.routes_history')} ({historyRoutes.length})
                    </button>
                </div>

                <div className="space-y-3">
                    {list.length === 0 && (
                        <p className="rounded-2xl bg-white p-8 text-center text-sm text-gray-500 ring-1 ring-gray-100">
                            {tab === 'active' ? t('explore.no_routes_yet') : t('explore.no_route_history')}
                        </p>
                    )}
                    {list.map(r => (
                        <div
                            key={r.id}
                            className={cn(
                                'overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md',
                                r.is_completed ? 'border-gray-100' : 'border-orange-100',
                            )}
                        >
                            <Link href={routeShow.url(r.slug)} className="block p-4">
                                <div className="flex items-start justify-between gap-2">
                                    <p className="font-bold text-gray-900">{r.name}</p>
                                    {r.is_completed && (
                                        <span className="flex shrink-0 items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700">
                                            <CheckCircle2 className="size-3" />
                                            {t('explore.route_done')}
                                        </span>
                                    )}
                                </div>
                                <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="size-3 text-[#E8001A]" />
                                        {formatDate(r.route_date, i18n.language)}
                                    </span>
                                    <span>{r.stops_count} {t('explore.stops_label')}</span>
                                    {r.total_distance_km != null && (
                                        <span className="flex items-center gap-0.5">
                                            <MapPin className="size-3" />
                                            {r.total_distance_km} km
                                        </span>
                                    )}
                                    {r.estimated_minutes != null && <span>~{r.estimated_minutes} min</span>}
                                </p>
                            </Link>
                            <div className="flex border-t border-gray-50">
                                <button
                                    type="button"
                                    className="flex flex-1 items-center justify-center gap-1 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50"
                                    onClick={() => {
                                        if (confirm(t('explore.confirm_delete_route'))) {
                                            router.delete(destroyRoute.url(r.id));
                                        }
                                    }}
                                >
                                    <Trash2 className="size-3.5" />
                                    {t('explore.delete_route')}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}

RoutesIndex.layout = (page: React.ReactNode) => <TouristExploreLayout>{page}</TouristExploreLayout>;

export default RoutesIndex;
