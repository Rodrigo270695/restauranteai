import { useTranslation } from 'react-i18next';
import { FooterNavItem } from './footer-nav-item';

const FOOTER_LINKS = [
    { key: 'home',    href: '/' },
    { key: 'about',   href: '/quienes-somos' },
    { key: 'faq',     href: '/preguntas-frecuentes' },
    { key: 'contact', href: '/contacto' },
] as const;

export function FooterNav() {
    const { t } = useTranslation();

    return (
        <nav className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2 lg:justify-start">
            {FOOTER_LINKS.map(({ key, href }, index) => (
                <span key={key} className="flex items-center gap-x-2">
                    {index > 0 && (
                        <span className="text-white/30 select-none">|</span>
                    )}
                    <FooterNavItem href={href} label={t(`footer.${key}`)} />
                </span>
            ))}
        </nav>
    );
}
