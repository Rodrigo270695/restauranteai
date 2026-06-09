import { router, useForm, usePage } from '@inertiajs/react';
import { CalendarCheck, Clock, MapPinCheck, Star, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
    defaultPeruDateTimeLocal,
    formatPeruDateTimeMedium,
    peruLocale,
} from '@/lib/peru-datetime';

export type RouteReservation = {
    id: number;
    status: 'pending' | 'confirmed' | 'visited' | 'cancelled';
    reserved_for: string;
    party_size: number;
    note?: string | null;
    visited_at?: string | null;
    can_confirm?: boolean;
    awaiting_restaurant?: boolean;
    can_mark_visited: boolean;
    can_review: boolean;
    has_review?: boolean;
};

type Props = {
    routeSlug: string;
    restaurantSlug: string;
    reservation: RouteReservation | null;
    className?: string;
    variant?: 'default' | 'panel';
    onReviewClick?: () => void;
    /** Se invoca justo al pulsar "Ya visité" (antes del POST). */
    onBeforeMarkVisited?: () => void;
    /** Se invoca tras marcar la visita con éxito (p. ej. abrir modal de reseña). */
    onMarkedVisited?: () => void;
};

function statusLabel(status: RouteReservation['status'], t: (k: string) => string): string {
    const map: Record<RouteReservation['status'], string> = {
        pending: t('explore.reservation_pending'),
        confirmed: t('explore.reservation_confirmed'),
        visited: t('explore.reservation_visited'),
        cancelled: t('explore.reservation_cancelled'),
    };
    return map[status];
}

function statusClass(status: RouteReservation['status']): string {
    switch (status) {
        case 'pending':
            return 'bg-amber-50 text-amber-800 ring-amber-200';
        case 'confirmed':
            return 'bg-blue-50 text-blue-800 ring-blue-200';
        case 'visited':
            return 'bg-green-50 text-green-800 ring-green-200';
        default:
            return 'bg-gray-50 text-gray-600 ring-gray-200';
    }
}

function defaultDateTimeLocal(): string {
    return defaultPeruDateTimeLocal();
}

export function RouteStopReservation({
    routeSlug,
    restaurantSlug,
    reservation,
    className,
    variant = 'default',
    onReviewClick,
    onBeforeMarkVisited,
    onMarkedVisited,
}: Props) {
    const { t, i18n } = useTranslation();
    const [showForm, setShowForm] = useState(false);
    const isPanel = variant === 'panel';
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;

    const form = useForm({
        reserved_for: defaultDateTimeLocal(),
        party_size: '2',
        note: '',
    });

    const storeUrl = `/explore/routes/${routeSlug}/stops/${restaurantSlug}/reservations`;

    const formatDate = (iso: string) => formatPeruDateTimeMedium(iso, peruLocale(i18n.language));

    useEffect(() => {
        if (!flash?.success) return;
        import('sonner').then(({ toast }) => toast.success(flash.success!));
        setShowForm(false);
    }, [flash?.success]);

    const post = (
        url: string,
        data: Record<string, unknown> = {},
        options?: { onSuccess?: () => void },
    ) => {
        router.post(url, data, {
            preserveScroll: true,
            onSuccess: () => {
                setShowForm(false);
                options?.onSuccess?.();
            },
            onError: errors => {
                const msg =
                    Object.values(errors).flat().join(' ') ||
                    t('explore.reservation_error_generic');
                import('sonner').then(({ toast }) => toast.error(msg));
            },
        });
    };

    const submitReservation = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(storeUrl, {
            preserveScroll: true,
            onSuccess: () => setShowForm(false),
            onError: () => {
                import('sonner').then(({ toast }) => {
                    const msg =
                        Object.values(form.errors).flat().join(' ') ||
                        t('explore.reservation_error_generic');
                    toast.error(msg);
                });
            },
        });
    };

    if (!reservation && !showForm) {
        return (
            <div
                className={cn(
                    isPanel
                        ? 'rounded-xl border border-orange-100 bg-orange-50/60 p-4'
                        : 'rounded-xl border border-dashed border-orange-200 bg-orange-50/50 p-3',
                    className,
                )}
            >
                <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-orange-100">
                        <CalendarCheck className="size-5 text-brand-orange" />
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900">{t('explore.reservation_cta_title')}</p>
                        <p className="mt-0.5 text-xs text-gray-600">{t('explore.reservation_cta_desc')}</p>
                    </div>
                </div>
                <Button
                    type="button"
                    className={cn(
                        'mt-3 w-full rounded-xl bg-brand-orange text-white shadow-sm',
                        isPanel && 'h-11',
                    )}
                    onClick={() => setShowForm(true)}
                >
                    {t('explore.reservation_book')}
                </Button>
            </div>
        );
    }

    if (!reservation && showForm) {
        return (
            <form
                className={cn(
                    'space-y-3 rounded-xl border border-orange-200 bg-white p-4 shadow-inner',
                    className,
                )}
                onSubmit={submitReservation}
            >
                <p className="text-sm font-bold text-gray-900">{t('explore.reservation_book')}</p>
                <div>
                    <label className="block text-xs font-medium text-gray-500">
                        {t('explore.reservation_datetime')}
                    </label>
                    <Input
                        type="datetime-local"
                        required
                        value={form.data.reserved_for}
                        onChange={e => form.setData('reserved_for', e.target.value)}
                        className={cn('mt-1 rounded-xl text-sm', form.errors.reserved_for && 'border-red-400')}
                    />
                    {form.errors.reserved_for && (
                        <p className="mt-1 text-xs text-red-600">{form.errors.reserved_for}</p>
                    )}
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500">
                        {t('explore.reservation_party')}
                    </label>
                    <Input
                        type="number"
                        min={1}
                        max={20}
                        required
                        value={form.data.party_size}
                        onChange={e => form.setData('party_size', e.target.value)}
                        className={cn('mt-1 rounded-xl text-sm', form.errors.party_size && 'border-red-400')}
                    />
                    {form.errors.party_size && (
                        <p className="mt-1 text-xs text-red-600">{form.errors.party_size}</p>
                    )}
                </div>
                <Input
                    value={form.data.note}
                    onChange={e => form.setData('note', e.target.value)}
                    placeholder={t('explore.reservation_note_placeholder')}
                    className="rounded-xl text-sm"
                />
                <div className="flex gap-2 pt-1">
                    <Button
                        type="submit"
                        disabled={form.processing || !form.data.reserved_for}
                        className="h-11 flex-1 rounded-xl bg-brand-orange text-white"
                    >
                        {form.processing ? t('explore.reservation_sending') : t('explore.reservation_submit')}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        className="h-11 rounded-xl px-4"
                        onClick={() => {
                            setShowForm(false);
                            form.clearErrors();
                        }}
                    >
                        {t('explore.back')}
                    </Button>
                </div>
            </form>
        );
    }

    if (!reservation) {
        return null;
    }

    return (
        <div
            className={cn(
                isPanel
                    ? 'rounded-xl border border-gray-100 bg-gray-50/80 p-4'
                    : 'rounded-xl border border-orange-100 bg-orange-50/40 p-3',
                className,
            )}
        >
            <div className="flex items-start justify-between gap-2">
                <div>
                    <span
                        className={cn(
                            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1',
                            statusClass(reservation.status),
                        )}
                    >
                        <Clock className="size-3.5" />
                        {statusLabel(reservation.status, t)}
                    </span>
                    <p className="mt-2 text-sm font-medium text-gray-800">
                        {formatDate(reservation.reserved_for)}
                    </p>
                    <p className="text-xs text-gray-500">
                        {reservation.party_size} {t('explore.reservation_guests')}
                        {reservation.note ? ` · ${reservation.note}` : ''}
                    </p>
                </div>
                {reservation.status !== 'visited' && reservation.status !== 'cancelled' && (
                    <button
                        type="button"
                        className="cursor-pointer rounded-lg p-1 text-gray-400 hover:bg-white hover:text-gray-600"
                        title={t('explore.reservation_cancel')}
                        onClick={() => {
                            if (confirm(t('explore.reservation_cancel_confirm'))) {
                                post(`/explore/reservations/${reservation.id}/cancel`);
                            }
                        }}
                    >
                        <X className="size-4" />
                    </button>
                )}
            </div>

            {reservation.awaiting_restaurant && (
                <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    {t('explore.reservation_awaiting_owner')}
                </p>
            )}

            <div className={cn('mt-3 flex flex-col gap-2', !isPanel && 'sm:flex-row sm:flex-wrap')}>
                {reservation.can_mark_visited && (
                    <Button
                        type="button"
                        className="h-11 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                        onClick={() => {
                            onBeforeMarkVisited?.();
                            post(`/explore/reservations/${reservation.id}/visited`, {}, {
                                onSuccess: onMarkedVisited,
                            });
                        }}
                    >
                        <MapPinCheck className="mr-2 size-4" />
                        {t('explore.reservation_mark_visited')}
                    </Button>
                )}
                {reservation.can_review && onReviewClick && (
                    <Button
                        type="button"
                        variant="outline"
                        className="h-11 rounded-xl"
                        onClick={onReviewClick}
                    >
                        <Star className="mr-2 size-4 fill-amber-400 text-amber-400" />
                        {t('explore.review_write')}
                    </Button>
                )}
            </div>

            {reservation.status === 'pending' && (
                <p className="mt-2 text-[10px] text-gray-500">{t('explore.reservation_pending_hint')}</p>
            )}
        </div>
    );
}
