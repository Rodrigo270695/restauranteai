import { Form, Head, Link, usePage } from '@inertiajs/react';
import { Mail, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AuthGlassCard } from '@/components/auth/auth-glass-card';
import { Spinner } from '@/components/ui/spinner';
import { AUTH_BTN_STYLE, authSubtitleClass, authTitleClass } from '@/lib/auth-styles';
import { logout } from '@/routes';
import { send } from '@/routes/verification';
import type { User } from '@/types';

export default function VerifyEmail({ status }: { status?: string }) {
    const { t } = useTranslation();
    const { auth } = usePage().props as { auth: { user: User | null } };

    return (
        <>
            <Head title={t('verify_email.title')} />

            <AuthGlassCard className="flex flex-col gap-5">
                <div className="flex flex-col items-center gap-2 text-center">
                    <div className="mb-1 flex h-14 w-14 items-center justify-center rounded-full bg-brand-orange/10">
                        <Mail className="h-7 w-7 text-brand-orange" />
                    </div>

                    <h1 className={authTitleClass}>{t('verify_email.heading')}</h1>
                    <p className={authSubtitleClass}>
                        {t('verify_email.subtitle')}
                        {auth.user && (
                            <span className="mt-1 block font-medium text-gray-700">{auth.user.email}</span>
                        )}
                    </p>
                </div>

                {status === 'verification-link-sent' && (
                    <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-center text-sm font-medium text-green-700">
                        {t('verify_email.resent')}
                    </div>
                )}

                <Form action={send.url()} method="post" className="flex flex-col gap-3">
                    {({ processing }) => (
                        <>
                            <button
                                type="submit"
                                disabled={processing}
                                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-70"
                                style={AUTH_BTN_STYLE}
                            >
                                {processing ? (
                                    <Spinner className="h-4 w-4" />
                                ) : (
                                    <RefreshCw className="h-4 w-4" />
                                )}
                                {t('verify_email.resend')}
                            </button>

                            <Link
                                href={logout()}
                                method="post"
                                as="button"
                                className="cursor-pointer text-center text-sm font-medium text-gray-600 transition-colors hover:text-brand-blue"
                            >
                                {t('verify_email.logout')}
                            </Link>
                        </>
                    )}
                </Form>
            </AuthGlassCard>
        </>
    );
}

VerifyEmail.layout = {
    title: 'verify_email.title',
    description: 'verify_email.subtitle',
};
