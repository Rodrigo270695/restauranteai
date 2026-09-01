import { Link, usePage } from '@inertiajs/react';
import { Heart, MapPin, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MiskiLogo } from '@/components/auth/miski-logo';
import LanguageSwitcher from '@/components/common/language-switcher';
import { useLanguageSync } from '@/hooks/use-language-sync';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

const AUTH_HERO = '/auth-hero-miski.png';

const BRAND_GRADIENT =
    'radial-gradient(ellipse 130% 120% at 55% 35%, #0a3d8f 0%, #002366 42%, #001a4d 72%, #001033 100%)';

type FeatureKey = 'recs' | 'routes' | 'favs';

const FEATURE_ICONS: Record<FeatureKey, typeof Sparkles> = {
    recs: Sparkles,
    routes: MapPin,
    favs: Heart,
};

const FEATURE_KEYS: FeatureKey[] = ['recs', 'routes', 'favs'];

export default function AuthBrandLayout({ children }: AuthLayoutProps) {
    const { t } = useTranslation();
    useLanguageSync();

    const { auth } = usePage().props as { auth?: { roles?: string[] } };
    const roles = auth?.roles ?? [];
    const showLanguage = roles.length === 0 || roles.includes('tourist');

    return (
        <div className="flex min-h-screen bg-white">
            <div
                className="relative hidden overflow-hidden lg:flex lg:w-[46%] lg:flex-col lg:px-12 lg:py-10"
                style={{ background: BRAND_GRADIENT }}
            >
                <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                        background: 'radial-gradient(ellipse 60% 50% at 50% 72%, rgba(255,140,0,0.22), transparent 70%)',
                    }}
                />
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.07]"
                    style={{
                        backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
                        backgroundSize: '28px 28px',
                    }}
                />

                <div className="relative z-10 flex min-h-0 flex-1 flex-col">
                    <Link href={home()} className="block w-fit max-w-full transition-opacity hover:opacity-95">
                        <MiskiLogo onDark className="h-20 w-auto xl:h-24" />
                    </Link>

                    <div className="mt-6 max-w-lg">
                        <h2 className="text-3xl font-bold leading-tight tracking-tight text-white xl:text-[2.35rem]">
                            {t('brand.hero_title')}{' '}
                            <span className="text-brand-orange">{t('brand.hero_highlight')}</span>
                        </h2>
                        <p className="mt-3 text-sm leading-relaxed text-white/75 xl:text-base">
                            {t('brand.hero_desc')}
                        </p>
                    </div>

                    <div className="flex min-h-0 flex-1 items-center justify-center py-2">
                        <img
                            src={AUTH_HERO}
                            alt=""
                            className="h-[min(46vh,26rem)] w-auto max-w-full object-contain object-bottom drop-shadow-[0_16px_40px_rgba(0,0,0,0.35)] xl:h-[min(52vh,30rem)]"
                            style={{ mixBlendMode: 'screen' }}
                        />
                    </div>

                    <div className="mt-2 flex flex-col gap-2.5">
                        {FEATURE_KEYS.map((key) => {
                            const Icon = FEATURE_ICONS[key];
                            return (
                                <div
                                    key={key}
                                    className="flex items-center gap-3 rounded-xl px-3.5 py-2.5"
                                    style={{
                                        background: 'rgba(0,0,0,0.15)',
                                        border: '1px solid rgba(255,255,255,0.10)',
                                    }}
                                >
                                    <span
                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                                        style={{ background: 'rgba(255,140,0,0.18)' }}
                                    >
                                        <Icon className="h-4 w-4 text-brand-orange" />
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

                    <div className="mt-6 flex justify-center gap-1.5" aria-hidden>
                        <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
                        <span className="h-1.5 w-1.5 rounded-full bg-white/35" />
                        <span className="h-1.5 w-1.5 rounded-full bg-white/35" />
                    </div>
                </div>
            </div>

            <div className="relative flex flex-1 flex-col items-center overflow-y-auto bg-white px-6 py-16 sm:px-12">
                {showLanguage && (
                    <div className="absolute top-5 right-6">
                        <LanguageSwitcher variant="light" />
                    </div>
                )}

                <div className="mb-8 lg:hidden">
                    <Link
                        href={home()}
                        className="flex justify-center rounded-2xl bg-brand-blue px-3 py-2 transition-opacity hover:opacity-95"
                    >
                        <MiskiLogo onDark className="h-16 w-auto" />
                    </Link>
                </div>

                <div className="my-auto w-full max-w-lg">
                    {children}
                    <p className="mt-6 text-center text-xs text-gray-400">
                        {t('common.footer')}
                    </p>
                </div>
            </div>
        </div>
    );
}
