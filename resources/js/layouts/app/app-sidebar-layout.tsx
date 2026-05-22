import { ActingRestaurantBannerFromPage } from '@/components/layout/acting-restaurant-banner';
import { AppContent } from '@/components/layout/app-content';
import { AppShell } from '@/components/layout/app-shell';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppSidebarHeader } from '@/components/layout/app-sidebar-header';
import { useFlashToast } from '@/hooks/use-flash-toast';
import type { AppLayoutProps } from '@/types';

/** Componente interno que consume useFlashToast dentro del árbol de Inertia */
function FlashToastListener() {
    useFlashToast();
    return null;
}

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    return (
        <AppShell variant="sidebar">
            <FlashToastListener />
            <AppSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden">
                <ActingRestaurantBannerFromPage />
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                {children}
            </AppContent>
        </AppShell>
    );
}
