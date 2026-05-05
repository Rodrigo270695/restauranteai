/**
 * PermissionsModal — selector de permisos con árbol módulo → ítem → acciones.
 *
 * La estructura del árbol refleja la navegación del sidebar.
 * Solo muestra grupos/ítems que tengan al menos un permiso disponible en `allPermissions`.
 */

import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// ─── tipos ────────────────────────────────────────────────────────────────────

type Permission = { id: number; name: string };

export type PermissionsModalProps = {
    open: boolean;
    onClose: () => void;
    allPermissions: Permission[];
    selected: string[];
    onSave: (permissions: string[]) => void;
    isProcessing?: boolean;
};

// ─── árbol de permisos ────────────────────────────────────────────────────────
// Refleja la estructura de app-sidebar-nav.ts.
// Cada módulo → ítems → acciones.
// Ir agregando a medida que se desarrollan los módulos.

type PermTreeItem = {
    label: string;
    permissions: Record<string, string>; // name → etiqueta amigable
};

type PermTreeModule = {
    label: string;
    icon: string;
    items: Record<string, PermTreeItem>;
};

const PERMISSION_TREE: Record<string, PermTreeModule> = {
    dashboard: {
        label: 'Dashboard',
        icon: '🏠',
        items: {
            dashboard: {
                label: 'Dashboard',
                permissions: {
                    'dashboard.view': 'Ver dashboard',
                },
            },
        },
    },
    admin: {
        label: 'Administración',
        icon: '🛡️',
        items: {
            roles: {
                label: 'Roles',
                permissions: {
                    'roles.view':               'Ver roles',
                    'roles.create':             'Crear roles',
                    'roles.edit':               'Editar roles',
                    'roles.delete':             'Eliminar roles',
                    'roles.assign_permissions': 'Asignar permisos',
                },
            },
            users: {
                label: 'Usuarios',
                permissions: {
                    'users.view':         'Ver usuarios',
                    'users.create':       'Crear usuarios',
                    'users.edit':         'Editar usuarios',
                    'users.delete':       'Eliminar usuarios',
                    'users.assign_roles': 'Asignar roles a usuarios',
                },
            },
            business_approval: {
                label: 'Aprobación de negocios',
                permissions: {
                    'owners.approve_business': 'Aprobar negocios de restaurante',
                },
            },
            restaurants: {
                label: 'Restaurantes',
                permissions: {
                    'restaurants.view':   'Ver restaurantes',
                    'restaurants.create': 'Crear restaurantes',
                    'restaurants.edit':   'Editar restaurantes',
                    'restaurants.delete': 'Eliminar restaurantes',
                },
            },
            business_requests: {
                label: 'Solicitudes de negocio',
                permissions: {
                    'business_requests.view':   'Ver solicitudes',
                    'business_requests.manage': 'Gestionar solicitudes',
                },
            },
        },
    },
    catalogs: {
        label: 'Catálogos',
        icon: '🗂️',
        items: {
            geography: {
                label: 'Geografía',
                permissions: {
                    'geography.view':   'Ver geografía',
                    'geography.create': 'Crear registros',
                    'geography.edit':   'Editar registros',
                    'geography.delete': 'Eliminar registros',
                },
            },
            cuisine_types: {
                label: 'Tipos de cocina',
                permissions: {
                    'cuisine_types.view':   'Ver tipos de cocina',
                    'cuisine_types.create': 'Crear tipo',
                    'cuisine_types.edit':   'Editar tipo',
                    'cuisine_types.delete': 'Eliminar tipo',
                },
            },
            ambiances: {
                label: 'Ambientes',
                permissions: {
                    'ambiances.view':   'Ver ambientes',
                    'ambiances.create': 'Crear ambiente',
                    'ambiances.edit':   'Editar ambiente',
                    'ambiances.delete': 'Eliminar ambiente',
                },
            },
            services: {
                label: 'Servicios (catálogo)',
                permissions: {
                    'services.view':   'Ver servicios',
                    'services.create': 'Crear servicio',
                    'services.edit':   'Editar servicio',
                    'services.delete': 'Eliminar servicio',
                },
            },
            dish_categories: {
                label: 'Categorías de platos',
                permissions: {
                    'dish_categories.view':   'Ver categorías',
                    'dish_categories.create': 'Crear categoría',
                    'dish_categories.edit':   'Editar categoría',
                    'dish_categories.delete': 'Eliminar categoría',
                },
            },
            languages: {
                label: 'Idiomas soportados',
                permissions: {
                    'languages.view':   'Ver idiomas',
                    'languages.create': 'Crear idioma',
                    'languages.edit':   'Editar idioma',
                    'languages.delete': 'Eliminar idioma',
                },
            },
        },
    },
    business: {
        label: 'Mi Restaurante',
        icon: '🍽️',
        items: {
            own_restaurant: {
                label: 'Datos del local',
                permissions: {
                    'manage_own_restaurant': 'Gestionar mi restaurante',
                },
            },
            dishes: {
                label: 'Platos',
                permissions: {
                    'manage_dishes': 'Gestionar platos',
                },
            },
            schedules: {
                label: 'Horarios',
                permissions: {
                    'manage_schedules': 'Gestionar horarios',
                },
            },
            promotions: {
                label: 'Promociones',
                permissions: {
                    'manage_promotions': 'Gestionar promociones',
                },
            },
        },
    },
    ml: {
        label: 'Motor de recomendación',
        icon: '🤖',
        items: {
            interactions: {
                label: 'Interacciones',
                permissions: {
                    'interactions.view': 'Ver interacciones',
                },
            },
            recommendations: {
                label: 'Recomendaciones',
                permissions: {
                    'recommendations.view':   'Ver recomendaciones',
                    'recommendations.manage': 'Gestionar recomendaciones',
                },
            },
        },
    },
    tam: {
        label: 'Investigación',
        icon: '📊',
        items: {
            tam_surveys: {
                label: 'Encuestas TAM',
                permissions: {
                    'tam_surveys.view':   'Ver encuestas',
                    'tam_surveys.manage': 'Gestionar encuestas',
                },
            },
        },
    },
};

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Filtra el árbol para mostrar solo items/permisos que existen en la DB */
function buildVisibleTree(allPerms: Permission[], search: string) {
    const available = new Set(allPerms.map((p) => p.name));
    const q = search.trim().toLowerCase();

    const modules: {
        id: string;
        label: string;
        icon: string;
        items: {
            id: string;
            label: string;
            permissions: { name: string; label: string }[];
        }[];
    }[] = [];

    for (const [modId, mod] of Object.entries(PERMISSION_TREE)) {
        const items: typeof modules[number]['items'] = [];

        for (const [itemId, item] of Object.entries(mod.items)) {
            const perms = Object.entries(item.permissions)
                .filter(([name]) => available.has(name))
                .filter(([name, label]) =>
                    !q || name.toLowerCase().includes(q) || label.toLowerCase().includes(q),
                )
                .map(([name, label]) => ({ name, label }));

            if (perms.length > 0) {
                items.push({ id: itemId, label: item.label, permissions: perms });
            }
        }

        if (items.length > 0) {
            modules.push({ id: modId, label: mod.label, icon: mod.icon, items });
        }
    }

    return modules;
}

// ─── componente principal ─────────────────────────────────────────────────────

export function PermissionsModal({
    open,
    onClose,
    allPermissions,
    selected,
    onSave,
    isProcessing = false,
}: PermissionsModalProps) {
    const [localSelected, setLocalSelected] = useState<Set<string>>(new Set(selected));
    const [search, setSearch] = useState('');

    // Sincronizar permisos seleccionados CADA VEZ que el modal se abre
    // (handleOpenChange de Radix no se dispara en opens programáticos via prop)
    useEffect(() => {
        if (open) {
            setLocalSelected(new Set(selected));
            setSearch('');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const handleOpenChange = (o: boolean) => {
        if (!o) onClose();
    };

    const tree = useMemo(() => buildVisibleTree(allPermissions, search), [allPermissions, search]);

    const toggle = (name: string) =>
        setLocalSelected((prev) => {
            const next = new Set(prev);
            next.has(name) ? next.delete(name) : next.add(name);
            return next;
        });

    const toggleGroup = (names: string[]) =>
        setLocalSelected((prev) => {
            const next = new Set(prev);
            const allIn = names.every((n) => next.has(n));
            allIn ? names.forEach((n) => next.delete(n)) : names.forEach((n) => next.add(n));
            return next;
        });

    const toggleModule = (names: string[]) => toggleGroup(names);

    const selectAll = () =>
        setLocalSelected(new Set(allPermissions.map((p) => p.name)));
    const clearAll = () => setLocalSelected(new Set());
    const handleSave = () => { onSave(Array.from(localSelected)); onClose(); };

    const totalSelected = localSelected.size;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                className="flex max-h-[88dvh] flex-col gap-0 p-0 sm:max-w-lg"
                onInteractOutside={(e) => e.preventDefault()}
            >
                {/* Cabecera */}
                <DialogHeader className="shrink-0 px-5 pt-5 pb-3">
                    <DialogTitle className="text-base font-semibold">
                        Asignar permisos
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        Selecciona los permisos que tendrá este rol.{' '}
                        <span className="font-semibold text-foreground">
                            {totalSelected} seleccionados
                        </span>
                    </DialogDescription>
                </DialogHeader>

                <Separator className="shrink-0" />

                {/* Buscador + acciones globales */}
                <div className="shrink-0 space-y-2 px-4 py-3">
                    <div className="relative">
                        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Filtrar permisos…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-8 pl-8 text-xs"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={selectAll}
                            className="cursor-pointer text-[11px] font-medium underline-offset-2 hover:underline"
                            style={{ color: '#cc0010' }}>
                            Seleccionar todos
                        </button>
                        <span className="text-muted-foreground text-[11px]">·</span>
                        <button type="button" onClick={clearAll}
                            className="cursor-pointer text-[11px] font-medium text-muted-foreground underline-offset-2 hover:underline">
                            Limpiar selección
                        </button>
                    </div>
                </div>

                <Separator className="shrink-0" />

                {/* Árbol con scroll */}
                <div className="flex-1 overflow-y-auto px-3 py-2.5">
                    {tree.length === 0 ? (
                        <p className="py-6 text-center text-xs text-muted-foreground">
                            No se encontraron permisos.
                        </p>
                    ) : (
                        <div className="space-y-2.5">
                            {tree.map((mod) => {
                                const modAllPerms = mod.items.flatMap((i) => i.permissions.map((p) => p.name));
                                const modChecked     = modAllPerms.every((n) => localSelected.has(n));
                                const modIndeterminate = !modChecked && modAllPerms.some((n) => localSelected.has(n));

                                return (
                                    <div key={mod.id} className="overflow-hidden rounded-xl border border-border/60">
                                        {/* Cabecera módulo */}
                                        <button
                                            type="button"
                                            onClick={() => toggleModule(modAllPerms)}
                                            className={cn(
                                                'flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left transition-colors',
                                                modChecked
                                                    ? 'bg-red-50 dark:bg-red-950/30'
                                                    : modIndeterminate
                                                    ? 'bg-orange-50/50 dark:bg-orange-950/15'
                                                    : 'bg-muted/50 hover:bg-muted/70',
                                            )}
                                        >
                                            <BrandCheckbox checked={modChecked} indeterminate={modIndeterminate} />
                                            <span className="text-sm">{mod.icon}</span>
                                            <span className="text-xs font-bold tracking-tight text-foreground">
                                                {mod.label}
                                            </span>
                                            <span className="ml-auto text-[10px] tabular-nums text-muted-foreground">
                                                {modAllPerms.filter((n) => localSelected.has(n)).length}/{modAllPerms.length}
                                            </span>
                                        </button>

                                        {/* Ítems del módulo */}
                                        <div className="divide-y divide-border/40 border-t border-border/60">
                                            {mod.items.map((item) => {
                                                const itemNames    = item.permissions.map((p) => p.name);
                                                const itemChecked  = itemNames.every((n) => localSelected.has(n));
                                                const itemIndet    = !itemChecked && itemNames.some((n) => localSelected.has(n));

                                                return (
                                                    <div key={item.id}>
                                                        {/* Sub-cabecera ítem */}
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleGroup(itemNames)}
                                                            className={cn(
                                                                'flex w-full cursor-pointer items-center gap-2.5 bg-background px-4 py-1.5 text-left transition-colors hover:bg-muted/30',
                                                                itemChecked && 'bg-red-50/40 dark:bg-red-950/10',
                                                            )}
                                                        >
                                                            <BrandCheckbox checked={itemChecked} indeterminate={itemIndet} size="sm" />
                                                            <span className="text-[11px] font-semibold text-foreground/80">
                                                                {item.label}
                                                            </span>
                                                            <span className="ml-auto text-[10px] tabular-nums text-muted-foreground">
                                                                {itemNames.filter((n) => localSelected.has(n)).length}/{itemNames.length}
                                                            </span>
                                                        </button>

                                                        {/* Permisos individuales */}
                                                        <div className="grid grid-cols-2 gap-x-1 gap-y-0.5 bg-background/70 px-5 pb-2 pt-1">
                                                            {item.permissions.map((perm) => {
                                                                const checked = localSelected.has(perm.name);
                                                                return (
                                                                    <label
                                                                        key={perm.name}
                                                                        title={perm.name}
                                                                        className={cn(
                                                                            'flex cursor-pointer items-center gap-1.5 rounded px-1.5 py-1 transition-colors hover:bg-muted/40',
                                                                            checked && 'bg-red-50/60 dark:bg-red-950/10',
                                                                        )}
                                                                    >
                                                                        <BrandCheckbox checked={checked} />
                                                                        <span className="text-[11px] text-foreground/80">
                                                                            {perm.label}
                                                                        </span>
                                                                        <input
                                                                            type="checkbox"
                                                                            className="sr-only"
                                                                            checked={checked}
                                                                            onChange={() => toggle(perm.name)}
                                                                        />
                                                                    </label>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <Separator className="shrink-0" />

                {/* Pie */}
                <DialogFooter className="shrink-0 flex-row items-center justify-between gap-2 px-5 py-3.5">
                    <span className="text-xs text-muted-foreground">
                        {totalSelected} de {allPermissions.length} permisos
                    </span>
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm"
                            onClick={onClose} disabled={isProcessing} className="cursor-pointer">
                            Cancelar
                        </Button>
                        <Button type="button" variant="brand" size="sm"
                            onClick={handleSave} disabled={isProcessing} className="cursor-pointer font-semibold">
                            Guardar permisos
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── checkbox visual ──────────────────────────────────────────────────────────

function BrandCheckbox({
    checked,
    indeterminate = false,
    size = 'md',
}: {
    checked: boolean;
    indeterminate?: boolean;
    size?: 'sm' | 'md';
}) {
    const dim = size === 'sm' ? 'size-3' : 'size-3.5';

    if (checked) {
        return (
            <span className={cn('flex shrink-0 items-center justify-center rounded-sm border', dim)}
                style={{ background: 'linear-gradient(135deg,#e8001a,#8b0008)', borderColor: '#cc0010' }}>
                <svg viewBox="0 0 10 10" className="size-2.5 text-white" fill="none">
                    <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5"
                        strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </span>
        );
    }

    if (indeterminate) {
        return (
            <span className={cn('flex shrink-0 items-center justify-center rounded-sm border', dim)}
                style={{ borderColor: '#cc0010', background: '#fff1f2' }}>
                <span className="block h-0.5 w-2" style={{ background: '#cc0010' }} />
            </span>
        );
    }

    return (
        <span className={cn('flex shrink-0 rounded-sm border border-border/70 bg-background', dim)} />
    );
}
