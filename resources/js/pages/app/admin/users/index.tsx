import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    Building2,
    Edit2,
    KeyRound,
    LayoutList,
    Monitor,
    Plus,
    SquareFunction,
    Trash2,
    UserCheck,
    UserRound,
    UserX,
} from 'lucide-react';
import { useState } from 'react';

import { OwnerBusinessApprovalModal } from '@/components/app/admin/owner-business-approval-modal';
import { UserFormModal } from '@/components/app/admin/user-form-modal';
import { ConfirmModal } from '@/components/modals/confirm-modal';
import { RolesModal } from '@/components/modals/roles-modal';
import { DataTable } from '@/components/shared/data-table';
import type { SortDir, TableColumn } from '@/components/shared/data-table';
import { OwnerApprovalStatusFilter } from '@/components/shared/owner-approval-status-filter';
import { PageHeader, STAT_COLORS } from '@/components/shared/page-header';
import type { StatBadge } from '@/components/shared/page-header';
import { PaginationLinks } from '@/components/shared/pagination-links';
import type { PaginationMeta } from '@/components/shared/pagination-links';
import { RoleSelectFilter } from '@/components/shared/role-select-filter';
import { SearchFilter } from '@/components/shared/search-filter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { APP_HREF } from '@/config/app-sidebar-nav';
import { useCan } from '@/hooks/use-can';
import { appBreadcrumbs } from '@/lib/app-breadcrumbs';
import {
    approveRestaurant as usersApproveRestaurant,
    destroy as usersDestroy,
    store as usersStore,
    update as usersUpdate,
} from '@/routes/app/admin/users';

// ─── tipos ────────────────────────────────────────────────────────────────────

type Role = { id: number; name: string };

type RestaurantProfileRow = {
    status: 'pending' | 'approved' | 'rejected';
    business_name?: string | null;
    ruc?: string | null;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    district?: string | null;
    description?: string | null;
    website?: string | null;
    rejection_reason?: string | null;
};

type UserRow = {
    id: number;
    name: string;
    email: string;
    created_at: string;
    roles_count: number;
    roles?: Role[];
    /** Perfil de negocio (solo aplica a dueños); `status` = aprobación admin. */
    restaurant_profile?: RestaurantProfileRow | null;
};

type UsersPaginatedData = PaginationMeta & { data: UserRow[] };

type UsersPageProps = {
    users: UsersPaginatedData;
    allRoles: Role[];
    filters: { search: string; sort?: string; dir?: SortDir; role?: string; owner_status?: string };
    stats: {
        totalUsers: number;
        totalRoles: number;
        currentPage: number;
        lastPage: number;
        onPage: number;
        withoutRoles: number;
    };
};

const ONLY = ['users', 'stats', 'filters'] as const;

/** Dueños y turistas: no editar datos, no cambiar roles desde admin ni eliminar la cuenta. */
const NON_EDITABLE_ROLES = new Set(['restaurant_owner', 'tourist']);

const ROLE_LABELS: Record<string, string> = {
    super_admin: 'Super administrador',
    restaurant_owner: 'Dueño',
    tourist: 'Turista',
};

function formatRoleLabel(name: string): string {
    return ROLE_LABELS[name] ?? name;
}

function rowHasNonEditableRole(row: UserRow): boolean {
    return row.roles?.some((r) => NON_EDITABLE_ROLES.has(r.name)) ?? false;
}

function rowIsRestaurantOwner(row: UserRow): boolean {
    return row.roles?.some((r) => r.name === 'restaurant_owner') ?? false;
}

const APPROVAL_STYLE: Record<
    'pending' | 'approved' | 'rejected',
    { bg: string; border: string; color: string; label: string }
> = {
    pending: {
        bg: '#fffbeb',
        border: '#fcd34d',
        color: '#b45309',
        label: 'Pendiente',
    },
    approved: {
        bg: '#ecfdf5',
        border: '#a7f3d0',
        color: '#065f46',
        label: 'Aprobado',
    },
    rejected: {
        bg: '#fff1f2',
        border: '#fecdd3',
        color: '#be123c',
        label: 'Rechazado',
    },
};

// ─── vista ────────────────────────────────────────────────────────────────────

export default function AppAdminUsers({ users, allRoles, filters, stats }: UsersPageProps) {
    const can = useCan();
    const { auth } = usePage<{ auth: { user: { id: number } | null } }>().props;
    const myId = auth.user?.id;

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<UserRow | null>(null);
    const form = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const [rolesTarget, setRolesTarget] = useState<UserRow | null>(null);
    const [savingRoles, setSavingRoles] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
    const { delete: destroy, processing: deleting } = useForm({});

    const [approvalTarget, setApprovalTarget] = useState<UserRow | null>(null);
    const [approving, setApproving] = useState(false);

    const sortKey = filters.sort ?? 'name';
    const sortDir = filters.dir ?? 'asc';

    const handleSort = (key: string, dir: SortDir) => {
        const params = new URLSearchParams(window.location.search);
        params.set('sort', key);
        params.set('dir', dir);
        params.delete('page');
        router.get(window.location.pathname + '?' + params.toString(), {}, {
            preserveState: true,
            preserveScroll: true,
            only: [...ONLY],
        });
    };

    const applyRoleFilter = (roleNameOrEmpty: string) => {
        const params = new URLSearchParams(window.location.search);

        if (roleNameOrEmpty) {
            params.set('role', roleNameOrEmpty);
        } else {
            params.delete('role');
        }

        params.delete('page');
        router.get(
            window.location.pathname + (params.toString() ? `?${params.toString()}` : ''),
            {},
            { preserveState: true, preserveScroll: true, only: [...ONLY] },
        );
    };

    const applyOwnerStatusFilter = (statusOrEmpty: string) => {
        const params = new URLSearchParams(window.location.search);

        if (statusOrEmpty) {
            params.set('owner_status', statusOrEmpty);
        } else {
            params.delete('owner_status');
        }

        params.delete('page');
        router.get(
            window.location.pathname + (params.toString() ? `?${params.toString()}` : ''),
            {},
            { preserveState: true, preserveScroll: true, only: [...ONLY] },
        );
    };

    const openCreate = () => {
        setEditing(null);
        form.reset();
        setModalOpen(true);
    };

    const openEdit = (u: UserRow) => {
        setEditing(u);
        form.setData({
            name: u.name,
            email: u.email,
            password: '',
            password_confirmation: '',
        });
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        form.reset();
        form.clearErrors();
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (editing) {
            const payload: Record<string, string> = {
                name: form.data.name,
                email: form.data.email,
            };

            if (form.data.password) {
                payload.password = form.data.password;
                payload.password_confirmation = form.data.password_confirmation;
            }

            router.put(usersUpdate.url(editing.id), payload, {
                preserveScroll: true,
                onSuccess: closeModal,
                onError: (errs) => form.setError(errs),
            });
        } else {
            form.post(usersStore.url(), { preserveScroll: true, onSuccess: closeModal });
        }
    };

    const openRoles = (u: UserRow) => {
        setRolesTarget(u);
    };

    const saveRoles = (roles: string[]) => {
        if (!rolesTarget) {
            return;
        }

        setSavingRoles(true);
        router.put(
            usersUpdate.url(rolesTarget.id),
            { roles },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setRolesTarget(null);
                    setSavingRoles(false);
                },
                onError: () => setSavingRoles(false),
                onFinish: () => setSavingRoles(false),
            },
        );
    };

    const handleDelete = () => {
        if (!deleteTarget) {
            return;
        }

        destroy(usersDestroy.url(deleteTarget.id), {
            preserveScroll: true,
            onSuccess: () => setDeleteTarget(null),
            onError: () => setDeleteTarget(null),
        });
    };

    const handleApproveRestaurant = () => {
        if (!approvalTarget) {
            return;
        }

        setApproving(true);
        router.post(
            usersApproveRestaurant.url(approvalTarget.id),
            {},
            {
                preserveScroll: true,
                only: [...ONLY],
                onSuccess: () => setApprovalTarget(null),
                onFinish: () => setApproving(false),
            },
        );
    };

    const columns: TableColumn<UserRow>[] = [
        {
            key: 'name',
            header: 'Nombre',
            sortable: true,
            cardTitle: true,
            cell: (row) => (
                <span className="flex items-center gap-2 font-medium">
                    <UserRound className="size-3.5 shrink-0 text-muted-foreground" />
                    {row.name}
                </span>
            ),
        },
        {
            key: 'email',
            header: 'Correo',
            sortable: true,
            cell: (row) => (
                <span className="text-sm text-muted-foreground">{row.email}</span>
            ),
        },
        {
            key: 'roles_count',
            header: 'Rol(es)',
            sortable: true,
            cell: (row) =>
                row.roles && row.roles.length > 0 ? (
                    <div className="flex max-w-[220px] flex-wrap gap-1">
                        {row.roles.map((r) => (
                            <Badge
                                key={r.id}
                                variant="outline"
                                className="font-normal"
                                style={{
                                    backgroundColor: '#f5f3ff',
                                    borderColor: '#ddd6fe',
                                    color: '#6d28d9',
                                }}
                            >
                                {formatRoleLabel(r.name)}
                            </Badge>
                        ))}
                    </div>
                ) : (
                    <Badge
                        variant="outline"
                        className="tabular-nums"
                        style={{
                            backgroundColor: '#fff1f2',
                            borderColor: '#fecdd3',
                            color: '#be123c',
                        }}
                    >
                        —
                    </Badge>
                ),
        },
        {
            key: 'owner_status',
            header: 'Estado',
            sortable: false,
            cell: (row) => {
                if (!rowIsRestaurantOwner(row)) {
                    return (
                        <span className="text-xs text-muted-foreground">—</span>
                    );
                }

                const st = row.restaurant_profile?.status;

                if (!st) {
                    return (
                        <Badge variant="outline" className="font-normal text-muted-foreground">
                            Sin perfil
                        </Badge>
                    );
                }

                const cfg = APPROVAL_STYLE[st];

                return (
                    <Badge
                        variant="outline"
                        className="font-normal"
                        style={{
                            backgroundColor: cfg.bg,
                            borderColor: cfg.border,
                            color: cfg.color,
                        }}
                    >
                        {cfg.label}
                    </Badge>
                );
            },
        },
        {
            key: 'created_at',
            header: 'Creado',
            sortable: true,
            cell: (row) => (
                <span className="text-xs text-muted-foreground">
                    {new Date(row.created_at).toLocaleDateString('es-PE', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                    })}
                </span>
            ),
        },
    ];

    const statBadges: StatBadge[] = [
        { icon: <UserCheck className="size-3.5" />, label: 'Usuarios', value: stats.totalUsers, color: STAT_COLORS.blue },
        { icon: <SquareFunction className="size-3.5" />, label: 'Roles (cat.)', value: stats.totalRoles, color: STAT_COLORS.violet },
        { icon: <LayoutList className="size-3.5" />, label: 'Página', value: `${stats.currentPage}/${stats.lastPage}`, color: STAT_COLORS.amber },
        { icon: <Monitor className="size-3.5" />, label: 'En pantalla', value: stats.onPage, color: STAT_COLORS.emerald },
        { icon: <UserX className="size-3.5" />, label: 'Sin roles', value: stats.withoutRoles, color: STAT_COLORS.rose },
    ];

    return (
        <>
            <Head title="Usuarios" />

            <div className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                <PageHeader
                    title="Usuarios"
                    description="Cuentas y roles. Los dueños muestran el estado de aprobación del negocio (registro en restaurant_profiles); hasta ser aprobados no acceden al panel del restaurante."
                    stats={statBadges}
                    actions={
                        can('users.create') ? (
                            <Button
                                size="sm"
                                variant="brand"
                                className="cursor-pointer gap-1.5 font-semibold"
                                onClick={openCreate}
                            >
                                <Plus className="size-4" />
                                Nuevo usuario
                            </Button>
                        ) : null
                    }
                />

                <SearchFilter
                    initialValue={filters.search}
                    placeholder="Buscar por nombre o correo…"
                    paramName="search"
                    only={[...ONLY]}
                >
                    <RoleSelectFilter
                        value={filters.role ?? ''}
                        onChange={applyRoleFilter}
                        roles={allRoles}
                        labelForRole={formatRoleLabel}
                    />
                    <OwnerApprovalStatusFilter
                        value={filters.owner_status ?? ''}
                        onChange={applyOwnerStatusFilter}
                    />
                </SearchFilter>

                <DataTable
                    columns={columns}
                    rows={users.data}
                    rowKey="id"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={handleSort}
                    emptyMessage="No se encontraron usuarios"
                    emptyDescription="Prueba con otra búsqueda o crea un nuevo usuario."
                    rowActions={(row) => (
                        <>
                            {can('owners.approve_business') &&
                                rowIsRestaurantOwner(row) &&
                                row.restaurant_profile?.status === 'pending' && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        title="Revisar y aprobar negocio"
                                        className="h-7 w-7 cursor-pointer rounded-md border p-0 text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 dark:hover:border-emerald-900 dark:hover:bg-emerald-950/40"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setApprovalTarget(row);
                                        }}
                                    >
                                        <Building2 className="size-3.5" />
                                    </Button>
                                )}

                            {can('users.assign_roles') && !rowHasNonEditableRole(row) && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    title="Gestionar roles"
                                    className="h-7 w-7 cursor-pointer rounded-md border p-0 text-violet-500 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:hover:border-violet-800 dark:hover:bg-violet-950/40"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        openRoles(row);
                                    }}
                                >
                                    <KeyRound className="size-3.5" />
                                </Button>
                            )}

                            {can('users.edit') && !rowHasNonEditableRole(row) && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    title="Editar usuario"
                                    className="h-7 w-7 cursor-pointer rounded-md border p-0 text-indigo-500 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/40"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        openEdit(row);
                                    }}
                                >
                                    <Edit2 className="size-3.5" />
                                </Button>
                            )}

                            {can('users.delete') && row.id !== myId && !rowHasNonEditableRole(row) && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    title="Eliminar usuario"
                                    className="h-7 w-7 cursor-pointer rounded-md border p-0 text-rose-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 dark:hover:border-rose-800 dark:hover:bg-rose-950/40"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteTarget(row);
                                    }}
                                >
                                    <Trash2 className="size-3.5" />
                                </Button>
                            )}
                        </>
                    )}
                />

                <PaginationLinks meta={users} only={[...ONLY]} />
            </div>

            <UserFormModal
                open={modalOpen}
                onClose={closeModal}
                editing={editing}
                form={form}
                onSubmit={handleSubmit}
            />

            <RolesModal
                key={rolesTarget?.id ?? 0}
                open={!!rolesTarget}
                onClose={() => setRolesTarget(null)}
                allRoles={allRoles}
                selected={rolesTarget?.roles?.map((r) => r.name) ?? []}
                onSave={saveRoles}
                isProcessing={savingRoles}
            />

            <ConfirmModal
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                isProcessing={deleting}
                title="Eliminar usuario"
                description="Esta acción es irreversible. Se eliminará el usuario"
                itemLabel={deleteTarget?.email}
                confirmLabel="Sí, eliminar"
            />

            <OwnerBusinessApprovalModal
                open={!!approvalTarget}
                onClose={() => setApprovalTarget(null)}
                userName={approvalTarget?.name ?? ''}
                userEmail={approvalTarget?.email ?? ''}
                profile={approvalTarget?.restaurant_profile ?? null}
                onApprove={handleApproveRestaurant}
                isProcessing={approving}
            />
        </>
    );
}

AppAdminUsers.layout = {
    breadcrumbs: appBreadcrumbs('Usuarios', APP_HREF.adminUsers),
};
