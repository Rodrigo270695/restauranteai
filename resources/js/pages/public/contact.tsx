import { Form, Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    CheckCircle,
    ClockCountdown,
    EnvelopeSimple,
    PaperPlaneTilt,
    Phone,
    Storefront,
} from '@phosphor-icons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { register } from '@/routes';

const BTN_PRIMARY: React.CSSProperties = {
    backgroundColor: '#ffa300',
    boxShadow: '0 8px 24px rgba(255, 163, 0, 0.35)',
};

const FIELD_CLASS =
    'mt-1.5 h-11 rounded-xl border-gray-200 bg-slate-50/80 text-gray-900 shadow-none transition focus-visible:border-brand-blue focus-visible:bg-white focus-visible:ring-[3px] focus-visible:ring-brand-blue/15';

const SELECT_CLASS =
    'mt-1.5 flex h-11 w-full rounded-xl border border-gray-200 bg-slate-50/80 px-3.5 text-sm text-gray-900 shadow-none transition focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-[3px] focus:ring-brand-blue/15';

type InquiryType = 'integrate_restaurant' | 'approval_help' | 'general';

type Props = {
    defaults: {
        name: string;
        email: string;
        type: InquiryType;
    };
    supportEmail: string;
    canRegister?: boolean;
};

const TYPE_OPTIONS: InquiryType[] = ['integrate_restaurant', 'approval_help', 'general'];

function InfoCard({
    icon,
    iconBg,
    title,
    children,
}: {
    icon: React.ReactNode;
    iconBg: string;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-2xl border border-gray-100/90 bg-white p-6 shadow-[0_4px_24px_rgba(7,53,119,0.06)] transition hover:border-brand-blue/10 hover:shadow-[0_8px_32px_rgba(7,53,119,0.08)]">
            <div
                className="flex size-12 items-center justify-center rounded-xl"
                style={{ backgroundColor: iconBg }}
            >
                {icon}
            </div>
            <h2 className="mt-4 text-lg font-bold text-brand-blue">{title}</h2>
            <div className="mt-2 text-sm leading-relaxed text-gray-600">{children}</div>
        </div>
    );
}

export default function ContactPage({ defaults, supportEmail, canRegister = true }: Props) {
    const { t } = useTranslation();
    const { flash } = usePage().props as { flash?: { type?: string } };
    const sent = flash?.type === 'success';
    const [inquiryType, setInquiryType] = useState<InquiryType>(defaults.type);

    const showRestaurantFields =
        inquiryType === 'integrate_restaurant' || inquiryType === 'approval_help';

    return (
        <>
            <Head title={t('contact.page_title')} />

            <section className="relative overflow-hidden border-b border-brand-blue/5 bg-gradient-to-br from-white via-[#f8faff] to-[#eef3fb] pt-28 pb-12 lg:pt-32 lg:pb-14">
                <div className="pointer-events-none absolute -right-24 top-16 size-72 rounded-full bg-[#ffa300]/8 blur-3xl" />
                <div className="pointer-events-none absolute -left-20 bottom-0 size-56 rounded-full bg-brand-blue/5 blur-3xl" />

                <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-3xl text-center">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-orange">
                            Chiclayo · Lambayeque
                        </p>
                        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-brand-blue sm:text-4xl lg:text-[2.75rem]">
                            {t('contact.hero_title')}
                        </h1>
                        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-gray-600 sm:text-lg">
                            {t('contact.hero_subtitle')}
                        </p>
                    </div>
                </div>
            </section>

            <section className="bg-[#f7f9fc] py-12 lg:py-16">
                <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-5 lg:gap-10 lg:px-8">
                    <div className="space-y-4 lg:col-span-2">
                        <InfoCard
                            icon={<Storefront size={26} weight="duotone" color="#ffa300" />}
                            iconBg="rgba(255, 163, 0, 0.12)"
                            title={t('contact.info_integrate_title')}
                        >
                            <p>{t('contact.info_integrate_desc')}</p>
                            {canRegister && (
                                <Link
                                    href={register()}
                                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-orange transition hover:gap-2.5"
                                >
                                    {t('contact.info_register_link')}
                                    <ArrowRight size={16} weight="bold" />
                                </Link>
                            )}
                        </InfoCard>

                        <InfoCard
                            icon={<ClockCountdown size={26} weight="duotone" color="#073577" />}
                            iconBg="rgba(7, 53, 119, 0.08)"
                            title={t('contact.info_approval_title')}
                        >
                            <p>{t('contact.info_approval_desc')}</p>
                        </InfoCard>

                        <div className="rounded-2xl border border-brand-blue/10 bg-gradient-to-br from-brand-blue to-[#0a4494] p-6 text-white shadow-[0_8px_32px_rgba(7,53,119,0.2)]">
                            <div className="flex size-11 items-center justify-center rounded-xl bg-white/10">
                                <EnvelopeSimple size={24} weight="duotone" color="#ffa300" />
                            </div>
                            <p className="mt-4 text-sm leading-relaxed text-white/85">{t('contact.direct_email')}</p>
                            <a
                                href={`mailto:${supportEmail}`}
                                className="mt-2 inline-block text-base font-semibold text-[#ffb833] transition hover:text-white"
                            >
                                {supportEmail}
                            </a>
                        </div>
                    </div>

                    <div className="lg:col-span-3">
                        {sent ? (
                            <div className="overflow-hidden rounded-3xl border border-emerald-200/80 bg-white px-8 py-14 text-center shadow-[0_8px_40px_rgba(7,53,119,0.08)]">
                                <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-50">
                                    <CheckCircle size={40} weight="duotone" color="#059669" />
                                </div>
                                <h2 className="mt-5 text-2xl font-bold text-brand-blue">{t('contact.success_title')}</h2>
                                <p className="mx-auto mt-3 max-w-md text-gray-600">{t('contact.success_desc')}</p>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="mt-8 rounded-xl border-brand-blue/15 text-brand-blue hover:bg-brand-blue/5"
                                    onClick={() => window.location.reload()}
                                >
                                    {t('contact.send_another')}
                                </Button>
                            </div>
                        ) : (
                            <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-[0_8px_40px_rgba(7,53,119,0.08)]">
                                <div className="border-b border-gray-100 bg-gradient-to-r from-brand-blue/[0.04] to-[#ffa300]/8 px-6 py-5 sm:px-8 sm:py-6">
                                    <h2 className="text-xl font-bold text-brand-blue sm:text-2xl">
                                        {t('contact.form_title')}
                                    </h2>
                                    <p className="mt-1.5 text-sm text-gray-600 sm:text-base">{t('contact.form_subtitle')}</p>
                                </div>

                                <Form
                                    action="/contacto"
                                    method="post"
                                    options={{ preserveScroll: true }}
                                    className="p-6 sm:p-8"
                                >
                                    {({ processing, errors }) => (
                                        <div className="space-y-5">
                                            <div>
                                                <Label htmlFor="type" className="text-gray-700">
                                                    {t('contact.field_type')}
                                                </Label>
                                                <select
                                                    id="type"
                                                    name="type"
                                                    value={inquiryType}
                                                    onChange={event =>
                                                        setInquiryType(event.target.value as InquiryType)
                                                    }
                                                    className={SELECT_CLASS}
                                                >
                                                    {TYPE_OPTIONS.map(value => (
                                                        <option key={value} value={value}>
                                                            {t(`contact.type_${value}`)}
                                                        </option>
                                                    ))}
                                                </select>
                                                {errors.type && (
                                                    <p className="mt-1 text-xs text-brand-orange-dark">{errors.type}</p>
                                                )}
                                            </div>

                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <div>
                                                    <Label htmlFor="name" className="text-gray-700">
                                                        {t('contact.field_name')}
                                                    </Label>
                                                    <Input
                                                        id="name"
                                                        name="name"
                                                        defaultValue={defaults.name}
                                                        className={FIELD_CLASS}
                                                        required
                                                    />
                                                    {errors.name && (
                                                        <p className="mt-1 text-xs text-brand-orange-dark">
                                                            {errors.name}
                                                        </p>
                                                    )}
                                                </div>
                                                <div>
                                                    <Label htmlFor="email" className="text-gray-700">
                                                        {t('contact.field_email')}
                                                    </Label>
                                                    <Input
                                                        id="email"
                                                        name="email"
                                                        type="email"
                                                        defaultValue={defaults.email}
                                                        className={FIELD_CLASS}
                                                        required
                                                    />
                                                    {errors.email && (
                                                        <p className="mt-1 text-xs text-brand-orange-dark">
                                                            {errors.email}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <Label htmlFor="phone" className="flex items-center gap-1.5 text-gray-700">
                                                    <Phone size={15} weight="duotone" color="#073577" />
                                                    {t('contact.field_phone')}
                                                    <span className="font-normal text-gray-400">
                                                        ({t('contact.optional')})
                                                    </span>
                                                </Label>
                                                <Input id="phone" name="phone" className={FIELD_CLASS} />
                                                {errors.phone && (
                                                    <p className="mt-1 text-xs text-brand-orange-dark">{errors.phone}</p>
                                                )}
                                            </div>

                                            {showRestaurantFields && (
                                                <div className="grid gap-4 rounded-2xl border border-brand-blue/8 bg-brand-blue/[0.02] p-4 sm:grid-cols-2 sm:p-5">
                                                    <div>
                                                        <Label htmlFor="restaurant_name" className="text-gray-700">
                                                            {t('contact.field_restaurant')}
                                                        </Label>
                                                        <Input
                                                            id="restaurant_name"
                                                            name="restaurant_name"
                                                            className={FIELD_CLASS}
                                                            required
                                                        />
                                                        {errors.restaurant_name && (
                                                            <p className="mt-1 text-xs text-brand-orange-dark">
                                                                {errors.restaurant_name}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="district" className="text-gray-700">
                                                            {t('contact.field_district')}
                                                            <span className="font-normal text-gray-400">
                                                                {' '}
                                                                ({t('contact.optional')})
                                                            </span>
                                                        </Label>
                                                        <Input
                                                            id="district"
                                                            name="district"
                                                            placeholder={t('contact.district_placeholder')}
                                                            className={FIELD_CLASS}
                                                        />
                                                        {errors.district && (
                                                            <p className="mt-1 text-xs text-brand-orange-dark">
                                                                {errors.district}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            <div>
                                                <Label htmlFor="message" className="text-gray-700">
                                                    {t('contact.field_message')}
                                                </Label>
                                                <Textarea
                                                    id="message"
                                                    name="message"
                                                    rows={5}
                                                    className="mt-1.5 rounded-xl border-gray-200 bg-slate-50/80 shadow-none transition focus-visible:border-brand-blue focus-visible:bg-white focus-visible:ring-[3px] focus-visible:ring-brand-blue/15"
                                                    placeholder={t('contact.message_placeholder')}
                                                    required
                                                />
                                                {errors.message && (
                                                    <p className="mt-1 text-xs text-brand-orange-dark">
                                                        {errors.message}
                                                    </p>
                                                )}
                                            </div>

                                            <Button
                                                type="submit"
                                                disabled={processing}
                                                className={cn(
                                                    'h-12 w-full rounded-xl text-base font-semibold text-white transition hover:brightness-105 active:scale-[0.99]',
                                                    processing && 'opacity-70',
                                                )}
                                                style={BTN_PRIMARY}
                                            >
                                                <PaperPlaneTilt size={18} weight="fill" className="mr-2" />
                                                {processing ? t('contact.sending') : t('contact.submit')}
                                            </Button>
                                        </div>
                                    )}
                                </Form>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </>
    );
}
