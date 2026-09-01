import { Link, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/common/language-switcher';
import { cn } from '@/lib/utils';
import { login, register } from '@/routes';
import type { User } from '@/types';
import { NavLinks } from './nav-links';
import { NavLogo } from './nav-logo';
import { NavMobileMenu } from './nav-mobile-menu';
import { NavUserMenu } from './nav-user-menu';

export function Navbar() {
    const page = usePage();
    const { auth } = page.props as { auth: { user: User | null; roles: string[] } };
    const user = auth.user ?? null;
    const { t } = useTranslation();

    const roles = auth.roles ?? [];
    const isPublicOrTourist = roles.length === 0 || roles.includes('tourist');
    const useDarkNav = isPublicOrTourist;

    return (
        <header
            className={cn(
                'fixed top-0 left-0 right-0 z-[100] transition-all duration-300',
                useDarkNav
                    ? 'border-b border-white/10 bg-brand-blue shadow-[0_8px_30px_rgba(5,42,88,0.35)]'
                    : 'border-b border-gray-100/80 bg-white/90 shadow-[0_4px_24px_rgba(0,0,0,0.07)] backdrop-blur-xl',
            )}
        >
            <div className="relative mx-auto flex h-[4.625rem] max-w-7xl items-center justify-between gap-3 overflow-visible px-4 sm:px-6 lg:px-8 xl:px-10">
                <NavLogo variant={useDarkNav ? 'dark' : 'light'} />

                <NavLinks variant={useDarkNav ? 'dark' : 'light'} />

                <div className="flex items-center gap-2 sm:gap-3">
                    {isPublicOrTourist && (
                        <LanguageSwitcher variant={useDarkNav ? 'dark' : 'light'} compact={useDarkNav} />
                    )}

                    {user ? (
                        <NavUserMenu user={user} variant={useDarkNav ? 'dark' : 'light'} />
                    ) : (
                        <div className="hidden items-center gap-2 md:flex">
                            <Link
                                href={login()}
                                className={cn(
                                    'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                                    useDarkNav
                                        ? 'text-white/90 hover:bg-white/10 hover:text-white'
                                        : 'text-gray-700 hover:bg-gray-100',
                                )}
                            >
                                {t('nav.login')}
                            </Link>
                            <Link
                                href={register()}
                                className="btn-brand-cta cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold transition-all active:scale-[0.98]"
                            >
                                {t('nav.register')}
                            </Link>
                        </div>
                    )}

                    <NavMobileMenu user={user} variant={useDarkNav ? 'dark' : 'light'} />
                </div>
            </div>
        </header>
    );
}
