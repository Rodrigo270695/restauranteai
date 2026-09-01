import { cn } from '@/lib/utils';

/** Tarjeta glass (login, register dueño, forgot, etc.) */
export const AUTH_CARD_STYLE: React.CSSProperties = {
    background:
        'radial-gradient(ellipse 110% 100% at 60% 30%, rgba(255,140,0,0.12) 0%, rgba(0,35,102,0.08) 45%, rgba(255,255,255,0.96) 100%)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(0,35,102,0.14)',
    boxShadow: '0 12px 50px rgba(0,35,102,0.12), 0 1px 0 rgba(255,255,255,0.7) inset',
};

export const AUTH_BTN_STYLE: React.CSSProperties = {
    background: 'linear-gradient(90deg, #ff9f2b 0%, #FF8C00 50%, #e67e00 100%)',
    boxShadow: '0 4px 18px rgba(255, 140, 0, 0.32)',
};

/** CTA del registro turista: azul → naranja, como la referencia. */
export const AUTH_REGISTER_BTN_STYLE: React.CSSProperties = {
    background: 'linear-gradient(90deg, #002366 0%, #FF8C00 100%)',
    boxShadow: '0 4px 18px rgba(0, 35, 102, 0.28)',
};

export const AUTH_BTN_GHOST: React.CSSProperties = {
    background: 'rgba(0,35,102,0.06)',
    border: '1.5px solid rgba(0,35,102,0.14)',
};

export const AUTH_INPUT_CLS = cn(
    'h-11 rounded-xl pl-10 transition-all',
    'border-orange-100 bg-white/80 placeholder:text-gray-400',
    'focus-visible:border-brand-orange focus-visible:bg-white focus-visible:ring-brand-orange/25',
);

export const AUTH_FLIP_MS = 540;

export const authIconClass = 'text-brand-orange opacity-70';

export const authLinkAccentClass =
    'cursor-pointer font-semibold text-brand-orange hover:text-brand-orange-dark';

export const authLinkBlueClass =
    'cursor-pointer font-semibold text-brand-blue hover:text-brand-blue-light';

export const authTitleClass = 'text-2xl font-bold tracking-tight text-brand-blue';

export const authSubtitleClass = 'mt-1 text-sm text-gray-500';
