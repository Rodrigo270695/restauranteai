import { Link } from '@inertiajs/react';

interface FooterNavItemProps {
    href: string;
    label: string;
}

export function FooterNavItem({ href, label }: FooterNavItemProps) {
    return (
        <Link
            href={href}
            className="text-sm text-white/70 transition-colors hover:text-white"
        >
            {label}
        </Link>
    );
}
