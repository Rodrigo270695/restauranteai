import { Bot, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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

/** Placeholder hasta recibir el asset del robot Miski. */
export function WelcomeHeroMiskiFloat() {
    const { t } = useTranslation();

    return (
        <div className="pointer-events-none absolute bottom-8 right-6 z-20 hidden max-w-[17.5rem] lg:block xl:right-10">
            <div className="relative rounded-2xl bg-white/95 p-4 pr-10 shadow-[0_16px_40px_rgba(7,53,119,0.14)] ring-1 ring-black/5 backdrop-blur-sm">
                <div
                    className="absolute -top-5 right-3 flex size-12 items-center justify-center rounded-full border-2 border-white shadow-md"
                    style={{
                        background: 'linear-gradient(180deg, #eef3fb 0%, #dbeafe 100%)',
                    }}
                    aria-hidden
                >
                    <Bot className="size-6 text-brand-blue" strokeWidth={2.2} />
                </div>

                <p className="text-sm font-bold leading-snug text-gray-900">
                    {t('welcome.hero_miski_greeting')}{' '}
                    <span className="text-[#ffa300]">Miski</span>
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-gray-600">{t('welcome.hero_miski_desc')}</p>

                <Sparkles className="absolute bottom-3.5 right-3.5 size-4 text-[#ffa300]/80" aria-hidden />
            </div>
        </div>
    );
}
