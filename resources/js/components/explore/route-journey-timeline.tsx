import { Link } from '@inertiajs/react';
import {
    CalendarCheck,
    Check,
    Clock,
    MapPin,
    Star,
    Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RestaurantReviewModal } from '@/components/explore/restaurant-review-modal';
import { RouteStopReservation, type RouteReservation } from '@/components/explore/route-stop-reservation';
import { CuisineBadges } from '@/components/explore/cuisine-badges';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { show as restaurantShow } from '@/routes/explore/restaurants';

export type JourneyStop = {
    stop_id: number;
    position: number;
    reservation: RouteReservation | null;
    restaurant: {
        name: string;
        slug: string;
        district?: string | null;
        address?: string | null;
        avg_rating: number;
        latitude?: number | null;
        longitude?: number | null;
        cuisines: Array<{ name: string; is_primary?: boolean }>;
    };
};

type StopPhase = 'book' | 'pending' | 'confirmed' | 'visited' | 'cancelled';

function getStopPhase(reservation: RouteReservation | null): StopPhase {
    if (!reservation) {
        return 'book';
    }
    if (reservation.status === 'cancelled') {
        return 'cancelled';
    }
    if (reservation.status === 'visited') {
        return 'visited';
    }
    if (reservation.status === 'confirmed') {
        return 'confirmed';
    }
    return 'pending';
}

const phaseOrder: StopPhase[] = ['book', 'pending', 'confirmed', 'visited'];

function phaseIndex(phase: StopPhase): number {
    if (phase === 'cancelled') {
        return -1;
    }
    const idx = phaseOrder.indexOf(phase);
    return idx >= 0 ? idx : 0;
}

type Props = {
    routeSlug: string;
    stops: JourneyStop[];
    isCompleted: boolean;
};

function StopNode({
    stop,
    phase,
    isSelected,
    isActiveLeg,
    onSelect,
}: {
    stop: JourneyStop;
    phase: StopPhase;
    isSelected: boolean;
    isActiveLeg: boolean;
    onSelect: () => void;
}) {
    const visited = phase === 'visited';
    const confirmed = phase === 'confirmed';
    const pending = phase === 'pending';

    return (
        <button
            type="button"
            onClick={onSelect}
            className={cn(
                'group flex w-[5.5rem] shrink-0 cursor-pointer flex-col items-center gap-2 rounded-2xl px-1 py-2 transition',
                isSelected ? 'bg-white shadow-md ring-2 ring-brand-orange' : 'hover:bg-white/80',
            )}
        >
            <span
                className={cn(
                    'relative flex size-11 items-center justify-center rounded-full text-sm font-bold shadow-sm transition',
                    visited && 'bg-emerald-500 text-white',
                    confirmed && 'bg-sky-500 text-white',
                    pending && 'bg-amber-400 text-amber-950',
                    phase === 'book' && isActiveLeg && 'bg-brand-orange text-white ring-4 ring-orange-200',
                    phase === 'book' && !isActiveLeg && 'bg-gray-200 text-gray-600',
                    phase === 'cancelled' && 'bg-gray-300 text-gray-600',
                )}
            >
                {visited ? <Check className="size-5 stroke-[3]" /> : stop.position}
                {isActiveLeg && phase === 'book' && (
                    <span className="absolute -right-0.5 -top-0.5 size-3 rounded-full bg-brand-orange ring-2 ring-white" />
                )}
            </span>
            <span
                className={cn(
                    'line-clamp-2 w-full text-center text-[10px] font-semibold leading-tight',
                    isSelected ? 'text-gray-900' : 'text-gray-600',
                )}
            >
                {stop.restaurant.name.split(' ').slice(0, 2).join(' ')}
            </span>
        </button>
    );
}

function Connector({ completed }: { completed: boolean }) {
    return (
        <div
            className={cn(
                'mx-0.5 mt-5 h-1 w-8 shrink-0 rounded-full sm:w-12',
                completed ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gray-200',
            )}
            aria-hidden
        />
    );
}

function ProgressStepper({ phase, t }: { phase: StopPhase; t: (k: string) => string }) {
    const current = phaseIndex(phase);
    const steps = [
        { key: 'book', label: t('explore.timeline_step_book') },
        { key: 'pending', label: t('explore.timeline_step_pending') },
        { key: 'confirmed', label: t('explore.timeline_step_confirmed') },
        { key: 'visited', label: t('explore.timeline_step_visited') },
    ];
    const allDone = phase === 'visited';

    return (
        <div className="flex items-center gap-1">
            {steps.map((step, i) => {
                const done = allDone || current > i;
                const active = !allDone && current === i;
                return (
                    <div key={step.key} className="flex flex-1 items-center gap-1">
                        <div
                            className={cn(
                                'flex size-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold',
                                done && 'bg-emerald-500 text-white',
                                active && 'bg-brand-orange text-white',
                                !done && !active && 'bg-gray-100 text-gray-400',
                            )}
                        >
                            {done ? <Check className="size-3.5" /> : i + 1}
                        </div>
                        <span
                            className={cn(
                                'hidden text-[10px] font-medium sm:inline',
                                (done || active) ? 'text-gray-800' : 'text-gray-400',
                            )}
                        >
                            {step.label}
                        </span>
                        {i < steps.length - 1 && (
                            <div
                                className={cn(
                                    'mx-0.5 hidden h-0.5 flex-1 rounded sm:block',
                                    done ? 'bg-emerald-300' : 'bg-gray-200',
                                )}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function VisitedDetail({
    reservation,
    restaurant,
    t,
    i18n,
    onWriteReview,
}: {
    reservation: RouteReservation;
    restaurant: JourneyStop['restaurant'];
    t: (k: string) => string;
    i18n: { language: string };
    onWriteReview: () => void;
}) {
    const locale = i18n.language === 'en' ? 'en-US' : 'es-PE';
    const reservedLabel = new Date(reservation.reserved_for).toLocaleString(locale, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
    const visitedLabel = reservation.visited_at
        ? new Date(reservation.visited_at).toLocaleString(locale, {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
          })
        : null;

    return (
        <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50/90 to-white p-4">
            <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <Check className="size-4" />
                </span>
                <div>
                    <p className="text-sm font-bold text-emerald-900">{t('explore.timeline_visited_title')}</p>
                    {visitedLabel && (
                        <p className="text-xs text-emerald-700">
                            {t('explore.timeline_visited_at', { date: visitedLabel })}
                        </p>
                    )}
                </div>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg bg-white/80 px-3 py-2 ring-1 ring-emerald-100">
                    <dt className="flex items-center gap-1 text-gray-500">
                        <Clock className="size-3" />
                        {t('explore.reservation_datetime')}
                    </dt>
                    <dd className="mt-0.5 font-semibold text-gray-900">{reservedLabel}</dd>
                </div>
                <div className="rounded-lg bg-white/80 px-3 py-2 ring-1 ring-emerald-100">
                    <dt className="flex items-center gap-1 text-gray-500">
                        <Users className="size-3" />
                        {t('explore.reservation_party')}
                    </dt>
                    <dd className="mt-0.5 font-semibold text-gray-900">
                        {reservation.party_size} {t('explore.reservation_guests')}
                    </dd>
                </div>
                {restaurant.avg_rating > 0 && (
                    <div className="col-span-2 rounded-lg bg-white/80 px-3 py-2 ring-1 ring-emerald-100">
                        <dt className="text-gray-500">{t('explore.timeline_place_rating')}</dt>
                        <dd className="mt-0.5 flex items-center gap-1 font-semibold text-gray-900">
                            <Star className="size-3.5 fill-amber-400 text-amber-400" />
                            {restaurant.avg_rating}
                        </dd>
                    </div>
                )}
                {reservation.note && (
                    <div className="col-span-2 rounded-lg bg-white/80 px-3 py-2 ring-1 ring-emerald-100">
                        <dt className="text-gray-500">{t('explore.timeline_your_note')}</dt>
                        <dd className="mt-0.5 text-gray-800">{reservation.note}</dd>
                    </div>
                )}
            </dl>

            {reservation.has_review && (
                <p className="mt-4 rounded-xl bg-emerald-100 px-3 py-2.5 text-center text-sm font-medium text-emerald-800">
                    {t('explore.review_thanks')}
                </p>
            )}
            {reservation.can_review && (
                <Button
                    type="button"
                    className="mt-4 w-full cursor-pointer rounded-xl bg-brand-orange text-white hover:bg-brand-orange-dark"
                    onClick={onWriteReview}
                >
                    <Star className="mr-2 size-4 fill-white" />
                    {t('explore.review_write')}
                </Button>
            )}
        </div>
    );
}

export function RouteJourneyTimeline({ routeSlug, stops, isCompleted }: Props) {
    const { t, i18n } = useTranslation();

    const firstOpenId = useMemo(() => {
        const open = stops.find(s => getStopPhase(s.reservation) !== 'visited');
        return open?.stop_id ?? stops[0]?.stop_id;
    }, [stops]);

    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [reviewOpen, setReviewOpen] = useState(false);
    const activeId = selectedId ?? firstOpenId ?? null;

    const selected = stops.find(s => s.stop_id === activeId) ?? stops[0];
    if (!selected) {
        return null;
    }

    const phase = getStopPhase(selected.reservation);
    const activeLegIndex = stops.findIndex(s => getStopPhase(s.reservation) !== 'visited');
    const furthestDone = stops.reduce(
        (max, s, i) => (getStopPhase(s.reservation) === 'visited' ? i : max),
        -1,
    );

    const canReviewSelected =
        selected.reservation?.can_review === true && getStopPhase(selected.reservation) === 'visited';

    return (
        <section className="space-y-4">
            <RestaurantReviewModal
                open={reviewOpen}
                onOpenChange={setReviewOpen}
                restaurantSlug={selected.restaurant.slug}
                restaurantName={selected.restaurant.name}
                reloadOnly={['route']}
            />
            <div className="flex items-end justify-between gap-2 px-1">
                <div>
                    <h2 className="text-sm font-bold text-gray-900">{t('explore.timeline_title')}</h2>
                    <p className="text-xs text-gray-500">{t('explore.timeline_hint')}</p>
                </div>
                <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-bold text-brand-orange-dark">
                    {stops.filter(s => getStopPhase(s.reservation) === 'visited').length}/{stops.length}
                </span>
            </div>

            <div className="-mx-1 cursor-grab overflow-x-auto pb-1 scrollbar-thin active:cursor-grabbing">
                <div className="flex min-w-max items-start justify-center px-2 py-1">
                    {stops.map((stop, index) => {
                        const stopPhase = getStopPhase(stop.reservation);
                        const legDone = index <= furthestDone;
                        const isActiveLeg = index === (activeLegIndex >= 0 ? activeLegIndex : 0);

                        return (
                            <div key={stop.stop_id} className="flex items-start">
                                {index > 0 && <Connector completed={legDone} />}
                                <StopNode
                                    stop={stop}
                                    phase={stopPhase}
                                    isSelected={stop.stop_id === activeId}
                                    isActiveLeg={isActiveLeg}
                                    onSelect={() => setSelectedId(stop.stop_id)}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>

            <article className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="border-b border-gray-50 bg-gradient-to-r from-gray-50 to-orange-50/30 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-brand-orange">
                                {t('explore.route_stop_order', { n: selected.position })}
                            </p>
                            <Link
                                href={restaurantShow.url(selected.restaurant.slug)}
                                className="mt-0.5 block cursor-pointer truncate text-base font-bold text-gray-900 hover:text-brand-orange"
                            >
                                {selected.restaurant.name}
                            </Link>
                            <div className="mt-1.5">
                                <CuisineBadges cuisines={selected.restaurant.cuisines} size="xs" />
                            </div>
                        </div>
                        <Link
                            href={restaurantShow.url(selected.restaurant.slug)}
                            className="shrink-0 cursor-pointer rounded-xl bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm ring-1 ring-gray-100 hover:ring-orange-200"
                        >
                            {t('explore.timeline_view_place')}
                        </Link>
                    </div>
                    <p className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="size-3 shrink-0 text-brand-orange" />
                        {selected.restaurant.district ?? selected.restaurant.address}
                    </p>
                </div>

                <div className="space-y-4 p-4">
                    {!isCompleted && <ProgressStepper phase={phase} t={t} />}

                    {phase === 'visited' && selected.reservation ? (
                        <VisitedDetail
                            reservation={selected.reservation}
                            restaurant={selected.restaurant}
                            t={t}
                            i18n={i18n}
                            onWriteReview={() => setReviewOpen(true)}
                        />
                    ) : !isCompleted ? (
                        <RouteStopReservation
                            routeSlug={routeSlug}
                            restaurantSlug={selected.restaurant.slug}
                            reservation={selected.reservation}
                            variant="panel"
                            onReviewClick={
                                canReviewSelected ? () => setReviewOpen(true) : undefined
                            }
                        />
                    ) : selected.reservation ? (
                        <VisitedDetail
                            reservation={selected.reservation}
                            restaurant={selected.restaurant}
                            t={t}
                            i18n={i18n}
                            onWriteReview={() => setReviewOpen(true)}
                        />
                    ) : (
                        <p className="text-center text-sm text-gray-500">{t('explore.timeline_no_reservation')}</p>
                    )}
                </div>
            </article>
        </section>
    );
}
