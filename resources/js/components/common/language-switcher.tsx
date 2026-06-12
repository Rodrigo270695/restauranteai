import type { HTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

const LANGS = [
    { code: 'es', label: 'ES', flag: '🇵🇪' },
    { code: 'en', label: 'EN', flag: '🇺🇸' },
] as const;

interface LanguageSwitcherProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'light' | 'dark';
    compact?: boolean;
}

export default function LanguageSwitcher({
    variant = 'light',
    compact = false,
    className,
    ...props
}: LanguageSwitcherProps) {
    const { i18n } = useTranslation();

    const handleChange = (code: string) => {
        i18n.changeLanguage(code);
        localStorage.setItem('lang', code);
    };

    const isActive = (code: string) => i18n.language === code;

    if (compact) {
        return (
            <div
                className={cn(
                    'inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 p-1',
                    className,
                )}
                {...props}
            >
                {LANGS.map(({ code, label, flag }) => (
                    <button
                        key={code}
                        type="button"
                        onClick={() => handleChange(code)}
                        className={cn(
                            'flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-all',
                            isActive(code)
                                ? 'bg-white/15 text-white'
                                : 'text-white/55 hover:bg-white/10 hover:text-white/85',
                        )}
                        aria-label={`Cambiar idioma a ${label}`}
                    >
                        <span className="text-sm leading-none">{flag}</span>
                        <span>{label}</span>
                    </button>
                ))}
            </div>
        );
    }

    return (
        <div
            className={cn(
                'inline-flex gap-1 rounded-lg p-1',
                variant === 'dark'
                    ? 'bg-white/10'
                    : 'bg-neutral-100 dark:bg-neutral-800',
                className,
            )}
            {...props}
        >
            {LANGS.map(({ code, label, flag }) => (
                <button
                    key={code}
                    type="button"
                    onClick={() => handleChange(code)}
                    className={cn(
                        'flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-all',
                        isActive(code)
                            ? variant === 'dark'
                                ? 'bg-white/20 font-semibold text-white shadow-sm'
                                : 'bg-white font-semibold text-gray-900 shadow-xs dark:bg-neutral-700 dark:text-neutral-100'
                            : variant === 'dark'
                                ? 'text-white/60 hover:bg-white/10 hover:text-white'
                                : 'text-neutral-500 hover:bg-neutral-200/60 hover:text-black dark:text-neutral-400 dark:hover:bg-neutral-700/60',
                    )}
                    aria-label={`Cambiar idioma a ${label}`}
                >
                    <span className="-ml-0.5 text-base leading-none">{flag}</span>
                    <span>{label}</span>
                </button>
            ))}
        </div>
    );
}
