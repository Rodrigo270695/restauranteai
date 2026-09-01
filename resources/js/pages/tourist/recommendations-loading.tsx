import { Head, router } from '@inertiajs/react';
import { Check, Heart, Lightbulb, MapPin, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthRegisterStepper } from '@/components/auth/auth-register-stepper';
import { MiskiLogo } from '@/components/auth/miski-logo';
import { useLanguageSync } from '@/hooks/use-language-sync';
import { cn } from '@/lib/utils';

const HERO = '/auth-hero-miski.png';

const CARD_IMAGES = [
    'https://images.unsplash.com/photo-1594040221058-7a070085357c?auto=format&fit=crop&w=400&q=70',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=70',
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=400&q=70',
];

const CARD_ICONS = [Heart, MapPin, Star];

const STEP_KEYS = [
    { title: 'setup.loading_step1_title', desc: 'setup.loading_step1_desc' },
    { title: 'setup.loading_step2_title', desc: 'setup.loading_step2_desc' },
    { title: 'setup.loading_step3_title', desc: 'setup.loading_step3_desc' },
    { title: 'setup.loading_step4_title', desc: 'setup.loading_step4_desc' },
    { title: 'setup.loading_step5_title', desc: 'setup.loading_step5_desc' },
] as const;

const STEP_MS = 1200;

export default function RecommendationsLoading() {
    const { t } = useTranslation();
    useLanguageSync();

    const [activeStep, setActiveStep] = useState(0);
    const [progress, setProgress] = useState(8);

    useEffect(() => {
        const timers: number[] = [];

        STEP_KEYS.forEach((_, index) => {
            timers.push(
                window.setTimeout(() => {
                    setActiveStep(index);
                    setProgress(Math.min(100, 12 + index * 22));
                }, index * STEP_MS),
            );
        });

        timers.push(
            window.setTimeout(() => {
                setActiveStep(STEP_KEYS.length);
                setProgress(100);
            }, STEP_KEYS.length * STEP_MS),
        );

        timers.push(
            window.setTimeout(() => {
                router.visit('/');
            }, STEP_KEYS.length * STEP_MS + 700),
        );

        return () => timers.forEach((id) => window.clearTimeout(id));
    }, []);

    const statusLabel =
        activeStep >= STEP_KEYS.length
            ? t('setup.loading_status_done')
            : t(STEP_KEYS[Math.min(activeStep, STEP_KEYS.length - 1)].title);

    return (
        <>
            <Head title={t('setup.loading_title')} />

            <div className="min-h-screen bg-white px-4 py-8 sm:px-8">
                <div className="mx-auto flex max-w-5xl flex-col items-center">
                    <div className="mb-6 w-full max-w-md">
                        <AuthRegisterStepper current={3} />
                    </div>

                    <div className="mb-5 rounded-2xl bg-brand-blue px-5 py-3 shadow-[0_8px_24px_rgba(0,35,102,0.22)]">
                        <MiskiLogo onDark className="mx-auto h-24 w-auto sm:h-28" />
                    </div>

                    <h1 className="max-w-2xl text-center text-2xl font-bold tracking-tight text-brand-blue sm:text-3xl">
                        {t('setup.loading_title')}
                    </h1>
                    <p className="mt-2 max-w-xl text-center text-sm text-gray-500 sm:text-base">
                        {t('setup.loading_subtitle')}
                    </p>

                    <div className="mt-6 w-full max-w-xl">
                        <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                            <div
                                className="h-full rounded-full transition-[width] duration-700 ease-out"
                                style={{
                                    width: `${progress}%`,
                                    background: 'linear-gradient(90deg, #002366 0%, #FF8C00 100%)',
                                }}
                            />
                        </div>
                        <p className="mt-2 text-center text-sm font-medium text-brand-blue">
                            {statusLabel}… {progress}%
                        </p>
                    </div>

                    <div className="mt-10 grid w-full items-center gap-10 lg:grid-cols-[1fr_1.1fr]">
                        <ol className="relative flex flex-col gap-5">
                            <div className="absolute top-3 bottom-3 left-4 border-l-2 border-dashed border-brand-blue/20" />
                            {STEP_KEYS.map((step, index) => {
                                const done = activeStep > index;
                                const current = activeStep === index;

                                return (
                                    <li key={step.title} className="relative z-10 flex gap-3">
                                        <span
                                            className={cn(
                                                'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 bg-white',
                                                done && 'border-brand-blue bg-brand-blue text-white',
                                                current && !done && 'border-brand-orange text-brand-orange',
                                                !done && !current && 'border-gray-200 text-transparent',
                                            )}
                                        >
                                            {done ? <Check className="h-4 w-4" strokeWidth={3} /> : null}
                                        </span>
                                        <div>
                                            <p
                                                className={cn(
                                                    'text-sm font-semibold',
                                                    done || current ? 'text-brand-blue' : 'text-gray-400',
                                                )}
                                            >
                                                {t(step.title)}
                                            </p>
                                            <p className="text-xs text-gray-400">{t(step.desc)}</p>
                                        </div>
                                    </li>
                                );
                            })}
                        </ol>

                        <div className="relative mx-auto flex min-h-88 w-full max-w-md items-end justify-center overflow-hidden rounded-4xl bg-brand-blue px-4 pt-6">
                            <div
                                className="pointer-events-none absolute inset-0 opacity-15"
                                style={{
                                    backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
                                    backgroundSize: '22px 22px',
                                }}
                            />
                            <img
                                src={HERO}
                                alt=""
                                className="relative z-10 h-80 w-auto max-w-full object-contain object-bottom sm:h-88"
                                style={{ mixBlendMode: 'screen' }}
                            />

                            <div className="absolute top-8 right-4 z-20 flex flex-col gap-4 sm:right-6">
                                {CARD_IMAGES.map((src, i) => {
                                    const Icon = CARD_ICONS[i];
                                    return (
                                        <div
                                            key={src}
                                            className="flex items-center gap-2 rounded-2xl bg-white p-1.5 shadow-lg"
                                            style={{ transform: `translateX(${i === 1 ? 12 : 0}px)` }}
                                        >
                                            <img src={src} alt="" className="h-12 w-16 rounded-xl object-cover" />
                                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-50 text-brand-orange">
                                                <Icon className="h-4 w-4" />
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 flex w-full max-w-3xl items-start gap-3 rounded-2xl border border-orange-100 bg-orange-50/80 px-4 py-4 sm:px-5">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-orange shadow-sm">
                            <Lightbulb className="h-5 w-5" />
                        </span>
                        <div>
                            <p className="text-sm font-semibold text-brand-blue">{t('setup.loading_tip_title')}</p>
                            <p className="mt-0.5 text-sm leading-relaxed text-gray-600">{t('setup.loading_tip_body')}</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
