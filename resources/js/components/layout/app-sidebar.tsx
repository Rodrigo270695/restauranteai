import { Link, usePage } from '@inertiajs/react';
import { NavSidebarModules } from '@/components/layout/nav-sidebar-modules';
import { NavUser } from '@/components/layout/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';

export function AppSidebar() {
    const page = usePage<{ auth: { roles: string[] } }>();
    const roles = page.props.auth?.roles ?? [];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader className="gap-0.5 border-sidebar-border/40 border-b px-2 py-1">
                <SidebarMenu className="gap-0">
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            asChild
                            className="h-auto min-h-0 bg-transparent py-0.5 hover:bg-sidebar-accent/50 data-[active=true]:bg-transparent"
                        >
                            <Link
                                href={dashboard()}
                                prefetch
                                className="flex cursor-pointer items-center gap-2.5 overflow-hidden bg-transparent"
                            >
                                <span className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted/25 p-0.5 ring-1 ring-sidebar-border/35 dark:bg-muted/15">
                                    {/* Puntos solo detrás del logo (no encima: no tapar la imagen) */}
                                    <span
                                        aria-hidden
                                        className="pointer-events-none absolute inset-0 z-0 rounded-xl bg-[radial-gradient(circle,var(--color-brand-nav-active)_2.5px,transparent_3px)] bg-size-[18px_18px] opacity-25"
                                    />
                                    <img
                                        src="/logo.png"
                                        alt="discover LAMB"
                                        width={160}
                                        height={56}
                                        decoding="async"
                                        fetchPriority="high"
                                        className="relative z-10 h-10 w-auto max-w-[min(100%,9.5rem)] object-contain"
                                    />
                                </span>
                                <span className="text-brand-brown dark:text-brand-yellow min-w-0 flex-1 truncate text-left text-base font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
                                    <span className="lowercase">discover</span>{' '}
                                    <span className="font-extrabold uppercase">LAMB</span>
                                </span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="min-h-0 flex-1 gap-0 overflow-x-hidden overflow-y-auto overscroll-contain pt-0.5">
                <NavSidebarModules roles={roles} />
            </SidebarContent>

            <SidebarFooter className="mt-auto shrink-0 gap-1 border-sidebar-border/40 border-t bg-sidebar p-1.5 pt-1">
                <NavUser compact />
            </SidebarFooter>
        </Sidebar>
    );
}
