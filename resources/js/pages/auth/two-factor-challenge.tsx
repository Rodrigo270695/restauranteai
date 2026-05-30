import { Form, Head, setLayoutProps } from '@inertiajs/react';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthGlassCard } from '@/components/auth/auth-glass-card';
import InputError from '@/components/common/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from '@/components/ui/input-otp';
import { OTP_MAX_LENGTH } from '@/hooks/use-two-factor-auth';
import {
    AUTH_BTN_STYLE,
    AUTH_INPUT_CLS,
    authLinkAccentClass,
    authSubtitleClass,
    authTitleClass,
} from '@/lib/auth-styles';
import { cn } from '@/lib/utils';
import { store } from '@/routes/two-factor/login';

export default function TwoFactorChallenge() {
    const { t } = useTranslation();
    const [showRecoveryInput, setShowRecoveryInput] = useState<boolean>(false);
    const [code, setCode] = useState<string>('');

    const authConfigContent = useMemo<{
        title: string;
        description: string;
        toggleText: string;
    }>(() => {
        if (showRecoveryInput) {
            return {
                title: t('auth.two_factor_recovery_title'),
                description: t('auth.two_factor_recovery_desc'),
                toggleText: t('auth.two_factor_use_code'),
            };
        }

        return {
            title: t('auth.two_factor_title'),
            description: t('auth.two_factor_desc'),
            toggleText: t('auth.two_factor_use_recovery'),
        };
    }, [showRecoveryInput, t]);

    setLayoutProps({
        title: authConfigContent.title,
        description: authConfigContent.description,
    });

    const toggleRecoveryMode = (clearErrors: () => void): void => {
        setShowRecoveryInput(!showRecoveryInput);
        clearErrors();
        setCode('');
    };

    return (
        <>
            <Head title={t('auth.two_factor_title')} />

            <AuthGlassCard>
                <div className="mb-6 flex flex-col items-center gap-3 text-center">
                    <span
                        className="flex h-12 w-12 items-center justify-center rounded-xl"
                        style={AUTH_BTN_STYLE}
                    >
                        <ShieldCheck className="h-6 w-6 text-white" />
                    </span>
                    <div>
                        <h1 className={authTitleClass}>{authConfigContent.title}</h1>
                        <p className={authSubtitleClass}>{authConfigContent.description}</p>
                    </div>
                </div>

                <Form
                    action={store.url()}
                    method="post"
                    className="flex flex-col gap-4"
                    resetOnError
                    resetOnSuccess={!showRecoveryInput}
                >
                    {({ errors, processing, clearErrors }) => (
                        <>
                            {showRecoveryInput ? (
                                <div className="space-y-1.5">
                                    <Input
                                        name="recovery_code"
                                        type="text"
                                        placeholder={t('auth.two_factor_recovery_placeholder')}
                                        autoFocus={showRecoveryInput}
                                        required
                                        className={cn(AUTH_INPUT_CLS, 'pl-3', errors.recovery_code && 'border-red-400 bg-red-50')}
                                    />
                                    <InputError message={errors.recovery_code} />
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center space-y-3 text-center">
                                    <div className="flex w-full items-center justify-center">
                                        <InputOTP
                                            name="code"
                                            maxLength={OTP_MAX_LENGTH}
                                            value={code}
                                            onChange={(value) => setCode(value)}
                                            disabled={processing}
                                            pattern={REGEXP_ONLY_DIGITS}
                                            autoFocus
                                        >
                                            <InputOTPGroup>
                                                {Array.from({ length: OTP_MAX_LENGTH }, (_, index) => (
                                                    <InputOTPSlot
                                                        key={index}
                                                        index={index}
                                                        className="border-orange-100 focus:border-brand-orange focus:ring-brand-orange/25"
                                                    />
                                                ))}
                                            </InputOTPGroup>
                                        </InputOTP>
                                    </div>
                                    <InputError message={errors.code} />
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="h-11 w-full cursor-pointer rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
                                style={AUTH_BTN_STYLE}
                                disabled={processing}
                            >
                                {t('auth.two_factor_continue')}
                            </Button>

                            <p className="text-center text-sm text-gray-500">
                                {t('auth.two_factor_or')}{' '}
                                <button
                                    type="button"
                                    className={authLinkAccentClass}
                                    onClick={() => toggleRecoveryMode(clearErrors)}
                                >
                                    {authConfigContent.toggleText}
                                </button>
                            </p>
                        </>
                    )}
                </Form>
            </AuthGlassCard>
        </>
    );
}
