import { Link, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { User } from '@/types';

interface NavItem {
    labelKey: string;
    href: string;
    exact: boolean;
    soon?: boolean;
}

// ─── Base pública (sin sesión) ────────────────────────────────────────────────
const BASE_NAV: NavItem[] = [
    { labelKey: 'nav.restaurants', href: '#', exact: false, soon: true },
    { labelKey: 'nav.favorites',   href: '#', exact: false, soon: true },
    { labelKey: 'nav.contact',     href: '#', exact: true,  soon: true },
];

// ─── Items según rol ──────────────────────────────────────────────────────────
const PUBLIC_NAV: NavItem[] = [
    { labelKey: 'nav.home', href: '/', exact: true },
    ...BASE_NAV,
];

const TOURIST_NAV: NavItem[] = [
    { labelKey: 'nav.home',            href: '/',        exact: true  },
    { labelKey: 'explore.nav_explore', href: '/explore', exact: true  },
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
        <nav className="hidden items-center gap-6 md:flex">
            {items.map(({ labelKey, href, exact, soon }) => {
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
                            <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-red">
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
                            'relative pb-1 text-sm font-medium transition-all duration-200',
                            'after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:rounded-full after:transition-transform after:duration-200',
                            isActive
                                ? 'font-semibold text-brand-red after:scale-x-100 after:bg-brand-red'
                                : scrolled || url !== '/'
                                  ? 'text-gray-600 after:scale-x-0 after:bg-brand-red hover:text-gray-900 hover:after:scale-x-100'
                                  : 'text-gray-700 after:scale-x-0 after:bg-brand-red hover:text-gray-900 hover:after:scale-x-100',
                        )}
                    >
                        {t(labelKey)}
                    </Link>
                );
            })}
        </nav>
    );
}
