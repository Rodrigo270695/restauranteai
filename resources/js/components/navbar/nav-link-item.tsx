import { Link, usePage } from '@inertiajs/react';
import { cn } from '@/lib/utils';

interface NavLinkItemProps {
    href: string;
    label: string;
    exact?: boolean;
    scrolled?: boolean;
}

export function NavLinkItem({ href, label, exact = false, scrolled = false }: NavLinkItemProps) {
    const { url } = usePage();
    const isActive = exact ? url === href : url.startsWith(href);

    return (
        <Link
            href={href}
            className={cn(
                'relative pb-1 text-sm font-medium transition-all duration-200',
                'after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:rounded-full after:transition-transform after:duration-200',
                isActive
                    ? 'font-semibold text-brand-red after:scale-x-100 after:bg-brand-red'
                    : 'text-gray-600 after:scale-x-0 after:bg-brand-red hover:text-gray-900 hover:after:scale-x-100',
            )}
        >
            {label}
        </Link>
    );
}
