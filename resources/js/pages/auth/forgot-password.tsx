import { Form, Head } from '@inertiajs/react';
import { KeyRound, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import InputError from '@/components/common/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useAuthPageFlip } from '@/hooks/use-auth-page-flip';
import {
    AUTH_BTN_STYLE,
    AUTH_CARD_STYLE,
    AUTH_INPUT_CLS,
    authIconClass,
    authSubtitleClass,
    authTitleClass,
} from '@/lib/auth-styles';
import { cn } from '@/lib/utils';
import { login } from '@/routes';
import { email as forgotStore } from '@/routes/password';

export default function ForgotPassword({ status }: { status?: string }) {
    const { t } = useTranslation();
    const { wrapStyle, cardWrapStyle, flipBack } = useAuthPageFlip(login.url());

    return (
        <>
            <Head title={t('auth.forgot_title')} />

            <div style={wrapStyle}>
                <div style={cardWrapStyle}>
                    <div className="w-full rounded-3xl" style={AUTH_CARD_STYLE}>
                        <div className="flex flex-col gap-0 p-8">
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
                                        style={AUTH_BTN_STYLE}
                                    >
                                        <KeyRound className="h-5 w-5 text-white" />
                                    </span>
                                    <div>
                                        <h1 className={authTitleClass}>{t('auth.forgot_title')}</h1>
                                        <p className={authSubtitleClass}>{t('auth.forgot_subtitle')}</p>
                                    </div>
                                </div>
                            </div>

                            {status && (
                                <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-center text-sm font-medium text-green-700">
                                    {status}
                                </div>
                            )}

                            <Form action={forgotStore.url()} method="post" className="flex flex-col gap-4">
                                {({ processing, errors }) => (
                                    <>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                                                {t('auth.email')}
                                            </Label>
                                            <div className="relative">
                                                <Mail className={cn('pointer-events-none absolute top-1/2 left-3.5 z-10 h-4 w-4 -translate-y-1/2', authIconClass)} />
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    name="email"
                                                    autoComplete="off"
                                                    autoFocus
                                                    placeholder={t('auth.email_placeholder')}
                                                    className={cn(AUTH_INPUT_CLS, errors.email && 'border-red-400 bg-red-50')}
                                                />
                                            </div>
                                            <InputError message={errors.email} />
                                        </div>

                                        <Button
                                            type="submit"
                                            className="mt-2 h-11 w-full cursor-pointer rounded-xl border-0 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
                                            style={AUTH_BTN_STYLE}
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
