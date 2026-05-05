import { Form, Head, Link, usePage } from '@inertiajs/react';
import { Mail, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Spinner } from '@/components/ui/spinner';
import { logout } from '@/routes';
import { send } from '@/routes/verification';
import type { User } from '@/types';

export default function VerifyEmail({ status }: { status?: string }) {
    const { t } = useTranslation();
    const { auth } = usePage().props as { auth: { user: User | null } };

    return (
        <>
            <Head title={t('verify_email.title')} />

            <div className="flex flex-col items-center gap-2 text-center">
                <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-brand-red/10">
                    <Mail className="h-7 w-7 text-brand-red" />
                </div>

                <h1 className="text-xl font-bold text-gray-800">
                    {t('verify_email.heading')}
                </h1>
                <p className="text-sm text-gray-500">
                    {t('verify_email.subtitle')}
                    {auth.user && (
                        <span className="block font-medium text-gray-700">{auth.user.email}</span>
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
                            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-70"
                            style={{ background: 'linear-gradient(90deg,#E8001A,#8B0008)' }}
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
                            className="cursor-pointer text-center text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
                        >
                            {t('verify_email.logout')}
                        </Link>
                    </>
                )}
            </Form>
        </>
    );
}

VerifyEmail.layout = {
    title: 'Verificar correo',
    description: 'Revisa tu bandeja de entrada y haz clic en el enlace de verificación.',
};
