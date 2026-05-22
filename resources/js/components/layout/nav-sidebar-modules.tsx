import { usePage } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import {
    dashboardNavItem,
    type AppRole,
    type SidebarNavLeaf,
    type SidebarNavModule,
    sidebarNavModules,
} from '@/config/app-sidebar-nav';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn } from '@/lib/utils';

type PagePropsWithAuth = {
    auth: { roles: string[]; permissions: string[] };
    actingRestaurant?: { id: number; name: string } | null;
    [key: string]: unknown;
};

function moduleHasActiveItem(
    mod: SidebarNavModule & { visibleItems: SidebarNavLeaf[] },
    isCurrentUrl: (href: string, current?: string, startsWith?: boolean) => boolean,
): boolean {
    return mod.visibleItems.some((item) => isCurrentUrl(item.href, undefined, true));
}

function itemMatchesPath(itemHref: string, pathname: string): boolean {
    return pathname === itemHref || pathname.startsWith(`${itemHref}/`);
}

function isSuperAdminOnlyModule(m: SidebarNavModule): boolean {
    return m.roles.length === 1 && m.roles[0] === 'super_admin';
}

function isOwnerOnlyModule(m: SidebarNavModule): boolean {
    return m.roles.length === 1 && m.roles[0] === 'restaurant_owner';
}

/**
 * Módulos solo super_admin: exigen rol (no basta compartir permiso con el dueño).
 * Módulos solo dueño: exigen restaurant_owner o suplantación activa.
 */
function moduleIsReachable(
    m: SidebarNavModule,
    roleSet: Set<string>,
    permSet: Set<string>,
    isActing: boolean,
): boolean {
    if (isSuperAdminOnlyModule(m)) {
        return roleSet.has('super_admin');
    }

    if (isOwnerOnlyModule(m)) {
        return roleSet.has('restaurant_owner') || (roleSet.has('super_admin') && isActing);
    }

    const byRole = m.roles.some((r) => roleSet.has(r));
    const byPermission = m.items.some(
        (item) => item.permission != null && permSet.has(item.permission),
    );

    return byRole || byPermission;
}

function itemVisible(
    item: SidebarNavLeaf,
    m: SidebarNavModule,
    roleSet: Set<string>,
    permSet: Set<string>,
    isActing: boolean,
): boolean {
    if (item.permission && !permSet.has(item.permission)) {
        return false;
    }

    if (isSuperAdminOnlyModule(m)) {
        return roleSet.has('super_admin');
    }

    if (isOwnerOnlyModule(m)) {
        return roleSet.has('restaurant_owner') || (roleSet.has('super_admin') && isActing);
    }

    return true;
}

/** Filtra módulos por rol/permisos y elimina ítems cuyo permiso no tiene el usuario */
function filterModules(
    roles: string[],
    permissions: string[],
    isActing: boolean,
): (SidebarNavModule & { visibleItems: SidebarNavLeaf[] })[] {
    const roleSet = new Set(roles as AppRole[]);
    const permSet = new Set(permissions);
    const isSuperAdmin = roleSet.has('super_admin');
    const isOwner = roleSet.has('restaurant_owner');

    return sidebarNavModules
        .filter((m) => {
            if (isOwnerOnlyModule(m) && isSuperAdmin && !isActing && !isOwner) {
                return false;
            }
            return moduleIsReachable(m, roleSet, permSet, isActing);
        })
        .map((m) => ({
            ...m,
            visibleItems: m.items.filter((item) =>
                itemVisible(item, m, roleSet, permSet, isActing),
            ),
        }))
        // Ocultar módulo si no tiene ningún ítem visible
        .filter((m) => m.visibleItems.length > 0);
}

export function NavSidebarModules({ roles }: { roles: string[] }) {
    const { currentUrl, isCurrentUrl } = useCurrentUrl();
    const page = usePage<PagePropsWithAuth>();
    const permissions = page.props.auth?.permissions ?? [];
    const isActing = !!page.props.actingRestaurant;
    const permSet = useMemo(() => new Set(permissions), [permissions]);
    const modules = useMemo(() => filterModules(roles, permissions, isActing), [roles, permissions, isActing]);

    const showDashboard =
        !dashboardNavItem.permission || permSet.has(dashboardNavItem.permission);

    const [openMap, setOpenMap] = useState<Record<string, boolean>>({});

    useEffect(() => {
        setOpenMap((prev) => {
            const next = { ...prev };
            for (const mod of modules) {
                const hit = mod.visibleItems.some((item) => itemMatchesPath(item.href, currentUrl));
                if (hit) {
                    next[mod.id] = true;
                }
            }
            return next;
        });
    }, [currentUrl, modules]);

    const DashboardIcon = dashboardNavItem.icon;

    return (
        <>
            {showDashboard && (
                <SidebarGroup className="p-1 px-2">
                    <SidebarGroupLabel className="text-sidebar-foreground/55 h-6 px-1 text-[10px] font-semibold tracking-widest uppercase">
                        Accesos
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu className="gap-px">
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isCurrentUrl(dashboardNavItem.href)}
                                    tooltip={{ children: dashboardNavItem.title }}
                                    className="rounded-lg"
                                >
                                    <Link href={dashboardNavItem.href} prefetch>
                                        <DashboardIcon />
                                        <span>{dashboardNavItem.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            )}

            <SidebarGroup className="p-1 px-2 pt-0">
                <SidebarGroupLabel className="text-sidebar-foreground/55 h-6 px-1 text-[10px] font-semibold tracking-widest uppercase">
                    Módulos
                </SidebarGroupLabel>
                <SidebarGroupContent className="flex flex-col gap-1">
                    {modules.map((mod) => {
                        const ModuleIcon = mod.icon;
                        const isOpen = openMap[mod.id] ?? false;
                        const hasActiveChild = moduleHasActiveItem(mod, isCurrentUrl);

                        return (
                            <Collapsible
                                key={mod.id}
                                open={isOpen}
                                onOpenChange={(next) =>
                                    setOpenMap((m) => ({ ...m, [mod.id]: next }))
                                }
                                className="group/collapsible"
                            >
                                <SidebarMenu className="gap-0">
                                    <SidebarMenuItem className="gap-0">
                                        <CollapsibleTrigger asChild>
                                            <SidebarMenuButton
                                                tooltip={{
                                                    children: mod.title,
                                                }}
                                                isActive={hasActiveChild}
                                                className={cn(
                                                    'relative cursor-pointer rounded-lg border border-transparent pr-7 transition-[background-color,border-color,box-shadow] duration-300 ease-out',
                                                    isOpen
                                                        ? 'bg-muted/45 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.45)] dark:bg-muted/25 dark:shadow-none'
                                                        : hasActiveChild
                                                          ? 'bg-muted/35'
                                                          : 'hover:bg-muted/40',
                                                )}
                                            >
                                                <span
                                                    className={cn(
                                                        'flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/30 transition-colors duration-300 ease-out dark:bg-muted/20',
                                                        (isOpen || hasActiveChild) &&
                                                            'bg-muted/55 text-sidebar-foreground dark:bg-muted/35',
                                                    )}
                                                >
                                                    <ModuleIcon className="size-[1.05rem] opacity-90" />
                                                </span>
                                                <span className="truncate font-medium tracking-tight">
                                                    {mod.title}
                                                </span>
                                                <ChevronRight
                                                    className={cn(
                                                        'text-sidebar-foreground/40 absolute right-2 size-4 shrink-0 transition-[transform,color] duration-300 ease-[cubic-bezier(0.33,1,0.68,1)]',
                                                        isOpen && 'rotate-90 text-sidebar-foreground/65',
                                                    )}
                                                />
                                            </SidebarMenuButton>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                                            <div className="border-sidebar-border/50 relative ml-3.5 mt-1 mb-0.5 border-l border-dashed pl-3">
                                                <SidebarMenuSub className="mx-0 flex min-w-0 translate-x-0 flex-col gap-0.5 border-0 px-0 py-0">
                                                    {mod.visibleItems.map((item) => {
                                                        const ItemIcon = item.icon;
                                                        const active = isCurrentUrl(
                                                            item.href,
                                                            undefined,
                                                            true,
                                                        );
                                                        return (
                                                            <SidebarMenuSubItem key={item.href}>
                                                                <SidebarMenuSubButton
                                                                    asChild
                                                                    isActive={active}
                                                                    size="sm"
                                                                    className={cn(
                                                                        'group/sub relative h-8 rounded-md pl-2 transition-[background-color,color,transform] duration-200 ease-out',
                                                                        'hover:bg-muted/55',
                                                                        'data-[active=true]:bg-muted/70 data-[active=true]:font-medium data-[active=true]:text-foreground',
                                                                    )}
                                                                >
                                                                    <Link
                                                                        href={item.href}
                                                                        prefetch
                                                                        className="flex items-center gap-2.5"
                                                                    >
                                                                        <span
                                                                            aria-hidden
                                                                            className={cn(
                                                                                'size-2.5 shrink-0 rounded-full bg-sidebar-foreground/18 transition-[transform,background-color] duration-200 ease-out',
                                                                                active &&
                                                                                    'bg-brand-nav-active scale-110 ring-2 ring-brand-nav-active/35 ring-offset-1 ring-offset-background',
                                                                            )}
                                                                        />
                                                                        <ItemIcon className="size-3.5 opacity-70 group-hover/sub:opacity-90" />
                                                                        <span>{item.title}</span>
                                                                    </Link>
                                                                </SidebarMenuSubButton>
                                                            </SidebarMenuSubItem>
                                                        );
                                                    })}
                                                </SidebarMenuSub>
                                            </div>
                                        </CollapsibleContent>
                                    </SidebarMenuItem>
                                </SidebarMenu>
                            </Collapsible>
                        );
                    })}
                </SidebarGroupContent>
            </SidebarGroup>
        </>
    );
}
