import { Link, usePage } from '@inertiajs/react';
import { Heart, Route, Search, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Navbar } from '@/components/navbar';
import { useFlashToast } from '@/hooks/use-flash-toast';
import { useLanguageSync } from '@/hooks/use-language-sync';
import { exploreFavoritesDiscoverUrl, exploreSearchUrl } from '@/lib/explore-discover-url';
import { cn } from '@/lib/utils';
import { profile as exploreProfile } from '@/routes/explore';
import { index as exploreRoutes } from '@/routes/explore/routes';

type Props = { children: React.ReactNode; wide?: boolean };

const MOBILE_NAV = [
    { key: 'explore', href: () => exploreSearchUrl(), icon: Search, labelKey: 'explore.nav_explore' },
    { key: 'favorites', href: () => exploreFavoritesDiscoverUrl(), icon: Heart, labelKey: 'explore.nav_favorites' },
    { key: 'routes', href: () => exploreRoutes.url(), icon: Route, labelKey: 'explore.nav_routes' },
    { key: 'profile', href: () => exploreProfile.url(), icon: User, labelKey: 'explore.my_profile' },
] as const;

export default function TouristExploreLayout({ children, wide = false }: Props) {
    useLanguageSync();
    useFlashToast();
    const { t } = useTranslation();
    const { url, auth } = usePage();
    const user = (auth as { user?: unknown | null } | undefined)?.user ?? null;

    const isActive = (href: string, key?: string) => {
        const path = url.split('?')[0];

        if (key === 'favorites') {
            return path === '/explore/favorites' || path.startsWith('/explore/favorites');
        }
        if (key === 'explore') {
            return path === '/explore/search' || path.startsWith('/explore/restaurants');
        }
        if (key === 'profile') {
            return path === '/explore/profile' || path.startsWith('/explore/profile');
        }
        if (href.startsWith('/explore') && (href === '/explore' || href.startsWith('/explore?'))) {
            return path === '/explore' || path === '/explore/discover' || path.startsWith('/explore/restaurants');
        }
        return path.startsWith(href.split('?')[0]);
    };

    return (
        <div className={cn(
            'relative min-h-screen bg-[#f0f5fb]',
            wide ? 'pb-16 md:h-dvh md:overflow-hidden md:pb-0' : 'pb-24 md:pb-6',
        )}>
            <Navbar />

            <main
                className={cn(
                    'relative z-0 mx-auto w-full pt-[4.625rem]',
                    wide ? 'max-w-[100%] md:h-[calc(100dvh-4.625rem)] md:overflow-hidden' : 'max-w-lg md:max-w-7xl',
                )}
            >
                {children}
            </main>

            <nav className="fixed bottom-0 left-0 right-0 z-[100] border-t border-orange-100 bg-white/95 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] backdrop-blur-md md:hidden">
                <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 py-2 safe-area-pb">
                    {(user ? MOBILE_NAV : MOBILE_NAV.filter((item) => item.key === 'explore')).map(item => {
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
