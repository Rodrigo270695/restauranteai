import { Link, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { User } from '@/types';

interface NavItem {
    labelKey: string;
    href: string;
    exact: boolean;
    soon?: boolean;
    topBadge?: string;
}

// ─── Base pública (sin sesión) ────────────────────────────────────────────────
const BASE_NAV: NavItem[] = [
    { labelKey: 'nav.restaurants', href: '/restaurantes-cercanos', exact: false },
    { labelKey: 'nav.favorites',   href: '#', exact: false, soon: true },
    { labelKey: 'nav.contact',     href: '/contacto', exact: true },
];

// ─── Items según rol ──────────────────────────────────────────────────────────
const PUBLIC_NAV: NavItem[] = [
    { labelKey: 'nav.home', href: '/', exact: true },
    ...BASE_NAV,
];

const TOURIST_NAV: NavItem[] = [
    { labelKey: 'nav.home',            href: '/',        exact: true  },
    { labelKey: 'explore.nav_explore', href: '/explore', exact: true, topBadge: 'IA' },
    ...BASE_NAV,
];

const OWNER_NAV: NavItem[] = [
    { labelKey: 'nav.home',     href: '/',             exact: true  },
    { labelKey: 'nav.my_panel', href: '/owner/pending', exact: false },
];

const ADMIN_NAV: NavItem[] = [
    { labelKey: 'nav.home',      href: '/',          exact: true  },
    { labelKey: 'nav.dashboard', href: '/dashboard', exact: false },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getNavItems(roles: string[]): NavItem[] {
    if (roles.includes('super_admin'))       return ADMIN_NAV;
    if (roles.includes('restaurant_owner'))  return OWNER_NAV;
    if (roles.includes('tourist'))           return TOURIST_NAV;
    return PUBLIC_NAV;
}

interface NavLinksProps {
    scrolled?: boolean;
}

export function NavLinks({ scrolled = false }: NavLinksProps) {
    const { t } = useTranslation();
    const page = usePage();
    const url = page.url;
    const { auth } = page.props as { auth: { user: User | null; roles: string[] } };
    const roles = auth.roles ?? [];
    const items = getNavItems(roles);

    return (
        <nav className="hidden items-center gap-6 overflow-visible md:flex">
            {items.map(({ labelKey, href, exact, soon, topBadge }) => {
                const isActive = soon
                    ? false
                    : exact
                      ? url === href
                      : url.startsWith(href);

                if (soon) {
                    return (
                        <span
                            key={labelKey}
                            className="flex cursor-not-allowed items-center gap-1.5 text-sm font-medium text-gray-300"
                        >
                            {t(labelKey)}
                            <span className="rounded-full bg-orange-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-orange">
                                Soon
                            </span>
                        </span>
                    );
                }

                return (
                    <Link
                        key={labelKey}
                        href={href}
                        className={cn(
                            'relative inline-flex items-center pb-1 text-sm font-medium transition-all duration-200',
                            'after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:rounded-full after:transition-transform after:duration-200',
                            isActive
                                ? 'font-semibold text-brand-orange after:scale-x-100 after:bg-brand-orange'
                                : scrolled || url !== '/'
                                  ? 'text-gray-600 after:scale-x-0 after:bg-brand-orange hover:text-gray-900 hover:after:scale-x-100'
                                  : 'text-gray-700 after:scale-x-0 after:bg-brand-orange hover:text-gray-900 hover:after:scale-x-100',
                        )}
                    >
                        {topBadge && (
                            <span className="pointer-events-none absolute -top-2.5 left-1/2 -translate-x-1/2 rounded bg-brand-orange px-1 py-px text-[8px] font-bold leading-none tracking-wide text-white">
                                {topBadge}
                            </span>
                        )}
                        {t(labelKey)}
                    </Link>
                );
            })}
        </nav>
    );
}
