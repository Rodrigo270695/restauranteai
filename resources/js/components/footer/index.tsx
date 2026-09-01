import { useTranslation } from 'react-i18next';
import { FooterBrand } from './footer-brand';
import { FooterNav } from './footer-nav';
import { FooterSocial } from './footer-social';

export function Footer() {
    const { t } = useTranslation();

    return (
        <footer className="bg-brand-blue">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-between">
                    <FooterBrand />

                    <div className="hidden h-12 w-px bg-white/10 lg:block" />

                    <FooterNav />

                    <div className="hidden h-12 w-px bg-white/10 lg:block" />

                    <FooterSocial />
                </div>
            </div>

            <div className="border-t border-white/10">
                <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
                    <p className="text-center text-xs text-white/30">
                        © {new Date().getFullYear()} MiskiGO · {t('footer.rights')}
                    </p>
                </div>
            </div>
        </footer>
    );
}
