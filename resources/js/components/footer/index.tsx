import { useTranslation } from 'react-i18next';
import { FooterBrand } from './footer-brand';
import { FooterNav } from './footer-nav';
import { FooterSocial } from './footer-social';

const FOOTER_BG = '#120003';

export function Footer() {
    const { t } = useTranslation();

    return (
        <footer style={{ backgroundColor: FOOTER_BG }}>

            {/* ── Fila principal ── */}
            <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-between">

                    {/* Izquierda: logo real */}
                    <FooterBrand />

                    {/* Línea divisoria vertical (desktop) */}
                    <div className="hidden h-12 w-px bg-white/10 lg:block" />

                    {/* Centro: links */}
                    <FooterNav />

                    {/* Línea divisoria vertical (desktop) */}
                    <div className="hidden h-12 w-px bg-white/10 lg:block" />

                    {/* Derecha: redes sociales */}
                    <FooterSocial />

                </div>
            </div>

            {/* ── Barra copyright ── */}
            <div className="border-t border-white/6">
                <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
                    <p className="text-center text-xs text-white/30">
                        © {new Date().getFullYear()} DiscoverLambo · {t('footer.rights')}
                    </p>
                </div>
            </div>

        </footer>
    );
}
