import { Head, Link } from '@inertiajs/react';
import { ChefHat, MapPin, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguageSync } from '@/hooks/use-language-sync';
import { login, register } from '@/routes';

const BTN_PRIMARY: React.CSSProperties = {
    background: 'linear-gradient(90deg, #E8001A 0%, #CC0010 50%, #8B0008 100%)',
    boxShadow: '0 4px 18px rgba(200,0,10,0.28)',
};

const FEATURES = [
    { icon: Sparkles, key: 'feature1' },
    { icon: ChefHat,  key: 'feature2' },
    { icon: MapPin,   key: 'feature3' },
] as const;

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { t } = useTranslation();
    useLanguageSync();

    return (
        <>
            <Head title={t('welcome.hero_title')} />

            {/* ── HERO — pt compensa el navbar fixed ────────────────────── */}
            <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-32"
                style={{ background: 'linear-gradient(135deg, #FFF8F0 0%, #FFFFFF 40%, #FFF0E8 70%, #FFE4D8 100%)' }}
            >
                {/* Decorative radial glow */}
                <div
                    className="pointer-events-none absolute -top-32 -right-32 h-[600px] w-[600px] rounded-full opacity-20"
                    style={{ background: 'radial-gradient(circle, #E8001A, transparent 70%)' }}
                />

                <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col items-center gap-10 text-center lg:flex-row lg:text-left">

                        {/* Texto hero */}
                        <div className="flex-1 space-y-6">
                            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 lg:text-6xl">
                                {t('welcome.hero_title')}{' '}
                                <span
                                    className="bg-clip-text text-transparent"
                                    style={{ backgroundImage: 'linear-gradient(90deg, #E8001A, #FF6B00)' }}
                                >
                                    {t('welcome.hero_highlight')}
                                </span>
                            </h1>

                            <p className="max-w-xl text-lg text-gray-600 lg:text-xl">
                                {t('welcome.hero_subtitle')}
                            </p>

                            <div className="flex flex-wrap items-center justify-center gap-4 lg:justify-start">
                                <Link
                                    href="/restaurantes"
                                    className="cursor-pointer rounded-xl px-7 py-3.5 text-base font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
                                    style={BTN_PRIMARY}
                                >
                                    {t('welcome.cta_explore')}
                                </Link>
                                {canRegister && (
                                    <Link
                                        href={register()}
                                        className="cursor-pointer rounded-xl border border-gray-200 bg-white px-7 py-3.5 text-base font-semibold text-gray-800 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md active:scale-[0.98]"
                                    >
                                        {t('welcome.cta_register')}
                                    </Link>
                                )}
                            </div>

                            {/* Stats rápidas */}
                            <div className="flex flex-wrap justify-center gap-8 pt-2 lg:justify-start">
                                {[
                                    { value: '200+', label: 'Restaurantes' },
                                    { value: '4.8★', label: 'Valoración media' },
                                    { value: '5K+', label: 'Turistas' },
                                ].map(({ value, label }) => (
                                    <div key={label} className="text-center lg:text-left">
                                        <p className="text-2xl font-extrabold text-gray-900">{value}</p>
                                        <p className="text-xs text-gray-500">{label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Logo hero */}
                        <div className="shrink-0">
                            <img
                                src="/logo.png"
                                alt="DiscoverLambo"
                                className="w-64 drop-shadow-2xl lg:w-80"
                            />
                        </div>

                    </div>
                </div>
            </section>

            {/* ── FEATURES ──────────────────────────────────────────────── */}
            <section className="bg-white py-20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        {FEATURES.map(({ icon: Icon, key }) => (
                            <div
                                key={key}
                                className="group flex flex-col gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-8 transition-all hover:-translate-y-1 hover:shadow-lg"
                            >
                                <span
                                    className="flex h-12 w-12 items-center justify-center rounded-xl text-white"
                                    style={BTN_PRIMARY}
                                >
                                    <Icon className="h-6 w-6" />
                                </span>
                                <h3 className="text-lg font-bold text-gray-900">
                                    {t(`welcome.${key}_title`)}
                                </h3>
                                <p className="text-sm leading-relaxed text-gray-600">
                                    {t(`welcome.${key}_desc`)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA FINAL ─────────────────────────────────────────────── */}
            <section
                className="py-20"
                style={{ background: 'radial-gradient(ellipse 120% 100% at 60% 30%, #E8001A 0%, #CC0010 35%, #9B0008 65%, #620005 100%)' }}
            >
                <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
                    <h2 className="mb-4 text-3xl font-extrabold text-white lg:text-4xl">
                        {t('welcome.cta_explore')}
                    </h2>
                    <p className="mb-8 text-lg text-white/70">
                        {t('welcome.hero_subtitle')}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <Link
                            href={login()}
                            className="cursor-pointer rounded-xl border border-white/30 px-7 py-3.5 text-base font-semibold text-white transition-all hover:bg-white/10"
                        >
                            {t('welcome.login')}
                        </Link>
                        {canRegister && (
                            <Link
                                href={register()}
                                className="cursor-pointer rounded-xl px-7 py-3.5 text-base font-semibold text-[#1B3A09] transition-all hover:opacity-90 active:scale-[0.98]"
                                style={{ background: '#FFD000' }}
                            >
                                {t('welcome.cta_register')}
                            </Link>
                        )}
                        </div>
                </div>
            </section>
        </>
    );
}
