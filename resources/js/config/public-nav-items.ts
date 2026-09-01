import type { LucideIcon } from 'lucide-react';
import { Heart, History, Home, LayoutDashboard, Mail, Map, Search, Sparkles, Store } from 'lucide-react';

export interface PublicNavItem {
    key: string;
    labelKey: string;
    href: string;
    exact: boolean;
    soon?: boolean;
    topBadge?: string;
    icon: LucideIcon;
    /** Solo turista autenticado: favoritos, rutas, historial. */
    authOnly?: boolean;
}

const HOME: PublicNavItem = { key: 'home', labelKey: 'nav.home', href: '/', exact: true, icon: Home };

const AI_RECS: PublicNavItem = {
    key: 'ai',
    labelKey: 'nav.ai',
    href: '/explore',
    exact: true,
    icon: Sparkles,
};

const CONTACT: PublicNavItem = { key: 'contact', labelKey: 'nav.contact', href: '/contacto', exact: true, icon: Mail };

export const PUBLIC_NAV: PublicNavItem[] = [
    HOME,
    { key: 'explore', labelKey: 'nav.explore', href: '/restaurantes-cercanos', exact: false, icon: Search },
    AI_RECS,
    CONTACT,
];

export const TOURIST_NAV: PublicNavItem[] = [
    HOME,
    { key: 'explore', labelKey: 'nav.explore', href: '/explore/search', exact: false, icon: Search },
    AI_RECS,
    { key: 'routes', labelKey: 'nav.gastro_routes', href: '/explore/routes', exact: false, icon: Map, authOnly: true },
    { key: 'favorites', labelKey: 'nav.favorites', href: '/explore/favorites', exact: false, icon: Heart, authOnly: true },
    { key: 'history', labelKey: 'nav.history', href: '/explore/routes?tab=history', exact: false, icon: History, authOnly: true },
];

export const OWNER_NAV: PublicNavItem[] = [
    HOME,
    { key: 'panel', labelKey: 'nav.my_panel', href: '/owner/pending', exact: false, icon: Store },
];

export const ADMIN_NAV: PublicNavItem[] = [
    HOME,
    { key: 'dashboard', labelKey: 'nav.dashboard', href: '/dashboard', exact: false, icon: LayoutDashboard },
];

export function getPublicNavItems(roles: string[]): PublicNavItem[] {
    if (roles.includes('super_admin')) {
        return ADMIN_NAV;
    }
    if (roles.includes('restaurant_owner')) {
        return OWNER_NAV;
    }
    if (roles.includes('tourist')) {
        return TOURIST_NAV;
    }

    return PUBLIC_NAV;
}

export function isPublicNavItemActive(url: string, item: PublicNavItem): boolean {
    if (item.soon) {
        return false;
    }

    const [path, query = ''] = url.split('?');
    const hasHistory = query.includes('tab=history');

    if (item.key === 'favorites') {
        return path === '/explore/favorites' || path.startsWith('/explore/favorites');
    }

    if (item.key === 'history') {
        return path === '/explore/routes' && hasHistory;
    }

    if (item.key === 'routes') {
        return path.startsWith('/explore/routes') && !hasHistory;
    }

    if (item.key === 'ai') {
        return path === '/explore';
    }

    if (item.key === 'explore') {
        if (item.href.startsWith('/explore/search')) {
            return path === '/explore/search' || path.startsWith('/explore/restaurants');
        }

        return path.startsWith(item.href.split('?')[0]);
    }

    if (item.exact) {
        return path === item.href || url === item.href;
    }

    return path.startsWith(item.href.split('?')[0]);
}
