import { Form, Head, router } from '@inertiajs/react';
import { KeyRound, Mail } from 'lucide-react';
import { useLayoutEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import InputError from '@/components/common/input-error';
import PasswordInput from '@/components/common/password-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { store } from '@/routes/login';

// ─────────────────────────────────────────────────────────────────────────────
// Types
type BackFace = 'register' | 'forgot';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
};

// ─────────────────────────────────────────────────────────────────────────────
// Estilos reutilizables
// ─────────────────────────────────────────────────────────────────────────────
const CARD_STYLE: React.CSSProperties = {
    background:
        'radial-gradient(ellipse 110% 100% at 60% 30%, rgba(232,0,26,0.13) 0%, rgba(180,0,10,0.09) 40%, rgba(100,0,5,0.06) 70%, rgba(255,255,255,0.94) 100%)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(200,0,15,0.18)',
    boxShadow: '0 12px 50px rgba(180,0,10,0.20), 0 1px 0 rgba(255,255,255,0.7) inset',
};

const INPUT_CLS = cn(
    'h-11 pl-10 transition-all',
    'border-red-100 bg-white/80 placeholder:text-gray-400',
    'focus-visible:border-brand-red focus-visible:bg-white focus-visible:ring-brand-red/20',
);

const BTN_STYLE: React.CSSProperties = {
    background: 'linear-gradient(90deg, #E8001A 0%, #CC0010 50%, #8B0008 100%)',
    boxShadow: '0 4px 18px rgba(200,0,10,0.28)',
};

// ─────────────────────────────────────────────────────────────────────────────
// Google icon
// ─────────────────────────────────────────────────────────────────────────────
function GoogleIcon() {
    return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Cara FRENTE — Login
// ─────────────────────────────────────────────────────────────────────────────
function LoginFace({
    status,
    canResetPassword,
    canRegister,
    onFlipTo,
}: Props & { onFlipTo: (face: BackFace) => void }) {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col gap-0 p-8">
            <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t('auth.welcome_back')}</h1>
                <p className="mt-1 text-sm text-gray-500">{t('auth.signin_subtitle')}</p>
            </div>

            {status && (
                <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-center text-sm font-medium text-green-700">
                    {status}
                </div>
            )}

            {/* Google */}
            <a
                href="/auth/google/redirect"
                className="mb-4 flex h-11 w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md active:scale-[0.98]"
            >
                <GoogleIcon />
                {t('auth.google')}
            </a>

            {/* Divider */}
                <div className="mb-4 flex items-center gap-3">
                    <div className="flex-1 border-t border-gray-300" />
                    <span className="text-xs font-medium text-gray-500">{t('auth.or_email')}</span>
                    <div className="flex-1 border-t border-gray-300" />
                </div>

            <Form action={store.url()} method="post" resetOnSuccess={['password']} className="flex flex-col gap-4">
                {({ processing, errors }) => (
                    <>
                        <div className="space-y-1.5">
                            <Label htmlFor="email" className="text-sm font-medium text-gray-700">{t('auth.email')}</Label>
                            <div className="relative">
                                <Mail className="pointer-events-none absolute top-1/2 left-3.5 z-10 h-4 w-4 -translate-y-1/2 text-brand-red opacity-60" />
                                <Input id="email" type="email" name="email" required autoFocus tabIndex={1} autoComplete="email" placeholder={t('auth.email_placeholder')}
                                    className={cn(INPUT_CLS, errors.email && 'border-red-400 bg-red-50')} />
                            </div>
                            <InputError message={errors.email} />
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-sm font-medium text-gray-700">{t('auth.password')}</Label>
                                {canResetPassword && (
                                    <button type="button" onClick={() => onFlipTo('forgot')}
                                        className="cursor-pointer text-xs font-medium text-brand-red hover:text-red-700">
                                        {t('auth.forgot_password')}
                                    </button>
                                )}
                            </div>
                            <div className="relative">
                                <KeyRound className="pointer-events-none absolute top-1/2 left-3.5 z-10 h-4 w-4 -translate-y-1/2 text-brand-red opacity-60" />
                                <PasswordInput id="password" name="password" required tabIndex={2} autoComplete="current-password" placeholder={t('auth.password_placeholder')}
                                    className={cn(INPUT_CLS, errors.password && 'border-red-400 bg-red-50')} />
                            </div>
                            <InputError message={errors.password} />
                        </div>

                        <div className="flex items-center gap-2.5">
                            <Checkbox id="remember" name="remember" tabIndex={3}
                                className="border-gray-300 data-[state=checked]:border-brand-red data-[state=checked]:bg-brand-red" />
                            <Label htmlFor="remember" className="cursor-pointer text-sm text-gray-600 select-none">{t('auth.remember_me')}</Label>
                        </div>

                        <Button type="submit"
                            className="mt-1 h-11 w-full cursor-pointer rounded-xl text-sm font-semibold tracking-wide text-white transition-all active:scale-[0.98] disabled:opacity-60"
                            style={BTN_STYLE} tabIndex={4} disabled={processing} data-test="login-button">
                            {processing ? <span className="flex items-center gap-2"><Spinner />{t('auth.signing_in')}</span> : t('auth.sign_in')}
                        </Button>

                        {canRegister && (
                            <p className="mt-1 text-center text-sm text-gray-500">
                                {t('auth.no_account')}{' '}
                                <button type="button" onClick={() => onFlipTo('register')}
                                    className="cursor-pointer font-semibold text-brand-red hover:text-red-700">
                                    {t('auth.register_free')}
                                </button>
                            </p>
                        )}
                    </>
                )}
            </Form>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal con flip
// Mismo patrón que register.tsx y forgot-password.tsx:
//   entrada  90° → 0°   (viene desde la derecha)
//   salida   0° → -90°  (sale hacia la izquierda)
// ─────────────────────────────────────────────────────────────────────────────
const FLIP_MS = 540;

export default function Login(props: Props) {
    const { t } = useTranslation();

    // Flip-in en montaje
    const [mounted, setMounted] = useState(false);
    // Flip-out al navegar
    const [exiting, setExiting] = useState(false);

    useLayoutEffect(() => {
        const id = requestAnimationFrame(() => setMounted(true));

        return () => cancelAnimationFrame(id);
    }, []);

    const flipTo = (face: BackFace) => {
        if (exiting) {
            return;
        }

        setExiting(true);
        setTimeout(() => {
            router.visit(face === 'register' ? '/register' : '/forgot-password');
        }, FLIP_MS);
    };

    const cardWrapStyle: React.CSSProperties = {
        // entrada: 90°→0°  |  salida: 0°→-90°  |  inicial (sin transición): 90°
        transform: exiting ? 'rotateY(-90deg)' : mounted ? 'rotateY(0deg)' : 'rotateY(90deg)',
        transition: mounted ? `transform ${FLIP_MS}ms cubic-bezier(0.4, 0, 0.2, 1)` : 'none',
        willChange: 'transform',
    };

    return (
        <>
            <Head title={t('auth.sign_in')} />

            <div style={{ perspective: '1200px' }}>
                <div style={cardWrapStyle}>
                    <div className="w-full rounded-3xl" style={CARD_STYLE}>
                        <LoginFace {...props} onFlipTo={flipTo} />
                    </div>
                </div>
            </div>
        </>
    );
}

Login.layout = {
    title: 'auth.welcome_back',
    description: 'auth.signin_subtitle',
};
