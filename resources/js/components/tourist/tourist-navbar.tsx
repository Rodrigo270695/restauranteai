import { Link, usePage } from '@inertiajs/react';
import { LogOut, Menu, User, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/common/language-switcher';
import { cn } from '@/lib/utils';
import { index as exploreIndex, profile as exploreProfile } from '@/routes/explore';

interface AuthUser {
    id: number;
    name: string;
    email: string;
}

interface NavItem {
    key: string;
    href: string;
    labelKey: string;
    ready: boolean;
}

const NAV_ITEMS: NavItem[] = [
    { key: 'home',        href: '/',        labelKey: 'explore.nav_home',         ready: true  },
    { key: 'explore',     href: '/explore', labelKey: 'explore.nav_explore',      ready: true  },
    { key: 'restaurants', href: '#',        labelKey: 'explore.nav_restaurants',  ready: false },
    { key: 'favorites',   href: '#',        labelKey: 'explore.nav_favorites',    ready: false },
];

function Avatar({ name }: { name: string }) {
    const initials = name
        .split(' ')
        .slice(0, 2)
        .map(w => w[0])
        .join('')
        .toUpperCase();

    return (
        <span
            className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #073577 0%, #052a58 100%)' }}
        >
            {initials}
        </span>
    );
}

export default function TouristNavbar() {
    const { t } = useTranslation();
    const { auth, url } = usePage().props as { auth: { user: AuthUser | null }; url: string };
    const user = auth.user;

    const [menuOpen, setMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    const isActive = (href: string) => {
        if (href === '#') return false;
        const currentPath = window.location.pathname;
        // Comparación exacta para rutas raíz y portal para evitar falsos positivos
        if (href === '/' || href === '/explore') return currentPath === href;
        return currentPath.startsWith(href);
    };

    return (
        <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 shadow-sm backdrop-blur-xl">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between gap-4">

                    {/* Logo ? va a la página de inicio pública */}
                    <Link href="/" className="shrink-0">
                        <img src="/logo.png" alt="DiscoverLambo" className="h-10 w-auto" />
                    </Link>

                    {/* Nav links — desktop */}
                    <div className="hidden items-center gap-1 md:flex">
                        {NAV_ITEMS.map(item => (
                            item.ready ? (
                                <Link
                                    key={item.key}
                                    href={item.href}
                                    className={cn(
                                        'relative px-4 py-2 text-sm font-medium transition-colors',
                                        isActive(item.href)
                                            ? 'text-brand-orange'
                                            : 'text-gray-600 hover:text-gray-900',
                                        'after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:rounded-full after:bg-brand-orange after:transition-transform',
                                        isActive(item.href) && 'after:scale-x-100',
                                    )}
                                >
                                    {t(item.labelKey)}
                                </Link>
                            ) : (
                                <span
                                    key={item.key}
                                    className="relative flex cursor-not-allowed items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-300"
                                    title="Próximamente"
                                >
                                    {t(item.labelKey)}
                                    <span className="rounded-full bg-orange-50 px-1.5 py-0.5 text-[10px] font-semibold text-brand-orange">
                                        Soon
                                    </span>
                                </span>
                            )
                        ))}
                    </div>

                    {/* Derecha: language switcher + user menu */}
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:block">
                            <LanguageSwitcher />
                        </div>

                        {/* User menu — desktop */}
                        {user && (
                            <div className="relative hidden md:block">
                                <button
                                    type="button"
                                    onClick={() => setUserMenuOpen(v => !v)}
                                    className="flex cursor-pointer items-center gap-2 rounded-full p-0.5 transition-all hover:ring-2 hover:ring-brand-orange/30"
                                >
                                    <Avatar name={user.name} />
                                </button>

                                {userMenuOpen && (
                                    <>
                                        {/* Overlay para cerrar */}
                                        <div
                                            className="fixed inset-0 z-10"
                                            onClick={() => setUserMenuOpen(false)}
                                        />
                                        <div className="absolute right-0 top-12 z-20 w-64 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
                                            {/* Info del usuario */}
                                            <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-50">
                                                <Avatar name={user.name} />
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold text-gray-900">{user.name}</p>
                                                    <p className="truncate text-xs text-gray-400">{user.email}</p>
                                                </div>
                                            </div>

                                            {/* Opciones */}
                                            <div className="py-1.5">
                                                <Link
                                                    href={exploreProfile.url()}
                                                    onClick={() => setUserMenuOpen(false)}
                                                    className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-orange-50 hover:text-brand-orange"
                                                >
                                                    <User className="h-4 w-4" />
                                                    {t('explore.my_profile')}
                                                </Link>
                                            </div>

                                            <div className="border-t border-gray-50 py-1.5">
                                                <Link
                                                    href="/logout"
                                                    method="post"
                                                    as="button"
                                                    className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-red-500 transition-colors hover:bg-orange-50"
                                                >
                                                    <LogOut className="h-4 w-4" />
                                                    {t('explore.logout')}
                                                </Link>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Botón hamburguesa — mobile */}
                        <button
                            type="button"
                            onClick={() => setMenuOpen(v => !v)}
                            className="flex cursor-pointer items-center justify-center rounded-xl p-2 text-gray-600 transition-colors hover:bg-gray-100 md:hidden"
                            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
                        >
                            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Menú móvil */}
            {menuOpen && (
                <div className="border-t border-gray-100 bg-white md:hidden">
                    <div className="px-4 py-3 space-y-1">
                        {NAV_ITEMS.map(item => (
                            item.ready ? (
                                <Link
                                    key={item.key}
                                    href={item.href}
                                    onClick={() => setMenuOpen(false)}
                                    className={cn(
                                        'block rounded-xl px-4 py-2.5 text-sm font-medium transition-colors',
                                        isActive(item.href)
                                            ? 'bg-orange-50 text-brand-orange'
                                            : 'text-gray-700 hover:bg-gray-50',
                                    )}
                                >
                                    {t(item.labelKey)}
                                </Link>
                            ) : (
                                <span
                                    key={item.key}
                                    className="flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium text-gray-300"
                                >
                                    {t(item.labelKey)}
                                    <span className="rounded-full bg-orange-50 px-1.5 py-0.5 text-[10px] font-semibold text-brand-orange">
                                        Soon
                                    </span>
                                </span>
                            )
                        ))}
                    </div>

                    {/* User info móvil */}
                    {user && (
                        <div className="border-t border-gray-100 px-4 py-3">
                            <div className="mb-3 flex items-center gap-3">
                                <Avatar name={user.name} />
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-gray-900">{user.name}</p>
                                    <p className="truncate text-xs text-gray-400">{user.email}</p>
                                </div>
                            </div>
                            <Link
                                href={exploreProfile.url()}
                                onClick={() => setMenuOpen(false)}
                                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-brand-orange"
                            >
                                <User className="h-4 w-4" />
                                {t('explore.my_profile')}
                            </Link>
                            <Link
                                href="/logout"
                                method="post"
                                as="button"
                                className="flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-red-500 hover:bg-orange-50"
                            >
                                <LogOut className="h-4 w-4" />
                                {t('explore.logout')}
                            </Link>
                        </div>
                    )}

                    {/* Language switcher móvil */}
                    <div className="border-t border-gray-100 px-4 py-3">
                        <LanguageSwitcher />
                    </div>
                </div>
            )}
        </nav>
    );
}
