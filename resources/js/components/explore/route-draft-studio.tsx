import { Calendar, ChevronDown, ChevronUp, Clock, Footprints, Route, Star, Trash2, UtensilsCrossed } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ExploreRouteMap } from '@/components/explore/explore-route-map';
import type { RouteDraftStop } from '@/components/explore/route-draft-stop-list';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDistanceKm, kmBetween } from '@/lib/geo-distance';
import { cn } from '@/lib/utils';

type Props = {
    stops: RouteDraftStop[];
    generatedByAi?: boolean;
    totalKm?: number | null;
    totalMin?: number | null;
    path?: [number, number][];
    routeName: string;
    setRouteName: (value: string) => void;
    routeDate: string;
    setRouteDate: (value: string) => void;
    onPublish: () => void;
    onMove: (slug: string, direction: -1 | 1) => void;
    onRemove: (slug: string) => void;
    removingSlug: string | null;
};

function StatCard({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2 text-brand-orange">
                <Icon className="size-4" />
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
            </div>
            <p className="mt-1 text-sm font-bold text-brand-blue">{value}</p>
        </div>
    );
}

export function RouteDraftStudio({
    stops,
    generatedByAi = false,
    totalKm,
    totalMin,
    path = [],
    routeName,
    setRouteName,
    routeDate,
    setRouteDate,
    onPublish,
    onMove,
    onRemove,
    removingSlug,
}: Props) {
    const { t } = useTranslation();
    const numberedStops = stops
        .filter((s) => s.restaurant.latitude != null && s.restaurant.longitude != null)
        .map((s) => ({
            position: s.position,
            lat: s.restaurant.latitude!,
            lng: s.restaurant.longitude!,
            name: s.restaurant.name,
        }));

    return (
        <section className="space-y-4">
            <div>
                <p className="text-xs font-semibold text-brand-orange">
                    {generatedByAi ? t('explore.ai_route_page_title') : t('explore.route_draft', { count: stops.length })}
                </p>
                <h2 className="mt-1 text-2xl font-bold text-brand-blue">
                    {generatedByAi ? t('explore.ai_studio_title') : t('explore.your_list_title')}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                    {generatedByAi
                        ? t('explore.ai_studio_subtitle')
                        : t('explore.your_list_desc', { count: stops.length })}
                </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    icon={Route}
                    label={t('explore.stat_distance')}
                    value={totalKm != null ? `${totalKm} km` : '—'}
                />
                <StatCard
                    icon={Clock}
                    label={t('explore.stat_time')}
                    value={totalMin != null ? `~${totalMin} min` : '—'}
                />
                <StatCard
                    icon={UtensilsCrossed}
                    label={t('explore.stat_stops')}
                    value={t('explore.stat_stops_value', { count: stops.length })}
                />
                <StatCard
                    icon={Star}
                    label={t('explore.stat_experience')}
                    value={generatedByAi ? t('explore.stat_personalized') : t('explore.stat_manual')}
                />
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
                <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
                    <p className="mb-4 text-sm font-bold text-brand-blue">{t('explore.studio_stops_tab')}</p>
                    <ol className="relative space-y-0">
                        {stops.map((stop, index) => {
                            const next = stops[index + 1];
                            const legKm =
                                stop.restaurant.latitude != null
                                && stop.restaurant.longitude != null
                                && next?.restaurant.latitude != null
                                && next.restaurant.longitude != null
                                    ? kmBetween(
                                          stop.restaurant.latitude,
                                          stop.restaurant.longitude,
                                          next.restaurant.latitude,
                                          next.restaurant.longitude,
                                      )
                                    : null;
                            const isStart = index === 0;
                            const isEnd = index === stops.length - 1 && stops.length > 1;
                            const cuisine = stop.restaurant.cuisines?.[0]?.name;

                            return (
                                <li key={stop.restaurant.slug} className="relative pl-10">
                                    {index < stops.length - 1 && (
                                        <span className="absolute top-8 bottom-0 left-[15px] border-l-2 border-dashed border-brand-orange/40" />
                                    )}
                                    <span
                                        className={cn(
                                            'absolute top-3 left-0 flex size-8 items-center justify-center rounded-full text-xs font-black text-white shadow-sm',
                                            isStart ? 'bg-green-600' : isEnd ? 'bg-brand-orange' : 'bg-brand-blue',
                                        )}
                                    >
                                        {index + 1}
                                    </span>
                                    <article className="mb-3 rounded-2xl border border-gray-100 bg-[#f8fafc] p-3">
                                        <div className="flex gap-3">
                                            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                                                {stop.restaurant.cover_url ? (
                                                    <img src={stop.restaurant.cover_url} alt="" className="size-full object-cover" />
                                                ) : (
                                                    <div className="flex size-full items-center justify-center text-[10px] text-gray-400">
                                                        Sin foto
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className="line-clamp-2 text-sm font-bold text-brand-blue">
                                                        {stop.restaurant.name}
                                                    </p>
                                                    <div className="flex shrink-0 items-center">
                                                        <button
                                                            type="button"
                                                            disabled={index === 0}
                                                            onClick={() => onMove(stop.restaurant.slug, -1)}
                                                            className="flex size-7 cursor-pointer items-center justify-center rounded-md text-gray-400 hover:bg-white hover:text-brand-blue disabled:opacity-30"
                                                            aria-label={t('explore.move_stop_up')}
                                                        >
                                                            <ChevronUp className="size-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={index === stops.length - 1}
                                                            onClick={() => onMove(stop.restaurant.slug, 1)}
                                                            className="flex size-7 cursor-pointer items-center justify-center rounded-md text-gray-400 hover:bg-white hover:text-brand-blue disabled:opacity-30"
                                                            aria-label={t('explore.move_stop_down')}
                                                        >
                                                            <ChevronDown className="size-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={removingSlug === stop.restaurant.slug}
                                                            onClick={() => onRemove(stop.restaurant.slug)}
                                                            className="flex size-7 cursor-pointer items-center justify-center rounded-md text-gray-400 hover:bg-red-50 hover:text-red-600"
                                                            aria-label={t('explore.remove_from_route')}
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                                {cuisine && (
                                                    <span className="mt-1 inline-flex rounded-md bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700">
                                                        {cuisine}
                                                    </span>
                                                )}
                                                {stop.restaurant.avg_rating != null && (
                                                    <p className="mt-1 inline-flex items-center gap-0.5 text-[11px] font-semibold text-amber-700">
                                                        <Star className="size-3 fill-amber-400 text-amber-400" />
                                                        {stop.restaurant.avg_rating}
                                                    </p>
                                                )}
                                                <p className="mt-1 text-[11px] font-medium text-emerald-700">
                                                    {isStart
                                                        ? t('explore.route_start')
                                                        : isEnd
                                                          ? t('explore.route_end')
                                                          : t('explore.route_stop_short')}
                                                </p>
                                            </div>
                                        </div>
                                    </article>
                                    {legKm != null && (
                                        <p className="mb-3 ml-1 flex items-center gap-1 text-[11px] font-medium text-gray-500">
                                            <Footprints className="size-3 text-brand-orange" />
                                            {formatDistanceKm(legKm)} km · ~{Math.max(3, Math.round(legKm * 12))} min
                                        </p>
                                    )}
                                </li>
                            );
                        })}
                    </ol>
                </div>

                <div className="space-y-3">
                    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                        <ExploreRouteMap
                            numberedStops={numberedStops}
                            path={path}
                            height="280px"
                            showLegend
                        />
                    </div>
                    <form
                        className="space-y-2 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                        onSubmit={(e) => {
                            e.preventDefault();
                            onPublish();
                        }}
                    >
                        <p className="text-sm font-bold text-brand-blue">{t('explore.studio_publish')}</p>
                        <Input
                            value={routeName}
                            onChange={(e) => setRouteName(e.target.value)}
                            className="rounded-xl border-orange-100 bg-white"
                            placeholder={t('explore.route_name_placeholder')}
                        />
                        <div className="relative">
                            <Calendar className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-gray-400" />
                            <Input
                                type="date"
                                value={routeDate}
                                onChange={(e) => setRouteDate(e.target.value)}
                                className="rounded-xl border-orange-100 bg-white pl-9"
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={!routeName.trim()}
                            className="h-11 w-full cursor-pointer rounded-xl bg-linear-to-r from-brand-blue to-brand-orange text-white shadow-md hover:brightness-105"
                        >
                            {t('explore.publish_route')}
                        </Button>
                    </form>
                </div>
            </div>
        </section>
    );
}
