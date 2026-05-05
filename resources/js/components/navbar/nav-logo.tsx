import { Link } from '@inertiajs/react';
import { home } from '@/routes';

interface NavLogoProps {
    scrolled?: boolean;
}

export function NavLogo({ scrolled = false }: NavLogoProps) {
    return (
        <Link href={home()} className="flex shrink-0 items-center">
            <img
                src="/logo.png"
                alt="DiscoverLambo"
                className="h-12 w-auto object-contain transition-all duration-300"
                style={{
                    filter: scrolled ? 'none' : 'drop-shadow(0 2px 8px rgba(0,0,0,0.35))',
                }}
            />
        </Link>
    );
}
