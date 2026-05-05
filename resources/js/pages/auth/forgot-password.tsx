import { Form, Head, router } from '@inertiajs/react';
import { KeyRound, Mail } from 'lucide-react';
import { useLayoutEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import InputError from '@/components/common/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { login } from '@/routes';
import { email as forgotStore } from '@/routes/password';

// ─── Estilos compartidos con login.tsx ───────────────────────────────────────
const CARD_STYLE: React.CSSProperties = {
    background:
        'radial-gradient(ellipse 110% 100% at 60% 30%, rgba(232,0,26,0.13) 0%, rgba(180,0,10,0.09) 40%, rgba(100,0,5,0.06) 70%, rgba(255,255,255,0.94) 100%)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(200,0,15,0.18)',
    boxShadow: '0 12px 50px rgba(180,0,10,0.20), 0 1px 0 rgba(255,255,255,0.7) inset',
};

const BTN_STYLE: React.CSSProperties = {
    background: 'linear-gradient(90deg, #E8001A 0%, #CC0010 50%, #8B0008 100%)',
    boxShadow: '0 4px 18px rgba(200,0,10,0.28)',
};

const INPUT_CLS = cn(
    'h-11 pl-10 transition-all',
    'border-red-100 bg-white/80 placeholder:text-gray-400',
    'focus-visible:border-brand-red focus-visible:bg-white focus-visible:ring-brand-red/20',
);

const FLIP_MS = 540;

// ─── Hook de flip cross-page ─────────────────────────────────────────────────
function usePageFlip(backUrl: string) {
    const [mounted, setMounted] = useState(false);
    const [exiting, setExiting] = useState(false);

    useLayoutEffect(() => {
        const id = requestAnimationFrame(() => setMounted(true));

        return () => cancelAnimationFrame(id);
    }, []);

    const flipBack = () => {
        if (exiting) {
            return;
        }

        setExiting(true);
        setTimeout(() => router.visit(backUrl), FLIP_MS);
    };

    const wrapStyle: React.CSSProperties = { perspective: '1200px' };

    const cardWrapStyle: React.CSSProperties = {
        transform: exiting ? 'rotateY(-90deg)' : mounted ? 'rotateY(0deg)' : 'rotateY(90deg)',
        transition: mounted ? `transform ${FLIP_MS}ms cubic-bezier(0.4,0,0.2,1)` : 'none',
        willChange: 'transform',
    };

    return { wrapStyle, cardWrapStyle, flipBack };
}

export default function ForgotPassword({ status }: { status?: string }) {
    const { t } = useTranslation();
    const { wrapStyle, cardWrapStyle, flipBack } = usePageFlip(login.url());

    return (
        <>
            <Head title={t('auth.forgot_title')} />

            {/* Contenedor de perspectiva 3D */}
            <div style={wrapStyle}>
                <div style={cardWrapStyle}>
                    {/* Glass card */}
                    <div style={CARD_STYLE} className="rounded-2xl">
                        <div className="flex flex-col gap-0 p-8">

                            {/* Header con botón volver */}
                            <div className="mb-6">
                                <button
                                    type="button"
                                    onClick={flipBack}
                                    className="mb-4 flex cursor-pointer items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800"
                                >
                                    ← {t('auth.back_to_login')}
                                </button>
                                <div className="flex items-center gap-3">
                                    <span
                                        className="flex h-10 w-10 items-center justify-center rounded-xl"
                                        style={BTN_STYLE}
                                    >
                                        <KeyRound className="h-5 w-5 text-white" />
                                    </span>
                                    <div>
                                        <h1 className="text-xl font-bold text-gray-900">{t('auth.forgot_title')}</h1>
                                        <p className="text-sm text-gray-500">{t('auth.forgot_subtitle')}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Status */}
                            {status && (
                                <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-center text-sm font-medium text-green-700">
                                    {status}
                                </div>
                            )}

                            {/* Form */}
                            <Form action={forgotStore.url()} method="post" className="flex flex-col gap-4">
                                {({ processing, errors }) => (
                                    <>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                                                {t('auth.email')}
                                            </Label>
                                            <div className="relative">
                                                <Mail className="pointer-events-none absolute top-1/2 left-3.5 z-10 h-4 w-4 -translate-y-1/2 text-brand-red opacity-60" />
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    name="email"
                                                    autoComplete="off"
                                                    autoFocus
                                                    placeholder={t('auth.email_placeholder')}
                                                    className={cn(INPUT_CLS, errors.email && 'border-red-400 bg-red-50')}
                                                />
                                            </div>
                                            <InputError message={errors.email} />
                                        </div>

                                        <Button
                                            type="submit"
                                            className="mt-2 h-11 w-full cursor-pointer rounded-xl border-0 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]"
                                            style={BTN_STYLE}
                                            disabled={processing}
                                            data-test="email-password-reset-link-button"
                                        >
                                            {processing && <Spinner />}
                                            {t('auth.send_link')}
                                        </Button>
                                    </>
                                )}
                            </Form>

                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

ForgotPassword.layout = {
    title: 'auth.forgot_title',
    description: 'auth.forgot_subtitle',
};
