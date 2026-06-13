import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MISKI_FLOAT_IMAGE = '/IMAGEN%20FLOTANTE.png';

export function WelcomeHeroAiBadge() {
    const { t } = useTranslation();

    return (
        <div className="inline-flex items-center gap-2.5">
            <span
                className="inline-flex min-w-[2rem] items-center justify-center rounded-md px-2 py-1 text-[10px] font-bold tracking-wide text-white shadow-sm"
                style={{
                    background: 'linear-gradient(180deg, #0d4a9e 0%, #073577 55%, #052a58 100%)',
                }}
            >
                IA
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-blue sm:text-xs">
                {t('welcome.hero_ai_badge')}
            </span>
        </div>
    );
}

/** Tarjeta flotante de Miski con avatar del asistente. */
export function WelcomeHeroMiskiFloat() {
    const { t } = useTranslation();

    return (
        <div className="pointer-events-none absolute bottom-12 right-6 z-20 hidden max-w-[25rem] lg:block xl:right-14">
            <div className="relative rounded-3xl bg-white/95 p-6 pr-14 shadow-[0_20px_48px_rgba(7,53,119,0.16)] ring-1 ring-black/5 backdrop-blur-sm">
                <div
                    className="absolute -top-11 right-0 size-[6.5rem] overflow-hidden rounded-full border-[3px] border-white bg-white shadow-[0_10px_28px_rgba(7,53,119,0.2)]"
                    aria-hidden
                >
                    <img
                        src={MISKI_FLOAT_IMAGE}
                        alt=""
                        className="size-full object-cover object-[center_15%]"
                    />
                </div>

                <p className="text-lg font-bold leading-snug text-gray-900">
                    {t('welcome.hero_miski_greeting')}{' '}
                    <span className="text-[#ffa300]">Miski</span>
                </p>
                <p className="mt-2.5 text-base leading-relaxed text-gray-600">{t('welcome.hero_miski_desc')}</p>

                <Sparkles className="absolute bottom-5 right-5 size-6 text-[#ffa300]/80" aria-hidden />
            </div>
        </div>
    );
}
