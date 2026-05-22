import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ConfirmModal } from '@/components/modals/confirm-modal';
import { DataTable, type TableColumn } from '@/components/shared/data-table';
import { PageHeader } from '@/components/shared/page-header';
import { PaginationLinks, type PaginationMeta } from '@/components/shared/pagination-links';
import { SearchFilter } from '@/components/shared/search-filter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCan } from '@/hooks/use-can';
import type { FieldDef } from '@/components/crud/catalog-crud-page';

type Row = Record<string, unknown> & { id: number };

const RESOURCE_PATH: Record<string, string> = {
    dishes: '/app/dishes',
    promotions: '/app/promotions',
    gallery: '/app/gallery',
    schedules: '/app/schedules',
    reviews: '/app/reviews',
};

const PERM: Record<string, string> = {
    dishes: 'manage_dishes',
    promotions: 'manage_promotions',
    gallery: 'manage_gallery',
    schedules: 'manage_schedules',
    reviews: 'reviews.view',
};

type Props = {
    resourceKey: string;
    title: string;
    resourceLabel: string;
    fields: FieldDef[];
    readonly?: boolean;
    items: PaginationMeta & { data: Row[] };
    filters: { search?: string };
    options?: Record<string, { id: number; name: string }[]>;
};

function emptyForm(fields: FieldDef[]): Record<string, unknown> {
    const data: Record<string, unknown> = {};
    for (const f of fields) {
        if (f.type === 'boolean') data[f.key] = f.default ?? true;
        else if (f.type === 'number') data[f.key] = f.default ?? 0;
        else data[f.key] = '';
    }
    return data;
}

export function OwnerResourceCrudPage({
    resourceKey,
    title,
    resourceLabel,
    fields,
    readonly = false,
    items,
    filters,
    options = {},
}: Props) {
    const base = RESOURCE_PATH[resourceKey] ?? '';
    const permission = PERM[resourceKey] ?? '';
    const can = useCan();
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Row | null>(null);
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
        form.setData(emptyForm(fields));
        setModalOpen(true);
    };

    const openEdit = (row: Row) => {
        setEditing(row);
        const data = emptyForm(fields);
        for (const f of fields) {
            data[f.key] = row[f.key] ?? data[f.key];
        }
        form.setData(data);
        setModalOpen(true);
    };

    const submit = () => {
        if (editing) {
            form.put(`${base}/${editing.id}`, { preserveScroll: true, onSuccess: () => setModalOpen(false) });
        } else {
            form.post(base, { preserveScroll: true, onSuccess: () => setModalOpen(false) });
        }
    };

    const rows = items?.data ?? [];

    const columns: TableColumn<Row>[] = [
        {
            key: 'main',
            header: 'Registro',
            cardTitle: true,
            cell: (row) => {
                if (resourceKey === 'reviews') {
                    const user = row.user as { name?: string } | undefined;
                    return (
                        <div className="text-sm">
                            <span className="font-medium">{user?.name ?? 'Turista'}</span>
                            <span className="text-muted-foreground"> — {String(row.rating)}★</span>
                            <p className="text-muted-foreground line-clamp-1">{String(row.comment ?? '')}</p>
                        </div>
                    );
                }
                const label = row.title ?? row.name ?? row.path ?? `#${row.id}`;
                return <span className="text-sm font-medium">{String(label)}</span>;
            },
        },
    ];

    return (
        <>
            <Head title={title} />
            <PageHeader
                title={title}
                description={readonly ? `Listado de ${resourceLabel} de tu local.` : `Gestiona ${resourceLabel} de tu restaurante.`}
                actions={
                    !readonly && can(permission) ? (
                        <Button type="button" variant="brand" size="sm" className="gap-1.5" onClick={openCreate}>
                            <Plus className="size-4" />
                            Nuevo
                        </Button>
                    ) : undefined
                }
            />
            <div className="space-y-4 px-4 pb-6 md:px-6">
                {!readonly && (
                    <SearchFilter
                        value={filters.search ?? ''}
                        onSearch={(q) => router.get(base, { search: q || undefined }, { preserveState: true })}
                    />
                )}
                <DataTable
                    columns={columns}
                    rows={rows}
                    rowKey="id"
                    emptyMessage={`Sin ${resourceLabel} aún.`}
                    rowActions={
                        readonly || !can(permission)
                            ? undefined
                            : (row) => (
                                  <>
                                      <Button
                                          type="button"
                                          size="sm"
                                          variant="ghost"
                                          className="h-7 w-7 cursor-pointer p-0 text-violet-600"
                                          onClick={(e) => {
                                              e.stopPropagation();
                                              openEdit(row);
                                          }}
                                      >
                                          <Edit2 className="size-3.5" />
                                      </Button>
                                      <Button
                                          type="button"
                                          size="sm"
                                          variant="ghost"
                                          className="h-7 w-7 cursor-pointer p-0 text-rose-600"
                                          onClick={(e) => {
                                              e.stopPropagation();
                                              setDeleteId(row.id);
                                          }}
                                      >
                                          <Trash2 className="size-3.5" />
                                      </Button>
                                  </>
                              )
                    }
                />
                <PaginationLinks meta={items} />
            </div>

            {!readonly && (
                <>
                    <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>
                                    {editing ? 'Editar' : 'Nuevo'} {resourceLabel}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-3 py-2">
                                {fields.map((f) => (
                                    <div key={f.key} className="grid gap-1.5">
                                        <Label>{f.label}</Label>
                                        {f.type === 'textarea' ? (
                                            <Textarea
                                                value={String(form.data[f.key] ?? '')}
                                                onChange={(e) => form.setData(f.key, e.target.value)}
                                            />
                                        ) : f.type === 'select' && f.relation ? (
                                            <select
                                                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                                                value={String(form.data[f.key] ?? '')}
                                                onChange={(e) => form.setData(f.key, e.target.value ? Number(e.target.value) : null)}
                                            >
                                                <option value="">—</option>
                                                {(options[f.relation] ?? []).map((o) => (
                                                    <option key={o.id} value={o.id}>
                                                        {o.name}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : f.type === 'select' && f.options ? (
                                            <select
                                                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                                                value={String(form.data[f.key] ?? '')}
                                                onChange={(e) => form.setData(f.key, e.target.value)}
                                            >
                                                {f.options.map((o) => (
                                                    <option key={o} value={o}>
                                                        {o}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : f.type === 'boolean' ? (
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={Boolean(form.data[f.key])}
                                                    onChange={(e) => form.setData(f.key, e.target.checked)}
                                                />
                                                <span className="text-sm">Sí</span>
                                            </label>
                                        ) : (
                                            <Input
                                                type={f.type === 'number' || f.type === 'datetime' ? (f.type === 'datetime' ? 'datetime-local' : 'number') : f.type === 'time' ? 'time' : 'text'}
                                                value={String(form.data[f.key] ?? '')}
                                                onChange={(e) =>
                                                    form.setData(
                                                        f.key,
                                                        f.type === 'number' ? Number(e.target.value) : e.target.value,
                                                    )
                                                }
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button type="button" variant="brand" disabled={form.processing} onClick={submit}>
                                    Guardar
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    <ConfirmModal
                        open={deleteId !== null}
                        onClose={() => setDeleteId(null)}
                        title="Eliminar"
                        description="¿Eliminar este registro?"
                        confirmLabel="Eliminar"
                        variant="destructive"
                        onConfirm={() => {
                            if (deleteId) {
                                router.delete(`${base}/${deleteId}`, { preserveScroll: true, onFinish: () => setDeleteId(null) });
                            }
                        }}
                    />
                </>
            )}
        </>
    );
}

export default OwnerResourceCrudPage;
