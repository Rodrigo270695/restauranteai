import { Head, router } from '@inertiajs/react';
import { DataTable, type TableColumn } from '@/components/shared/data-table';
import { PageHeader } from '@/components/shared/page-header';
import { PaginationLinks, type PaginationMeta } from '@/components/shared/pagination-links';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { APP_HREF } from '@/config/app-sidebar-nav';
import { useCan } from '@/hooks/use-can';
import { appBreadcrumbs } from '@/lib/app-breadcrumbs';

type Row = {
    id: number;
    business_name: string;
    status: 'pending' | 'approved' | 'rejected';
    user?: { name: string; email: string };
};

type Props = {
    items: PaginationMeta & { data: Row[] };
    filters: { status?: string | null };
    stats: { pending: number; approved: number; rejected: number };
};

const statusLabel = { pending: 'Pendiente', approved: 'Aprobado', rejected: 'Rechazado' };

function Page({ items, filters, stats }: Props) {
    const can = useCan();
    const base = APP_HREF.adminBusinessRequests;

    const rows = items?.data ?? [];

    const columns: TableColumn<Row>[] = [
        {
            key: 'business',
            header: 'Negocio',
            cardTitle: true,
            cell: (r) => <span className="font-medium">{r.business_name}</span>,
        },
        {
            key: 'user',
            header: 'Dueño',
            cell: (r) => (
                <span className="text-sm">
                    {r.user?.name}
                    <br />
                    <span className="text-muted-foreground">{r.user?.email}</span>
                </span>
            ),
        },
        {
            key: 'status',
            header: 'Estado',
            cell: (r) => <Badge>{statusLabel[r.status]}</Badge>,
        },
    ];

    return (
        <>
            <Head title="Solicitudes de negocio" />
            <PageHeader
                title="Solicitudes de negocio"
                description="Aprobación de registros (restaurant_profiles)."
                stats={[
                    { label: 'Pendientes', value: stats.pending, color: 'amber' },
                    { label: 'Aprobadas', value: stats.approved, color: 'green' },
                    { label: 'Rechazadas', value: stats.rejected, color: 'red' },
                ]}
            />
            <div className="space-y-4 px-4 pb-6 md:px-6">
                <div className="flex gap-2">
                    {(['', 'pending', 'approved', 'rejected'] as const).map((s) => (
                        <Button
                            key={s || 'all'}
                            size="sm"
                            variant={filters.status === s || (!filters.status && !s) ? 'brand' : 'outline'}
                            onClick={() => router.get(base, { status: s || undefined }, { preserveState: true })}
                        >
                            {s ? statusLabel[s] : 'Todas'}
                        </Button>
                    ))}
                </div>
                <DataTable
                    columns={columns}
                    rows={rows}
                    rowKey="id"
                    emptyMessage="Sin solicitudes."
                    rowActions={(r) =>
                        r.status === 'pending' && can('business_requests.manage') ? (
                            <>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 cursor-pointer border-emerald-200 px-2 text-xs text-emerald-800 hover:bg-emerald-50"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        router.patch(`${base}/${r.id}`, { status: 'approved' });
                                    }}
                                >
                                    Aprobar
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 cursor-pointer border-rose-200 px-2 text-xs text-rose-800 hover:bg-rose-50"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        router.patch(`${base}/${r.id}`, {
                                            status: 'rejected',
                                            rejection_reason: 'Revisar documentación',
                                        });
                                    }}
                                >
                                    Rechazar
                                </Button>
                            </>
                        ) : null
                    }
                />
                <PaginationLinks meta={items} />
            </div>
        </>
    );
}

export default Page;
Page.layout = { breadcrumbs: appBreadcrumbs('Solicitudes de negocio', APP_HREF.adminBusinessRequests) };
