import { ChevronDown, ChevronUp, Star, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export type RouteDraftStop = {
    position: number;
    restaurant: {
        name: string;
        slug: string;
        cover_url?: string | null;
        avg_rating?: number;
        cuisines?: Array<{ name: string }>;
        latitude?: number | null;
        longitude?: number | null;
        short_description?: string | null;
    };
};

type Props = {
    stops: RouteDraftStop[];
    onRemove: (slug: string) => void;
    onMove: (slug: string, direction: -1 | 1) => void;
    removingSlug?: string | null;
};

function stopRole(index: number, total: number, t: (key: string) => string) {
    if (index === 0) {
        return { label: t('explore.route_start_short'), className: 'bg-green-600 text-white' };
    }
    if (total > 1 && index === total - 1) {
        return { label: t('explore.route_end_short'), className: 'bg-brand-orange text-white' };
    }

    return { label: t('explore.route_stop_short'), className: 'bg-amber-500 text-white' };
}

export function RouteDraftStopList({ stops, onRemove, onMove, removingSlug = null }: Props) {
    const { t } = useTranslation();

    return (
        <div className="space-y-2">
            {stops.map((stop, index) => {
                const role = stopRole(index, stops.length, t);
                const cuisine = stop.restaurant.cuisines?.[0]?.name;

                return (
                    <article
                        key={stop.restaurant.slug}
                        className="flex overflow-hidden rounded-xl border border-orange-100 bg-white shadow-sm"
                    >
                        <div className={cn('flex w-9 shrink-0 flex-col items-center justify-center text-center', role.className)}>
                            <span className="text-base font-black leading-none">{index + 1}</span>
                            <span className="mt-0.5 px-0.5 text-[8px] font-bold uppercase leading-tight">
                                {role.label}
                            </span>
                        </div>
                        <div className="min-w-0 flex-1 p-2">
                            <div className="flex gap-2">
                                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                                    {stop.restaurant.cover_url ? (
                                        <img src={stop.restaurant.cover_url} alt="" className="size-full object-cover" />
                                    ) : (
                                        <div className="flex size-full items-center justify-center text-[9px] text-gray-400">
                                            Sin foto
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="line-clamp-1 text-sm font-semibold text-brand-blue">
                                        {stop.restaurant.name}
                                    </p>
                                    {cuisine && (
                                        <p className="line-clamp-1 text-[10px] font-medium text-sky-700">{cuisine}</p>
                                    )}
                                    {stop.restaurant.avg_rating != null && (
                                        <p className="mt-0.5 inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-700">
                                            <Star className="size-3 fill-amber-400 text-amber-400" />
                                            {stop.restaurant.avg_rating}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="mt-1.5 flex items-center justify-between">
                                <div className="flex items-center gap-0.5">
                                    <button
                                        type="button"
                                        disabled={index === 0}
                                        onClick={() => onMove(stop.restaurant.slug, -1)}
                                        className="flex size-7 cursor-pointer items-center justify-center rounded-md text-gray-400 hover:bg-orange-50 hover:text-brand-blue disabled:cursor-not-allowed disabled:opacity-30"
                                        aria-label={t('explore.move_stop_up')}
                                    >
                                        <ChevronUp className="size-4" />
                                    </button>
                                    <button
                                        type="button"
                                        disabled={index === stops.length - 1}
                                        onClick={() => onMove(stop.restaurant.slug, 1)}
                                        className="flex size-7 cursor-pointer items-center justify-center rounded-md text-gray-400 hover:bg-orange-50 hover:text-brand-blue disabled:cursor-not-allowed disabled:opacity-30"
                                        aria-label={t('explore.move_stop_down')}
                                    >
                                        <ChevronDown className="size-4" />
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    disabled={removingSlug === stop.restaurant.slug}
                                    onClick={() => onRemove(stop.restaurant.slug)}
                                    className="flex size-7 cursor-pointer items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600"
                                    aria-label={t('explore.remove_from_route')}
                                >
                                    <Trash2 className="size-3.5" />
                                </button>
                            </div>
                        </div>
                    </article>
                );
            })}
        </div>
    );
}
