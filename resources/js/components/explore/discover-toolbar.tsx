import { List, Map as MapIcon, MapPin, PanelRightOpen, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type District = { id: number; name: string };

type Props = {
    search: string;
    onSearchChange: (value: string) => void;
    onSearchSubmit: () => void;
    districts: District[];
    districtId: number | null;
    onDistrictChange: (id: number | null) => void;
    sort: string;
    onSortChange: (sort: string) => void;
    view?: 'list' | 'map';
    onViewChange?: (view: 'list' | 'map') => void;
    routePanelOpen?: boolean;
    onToggleRoutePanel?: () => void;
    routeStopsCount?: number;
};

export function DiscoverToolbar({
    search,
    onSearchChange,
    onSearchSubmit,
    districts,
    districtId,
    onDistrictChange,
    sort,
    onSortChange,
    view,
    onViewChange,
    routePanelOpen = false,
    onToggleRoutePanel,
    routeStopsCount = 0,
}: Props) {
    const { t } = useTranslation();

    return (
        <div className="space-y-3">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-brand-blue lg:text-[1.75rem]">
                    {t('explore.explore_title')}{' '}
                    <span className="text-brand-orange">{t('explore.explore_title_accent')}</span>
                </h1>
                <p className="mt-0.5 text-sm text-gray-500">{t('explore.explore_subtitle')}</p>
            </div>

            <div className="flex min-w-0 flex-wrap items-center gap-2">
                <div className="relative min-w-[14rem] flex-1">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                    <Input
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && onSearchSubmit()}
                        placeholder={t('explore.search_placeholder')}
                        className="h-11 rounded-xl border-gray-200 bg-white pl-10 text-sm shadow-sm"
                    />
                </div>
                <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-brand-orange" />
                    <select
                        value={districtId ?? ''}
                        onChange={(e) => onDistrictChange(e.target.value ? Number(e.target.value) : null)}
                        className="h-11 max-w-[15rem] appearance-none rounded-xl border border-gray-200 bg-white py-2 pr-8 pl-8 text-sm text-gray-700 shadow-sm"
                    >
                        <option value="">{t('home.location_fallback')}</option>
                        {districts.map((d) => (
                            <option key={d.id} value={d.id}>
                                {d.name}
                            </option>
                        ))}
                    </select>
                </div>
                <select
                    value={sort}
                    onChange={(e) => onSortChange(e.target.value)}
                    className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 shadow-sm"
                >
                    <option value="relevant">{t('explore.sort_relevant')}</option>
                    <option value="distance">{t('explore.sort_distance')}</option>
                    <option value="rating">{t('explore.sort_rating')}</option>
                    <option value="name">{t('explore.sort_name')}</option>
                </select>
                {onViewChange && view && (
                <div className="flex overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <button
                        type="button"
                        onClick={() => onViewChange('list')}
                        className={cn(
                            'inline-flex cursor-pointer items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold',
                            view === 'list' ? 'bg-brand-blue text-white' : 'text-gray-500 hover:bg-gray-50',
                        )}
                    >
                        <List className="size-3.5" />
                        {t('explore.view_list')}
                    </button>
                    <button
                        type="button"
                        onClick={() => onViewChange('map')}
                        className={cn(
                            'inline-flex cursor-pointer items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold',
                            view === 'map' ? 'bg-brand-blue text-white' : 'text-gray-500 hover:bg-gray-50',
                        )}
                    >
                        <MapIcon className="size-3.5" />
                        {t('explore.view_map')}
                    </button>
                </div>
                )}
                {onToggleRoutePanel && (
                    <button
                        type="button"
                        onClick={onToggleRoutePanel}
                        className={cn(
                            'inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold shadow-sm',
                            routePanelOpen
                                ? 'border-brand-orange bg-orange-50 text-brand-orange'
                                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50',
                        )}
                    >
                        <PanelRightOpen className="size-3.5" />
                        {t('explore.your_list_fab', { count: routeStopsCount })}
                    </button>
                )}
            </div>
        </div>
    );
}
