import { Form, Head } from '@inertiajs/react';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AuthGlassCard } from '@/components/auth/auth-glass-card';
import InputError from '@/components/common/input-error';
import PasswordInput from '@/components/common/password-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
    AUTH_BTN_STYLE,
    AUTH_INPUT_CLS,
    authIconClass,
    authSubtitleClass,
    authTitleClass,
} from '@/lib/auth-styles';
import { cn } from '@/lib/utils';
import { store } from '@/routes/password/confirm';

export default function ConfirmPassword() {
    const { t } = useTranslation();

    return (
        <>
            <Head title={t('auth.confirm_title')} />

            <AuthGlassCard>
                <div className="mb-6 flex flex-col items-center gap-3 text-center">
                    <span
                        className="flex h-12 w-12 items-center justify-center rounded-xl"
                        style={AUTH_BTN_STYLE}
                    >
                        <ShieldCheck className="h-6 w-6 text-white" />
                    </span>
                    <div>
                        <h1 className={authTitleClass}>{t('auth.confirm_title')}</h1>
                        <p className={authSubtitleClass}>{t('auth.confirm_subtitle')}</p>
                    </div>
                </div>

                <Form action={store.url()} method="post" resetOnSuccess={['password']} className="flex flex-col gap-4">
                    {({ processing, errors }) => (
                        <>
                            <div className="space-y-1.5">
                                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                                    {t('auth.password')}
                                </Label>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    placeholder={t('auth.password_placeholder')}
                                    autoComplete="current-password"
                                    autoFocus
                                    className={cn(AUTH_INPUT_CLS, errors.password && 'border-red-400 bg-red-50')}
                                    leftIcon={<KeyRound className={cn('h-4 w-4', authIconClass)} />}
                                />
                                <InputError message={errors.password} />
                            </div>

                            <Button
                                type="submit"
                                className="h-11 w-full cursor-pointer rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
                                style={AUTH_BTN_STYLE}
                                disabled={processing}
                                data-test="confirm-password-button"
                            >
                                {processing && <Spinner />}
                                {t('auth.confirm_submit')}
                            </Button>
                        </>
                    )}
                </Form>
            </AuthGlassCard>
        </>
    );
}

ConfirmPassword.layout = {
    title: 'auth.confirm_title',
    description: 'auth.confirm_subtitle',
};
