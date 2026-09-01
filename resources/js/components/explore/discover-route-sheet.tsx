import { Link } from '@inertiajs/react';
import { Calendar, PanelRightClose, Route } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { RouteDraftStopList, type RouteDraftStop } from '@/components/explore/route-draft-stop-list';
import { index as exploreRoutes } from '@/routes/explore/routes';

export type DiscoverRouteStop = RouteDraftStop & {
    restaurant: RouteDraftStop['restaurant'] & {
        latitude?: number | null;
        longitude?: number | null;
    };
};

export type DiscoverRoutePanelProps = {
    stops: DiscoverRouteStop[];
    routeName: string;
    setRouteName: (value: string) => void;
    routeDate: string;
    setRouteDate: (value: string) => void;
    isPublishing: boolean;
    onPublish: () => void;
    onRemove: (slug: string) => void;
    onMove: (slug: string, direction: -1 | 1) => void;
    removingSlug: string | null;
    totalKm?: number | null;
    totalMin?: number | null;
    className?: string;
    onClose?: () => void;
};

export function DiscoverRoutePanel({
    stops,
    routeName,
    setRouteName,
    routeDate,
    setRouteDate,
    isPublishing,
    onPublish,
    onRemove,
    onMove,
    removingSlug,
    totalKm,
    totalMin,
    className,
    onClose,
}: DiscoverRoutePanelProps) {
    const { t } = useTranslation();

    return (
        <div className={cn('flex h-full min-h-0 flex-col bg-white', className)}>
            <div className="flex shrink-0 items-start justify-between gap-2 border-b border-gray-100 px-3 py-3">
                <div>
                    <p className="flex items-center gap-2 text-sm font-bold text-brand-blue">
                        <Route className="size-4 text-brand-orange" />
                        {t('explore.your_list_title')}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                        {t('explore.your_list_desc', { count: stops.length })}
                    </p>
                </div>
                {onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-brand-blue"
                        aria-label={t('explore.hide_route_panel')}
                    >
                        <PanelRightClose className="size-4" />
                    </button>
                )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-2.5 py-2.5 scrollbar-thin">
                {stops.length === 0 ? (
                    <p className="rounded-xl bg-gray-50 px-3 py-8 text-center text-sm text-gray-500">
                        {t('explore.your_list_empty')}
                    </p>
                ) : (
                    <RouteDraftStopList
                        stops={stops}
                        onRemove={onRemove}
                        onMove={onMove}
                        removingSlug={removingSlug}
                    />
                )}
            </div>

            {stops.length > 0 && (
                <div className="shrink-0 space-y-2 border-t border-gray-100 p-3">
                    {totalKm != null && (
                        <p className="text-[11px] font-medium text-brand-orange">
                            {t('explore.route_summary', {
                                count: stops.length,
                                km: totalKm,
                                min: totalMin ?? '—',
                            })}
                        </p>
                    )}
                    <Input
                        value={routeName}
                        onChange={(e) => setRouteName(e.target.value)}
                        placeholder={t('explore.route_name_placeholder')}
                        className="h-9 rounded-lg text-sm"
                        disabled={isPublishing}
                    />
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-gray-400" />
                        <Input
                            type="date"
                            value={routeDate}
                            onChange={(e) => setRouteDate(e.target.value)}
                            className="h-9 rounded-lg pl-9 text-sm"
                            disabled={isPublishing}
                        />
                    </div>
                    <Button
                        type="button"
                        disabled={isPublishing || !routeName.trim()}
                        onClick={onPublish}
                        className="w-full rounded-lg bg-brand-orange text-white hover:bg-brand-orange-dark"
                    >
                        {isPublishing ? t('explore.route_publishing') : t('explore.publish_route')}
                    </Button>
                    <Button variant="outline" className="w-full rounded-lg" asChild>
                        <Link href={exploreRoutes.url()}>{t('explore.nav_routes')}</Link>
                    </Button>
                </div>
            )}
        </div>
    );
}

type SheetProps = DiscoverRoutePanelProps & {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export function DiscoverRouteSheet({ open, onOpenChange, ...panelProps }: SheetProps) {
    const { t } = useTranslation();

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                overlayClassName="top-[4.625rem] bottom-16 md:hidden"
                className="inset-y-auto top-[4.625rem] right-0 bottom-16 z-[90] flex h-auto w-full flex-col gap-0 border-l p-0 sm:max-w-sm md:hidden"
            >
                <SheetHeader className="sr-only">
                    <SheetTitle>{t('explore.your_list_title')}</SheetTitle>
                    <SheetDescription>{t('explore.your_list_desc', { count: panelProps.stops.length })}</SheetDescription>
                </SheetHeader>
                <DiscoverRoutePanel {...panelProps} onClose={() => onOpenChange(false)} />
            </SheetContent>
        </Sheet>
    );
}
