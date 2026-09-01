import { usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { getPublicNavItems } from '@/config/public-nav-items';
import type { User } from '@/types';
import { FooterNavItem } from './footer-nav-item';

export function FooterNav() {
    const { t } = useTranslation();
    const page = usePage();
    const { auth } = page.props as { auth: { user: User | null; roles: string[] } };
    const items = getPublicNavItems(auth.roles ?? []);

    return (
        <nav className="flex flex-wrap items-center justify-center gap-x-1 gap-y-2 lg:justify-start">
            {items.map((item, index) => (
                <span key={item.key} className="flex items-center gap-x-1">
                    {index > 0 && <span className="select-none px-1 text-white/25">|</span>}
                    <FooterNavItem href={item.href} label={t(item.labelKey)} icon={item.icon} />
                </span>
            ))}
        </nav>
    );
}
