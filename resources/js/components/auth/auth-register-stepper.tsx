import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

type Step = 1 | 2 | 3;

const STEPS: { n: Step; key: string }[] = [
    { n: 1, key: 'auth.step_account' },
    { n: 2, key: 'auth.step_preferences' },
    { n: 3, key: 'auth.step_done' },
];

export function AuthRegisterStepper({ current }: { current: Step }) {
    const { t } = useTranslation();

    return (
        <ol className="flex items-center gap-0">
            {STEPS.map((step, i) => {
                const done = current > step.n;
                const active = current === step.n;

                return (
                    <li key={step.n} className="flex min-w-0 flex-1 items-center">
                        <div className="flex min-w-0 flex-col items-center gap-1.5">
                            <span
                                className={cn(
                                    'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors',
                                    active && 'bg-brand-blue text-white shadow-[0_4px_12px_rgba(0,35,102,0.28)]',
                                    done && 'bg-brand-blue text-white',
                                    !active && !done && 'bg-gray-200 text-gray-500',
                                )}
                            >
                                {step.n}
                            </span>
                            <span
                                className={cn(
                                    'max-w-22 truncate text-center text-[11px] font-semibold',
                                    active ? 'text-brand-blue' : done ? 'text-brand-blue' : 'text-gray-400',
                                )}
                            >
                                {t(step.key)}
                            </span>
                        </div>
                        {i < STEPS.length - 1 && (
                            <div
                                className={cn(
                                    'mb-5 h-0.5 min-w-3 flex-1 rounded-full',
                                    current > step.n ? 'bg-brand-orange' : 'bg-gray-200',
                                )}
                            />
                        )}
                    </li>
                );
            })}
        </ol>
    );
}
