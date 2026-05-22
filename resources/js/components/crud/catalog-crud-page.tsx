import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { ConfirmModal } from '@/components/modals/confirm-modal';
import { FormField, ResourceModal } from '@/components/modals/resource-modal';
import { DataTable, type TableColumn } from '@/components/shared/data-table';
import { PageHeader, STAT_COLORS, type StatBadge } from '@/components/shared/page-header';
import { PaginationLinks, type PaginationMeta } from '@/components/shared/pagination-links';
import { SearchFilter } from '@/components/shared/search-filter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCan } from '@/hooks/use-can';
import { APP_HREF } from '@/config/app-sidebar-nav';
export type FieldDef = {
    key: string;
    label: string;
    type: 'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'datetime' | 'time';
    required?: boolean;
    default?: boolean | number | string;
    relation?: string;
    options?: string[];
};

type CatalogRow = Record<string, unknown> & { id: number };

type Props = {
    catalogKey: string;
    title: string;
    resourceLabel: string;
    fields: FieldDef[];
    items: PaginationMeta & { data: CatalogRow[] };
    filters: { search?: string; sort?: string; dir?: string };
    stats?: { total?: number; active?: number };
};

const CATALOG_PATH: Record<string, string> = {
    cuisine_types: APP_HREF.adminCuisineTypes,
    ambiances: APP_HREF.adminAmbiances,
    services: APP_HREF.adminServices,
    dish_categories: APP_HREF.adminDishCategories,
    languages: APP_HREF.adminLanguages,
};

const ONLY = ['items', 'stats', 'filters'] as const;

const actionBtn =
    'h-7 w-7 cursor-pointer rounded-md border p-0 transition-colors';

function emptyForm(fields: FieldDef[]): Record<string, unknown> {
    const data: Record<string, unknown> = {};
    for (const f of fields) {
        if (f.type === 'boolean') {
            data[f.key] = f.default ?? true;
        } else if (f.type === 'number') {
            data[f.key] = f.default ?? 0;
        } else {
            data[f.key] = '';
        }
    }
    return data;
}

export function CatalogCrudPage({
    catalogKey,
    title,
    resourceLabel,
    fields,
    items,
    filters,
    stats,
}: Props) {
    const base = CATALOG_PATH[catalogKey] ?? '';
    const can = useCan();
    const prefix = catalogKey;
    const rows = items?.data ?? [];
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<CatalogRow | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const form = useForm<Record<string, unknown>>(emptyForm(fields));

    useEffect(() => {
        if (!flash?.success && !flash?.error) return;
        import('sonner').then(({ toast }) => {
            if (flash.success) toast.success(flash.success);
            if (flash.error) toast.error(flash.error);
        });
    }, [flash]);

    const openCreate = () => {
        setEditing(null);
        form.reset();
        form.setData(emptyForm(fields));
        setModalOpen(true);
    };

    const openEdit = (row: CatalogRow) => {
        setEditing(row);
        const data = emptyForm(fields);
        for (const f of fields) {
            data[f.key] = row[f.key] ?? data[f.key];
        }
        form.setData(data);
        setModalOpen(true);
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (editing) {
            form.put(`${base}/${editing.id}`, { preserveScroll: true, onSuccess: () => setModalOpen(false) });
        } else {
            form.post(base, { preserveScroll: true, onSuccess: () => setModalOpen(false) });
        }
    };

    const displayFields = fields.filter((f) => f.type !== 'textarea').slice(0, 4);

    const columns: TableColumn<CatalogRow>[] = displayFields.map((f) => ({
        key: f.key,
        header: f.label,
        cardTitle: f.key === displayFields[0]?.key,
        cell: (row: CatalogRow) => {
            const v = row[f.key];
            if (f.type === 'boolean') {
                return (
                    <Badge
                        className={
                            v
                                ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                                : 'border-slate-200 bg-slate-50 text-slate-600'
                        }
                    >
                        {v ? 'Sí' : 'No'}
                    </Badge>
                );
            }
            return <span className="text-sm">{String(v ?? '—')}</span>;
        },
    }));

    const statBadges: StatBadge[] = [
        { label: 'Total', value: stats?.total ?? items.total, color: STAT_COLORS.blue },
        {
            label: 'Activos',
            value: stats?.active ?? '—',
            color: STAT_COLORS.emerald,
        },
    ];

    return (
        <>
            <Head title={title} />
            <div className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                <PageHeader
                    title={title}
                    description={`Catálogo de ${resourceLabel}.`}
                    stats={statBadges}
                    actions={
                        can(`${prefix}.create`) ? (
                            <Button
                                type="button"
                                variant="brand"
                                size="sm"
                                className="cursor-pointer gap-1.5"
                                onClick={openCreate}
                            >
                                <Plus className="size-4" />
                                Nuevo
                            </Button>
                        ) : undefined
                    }
                />

                <SearchFilter
                    initialValue={filters.search ?? ''}
                    placeholder={`Buscar ${resourceLabel}…`}
                    paramName="search"
                    only={[...ONLY]}
                />

                <DataTable
                    columns={columns}
                    rows={rows}
                    rowKey="id"
                    emptyMessage={`No hay ${resourceLabel} registrados.`}
                    rowActions={(row) => (
                        <>
                            {can(`${prefix}.edit`) && (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    title="Editar"
                                    className={`${actionBtn} text-violet-600 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-800`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        openEdit(row);
                                    }}
                                >
                                    <Edit2 className="size-3.5" />
                                </Button>
                            )}
                            {can(`${prefix}.delete`) && (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    title="Eliminar"
                                    className={`${actionBtn} text-rose-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-800`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteId(row.id);
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

            <ResourceModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editing ? `Editar ${resourceLabel}` : `Nuevo ${resourceLabel}`}
                description={
                    editing
                        ? `Modifica los datos de este registro del catálogo.`
                        : `Crea un nuevo ítem en el catálogo de ${resourceLabel}.`
                }
                onSubmit={handleSubmit}
                isProcessing={form.processing}
                submitLabel={editing ? 'Guardar cambios' : 'Crear'}
            >
                {fields.map((f) => (
                    <FormField
                        key={f.key}
                        label={f.label}
                        htmlFor={`catalog-${f.key}`}
                        error={form.errors[f.key] as string | undefined}
                        required={f.required}
                    >
                        {f.type === 'textarea' ? (
                            <Textarea
                                id={`catalog-${f.key}`}
                                value={String(form.data[f.key] ?? '')}
                                onChange={(e) => form.setData(f.key, e.target.value)}
                                disabled={form.processing}
                            />
                        ) : f.type === 'boolean' ? (
                            <label className="flex cursor-pointer items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={Boolean(form.data[f.key])}
                                    onChange={(e) => form.setData(f.key, e.target.checked)}
                                    disabled={form.processing}
                                    className="size-4 rounded accent-[#cc0010]"
                                />
                                <span className="text-sm text-muted-foreground">Activo en plataforma</span>
                            </label>
                        ) : (
                            <Input
                                id={`catalog-${f.key}`}
                                type={f.type === 'number' ? 'number' : 'text'}
                                value={String(form.data[f.key] ?? '')}
                                onChange={(e) =>
                                    form.setData(
                                        f.key,
                                        f.type === 'number' ? Number(e.target.value) : e.target.value,
                                    )
                                }
                                disabled={form.processing}
                            />
                        )}
                    </FormField>
                ))}
            </ResourceModal>

            <ConfirmModal
                open={deleteId !== null}
                onClose={() => setDeleteId(null)}
                title="Eliminar registro"
                description="¿Confirmas eliminar este registro del catálogo?"
                confirmLabel="Eliminar"
                variant="destructive"
                onConfirm={() => {
                    if (deleteId) {
                        router.delete(`${base}/${deleteId}`, {
                            preserveScroll: true,
                            onFinish: () => setDeleteId(null),
                        });
                    }
                }}
            />
        </>
    );
}

export default CatalogCrudPage;
