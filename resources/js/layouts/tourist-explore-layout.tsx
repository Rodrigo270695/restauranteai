import { Link, usePage } from '@inertiajs/react';
import { Heart, Map, Route, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/common/language-switcher';
import { useFlashToast } from '@/hooks/use-flash-toast';
import { useLanguageSync } from '@/hooks/use-language-sync';
import { cn } from '@/lib/utils';
import { exploreDiscoverUrl, exploreFavoritesDiscoverUrl } from '@/lib/explore-discover-url';
import { BrandLogo } from '@/components/common/brand-logo';
import { home } from '@/routes';
import { index as exploreRoutes } from '@/routes/explore/routes';
import { profile as exploreProfile } from '@/routes/explore';

type Props = { children: React.ReactNode; wide?: boolean };

const NAV = [
    {
        key: 'explore',
        href: () => exploreDiscoverUrl(),
        icon: Map,
        labelKey: 'explore.nav_explore',
        topBadgeKey: 'explore.near_you',
    },
    { key: 'favorites', href: () => exploreFavoritesDiscoverUrl(), icon: Heart, labelKey: 'explore.nav_favorites' },
    { key: 'routes', href: () => exploreRoutes.url(), icon: Route, labelKey: 'explore.nav_routes' },
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
        if (href.startsWith('/explore') && (href === '/explore' || href.startsWith('/explore?'))) {
            return path === '/explore' || path === '/explore/discover' || path.startsWith('/explore/restaurants');
        }
        return path.startsWith(href.split('?')[0]);
    };

    return (
        <div className="relative min-h-screen bg-[#f0f5fb] pb-24 md:pb-6">
            <header className="sticky top-0 z-[100] border-b border-orange-100/80 bg-white/95 shadow-sm backdrop-blur-md">
                <div
                    className={cn(
                        'mx-auto flex h-14 items-center justify-between gap-2 px-4',
                        wide ? 'max-w-[100%] lg:px-6' : 'max-w-lg md:max-w-7xl',
                    )}
                >
                    <BrandLogo href={home.url()} surface="light" size="sm" />
                    <div className="hidden items-center gap-1 overflow-visible md:flex">
                        {NAV.map(item => {
                            const Icon = item.icon;
                            const href = item.href();
                            const topBadgeKey = 'topBadgeKey' in item ? item.topBadgeKey : undefined;

                            return (
                                <Link
                                    key={item.key}
                                    href={href}
                                    className={cn(
                                        'relative inline-flex items-center gap-1.5 rounded-full px-3 pb-1.5 pt-2.5 text-sm font-medium transition',
                                        isActive(href, item.key)
                                            ? 'bg-brand-orange text-white shadow-sm'
                                            : 'text-gray-600 hover:bg-orange-50',
                                    )}
                                >
                                    {topBadgeKey && (
                                        <span
                                            className={cn(
                                                'pointer-events-none absolute -top-1 left-1/2 max-w-[5.5rem] -translate-x-1/2 truncate rounded px-1.5 py-px text-[7px] font-bold uppercase leading-none tracking-wide',
                                                isActive(href, item.key)
                                                    ? 'bg-white/95 text-brand-orange'
                                                    : 'bg-brand-orange text-white',
                                            )}
                                        >
                                            {t(topBadgeKey)}
                                        </span>
                                    )}
                                    <Icon className="size-4 shrink-0" />
                                    {t(item.labelKey)}
                                </Link>
                            );
                        })}
                        <LanguageSwitcher />
                    </div>
                    <div className="flex items-center gap-2 md:hidden">
                        <LanguageSwitcher />
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
                    {NAV.map(item => {
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
