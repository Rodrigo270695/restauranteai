import { Head, router, usePage } from '@inertiajs/react';
import { CalendarCheck, Check, Clock, Users, X } from 'lucide-react';
import { useEffect } from 'react';
import { AdminPanelBanner } from '@/components/layout/admin-panel-banner';
import { FormSection, STAT_COLORS } from '@/components/app/owner/form-section';
import { scopedPath, type PanelContext } from '@/lib/scoped-app-path';
import { PageHeader, type StatBadge } from '@/components/shared/page-header';
import { PaginationLinks, type PaginationMeta } from '@/components/shared/pagination-links';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCan } from '@/hooks/use-can';
import { useOwnerReadOnly } from '@/hooks/use-owner-read-only';
import { cn } from '@/lib/utils';

export type ReservationRow = {
    id: number;
    status: 'pending' | 'confirmed' | 'visited' | 'cancelled';
    reserved_for: string;
    party_size: number;
    note: string | null;
    created_at: string;
    guest_name: string;
    guest_email: string | null;
    can_confirm: boolean;
    can_reject: boolean;
};

type Props = {
    restaurant: { id: number; name: string };
    owner: { name: string; business_name?: string | null };
    reservations: PaginationMeta & { data: ReservationRow[] };
    stats: { pending: number; confirmed: number; visited: number; total: number };
    filters: { status: 'all' | 'pending' | 'confirmed' | 'visited' | 'cancelled' };
    panel?: PanelContext;
};

const STATUS_TABS: { key: Props['filters']['status']; label: string }[] = [
    { key: 'all', label: 'Todas' },
    { key: 'pending', label: 'Pendientes' },
    { key: 'confirmed', label: 'Confirmadas' },
    { key: 'visited', label: 'Visitadas' },
    { key: 'cancelled', label: 'Canceladas' },
];

const statusBadge: Record<ReservationRow['status'], string> = {
    pending: 'bg-amber-100 text-amber-900',
    confirmed: 'bg-sky-100 text-sky-900',
    visited: 'bg-emerald-100 text-emerald-900',
    cancelled: 'bg-gray-100 text-gray-600',
};

const statusLabel: Record<ReservationRow['status'], string> = {
    pending: 'Pendiente',
    confirmed: 'Confirmada',
    visited: 'Visitada',
    cancelled: 'Cancelada',
};

export function RestaurantReservationsPage({
    restaurant,
    owner,
    reservations,
    stats,
    filters,
    panel,
}: Props) {
    const can = useCan();
    const readOnly = useOwnerReadOnly();
    const canManage = can('reservations.manage') && !readOnly && !panel?.readOnly;
    const reservationsBase = scopedPath('/reservations', panel);
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;

    useEffect(() => {
        if (!flash?.success && !flash?.error) return;
        import('sonner').then(({ toast }) => {
            if (flash.success) toast.success(flash.success);
            if (flash.error) toast.error(flash.error);
        });
    }, [flash]);

    const displayName = owner.business_name || restaurant.name;

    const statBadges: StatBadge[] = [
        {
            icon: <CalendarCheck className="size-3.5" />,
            label: 'Total',
            value: stats.total,
            color: STAT_COLORS.violet,
        },
        {
            icon: <Clock className="size-3.5" />,
            label: 'Pendientes',
            value: stats.pending,
            color: stats.pending > 0 ? STAT_COLORS.orange : STAT_COLORS.emerald,
        },
        {
            icon: <Check className="size-3.5" />,
            label: 'Confirmadas',
            value: stats.confirmed,
            color: STAT_COLORS.sky,
        },
        {
            icon: <Users className="size-3.5" />,
            label: 'Local',
            value: displayName,
            color: STAT_COLORS.amber,
        },
    ];

    const applyFilter = (status: Props['filters']['status']) => {
        router.get(
            reservationsBase,
            { status: status === 'all' ? undefined : status },
            { preserveState: true, preserveScroll: true },
        );
    };

    const postAction = (url: string) => {
        router.post(url, {}, { preserveScroll: true });
    };

    return (
        <>
            <Head title="Reservas" />
            <AdminPanelBanner panel={panel} restaurantName={restaurant.name} />
            <PageHeader
                title="Reservas de turistas"
                description={
                    panel?.mode === 'admin'
                        ? `Solicitudes de mesa solo para ${restaurant.name}.`
                        : `Solicitudes de mesa para ${displayName}. Confirma o rechaza desde aquí.`
                }
                statBadges={statBadges}
            />

            <FormSection
                title="Solicitudes"
                description="Confirma o rechaza las reservas de turistas para este local."
                icon={<CalendarCheck className="size-4" />}
                palette={STAT_COLORS.blue}
                className="mt-6"
            >
                <div className="mb-4 flex flex-wrap gap-2">
                    {STATUS_TABS.map(tab => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => applyFilter(tab.key)}
                            className={cn(
                                'rounded-full px-3 py-1.5 text-xs font-semibold transition',
                                filters.status === tab.key
                                    ? 'bg-brand-orange text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {reservations.data.length === 0 ? (
                    <p className="py-12 text-center text-sm text-gray-500">
                        No hay reservas con este filtro.
                    </p>
                ) : (
                    <ul className="space-y-3">
                        {reservations.data.map(row => (
                            <li
                                key={row.id}
                                className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="font-bold text-gray-900">{row.guest_name}</p>
                                            <Badge className={cn('text-[10px]', statusBadge[row.status])}>
                                                {statusLabel[row.status]}
                                            </Badge>
                                        </div>
                                        {row.guest_email && (
                                            <p className="text-xs text-gray-500">{row.guest_email}</p>
                                        )}
                                    </div>
                                    <div className="text-right text-xs text-gray-600">
                                        <p className="font-semibold text-gray-900">{row.reserved_for}</p>
                                        <p>
                                            {row.party_size} persona{row.party_size !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                </div>
                                {row.note && (
                                    <p className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-700">
                                        {row.note}
                                    </p>
                                )}
                                <p className="mt-2 text-[10px] text-gray-400">Solicitud: {row.created_at}</p>

                                {canManage && (row.can_confirm || row.can_reject) && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {row.can_confirm && (
                                            <Button
                                                type="button"
                                                size="sm"
                                                className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                                                onClick={() =>
                                                    postAction(`${reservationsBase}/${row.id}/confirm`)
                                                }
                                            >
                                                <Check className="mr-1 size-3.5" />
                                                Confirmar
                                            </Button>
                                        )}
                                        {row.can_reject && (
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                className="rounded-xl border-red-200 text-red-700"
                                                onClick={() => {
                                                    if (confirm('¿Rechazar esta reserva?')) {
                                                        postAction(`${reservationsBase}/${row.id}/reject`);
                                                    }
                                                }}
                                            >
                                                <X className="mr-1 size-3.5" />
                                                Rechazar
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}

                <PaginationLinks meta={reservations} className="mt-6" />
            </FormSection>
        </>
    );
}

export default RestaurantReservationsPage;
