import { Link, usePage } from '@inertiajs/react';
import { LayoutDashboard, LogOut, Menu, Store, User, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { login, logout, register } from '@/routes';
import type { User as UserType } from '@/types';

interface NavItem { labelKey: string; href: string; exact: boolean; soon?: boolean; topBadge?: string }

// ─── Base pública (sin sesión) ────────────────────────────────────────────────
const BASE_NAV: NavItem[] = [
    { labelKey: 'nav.restaurants', href: '/restaurantes-cercanos', exact: false },
    { labelKey: 'nav.contact',     href: '/contacto', exact: true },
];

// ─── Items según rol ──────────────────────────────────────────────────────────
const PUBLIC_NAV: NavItem[] = [
    { labelKey: 'nav.home', href: '/', exact: true },
    ...BASE_NAV,
];

const TOURIST_NAV: NavItem[] = [
    { labelKey: 'nav.home',            href: '/',        exact: true },
    { labelKey: 'explore.nav_explore', href: '/explore', exact: true, topBadge: 'IA' },
    { labelKey: 'nav.favorites',       href: '/explore/discover?favorites_only=1', exact: false },
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

function getNavItems(roles: string[]): NavItem[] {
    if (roles.includes('super_admin'))      return ADMIN_NAV;
    if (roles.includes('restaurant_owner')) return OWNER_NAV;
    if (roles.includes('tourist'))          return TOURIST_NAV;
    return PUBLIC_NAV;
}

interface NavMobileMenuProps {
    user: UserType | null;
    scrolled?: boolean;
}

export function NavMobileMenu({ user }: NavMobileMenuProps) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const page = usePage();
    const url = page.url;
    const { auth } = page.props as { auth: { user: UserType | null; roles: string[] } };
    const roles = auth.roles ?? [];

    const isTourist = roles.includes('tourist');
    const isOwner   = roles.includes('restaurant_owner');
    const isAdmin   = roles.includes('super_admin');

    const navItems = getNavItems(roles);

    return (
        <div className="md:hidden">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="cursor-pointer rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100"
                aria-label={open ? t('nav.close_menu') : t('nav.open_menu')}
            >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <div
                className={cn(
                    'absolute left-0 right-0 top-full z-50 border-t border-gray-100 bg-white px-4 py-3 shadow-lg transition-all duration-200',
                    open ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0',
                )}
            >
                {/* Links de navegación */}
                <nav className="flex flex-col gap-1">
                    {navItems.map(({ labelKey, href, exact, soon, topBadge }) => {
                        const isActive = !soon && (
                            labelKey === 'nav.favorites'
                                ? url.includes('favorites_only=1')
                                : exact
                                  ? url === href
                                  : url.startsWith(href.split('?')[0])
                        );

                        if (soon) {
                            return (
                                <span key={labelKey}
                                    className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-gray-300">
                                    {t(labelKey)}
                                    <span className="rounded-full bg-orange-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-orange">Soon</span>
                                </span>
                            );
                        }

                        return (
                            <Link key={labelKey} href={href}
                                onClick={() => setOpen(false)}
                                className={cn(
                                    'relative rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                                    isActive ? 'bg-orange-50 text-brand-orange' : 'text-gray-700 hover:bg-gray-50',
                                )}
                            >
                                {topBadge && (
                                    <span className="pointer-events-none absolute -top-1 left-3 rounded bg-brand-orange px-1 py-px text-[8px] font-bold leading-none tracking-wide text-white">
                                        {topBadge}
                                    </span>
                                )}
                                {t(labelKey)}
                            </Link>
                        );
                    })}
                </nav>

                {/* Sección de usuario */}
                {user ? (
                    <div className="mt-3 flex flex-col gap-1 border-t border-gray-100 pt-3">
                        {isTourist && (
                            <Link href="/explore/profile" onClick={() => setOpen(false)}
                                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                                <User className="h-4 w-4 text-brand-orange" />
                                {t('explore.my_profile')}
                            </Link>
                        )}
                        {isOwner && (
                            <Link href="/owner/pending" onClick={() => setOpen(false)}
                                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                                <Store className="h-4 w-4 text-brand-orange" />
                                {t('nav.my_panel')}
                            </Link>
                        )}
                        {isAdmin && (
                            <Link href="/dashboard" onClick={() => setOpen(false)}
                                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                                <LayoutDashboard className="h-4 w-4 text-brand-orange" />
                                Dashboard
                            </Link>
                        )}
                        <Link href={logout()} method="post" as="button" onClick={() => setOpen(false)}
                            className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-orange-50">
                            <LogOut className="h-4 w-4" />
                            {t('nav.logout')}
                        </Link>
                    </div>
                ) : (
                    <div className="mt-3 flex flex-col gap-2 border-t border-gray-100 pt-3">
                        <Link href={login()} onClick={() => setOpen(false)}
                            className="rounded-lg px-3 py-2.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-50">
                            {t('nav.login')}
                        </Link>
                        <Link href={register()} onClick={() => setOpen(false)}
                            className="rounded-lg px-3 py-2.5 text-center text-sm font-semibold text-white"
                            style={{ background: 'linear-gradient(90deg,#ffb833,#ffa300,#e59200)' }}>
                            {t('nav.register')}
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
