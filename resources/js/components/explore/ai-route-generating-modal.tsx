import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Check, Lightbulb, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

const MASCOT = encodeURI('/ChatGPT Image 1 sept 2026, 04_03_03 a.m.png');

const STEPS = [
    { titleKey: 'explore.ai_gen_step1', descKey: 'explore.ai_gen_step1_desc' },
    { titleKey: 'explore.ai_gen_step2', descKey: 'explore.ai_gen_step2_desc' },
    { titleKey: 'explore.ai_gen_step3', descKey: 'explore.ai_gen_step3_desc' },
    { titleKey: 'explore.ai_gen_step4', descKey: 'explore.ai_gen_step4_desc' },
    { titleKey: 'explore.ai_gen_step5', descKey: 'explore.ai_gen_step5_desc' },
] as const;

type Props = {
    open: boolean;
};

export function AiRouteGeneratingModal({ open }: Props) {
    const { t } = useTranslation();
    const [step, setStep] = useState(0);
    const [percent, setPercent] = useState(8);

    useEffect(() => {
        if (!open) {
            setStep(0);
            setPercent(8);
            return;
        }

        const tick = window.setInterval(() => {
            setStep((current) => Math.min(current + 1, STEPS.length - 1));
            setPercent((current) => Math.min(current + 14, 92));
        }, 700);

        return () => window.clearInterval(tick);
    }, [open]);

    return (
        <DialogPrimitive.Root open={open}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-[120] bg-brand-blue/45 backdrop-blur-[2px]" />
                <DialogPrimitive.Content
                    aria-describedby={undefined}
                    className="fixed top-1/2 left-1/2 z-[130] w-[min(100%-1.5rem,44rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border border-white/60 bg-white p-6 shadow-2xl sm:p-8"
                    onPointerDownOutside={(e) => e.preventDefault()}
                    onEscapeKeyDown={(e) => e.preventDefault()}
                >
                    <DialogPrimitive.Title className="sr-only">
                        {t('explore.ai_gen_title')}
                    </DialogPrimitive.Title>

                    <div className="flex flex-col items-center text-center">
                        <span className="flex size-14 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue">
                            <MapPin className="size-7" />
                        </span>
                        <h2 className="mt-4 text-xl font-bold text-brand-blue sm:text-2xl">
                            {t('explore.ai_gen_title')}
                        </h2>
                        <p className="mt-2 max-w-md text-sm text-gray-500">{t('explore.ai_gen_subtitle')}</p>
                    </div>

                    <div className="mt-6">
                        <div className="h-2 overflow-hidden rounded-full bg-orange-100">
                            <div
                                className="h-full rounded-full bg-brand-orange transition-all duration-500"
                                style={{ width: `${percent}%` }}
                            />
                        </div>
                        <p className="mt-2 text-sm font-semibold text-brand-orange">
                            {t('explore.ai_gen_progress', { percent })}
                        </p>
                    </div>

                    <div className="mt-6 grid gap-6 sm:grid-cols-[1fr_12rem] sm:items-center">
                        <ol className="space-y-3 text-left">
                            {STEPS.map((item, index) => {
                                const done = index < step;
                                const active = index === step;

                                return (
                                    <li key={item.titleKey} className="flex gap-3">
                                        <span
                                            className={cn(
                                                'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold',
                                                done && 'border-brand-orange bg-brand-orange text-white',
                                                active && 'border-dashed border-brand-orange text-brand-orange',
                                                !done && !active && 'border-gray-200 text-gray-300',
                                            )}
                                        >
                                            {done ? <Check className="size-3.5" /> : index + 1}
                                        </span>
                                        <div>
                                            <p
                                                className={cn(
                                                    'text-sm font-semibold',
                                                    done || active ? 'text-brand-blue' : 'text-gray-400',
                                                )}
                                            >
                                                {t(item.titleKey)}
                                            </p>
                                            <p className="text-xs text-gray-500">{t(item.descKey)}</p>
                                        </div>
                                    </li>
                                );
                            })}
                        </ol>
                        <div className="hidden justify-center sm:flex">
                            <img
                                src={MASCOT}
                                alt=""
                                className="h-52 w-auto -scale-x-100 object-contain object-bottom drop-shadow-md"
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex items-start gap-3 rounded-2xl bg-orange-50 px-4 py-3 text-left">
                        <Lightbulb className="mt-0.5 size-5 shrink-0 text-brand-orange" />
                        <div>
                            <p className="text-sm font-bold text-brand-blue">{t('explore.ai_gen_tip_title')}</p>
                            <p className="text-xs leading-relaxed text-gray-600">{t('explore.ai_gen_tip_body')}</p>
                        </div>
                    </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}
