import { Head, router, usePage } from '@inertiajs/react';
import { CalendarCheck, Check, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { PaginationLinks, type PaginationMeta } from '@/components/shared/pagination-links';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCan } from '@/hooks/use-can';
import { cn } from '@/lib/utils';
import { APP_HREF } from '@/config/app-sidebar-nav';
import { appBreadcrumbs } from '@/lib/app-breadcrumbs';
import type { ReservationRow } from '@/components/app/owner/restaurant-reservations-page';

type Props = {
    reservations: PaginationMeta & { data: (ReservationRow & { restaurant_name: string })[] };
    stats: { pending: number; total: number };
    filters: { status: string; search: string };
};

const statusBadge: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-900',
    confirmed: 'bg-sky-100 text-sky-900',
    visited: 'bg-emerald-100 text-emerald-900',
    cancelled: 'bg-gray-100 text-gray-600',
};

function AdminReservationsPage({ reservations, stats, filters }: Props) {
    const can = useCan();
    const canManage = can('reservations.manage');
    const [search, setSearch] = useState(filters.search);
    const flash = usePage().props.flash as { success?: string } | undefined;

    useEffect(() => {
        if (flash?.success) {
            import('sonner').then(({ toast }) => toast.success(flash.success!));
        }
    }, [flash]);

    const apply = (patch: Record<string, string | undefined>) => {
        router.get(APP_HREF.adminReservations, patch, { preserveState: true, preserveScroll: true });
    };

    return (
        <>
            <Head title="Reservas (plataforma)" />
            <PageHeader
                title="Reservas de turistas"
                description="Vista global de la plataforma. Para un local concreto, entra desde Restaurantes → Gestionar → módulo Reservas."
            />

            <div className="mt-6 rounded-2xl border bg-white p-4 shadow-sm">
                <div className="mb-4 flex flex-wrap gap-2">
                    <div className="relative min-w-[200px] flex-1">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                        <Input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && apply({ search, status: filters.status })}
                            placeholder="Buscar turista o restaurante..."
                            className="pl-9"
                        />
                    </div>
                    <Badge className="bg-amber-100 text-amber-900">{stats.pending} pendientes</Badge>
                </div>

                <ul className="space-y-3">
                    {reservations.data.map(row => (
                        <li key={row.id} className="rounded-xl border p-4">
                            <div className="flex flex-wrap justify-between gap-2">
                                <div>
                                    <p className="font-bold">{row.restaurant_name}</p>
                                    <p className="text-sm text-gray-600">
                                        {row.guest_name} · {row.reserved_for} · {row.party_size} pax
                                    </p>
                                </div>
                                <Badge className={cn('h-fit', statusBadge[row.status])}>{row.status}</Badge>
                            </div>
                            {canManage && row.can_confirm && (
                                <div className="mt-2 flex gap-2">
                                    <Button
                                        size="sm"
                                        onClick={() =>
                                            router.post(`/app/admin/reservations/${row.id}/confirm`, {}, { preserveScroll: true })
                                        }
                                    >
                                        <Check className="mr-1 size-3" /> Confirmar
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                            router.post(`/app/admin/reservations/${row.id}/reject`, {}, { preserveScroll: true })
                                        }
                                    >
                                        <X className="mr-1 size-3" /> Rechazar
                                    </Button>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
                <PaginationLinks meta={reservations} className="mt-4" />
            </div>
        </>
    );
}

export default AdminReservationsPage;
AdminReservationsPage.layout = {
    breadcrumbs: appBreadcrumbs('Reservas', APP_HREF.adminReservations),
};
