import { Link, usePage } from '@inertiajs/react';
import { ChefHat, MapPin, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/common/language-switcher';
import { useLanguageSync } from '@/hooks/use-language-sync';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

// Gradiente más limpio: rojo brillante en el centro, extremos en rojo medio (no tan oscuro)
const BRAND_GRADIENT =
    'radial-gradient(ellipse 130% 120% at 55% 35%, #F0001E 0%, #D4000F 30%, #B00009 55%, #8C0007 75%, #780006 100%)';

type FeatureKey = 'restaurants' | 'ai' | 'best';

const FEATURE_ICONS: Record<FeatureKey, typeof MapPin> = {
    restaurants: MapPin,
    ai: Sparkles,
    best: ChefHat,
};

const FEATURE_KEYS: FeatureKey[] = ['restaurants', 'ai', 'best'];

export default function AuthBrandLayout({ children, title, description }: AuthLayoutProps) {
    const { t } = useTranslation();
    useLanguageSync();

    const { auth } = usePage().props as { auth?: { roles?: string[] } };
    const roles = auth?.roles ?? [];
    // Solo turistas y visitantes sin sesión ven el selector de idioma
    const showLanguage = roles.length === 0 || roles.includes('tourist');

    return (
        <div className="flex min-h-screen bg-white">

            {/* ── LEFT PANEL ──────────────────────────────────────────────── */}
            <div
                className="relative hidden overflow-hidden lg:flex lg:w-[48%] lg:flex-col lg:p-12"
                style={{ background: BRAND_GRADIENT }}
            >
                {/* Glow sutil en el centro */}
                <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                        background: 'radial-gradient(ellipse 60% 50% at 50% 80%, rgba(220,0,10,0.35), transparent 70%)',
                    }}
                />

                {/* Dot pattern sutil */}
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.05]"
                    style={{
                        backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
                        backgroundSize: '28px 28px',
                    }}
                />

                {/* ── LOGO centrado grande ── */}
                <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6">
                    <Link href={home()} className="block">
                        <img
                            src="/logo.png"
                            alt="DiscoverLambo"
                            className="w-72 drop-shadow-[0_8px_32px_rgba(0,0,0,0.45)]"
                        />
                    </Link>

                    {/* Tagline */}
                    <p className="text-center text-lg font-medium tracking-wide text-white/80 drop-shadow">
                        {t('brand.tagline')}
                    </p>

                    {/* Features */}
                    <div className="mt-4 flex flex-col gap-3 self-stretch">
                        {FEATURE_KEYS.map((key) => {
                            const Icon = FEATURE_ICONS[key];
                            return (
                                <div
                                    key={key}
                                    className="flex items-center gap-3 rounded-xl px-4 py-3"
                                    style={{
                                        background: 'rgba(0,0,0,0.15)',
                                        border: '1px solid rgba(255,255,255,0.10)',
                                    }}
                                >
                                    <span
                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                                        style={{ background: 'rgba(255,255,255,0.15)' }}
                                    >
                                        <Icon className="h-4 w-4 text-white" />
                                    </span>
                                    <div>
                                        <p className="text-sm font-semibold text-white">
                                            {t(`brand.feature_${key}_title`)}
                                        </p>
                                        <p className="text-xs text-white/60">
                                            {t(`brand.feature_${key}_desc`)}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>

            {/* ── RIGHT PANEL: Form ───────────────────────────────────────── */}
            <div className="relative flex flex-1 flex-col items-center justify-center bg-white px-6 py-12 sm:px-12">

                {/* Language switcher — solo para turistas y visitantes */}
                {showLanguage && (
                    <div className="absolute top-5 right-6">
                        <LanguageSwitcher variant="light" />
                    </div>
                )}

                {/* Mobile logo */}
                <div className="mb-8 lg:hidden">
                    <Link href={home()} className="flex justify-center">
                        <img src="/logo.png" alt="DiscoverLambo" className="h-24 w-auto" />
                    </Link>
                </div>

                <div className="w-full max-w-sm">
                    {/* Form slot */}
                    {children}

                    {/* Footer */}
                    <p className="mt-6 text-center text-xs text-gray-400">
                        {t('common.footer')}
                    </p>
                </div>
            </div>
        </div>
    );
}
