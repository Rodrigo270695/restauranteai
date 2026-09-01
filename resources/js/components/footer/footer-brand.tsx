import { home } from '@/routes';
import { BrandLogo } from '@/components/common/brand-logo';
import { useTranslation } from 'react-i18next';

export function FooterBrand() {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col items-center gap-1.5 lg:items-start">
            <BrandLogo href={home()} surface="dark" size="lg" framed={false} logoVariant="navbar" />
            <p className="max-w-[14rem] text-center text-xs text-white/50 lg:text-left">{t('footer.tagline')}</p>
        </div>
    );
}
