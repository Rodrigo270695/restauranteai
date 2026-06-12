import type { LucideIcon } from 'lucide-react';
import { Heart, Home, LayoutDashboard, Mail, MapPin, Sparkles, Store } from 'lucide-react';

export interface PublicNavItem {
    labelKey: string;
    href: string;
    exact: boolean;
    soon?: boolean;
    topBadge?: string;
    icon: LucideIcon;
}

const BASE_NAV: PublicNavItem[] = [
    { labelKey: 'nav.restaurants', href: '/restaurantes-cercanos', exact: false, icon: MapPin },
    { labelKey: 'nav.contact', href: '/contacto', exact: true, icon: Mail },
];

export const PUBLIC_NAV: PublicNavItem[] = [
    { labelKey: 'nav.home', href: '/', exact: true, icon: Home },
    ...BASE_NAV,
];

export const TOURIST_NAV: PublicNavItem[] = [
    { labelKey: 'nav.home', href: '/', exact: true, icon: Home },
    { labelKey: 'explore.nav_explore', href: '/explore', exact: true, topBadge: 'IA', icon: Sparkles },
    { labelKey: 'nav.favorites', href: '/explore/discover?favorites_only=1', exact: false, icon: Heart },
    ...BASE_NAV,
];

export const OWNER_NAV: PublicNavItem[] = [
    { labelKey: 'nav.home', href: '/', exact: true, icon: Home },
    { labelKey: 'nav.my_panel', href: '/owner/pending', exact: false, icon: Store },
];

export const ADMIN_NAV: PublicNavItem[] = [
    { labelKey: 'nav.home', href: '/', exact: true, icon: Home },
    { labelKey: 'nav.dashboard', href: '/dashboard', exact: false, icon: LayoutDashboard },
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

    if (item.labelKey === 'nav.favorites') {
        return url.includes('favorites_only=1');
    }

    if (item.exact) {
        return url === item.href;
    }

    return url.startsWith(item.href.split('?')[0]);
}
