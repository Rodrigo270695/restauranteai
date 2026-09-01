import { Link } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';

interface FooterNavItemProps {
    href: string;
    label: string;
    icon?: LucideIcon;
}

export function FooterNavItem({ href, label, icon: Icon }: FooterNavItemProps) {
    return (
        <Link
            href={href}
            className="inline-flex items-center gap-1.5 text-sm text-white/75 transition-colors hover:text-brand-orange"
        >
            {Icon && <Icon className="size-3.5 shrink-0 opacity-80" />}
            {label}
        </Link>
    );
}
