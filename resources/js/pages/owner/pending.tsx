import { Head, Link } from '@inertiajs/react';
import { Building2, CheckCircle2, Clock, Mail, Phone, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

const BTN_STYLE: React.CSSProperties = {
    background: 'linear-gradient(90deg, #E8001A 0%, #CC0010 50%, #8B0008 100%)',
};

type Status = 'pending' | 'approved' | 'rejected';

interface Props {
    user: { name: string; email: string };
    restaurant: {
        business_name: string;
        city: string | null;
        phone: string | null;
        status: Status;
        rejection_reason: string | null;
        submitted_at: string | null;
    } | null;
}

function StatusBadge({ status }: { status: Status }) {
    const { t } = useTranslation();

    const config = {
        pending:  { icon: Clock,        color: 'text-amber-600 bg-amber-50 border-amber-200',  label: t('owner_pending.status_pending') },
        approved: { icon: CheckCircle2, color: 'text-green-600 bg-green-50 border-green-200',  label: t('owner_pending.status_approved') },
        rejected: { icon: XCircle,      color: 'text-red-600 bg-red-50 border-red-200',        label: t('owner_pending.status_rejected') },
    }[status];

    const Icon = config.icon;

    return (
        <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold', config.color)}>
            <Icon className="h-4 w-4" />
            {config.label}
        </span>
    );
}

export default function OwnerPending({ user, restaurant }: Props) {
    const { t } = useTranslation();
    const firstName = user.name.split(' ')[0];

    const submittedDate = restaurant?.submitted_at
        ? new Date(restaurant.submitted_at).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })
        : null;

    const steps = [
        t('owner_pending.step1'),
        t('owner_pending.step2'),
        t('owner_pending.step3'),
    ];

    return (
        <>
            <Head title={t('owner_pending.title')} />

            <div
                className="min-h-screen"
                style={{ background: 'linear-gradient(135deg, #FFF8F0 0%, #FFFFFF 40%, #FFF0E8 70%, #FFE4D8 100%)' }}
            >
                {/* Header */}
                <header className="flex items-center px-6 py-4">
                    <img src="/logo.png" alt="DiscoverLambo" className="h-10 w-auto" />
                </header>

                <div className="mx-auto max-w-lg px-4 py-8">
                    {/* Ícono y título */}
                    <div className="mb-8 text-center">
                        <div
                            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
                            style={BTN_STYLE}
                        >
                            <Building2 className="h-8 w-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Hola, <span className="text-brand-red">{firstName}</span>
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">{t('owner_pending.subtitle')}</p>
                    </div>

                    {/* Tarjeta de estado */}
                    <div
                        className="mb-4 rounded-2xl p-6"
                        style={{
                            background: 'rgba(255,255,255,0.95)',
                            border: '1px solid rgba(200,0,15,0.12)',
                            boxShadow: '0 8px 30px rgba(180,0,10,0.10)',
                        }}
                    >
                        <div className="mb-4 flex items-start justify-between gap-3">
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                    {t('owner_pending.your_restaurant')}
                                </p>
                                <h2 className="mt-0.5 text-lg font-bold text-gray-900">
                                    {restaurant?.business_name ?? '—'}
                                </h2>
                                {restaurant?.city && (
                                    <p className="text-sm text-gray-500">{restaurant.city}</p>
                                )}
                            </div>
                            <StatusBadge status={restaurant?.status ?? 'pending'} />
                        </div>

                        {restaurant?.phone && (
                            <div className="mb-3 flex items-center gap-2 text-sm text-gray-500">
                                <Phone className="h-4 w-4 text-brand-red opacity-60" />
                                {restaurant.phone}
                            </div>
                        )}

                        {submittedDate && (
                            <p className="text-xs text-gray-400">
                                {t('owner_pending.submitted')} {submittedDate}
                            </p>
                        )}

                        {/* Motivo de rechazo */}
                        {restaurant?.status === 'rejected' && restaurant.rejection_reason && (
                            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
                                <p className="text-xs font-semibold text-red-700">
                                    {t('owner_pending.rejection_title')}
                                </p>
                                <p className="mt-1 text-sm text-red-600">{restaurant.rejection_reason}</p>
                            </div>
                        )}
                    </div>

                    {/* Pasos de aprobación */}
                    {restaurant?.status === 'pending' && (
                        <div
                            className="mb-4 rounded-2xl p-6"
                            style={{
                                background: 'rgba(255,255,255,0.95)',
                                border: '1px solid rgba(200,0,15,0.12)',
                                boxShadow: '0 8px 30px rgba(180,0,10,0.10)',
                            }}
                        >
                            <h3 className="mb-4 text-sm font-semibold text-gray-700">
                                {t('owner_pending.what_next_title')}
                            </h3>
                            <ol className="flex flex-col gap-3">
                                {steps.map((step, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <span
                                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                                            style={BTN_STYLE}
                                        >
                                            {i + 1}
                                        </span>
                                        <p className="pt-0.5 text-sm text-gray-600">{step}</p>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    )}

                    {/* Correo electrónico */}
                    <div
                        className="rounded-2xl p-5"
                        style={{
                            background: 'rgba(255,255,255,0.95)',
                            border: '1px solid rgba(200,0,15,0.12)',
                            boxShadow: '0 8px 30px rgba(180,0,10,0.10)',
                        }}
                    >
                        <div className="flex items-start gap-3">
                            <div
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                                style={BTN_STYLE}
                            >
                                <Mail className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-800">{t('owner_pending.check_email')}</p>
                                <p className="mt-0.5 text-xs text-gray-500">
                                    {t('owner_pending.check_email_desc')}{' '}
                                    <span className="font-medium text-gray-700">{user.email}</span>{' '}
                                    {t('owner_pending.check_email_desc2')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <p className="mt-6 text-center text-xs text-gray-400">
                        {t('owner_pending.contact_note')}
                    </p>
                </div>
            </div>
        </>
    );
}
