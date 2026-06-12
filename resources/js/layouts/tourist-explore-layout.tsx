import { Link, usePage } from '@inertiajs/react';
import { Heart, Map, Route, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/common/language-switcher';
import { BrandLogo } from '@/components/common/brand-logo';
import { useFlashToast } from '@/hooks/use-flash-toast';
import { useLanguageSync } from '@/hooks/use-language-sync';
import { cn } from '@/lib/utils';
import { exploreDiscoverUrl, exploreFavoritesDiscoverUrl } from '@/lib/explore-discover-url';
import { home } from '@/routes';
import { index as exploreRoutes } from '@/routes/explore/routes';
import { profile as exploreProfile } from '@/routes/explore';

type Props = { children: React.ReactNode; wide?: boolean };

const MAIN_NAV = [
    {
        key: 'explore',
        href: () => exploreDiscoverUrl(),
        icon: Map,
        labelKey: 'explore.nav_explore',
        topBadgeKey: 'explore.near_you',
    },
    { key: 'favorites', href: () => exploreFavoritesDiscoverUrl(), icon: Heart, labelKey: 'explore.nav_favorites' },
    { key: 'routes', href: () => exploreRoutes.url(), icon: Route, labelKey: 'explore.nav_routes' },
] as const;

const MOBILE_NAV = [
    ...MAIN_NAV,
    { key: 'profile', href: () => exploreProfile.url(), icon: User, labelKey: 'explore.my_profile' },
] as const;

export default function TouristExploreLayout({ children, wide = false }: Props) {
    useLanguageSync();
    useFlashToast();
    const { t } = useTranslation();
    const { url } = usePage();

    const isActive = (href: string, key?: string) => {
        const path = url.split('?')[0];
        const query = url.includes('?') ? url.split('?')[1] : '';

        if (key === 'favorites') {
            return path === '/explore/discover' && query.includes('favorites_only=1');
        }
        if (key === 'explore') {
            return (
                (path === '/explore' || path === '/explore/discover' || path.startsWith('/explore/restaurants'))
                && !query.includes('favorites_only=1')
            );
        }
        if (key === 'profile') {
            return path === '/explore/profile' || path.startsWith('/explore/profile');
        }
        if (href.startsWith('/explore') && (href === '/explore' || href.startsWith('/explore?'))) {
            return path === '/explore' || path === '/explore/discover' || path.startsWith('/explore/restaurants');
        }
        return path.startsWith(href.split('?')[0]);
    };

    const profileHref = exploreProfile.url();
    const profileActive = isActive(profileHref, 'profile');

    return (
        <div className="relative min-h-screen bg-[#f0f5fb] pb-24 md:pb-6">
            <header className="sticky top-0 z-[100] border-b border-white/10 bg-brand-blue shadow-[0_8px_30px_rgba(5,42,88,0.35)]">
                <div
                    className={cn(
                        'mx-auto flex h-[4.625rem] items-center justify-between gap-3 px-4 sm:px-6',
                        wide ? 'max-w-[100%] lg:px-6' : 'max-w-lg md:max-w-7xl',
                    )}
                >
                    <BrandLogo href={home.url()} surface="dark" size="xl" framed={false} logoVariant="navbar" />

                    <div className="hidden items-center gap-1 overflow-visible md:flex lg:gap-2">
                        {MAIN_NAV.map(item => {
                            const Icon = item.icon;
                            const href = item.href();
                            const active = isActive(href, item.key);
                            const topBadgeKey = 'topBadgeKey' in item ? item.topBadgeKey : undefined;

                            return (
                                <Link
                                    key={item.key}
                                    href={href}
                                    className={cn(
                                        'group relative flex min-w-[4.5rem] flex-col items-center gap-1 rounded-lg px-2.5 py-1.5 transition-colors',
                                        active ? 'text-brand-orange' : 'text-white/85 hover:text-white',
                                    )}
                                >
                                    <span className="relative">
                                        <Icon
                                            className={cn(
                                                'size-5 transition-colors',
                                                active ? 'text-brand-orange' : 'text-white/90 group-hover:text-white',
                                            )}
                                        />
                                        {topBadgeKey && (
                                            <span className="pointer-events-none absolute -right-3 -top-2 max-w-[4.5rem] truncate rounded bg-brand-orange px-1 py-px text-[6px] font-bold uppercase leading-none tracking-wide text-white">
                                                {t(topBadgeKey)}
                                            </span>
                                        )}
                                    </span>
                                    <span className="text-center text-[11px] font-semibold leading-tight">
                                        {t(item.labelKey)}
                                    </span>
                                    <span
                                        className={cn(
                                            'absolute -bottom-0.5 left-2 right-2 h-0.5 rounded-full bg-brand-orange transition-transform',
                                            active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100',
                                        )}
                                    />
                                </Link>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <Link
                            href={profileHref}
                            className={cn(
                                'hidden items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition md:inline-flex',
                                profileActive
                                    ? 'bg-brand-orange text-white shadow-sm'
                                    : 'bg-brand-orange/90 text-white hover:bg-brand-orange',
                            )}
                        >
                            <User className="size-4" />
                            {t('explore.my_profile')}
                        </Link>
                        <LanguageSwitcher variant="dark" compact />
                    </div>
                </div>
            </header>

            <main
                className={cn(
                    'relative z-0 mx-auto w-full',
                    wide ? 'max-w-[100%]' : 'max-w-lg md:max-w-7xl',
                )}
            >
                {children}
            </main>

            <nav className="fixed bottom-0 left-0 right-0 z-[100] border-t border-orange-100 bg-white/95 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] backdrop-blur-md md:hidden">
                <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 py-2 safe-area-pb">
                    {MOBILE_NAV.map(item => {
                        const Icon = item.icon;
                        const href = item.href();
                        const active = isActive(href, item.key);
                        const topBadgeKey = 'topBadgeKey' in item ? item.topBadgeKey : undefined;

                        return (
                            <Link
                                key={item.key}
                                href={href}
                                className={cn(
                                    'relative flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1 text-[10px] font-semibold transition',
                                    active ? 'text-brand-orange' : 'text-gray-500',
                                )}
                            >
                                {topBadgeKey && (
                                    <span
                                        className={cn(
                                            'mb-0.5 max-w-full truncate rounded px-1 py-px text-[6px] font-bold uppercase leading-none tracking-wide',
                                            active ? 'bg-brand-orange text-white' : 'bg-orange-100 text-brand-orange',
                                        )}
                                    >
                                        {t(topBadgeKey)}
                                    </span>
                                )}
                                <span
                                    className={cn(
                                        'flex size-9 items-center justify-center rounded-xl transition',
                                        active && 'bg-orange-50',
                                    )}
                                >
                                    <Icon className={cn('size-5', active && 'text-brand-orange')} />
                                </span>
                                {t(item.labelKey)}
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
