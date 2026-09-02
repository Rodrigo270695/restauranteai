import { Brain, Check, Heart, Lightbulb, MapPin, Sparkles, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

const MASCOT = encodeURI('/ChatGPT Image 1 sept 2026, 04_03_03 a.m.png');

const CARD_IMAGES = [
    'https://images.unsplash.com/photo-1594040221058-7a070085357c?auto=format&fit=crop&w=400&q=70',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=70',
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=400&q=70',
];

const CARD_ICONS = [Heart, MapPin, Star];

const STEPS = [
    { title: 'setup.loading_step1_title', desc: 'setup.loading_step1_desc' },
    { title: 'setup.loading_step2_title', desc: 'setup.loading_step2_desc' },
    { title: 'setup.loading_step3_title', desc: 'setup.loading_step3_desc' },
    { title: 'setup.loading_step4_title', desc: 'setup.loading_step4_desc' },
    { title: 'setup.loading_step5_title', desc: 'setup.loading_step5_desc' },
] as const;

const STEP_MS = 900;

type Props = {
    onDone: () => void;
};

export function AiRecommendationsPreparing({ onDone }: Props) {
    const { t } = useTranslation();
    const [activeStep, setActiveStep] = useState(0);
    const [progress, setProgress] = useState(8);

    useEffect(() => {
        const timers: number[] = [];

        STEPS.forEach((_, index) => {
            timers.push(
                window.setTimeout(() => {
                    setActiveStep(index);
                    setProgress(Math.min(92, 12 + index * 20));
                }, index * STEP_MS),
            );
        });

        timers.push(
            window.setTimeout(() => {
                setActiveStep(STEPS.length);
                setProgress(100);
            }, STEPS.length * STEP_MS),
        );

        timers.push(
            window.setTimeout(() => {
                onDone();
            }, STEPS.length * STEP_MS + 600),
        );

        return () => timers.forEach((id) => window.clearTimeout(id));
    }, [onDone]);

    const statusLabel =
        activeStep >= STEPS.length
            ? t('setup.loading_status_done')
            : t(STEPS[Math.min(activeStep, STEPS.length - 1)].title);

    return (
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
            <div className="flex flex-col items-center">
                <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue">
                    <Brain className="size-7" />
                </span>
                <h1 className="mt-4 max-w-2xl text-center text-2xl font-bold tracking-tight text-brand-blue sm:text-3xl">
                    {t('setup.loading_title')}
                </h1>
                <p className="mt-2 max-w-xl text-center text-sm text-gray-500 sm:text-base">
                    {t('setup.loading_subtitle')}
                </p>

                <div className="mt-6 w-full max-w-xl">
                    <div className="h-2.5 overflow-hidden rounded-full bg-orange-100">
                        <div
                            className="h-full rounded-full transition-[width] duration-700 ease-out"
                            style={{
                                width: `${progress}%`,
                                background: 'linear-gradient(90deg, #002366 0%, #FF8C00 100%)',
                            }}
                        />
                    </div>
                    <p className="mt-2 text-center text-sm font-semibold text-brand-orange">
                        {statusLabel}... {progress}%
                    </p>
                </div>

                <div className="mt-10 grid w-full items-center gap-10 lg:grid-cols-[1fr_1.05fr]">
                    <ol className="relative flex flex-col gap-5">
                        <div className="absolute top-3 bottom-3 left-4 border-l-2 border-dashed border-brand-orange/30" />
                        {STEPS.map((step, index) => {
                            const done = activeStep > index;
                            const current = activeStep === index;

                            return (
                                <li key={step.title} className="relative z-10 flex gap-3">
                                    <span
                                        className={cn(
                                            'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 bg-white text-[11px] font-bold',
                                            done && 'border-brand-orange bg-brand-orange text-white',
                                            current && !done && 'border-dashed border-brand-orange text-brand-orange',
                                            !done && !current && 'border-gray-200 text-gray-300',
                                        )}
                                    >
                                        {done ? <Check className="h-4 w-4" strokeWidth={3} /> : index + 1}
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
                                        <p className="text-xs text-gray-500">{t(step.desc)}</p>
                                    </div>
                                </li>
                            );
                        })}
                    </ol>

                    <div className="relative mx-auto flex min-h-72 w-full max-w-md items-end justify-center">
                        <img
                            src={MASCOT}
                            alt=""
                            className="relative z-10 h-64 w-auto max-w-full -scale-x-100 object-contain object-bottom sm:h-72"
                        />
                        <div className="absolute top-2 right-0 z-20 hidden flex-col gap-3 sm:flex">
                            {CARD_IMAGES.map((src, i) => {
                                const Icon = CARD_ICONS[i];
                                return (
                                    <div
                                        key={src}
                                        className="flex items-center gap-2 rounded-2xl bg-white p-1.5 shadow-lg ring-1 ring-gray-100"
                                        style={{ transform: `translateX(${i === 1 ? 10 : 0}px)` }}
                                    >
                                        <img src={src} alt="" className="h-11 w-14 rounded-xl object-cover" />
                                        <span className="flex size-8 items-center justify-center rounded-full bg-orange-50 text-brand-orange">
                                            <Icon className="size-4" />
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="mt-10 flex w-full max-w-3xl items-start gap-3 rounded-2xl border border-orange-100 bg-orange-50/80 px-4 py-4 sm:px-5">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-orange shadow-sm">
                        <Lightbulb className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-brand-blue">{t('setup.loading_tip_title')}</p>
                        <p className="mt-0.5 text-sm leading-relaxed text-gray-600">{t('setup.loading_tip_body')}</p>
                    </div>
                    <Sparkles className="mt-1 hidden size-4 shrink-0 text-brand-orange sm:block" />
                </div>
            </div>
        </div>
    );
}
