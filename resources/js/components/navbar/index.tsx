import { Link, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/common/language-switcher';
import { useScrollNavbar } from '@/hooks/use-scroll-navbar';
import { cn } from '@/lib/utils';
import { login, register } from '@/routes';
import type { User } from '@/types';
import { NavLinks } from './nav-links';
import { NavLogo } from './nav-logo';
import { NavMobileMenu } from './nav-mobile-menu';
import { NavUserMenu } from './nav-user-menu';

export function Navbar() {
    const page = usePage();
    const url = page.url;
    const { auth } = page.props as { auth: { user: User | null; roles: string[] } };
    const user = auth.user ?? null;
    const { t } = useTranslation();

    // Scroll solo importa en la welcome page para el efecto transparente
    const isWelcomePage = url === '/';
    const scrolled = useScrollNavbar(60);

    // En la welcome: transparente arriba, s?lido al hacer scroll
    // En cualquier otra p?gina: siempre s?lido
    const solid = isWelcomePage ? scrolled : true;

    const roles = auth.roles ?? [];
    const isPublicOrTourist = roles.length === 0 || roles.includes('tourist');

    return (
        <header
            className={cn(
                'fixed top-0 left-0 right-0 z-40 transition-all duration-300',
                solid
                    ? 'border-b border-gray-100/80 bg-white/90 shadow-[0_4px_24px_rgba(0,0,0,0.07)] backdrop-blur-xl'
                    : isWelcomePage
                      ? 'border-b border-brand-blue/5 bg-white/70 backdrop-blur-md'
                      : 'bg-transparent',
            )}
        >
            <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

                {/* Logo */}
                <NavLogo />

                {/* Links seg?n rol */}
                <NavLinks scrolled={solid} />

                {/* Derecha: idioma (solo p?blico/turista) + usuario */}
                <div className="flex items-center gap-2">
                    {isPublicOrTourist && <LanguageSwitcher variant="light" />}

                    {user ? (
                        <NavUserMenu user={user} scrolled={solid} />
                    ) : (
                        <div className="hidden items-center gap-2 md:flex">
                            <Link
                                href={login()}
                                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
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

                    {/* Hamburguesa ? mobile */}
                    <NavMobileMenu user={user} scrolled={solid} />
                </div>

            </div>
        </header>
    );
}
