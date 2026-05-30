import { home } from '@/routes';
import { BrandLogo } from '@/components/common/brand-logo';

export function NavLogo() {
    return <BrandLogo href={home()} surface="light" size="lg" />;
}
