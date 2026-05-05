import { Head, router, useForm } from '@inertiajs/react';
import {
    Edit2,
    KeyRound,
    LayoutList,
    Monitor,
    Plus,
    Shield,
    ShieldCheck,
    ShieldOff,
    SquareFunction,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';

import { RoleFormModal } from '@/components/app/admin/role-form-modal';
import { ConfirmModal } from '@/components/modals/confirm-modal';
import { DataTable, type SortDir, type TableColumn } from '@/components/shared/data-table';
import { PageHeader, STAT_COLORS, type StatBadge } from '@/components/shared/page-header';
import { PaginationLinks, type PaginationMeta } from '@/components/shared/pagination-links';
import { PermissionsModal } from '@/components/modals/permissions-modal';
import { SearchFilter } from '@/components/shared/search-filter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { APP_HREF } from '@/config/app-sidebar-nav';
import { useCan } from '@/hooks/use-can';
import { appBreadcrumbs } from '@/lib/app-breadcrumbs';
import {
    destroy as rolesDestroy,
    store as rolesStore,
    update as rolesUpdate,
} from '@/routes/app/admin/roles';

// ─── tipos ────────────────────────────────────────────────────────────────────

type Permission = { id: number; name: string };

type Role = {
    id: number;
    name: string;
    guard_name: string;
    permissions_count: number;
    users_count: number;
    created_at: string;
    permissions?: Permission[];
};

type RolesPaginatedData = PaginationMeta & { data: Role[] };

type RolesPageProps = {
    roles: RolesPaginatedData;
    allPermissions: Permission[];
    filters: { search: string; sort?: string; dir?: SortDir };
    stats: {
        totalRoles: number;
        totalPermissions: number;
        currentPage: number;
        lastPage: number;
        onPage: number;
        withoutPermissions: number;
    };
};

// ─── constantes ───────────────────────────────────────────────────────────────

const PROTECTED = ['super_admin', 'restaurant_owner', 'tourist'];
const ONLY = ['roles', 'stats', 'filters'] as const;

// ─── vista ────────────────────────────────────────────────────────────────────

export default function AppAdminRoles({ roles, allPermissions, filters, stats }: RolesPageProps) {
    const can = useCan();

    /* ── modal crear/editar ── */
    const [modalOpen, setModalOpen]  = useState(false);
    const [editing, setEditing]      = useState<Role | null>(null);
    const form = useForm({ name: '', permissions: [] as string[] });

    /* ── modal permisos ── */
    const [permTarget, setPermTarget] = useState<Role | null>(null);
    const [savingPerms, setSavingPerms] = useState(false);

    /* ── modal confirmación eliminar ── */
    const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
    const { delete: destroy, processing: deleting } = useForm({});

    /* ── sorting ── */
    const sortKey = filters.sort ?? 'name';
    const sortDir = filters.dir ?? 'asc';

    const handleSort = (key: string, dir: SortDir) => {
        const params = new URLSearchParams(window.location.search);
        params.set('sort', key); params.set('dir', dir); params.delete('page');
        router.get(window.location.pathname + '?' + params.toString(), {}, {
            preserveState: true, preserveScroll: true, only: [...ONLY],
        });
    };

    /* ── crear/editar ── */
    const openCreate = () => { setEditing(null); form.reset(); setModalOpen(true); };
    const openEdit   = (role: Role) => { setEditing(role); form.setData({ name: role.name, permissions: [] }); setModalOpen(true); };
    const closeModal = () => { setModalOpen(false); form.reset(); form.clearErrors(); };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (editing) {
            form.put(rolesUpdate.url(editing.id), { preserveScroll: true, onSuccess: closeModal });
        } else {
            form.post(rolesStore.url(), { preserveScroll: true, onSuccess: closeModal });
        }
    };

    /* ── permisos ── */
    const openPerms = (role: Role) => setPermTarget(role);

    /**
     * Usa router.put directamente con los datos frescos para evitar el
     * "stale closure" de useForm (setData + put inmediato envía [] vacío).
     */
    const savePerms = (permissions: string[]) => {
        if (!permTarget) return;
        setSavingPerms(true);
        router.put(
            rolesUpdate.url(permTarget.id),
            { permissions },
            {
                preserveScroll: true,
                onSuccess: () => { setPermTarget(null); setSavingPerms(false); },
                onError:   () => setSavingPerms(false),
                onFinish:  () => setSavingPerms(false),
            },
        );
    };

    /* ── eliminar ── */
    const handleDelete = () => {
        if (!deleteTarget) return;
        destroy(rolesDestroy.url(deleteTarget.id), {
            preserveScroll: true,
            onSuccess: () => setDeleteTarget(null),
            onError:   () => setDeleteTarget(null),
        });
    };

    /* ── columnas tabla ── */
    const columns: TableColumn<Role>[] = [
        {
            key: 'name',
            header: 'Nombre del rol',
            sortable: true,
            cardTitle: true,
            cell: (row) => (
                <span className="flex items-center gap-2 font-medium">
                    <Shield className="size-3.5 shrink-0 text-muted-foreground" />
                    {row.name}
                    {PROTECTED.includes(row.name) && (
                        <span
                            className="rounded-full border px-2 py-0.5 text-[10px] font-semibold"
                            style={{ backgroundColor: '#f0f9ff', borderColor: '#bae6fd', color: '#0369a1' }}
                        >
                            sistema
                        </span>
                    )}
                </span>
            ),
        },
        {
            key: 'permissions_count',
            header: 'Permisos',
            sortable: true,
            cell: (row) => (
                <Badge variant="outline" className="tabular-nums" style={
                    row.permissions_count > 0
                        ? { backgroundColor: '#f5f3ff', borderColor: '#ddd6fe', color: '#6d28d9' }
                        : { backgroundColor: '#fff1f2', borderColor: '#fecdd3', color: '#be123c' }
                }>
                    {row.permissions_count}
                </Badge>
            ),
        },
        {
            key: 'users_count',
            header: 'Usuarios',
            sortable: true,
            cell: (row) => (
                <Badge variant="outline" className="tabular-nums"
                    style={{ backgroundColor: '#ecfdf5', borderColor: '#a7f3d0', color: '#065f46' }}>
                    {row.users_count}
                </Badge>
            ),
        },
        {
            key: 'created_at',
            header: 'Creado',
            sortable: true,
            cell: (row) => (
                <span className="text-xs text-muted-foreground">
                    {new Date(row.created_at).toLocaleDateString('es-PE', {
                        day: '2-digit', month: 'short', year: 'numeric',
                    })}
                </span>
            ),
        },
    ];

    /* ── badges estadísticas ── */
    const statBadges: StatBadge[] = [
        { icon: <ShieldCheck className="size-3.5" />,    label: 'Roles',        value: stats.totalRoles,                         color: STAT_COLORS.blue },
        { icon: <SquareFunction className="size-3.5" />, label: 'Permisos',     value: stats.totalPermissions,                   color: STAT_COLORS.violet },
        { icon: <LayoutList className="size-3.5" />,     label: 'Página',       value: `${stats.currentPage}/${stats.lastPage}`, color: STAT_COLORS.amber },
        { icon: <Monitor className="size-3.5" />,        label: 'En pantalla',  value: stats.onPage,                             color: STAT_COLORS.emerald },
        { icon: <ShieldOff className="size-3.5" />,      label: 'Sin permisos', value: stats.withoutPermissions,                 color: STAT_COLORS.rose },
    ];

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <>
            <Head title="Roles" />

            <div className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                <PageHeader
                    title="Roles"
                    description="Gestión de roles y permisos del sistema."
                    stats={statBadges}
                    actions={
                        can('roles.create') ? (
                            <Button size="sm" variant="brand"
                                className="cursor-pointer gap-1.5 font-semibold"
                                onClick={openCreate}
                            >
                                <Plus className="size-4" />
                                Nuevo rol
                            </Button>
                        ) : null
                    }
                />

                <SearchFilter
                    initialValue={filters.search}
                    placeholder="Buscar por nombre de rol…"
                    paramName="search"
                    only={[...ONLY]}
                />

                <DataTable
                    columns={columns}
                    rows={roles.data}
                    rowKey="id"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={handleSort} 
                    emptyMessage="No se encontraron roles"
                    emptyDescription="Prueba con otra búsqueda o crea un nuevo rol."
                    rowActions={(row) => (
                        <>
                            {/* Permisos — también roles sistema (nombre/editar/eliminar siguen bloqueados) */}
                            {can('roles.assign_permissions') && (
                                <Button size="sm" variant="ghost" title="Gestionar permisos"
                                    className="h-7 w-7 cursor-pointer rounded-md border p-0 text-violet-500 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:hover:border-violet-800 dark:hover:bg-violet-950/40"
                                    onClick={(e) => { e.stopPropagation(); openPerms(row); }}
                                >
                                    <KeyRound className="size-3.5" />
                                </Button>
                            )}

                            {/* Editar nombre — solo no-PROTECTED */}
                            {can('roles.edit') && !PROTECTED.includes(row.name) && (
                                <Button size="sm" variant="ghost" title="Editar rol"
                                    className="h-7 w-7 cursor-pointer rounded-md border p-0 text-indigo-500 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/40"
                                    onClick={(e) => { e.stopPropagation(); openEdit(row); }}
                                >
                                    <Edit2 className="size-3.5" />
                                </Button>
                            )}

                            {/* Eliminar — solo no-PROTECTED */}
                            {can('roles.delete') && !PROTECTED.includes(row.name) && (
                                <Button size="sm" variant="ghost" title="Eliminar rol"
                                    className="h-7 w-7 cursor-pointer rounded-md border p-0 text-rose-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 dark:hover:border-rose-800 dark:hover:bg-rose-950/40"
                                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }}
                                >
                                    <Trash2 className="size-3.5" />
                                </Button>
                            )}
                        </>
                    )}
                />

                <PaginationLinks meta={roles} only={[...ONLY]} />
            </div>

            <RoleFormModal
                open={modalOpen}
                onClose={closeModal}
                editing={editing}
                form={form}
                onSubmit={handleSubmit}
                protectedRoleNames={PROTECTED}
            />

            {/* Modal permisos — key fuerza re-mount al cambiar de rol (para que useEffect sincronice) */}
            <PermissionsModal
                key={permTarget?.id ?? 0}
                open={!!permTarget}
                onClose={() => setPermTarget(null)}
                allPermissions={allPermissions}
                selected={permTarget?.permissions?.map((p) => p.name) ?? []}
                onSave={savePerms}
                isProcessing={savingPerms}
            />

            {/* Modal confirmar eliminación */}
            <ConfirmModal
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                isProcessing={deleting}
                title="Eliminar rol"
                description="Esta acción es irreversible. Se eliminará el rol"
                itemLabel={deleteTarget?.name}
                confirmLabel="Sí, eliminar"
            />
        </>
    );
}

AppAdminRoles.layout = {
    breadcrumbs: appBreadcrumbs('Roles', APP_HREF.adminRoles),
};
