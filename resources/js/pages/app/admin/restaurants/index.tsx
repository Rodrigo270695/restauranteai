import { Head, Link, router, useForm } from '@inertiajs/react';
import { Edit2, ExternalLink, Plus, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import {
    RestaurantFormModal,
    type RestaurantFormData,
} from '@/components/app/admin/restaurant-form-modal';
import { ConfirmModal } from '@/components/modals/confirm-modal';
import { DataTable, type TableColumn } from '@/components/shared/data-table';
import { PageHeader, STAT_COLORS, type StatBadge } from '@/components/shared/page-header';
import { PaginationLinks, type PaginationMeta } from '@/components/shared/pagination-links';
import { SearchFilter } from '@/components/shared/search-filter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { APP_HREF } from '@/config/app-sidebar-nav';
import { useCan } from '@/hooks/use-can';
import { appBreadcrumbs } from '@/lib/app-breadcrumbs';

type Row = {
    id: number;
    name: string;
    price_range: string;
    is_active: boolean;
    is_verified: boolean;
    cuisine_type_id?: number | null;
    owner?: { name: string };
    cuisine_type?: { id: number; name: string } | null;
    cuisine_types?: Array<{ id: number; name: string; pivot?: { is_primary: boolean } }>;
};

type Props = {
    items: PaginationMeta & { data: Row[] };
    owners: { id: number; name: string }[];
    cuisineTypes: { id: number; name: string }[];
    filters: { search?: string };
    stats: { total: number; active: number; verified: number };
};

const ONLY = ['items', 'stats', 'filters'] as const;

const actionBtn =
    'h-7 w-7 cursor-pointer rounded-md border p-0 transition-colors';

function Page({ items, owners, cuisineTypes, filters, stats }: Props) {
    const can = useCan();
    const base = APP_HREF.adminRestaurants;
    const rows = items?.data ?? [];
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Row | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const form = useForm<RestaurantFormData>({
        owner_id: '',
        name: '',
        cuisine_type_ids: [],
        primary_cuisine_type_id: null,
        price_range: 'moderado',
        is_active: false,
        is_verified: false,
    });

    const openCreate = () => {
        setEditing(null);
        form.reset();
        setModalOpen(true);
    };

    const openEdit = (r: Row) => {
        setEditing(r);
        const types = r.cuisine_types ?? [];
        const primary =
            types.find(t => t.pivot?.is_primary)?.id ??
            r.cuisine_type_id ??
            r.cuisine_type?.id ??
            null;
        form.setData({
            owner_id: '',
            name: r.name,
            cuisine_type_ids: types.length
                ? types.map(t => t.id)
                : primary
                  ? [primary]
                  : [],
            primary_cuisine_type_id: primary,
            price_range: r.price_range,
            is_active: r.is_active,
            is_verified: r.is_verified,
        });
        setModalOpen(true);
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (editing) {
            form.put(`${base}/${editing.id}`, {
                preserveScroll: true,
                onSuccess: () => setModalOpen(false),
            });
        } else {
            form.post(base, {
                preserveScroll: true,
                onSuccess: () => setModalOpen(false),
            });
        }
    };

    const columns: TableColumn<Row>[] = [
        {
            key: 'name',
            header: 'Restaurante',
            cardTitle: true,
            cell: (r) => <span className="font-medium">{r.name}</span>,
        },
        {
            key: 'owner',
            header: 'Dueño',
            cell: (r) => r.owner?.name ?? '—',
        },
        {
            key: 'cuisine',
            header: 'Cocinas',
            cell: (r) => {
                const list = r.cuisine_types?.length
                    ? r.cuisine_types
                    : r.cuisine_type
                      ? [{ id: r.cuisine_type.id, name: r.cuisine_type.name, pivot: { is_primary: true } }]
                      : [];
                if (!list.length) return '—';
                return (
                    <div className="flex max-w-[220px] flex-wrap gap-1">
                        {list.map(c => (
                            <Badge
                                key={c.id}
                                variant="outline"
                                className={
                                    c.pivot?.is_primary
                                        ? 'border-amber-300 bg-amber-50 text-amber-900 text-[10px]'
                                        : 'text-[10px]'
                                }
                            >
                                {c.name}
                                {c.pivot?.is_primary ? ' ★' : ''}
                            </Badge>
                        ))}
                    </div>
                );
            },
        },
        {
            key: 'flags',
            header: 'Estado',
            cell: (r) => (
                <div className="flex flex-wrap gap-1">
                    {r.is_active && (
                        <Badge className="border-emerald-300 bg-emerald-50 text-emerald-900">Activo</Badge>
                    )}
                    {r.is_verified && (
                        <Badge variant="secondary" className="border-sky-300 bg-sky-50 text-sky-900">
                            Verificado
                        </Badge>
                    )}
                    {!r.is_active && !r.is_verified && (
                        <span className="text-muted-foreground text-xs">—</span>
                    )}
                </div>
            ),
        },
    ];

    const statBadges: StatBadge[] = [
        { label: 'Total', value: stats.total, color: STAT_COLORS.blue },
        { label: 'Activos', value: stats.active, color: STAT_COLORS.emerald },
        { label: 'Verificados', value: stats.verified, color: STAT_COLORS.violet },
    ];

    return (
        <>
            <Head title="Restaurantes" />
            <div className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                <PageHeader
                    title="Restaurantes"
                    description="Moderación global de locales."
                    stats={statBadges}
                    actions={
                        can('restaurants.create') ? (
                            <Button
                                variant="brand"
                                size="sm"
                                className="cursor-pointer gap-1.5"
                                onClick={openCreate}
                            >
                                <Plus className="size-4" /> Nuevo
                            </Button>
                        ) : null
                    }
                />

                <SearchFilter
                    initialValue={filters.search ?? ''}
                    placeholder="Buscar por nombre…"
                    paramName="search"
                    only={[...ONLY]}
                />

                <DataTable
                    columns={columns}
                    rows={rows}
                    rowKey="id"
                    emptyMessage="Sin restaurantes."
                    emptyDescription="No hay locales registrados o no coinciden con la búsqueda."
                    rowActions={(r) => (
                        <>
                            <Link href={`${base}/${r.id}`}>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    title="Gestionar restaurante"
                                    className={`${actionBtn} text-sky-600 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800 dark:hover:border-sky-800 dark:hover:bg-sky-950/40`}
                                >
                                    <ExternalLink className="size-3.5" />
                                </Button>
                            </Link>
                            {can('restaurants.edit') && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    title="Editar"
                                    className={`${actionBtn} text-violet-600 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-800 dark:hover:border-violet-800 dark:hover:bg-violet-950/40`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        openEdit(r);
                                    }}
                                >
                                    <Edit2 className="size-3.5" />
                                </Button>
                            )}
                            {can('restaurants.delete') && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    title="Eliminar"
                                    className={`${actionBtn} text-rose-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-800 dark:hover:border-rose-800 dark:hover:bg-rose-950/40`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteId(r.id);
                                    }}
                                >
                                    <Trash2 className="size-3.5" />
                                </Button>
                            )}
                        </>
                    )}
                />
                <PaginationLinks meta={items} only={[...ONLY]} />
            </div>

            <RestaurantFormModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                editing={editing}
                owners={owners}
                cuisineTypes={cuisineTypes}
                form={form}
                onSubmit={handleSubmit}
            />

            <ConfirmModal
                open={deleteId !== null}
                onClose={() => setDeleteId(null)}
                title="Eliminar restaurante"
                description="Se borrará el local y sus datos asociados. Esta acción no se puede deshacer."
                confirmLabel="Eliminar"
                variant="destructive"
                onConfirm={() =>
                    deleteId &&
                    router.delete(`${base}/${deleteId}`, {
                        preserveScroll: true,
                        onFinish: () => setDeleteId(null),
                    })
                }
            />
        </>
    );
}

export default Page;
Page.layout = { breadcrumbs: appBreadcrumbs('Restaurantes', APP_HREF.adminRestaurants) };
