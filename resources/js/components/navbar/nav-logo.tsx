import { home } from '@/routes';
import { BrandLogo } from '@/components/common/brand-logo';

type Props = {
    variant?: 'light' | 'dark';
};

export function NavLogo({ variant = 'light' }: Props) {
    return (
        <BrandLogo
            href={home()}
            surface={variant === 'dark' ? 'dark' : 'light'}
            size="xl"
            framed={variant !== 'dark'}
            logoVariant="navbar"
        />
    );
}
