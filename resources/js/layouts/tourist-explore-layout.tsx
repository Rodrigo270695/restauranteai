import { Link, usePage } from '@inertiajs/react';
import { Map, Route, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/common/language-switcher';
import { useLanguageSync } from '@/hooks/use-language-sync';
import { cn } from '@/lib/utils';
import { exploreDiscoverUrl } from '@/lib/explore-discover-url';
import { home } from '@/routes';
import { index as exploreRoutes } from '@/routes/explore/routes';
import { profile as exploreProfile } from '@/routes/explore';

type Props = { children: React.ReactNode; wide?: boolean };

const NAV = [
    { key: 'explore', href: () => exploreDiscoverUrl(), icon: Map, labelKey: 'explore.nav_explore' },
    { key: 'routes', href: () => exploreRoutes.url(), icon: Route, labelKey: 'explore.nav_routes' },
    { key: 'profile', href: () => exploreProfile.url(), icon: User, labelKey: 'explore.my_profile' },
] as const;

export default function TouristExploreLayout({ children, wide = false }: Props) {
    useLanguageSync();
    const { t } = useTranslation();
    const { url } = usePage();

    const isActive = (href: string) => {
        const path = url.split('?')[0];
        if (href.startsWith('/explore') && (href === '/explore' || href.startsWith('/explore?'))) {
            return path === '/explore' || path === '/explore/discover' || path.startsWith('/explore/restaurants');
        }
        return path.startsWith(href.split('?')[0]);
    };

    return (
        <div className="relative min-h-screen bg-[#FFF8F2] pb-24 md:pb-6">
            <header className="sticky top-0 z-[100] border-b border-orange-100/80 bg-white/95 shadow-sm backdrop-blur-md">
                <div
                    className={cn(
                        'mx-auto flex h-14 items-center justify-between gap-2 px-4',
                        wide ? 'max-w-[100%] lg:px-6' : 'max-w-lg md:max-w-7xl',
                    )}
                >
                    <Link href={home.url()} className="flex min-w-0 items-center gap-2">
                        <img src="/logo.png" alt="DiscoverLambo" className="h-8 w-auto shrink-0" />
                        <span className="hidden truncate text-sm font-bold text-gray-900 sm:inline">
                            DiscoverLambo
                        </span>
                    </Link>
                    <div className="hidden items-center gap-1 md:flex">
                        {NAV.map(item => {
                            const Icon = item.icon;
                            const href = item.href();
                            return (
                                <Link
                                    key={item.key}
                                    href={href}
                                    className={cn(
                                        'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition',
                                        isActive(href)
                                            ? 'bg-[#E8001A] text-white shadow-sm'
                                            : 'text-gray-600 hover:bg-orange-50',
                                    )}
                                >
                                    <Icon className="size-4" />
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
                        const active = isActive(href);
                        return (
                            <Link
                                key={item.key}
                                href={href}
                                className={cn(
                                    'flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10px] font-semibold transition',
                                    active ? 'text-[#E8001A]' : 'text-gray-500',
                                )}
                            >
                                <span
                                    className={cn(
                                        'flex size-9 items-center justify-center rounded-xl transition',
                                        active && 'bg-red-50',
                                    )}
                                >
                                    <Icon className={cn('size-5', active && 'text-[#E8001A]')} />
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
