import { Link, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { getPublicNavItems, isPublicNavItemActive } from '@/config/public-nav-items';
import { cn } from '@/lib/utils';
import type { User } from '@/types';

interface NavLinksProps {
    variant?: 'light' | 'dark';
}

export function NavLinks({ variant = 'light' }: NavLinksProps) {
    const { t } = useTranslation();
    const page = usePage();
    const url = page.url;
    const { auth } = page.props as { auth: { user: User | null; roles: string[] } };
    const roles = auth.roles ?? [];
    const items = getPublicNavItems(roles);
    const isDark = variant === 'dark';

    return (
        <nav className="hidden items-center gap-1 overflow-visible md:flex lg:gap-2">
            {items.map(item => {
                const isActive = isPublicNavItemActive(url, item);
                const Icon = item.icon;

                if (item.soon) {
                    return (
                        <span
                            key={item.key}
                            className="flex cursor-not-allowed flex-col items-center gap-1 px-3 py-1 text-gray-400"
                        >
                            <Icon className="size-5 opacity-40" />
                            <span className="text-[11px] font-medium">{t(item.labelKey)}</span>
                        </span>
                    );
                }

                return (
                    <Link
                        key={item.key}
                        href={item.href}
                        className={cn(
                            'group relative flex min-w-[3.6rem] flex-col items-center gap-1 rounded-lg px-1.5 py-1.5 transition-colors lg:min-w-[4.5rem] lg:px-2.5',
                            isActive
                                ? isDark
                                    ? 'text-brand-orange'
                                    : 'text-brand-orange'
                                : isDark
                                  ? 'text-white/85 hover:text-white'
                                  : 'text-gray-600 hover:text-gray-900',
                        )}
                    >
                        <span className="relative">
                            <Icon
                                className={cn(
                                    'size-5 transition-colors',
                                    isActive ? 'text-brand-orange' : isDark ? 'text-white/90' : 'text-gray-500 group-hover:text-gray-800',
                                )}
                            />
                            {item.topBadge && (
                                <span className="pointer-events-none absolute -right-2.5 -top-2 rounded bg-brand-orange px-1 py-px text-[7px] font-bold leading-none tracking-wide text-white">
                                    {item.topBadge}
                                </span>
                            )}
                        </span>
                        <span className="text-center text-[11px] font-semibold leading-tight">{t(item.labelKey)}</span>
                        <span
                            className={cn(
                                'absolute -bottom-0.5 left-2 right-2 h-0.5 rounded-full bg-brand-orange transition-transform',
                                isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100',
                            )}
                        />
                    </Link>
                );
            })}
        </nav>
    );
}
