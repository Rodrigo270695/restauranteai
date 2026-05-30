import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';

type Surface = 'light' | 'dark';
type Size = 'sm' | 'md' | 'lg' | 'xl' | 'hero';

const IMG_SIZE: Record<Size, string> = {
    sm: 'h-7',
    md: 'h-9',
    lg: 'h-10',
    xl: 'h-14',
    hero: 'h-20 sm:h-24 xl:h-28',
};

const PAD_SIZE: Record<Size, string> = {
    sm: 'px-2 py-1',
    md: 'px-2.5 py-1',
    lg: 'px-3 py-1.5',
    xl: 'px-4 py-2',
    hero: 'px-5 py-3 sm:px-6 sm:py-4',
};

type Props = {
    surface?: Surface;
    size?: Size;
    href?: string;
    className?: string;
    imgClassName?: string;
    alt?: string;
};

export function BrandLogo({
    surface = 'light',
    size = 'md',
    href,
    className,
    imgClassName,
    alt = 'DiscoverLambo',
}: Props) {
    const img = (
        <img
            src="/logo.png"
            alt={alt}
            className={cn(IMG_SIZE[size], 'w-auto object-contain', surface === 'dark' && 'drop-shadow-lg', imgClassName)}
        />
    );

    const content =
        surface === 'light' ? (
            <span
                className={cn(
                    'inline-flex items-center justify-center rounded-xl bg-brand-blue shadow-md ring-1 ring-brand-blue-dark/25',
                    PAD_SIZE[size],
                )}
            >
                {img}
            </span>
        ) : (
            img
        );

    if (href) {
        return (
            <Link
                href={href}
                className={cn('inline-flex shrink-0 items-center transition-opacity hover:opacity-90', className)}
            >
                {content}
            </Link>
        );
    }

    return <span className={cn('inline-flex shrink-0 items-center', className)}>{content}</span>;
}
