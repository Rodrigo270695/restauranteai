import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

export function FooterBrand() {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col items-center gap-2 lg:items-start">
            <Link href="/" className="block transition-opacity hover:opacity-90">
                <img
                    src="/logo.png"
                    alt="DiscoverLambo"
                    className="h-20 w-auto object-contain drop-shadow-lg"
                />
            </Link>
            <p className="text-xs text-white/40">{t('footer.tagline')}</p>
        </div>
    );
}
