import { Link, usePage } from '@inertiajs/react';
import { LayoutDashboard, LogOut, Menu, Store, User, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getPublicNavItems, isPublicNavItemActive } from '@/config/public-nav-items';
import { cn } from '@/lib/utils';
import { login, logout, register } from '@/routes';
import type { User as UserType } from '@/types';

interface NavMobileMenuProps {
    user: UserType | null;
    variant?: 'light' | 'dark';
}

export function NavMobileMenu({ user, variant = 'light' }: NavMobileMenuProps) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const page = usePage();
    const url = page.url;
    const { auth } = page.props as { auth: { user: UserType | null; roles: string[] } };
    const roles = auth.roles ?? [];
    const isDark = variant === 'dark';

    const isTourist = roles.includes('tourist');
    const isOwner = roles.includes('restaurant_owner');
    const isAdmin = roles.includes('super_admin');
    const navItems = getPublicNavItems(roles);

    return (
        <div className="md:hidden">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className={cn(
                    'cursor-pointer rounded-lg p-2 transition-colors',
                    isDark ? 'text-white hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100',
                )}
                aria-label={open ? t('nav.close_menu') : t('nav.open_menu')}
            >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <div
                className={cn(
                    'absolute left-0 right-0 top-full z-50 border-t px-4 py-3 shadow-lg transition-all duration-200',
                    isDark ? 'border-white/10 bg-brand-blue' : 'border-gray-100 bg-white',
                    open ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0',
                )}
            >
                <nav className="flex flex-col gap-1">
                    {navItems.map(item => {
                        const isActive = isPublicNavItemActive(url, item);
                        const Icon = item.icon;

                        if (item.soon) {
                            return (
                                <span
                                    key={item.labelKey}
                                    className={cn(
                                        'flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium',
                                        isDark ? 'text-white/40' : 'text-gray-300',
                                    )}
                                >
                                    <span className="flex items-center gap-2">
                                        <Icon className="size-4" />
                                        {t(item.labelKey)}
                                    </span>
                                    <span className="rounded-full bg-brand-orange/20 px-1.5 py-0.5 text-[10px] font-bold text-brand-orange">
                                        Soon
                                    </span>
                                </span>
                            );
                        }

                        return (
                            <Link
                                key={item.labelKey}
                                href={item.href}
                                onClick={() => setOpen(false)}
                                className={cn(
                                    'relative flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                                    isActive
                                        ? isDark
                                            ? 'bg-white/10 text-brand-orange'
                                            : 'bg-orange-50 text-brand-orange'
                                        : isDark
                                          ? 'text-white/90 hover:bg-white/10'
                                          : 'text-gray-700 hover:bg-gray-50',
                                )}
                            >
                                <Icon className="size-4" />
                                {item.topBadge && (
                                    <span className="rounded bg-brand-orange px-1 py-px text-[8px] font-bold leading-none tracking-wide text-white">
                                        {item.topBadge}
                                    </span>
                                )}
                                {t(item.labelKey)}
                            </Link>
                        );
                    })}
                </nav>

                {user ? (
                    <div className={cn('mt-3 flex flex-col gap-1 border-t pt-3', isDark ? 'border-white/10' : 'border-gray-100')}>
                        {isTourist && (
                            <Link
                                href="/explore/profile"
                                onClick={() => setOpen(false)}
                                className={cn(
                                    'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium',
                                    isDark ? 'text-white/90 hover:bg-white/10' : 'text-gray-700 hover:bg-gray-50',
                                )}
                            >
                                <User className="h-4 w-4 text-brand-orange" />
                                {t('explore.my_profile')}
                            </Link>
                        )}
                        {isOwner && (
                            <Link
                                href="/owner/pending"
                                onClick={() => setOpen(false)}
                                className={cn(
                                    'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium',
                                    isDark ? 'text-white/90 hover:bg-white/10' : 'text-gray-700 hover:bg-gray-50',
                                )}
                            >
                                <Store className="h-4 w-4 text-brand-orange" />
                                {t('nav.my_panel')}
                            </Link>
                        )}
                        {isAdmin && (
                            <Link
                                href="/dashboard"
                                onClick={() => setOpen(false)}
                                className={cn(
                                    'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium',
                                    isDark ? 'text-white/90 hover:bg-white/10' : 'text-gray-700 hover:bg-gray-50',
                                )}
                            >
                                <LayoutDashboard className="h-4 w-4 text-brand-orange" />
                                Dashboard
                            </Link>
                        )}
                        <Link
                            href={logout()}
                            method="post"
                            as="button"
                            onClick={() => setOpen(false)}
                            className={cn(
                                'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400',
                                isDark ? 'hover:bg-white/10' : 'text-red-500 hover:bg-orange-50',
                            )}
                        >
                            <LogOut className="h-4 w-4" />
                            {t('nav.logout')}
                        </Link>
                    </div>
                ) : (
                    <div className={cn('mt-3 flex flex-col gap-2 border-t pt-3', isDark ? 'border-white/10' : 'border-gray-100')}>
                        <Link
                            href={login()}
                            onClick={() => setOpen(false)}
                            className={cn(
                                'rounded-lg px-3 py-2.5 text-center text-sm font-medium',
                                isDark ? 'text-white hover:bg-white/10' : 'text-gray-700 hover:bg-gray-50',
                            )}
                        >
                            {t('nav.login')}
                        </Link>
                        <Link
                            href={register()}
                            onClick={() => setOpen(false)}
                            className="rounded-lg px-3 py-2.5 text-center text-sm font-semibold text-white"
                            style={{ background: 'linear-gradient(90deg,#ffb833,#ffa300,#e59200)' }}
                        >
                            {t('nav.register')}
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
