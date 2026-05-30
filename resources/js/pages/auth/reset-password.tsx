import { Form, Head } from '@inertiajs/react';
import { KeyRound, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AuthGlassCard } from '@/components/auth/auth-glass-card';
import InputError from '@/components/common/input-error';
import PasswordInput from '@/components/common/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { update } from '@/routes/password';

type Props = {
    token: string;
    email: string;
};

export default function ResetPassword({ token, email }: Props) {
    const { t } = useTranslation();

    return (
        <>
            <Head title={t('auth.reset_title')} />

            <AuthGlassCard>
                <div className="mb-6 text-center">
                    <h1 className={authTitleClass}>{t('auth.reset_title')}</h1>
                    <p className={authSubtitleClass}>{t('auth.reset_subtitle')}</p>
                </div>

                <Form
                    action={update.url()}
                    method="post"
                    transform={(data) => ({ ...data, token, email })}
                    resetOnSuccess={['password', 'password_confirmation']}
                    className="flex flex-col gap-4"
                >
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
                                        autoComplete="email"
                                        value={email}
                                        readOnly
                                        className={cn(AUTH_INPUT_CLS, 'cursor-not-allowed opacity-80')}
                                    />
                                </div>
                                <InputError message={errors.email} />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                                    {t('auth.password')}
                                </Label>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    autoComplete="new-password"
                                    autoFocus
                                    placeholder={t('auth.password_placeholder')}
                                    className={cn(AUTH_INPUT_CLS, errors.password && 'border-red-400 bg-red-50')}
                                    leftIcon={<KeyRound className={cn('h-4 w-4', authIconClass)} />}
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="password_confirmation" className="text-sm font-medium text-gray-700">
                                    {t('auth.confirm_password')}
                                </Label>
                                <PasswordInput
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    autoComplete="new-password"
                                    placeholder={t('auth.confirm_password_placeholder')}
                                    className={cn(AUTH_INPUT_CLS, errors.password_confirmation && 'border-red-400 bg-red-50')}
                                    leftIcon={<KeyRound className={cn('h-4 w-4', authIconClass)} />}
                                />
                                <InputError message={errors.password_confirmation} />
                            </div>

                            <Button
                                type="submit"
                                className="mt-1 h-11 w-full cursor-pointer rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
                                style={AUTH_BTN_STYLE}
                                disabled={processing}
                                data-test="reset-password-button"
                            >
                                {processing && <Spinner />}
                                {t('auth.reset_submit')}
                            </Button>
                        </>
                    )}
                </Form>
            </AuthGlassCard>
        </>
    );
}

ResetPassword.layout = {
    title: 'auth.reset_title',
    description: 'auth.reset_subtitle',
};
