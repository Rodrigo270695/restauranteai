import { Form, Head, Link, usePage } from '@inertiajs/react';
import { Building2, CheckCircle2, Clock, Mail, MessageSquare, Phone, Send } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { register } from '@/routes';

const BTN_PRIMARY: React.CSSProperties = {
    background: 'linear-gradient(90deg, #E8001A 0%, #CC0010 50%, #8B0008 100%)',
    boxShadow: '0 4px 18px rgba(200,0,10,0.28)',
};

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

            <section
                className="relative overflow-hidden pt-28 pb-12 lg:pt-32"
                style={{
                    background:
                        'linear-gradient(135deg, #FFF8F0 0%, #FFFFFF 45%, #FFF0E8 75%, #FFE4D8 100%)',
                }}
            >
                <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-3xl text-center">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E8001A]">
                            Chiclayo · Lambayeque
                        </p>
                        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                            {t('contact.hero_title')}
                        </h1>
                        <p className="mt-3 text-base text-gray-600 sm:text-lg">{t('contact.hero_subtitle')}</p>
                    </div>
                </div>
            </section>

            <section className="bg-gray-50/90 py-10 lg:py-14">
                <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-5 lg:gap-12 lg:px-8">
                    <div className="space-y-5 lg:col-span-2">
                        <div className="rounded-2xl border border-white bg-white p-5 shadow-sm">
                            <Building2 className="size-8 text-[#E8001A]" />
                            <h2 className="mt-3 text-lg font-bold text-gray-900">
                                {t('contact.info_integrate_title')}
                            </h2>
                            <p className="mt-2 text-sm leading-relaxed text-gray-600">
                                {t('contact.info_integrate_desc')}
                            </p>
                            {canRegister && (
                                <Link
                                    href={register()}
                                    className="mt-4 inline-block text-sm font-semibold text-[#E8001A] hover:underline"
                                >
                                    {t('contact.info_register_link')} →
                                </Link>
                            )}
                        </div>

                        <div className="rounded-2xl border border-white bg-white p-5 shadow-sm">
                            <Clock className="size-8 text-amber-600" />
                            <h2 className="mt-3 text-lg font-bold text-gray-900">
                                {t('contact.info_approval_title')}
                            </h2>
                            <p className="mt-2 text-sm leading-relaxed text-gray-600">
                                {t('contact.info_approval_desc')}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-5">
                            <Mail className="size-6 text-[#E8001A]" />
                            <p className="mt-2 text-sm text-gray-700">
                                {t('contact.direct_email')}{' '}
                                <a
                                    href={`mailto:${supportEmail}`}
                                    className="font-semibold text-[#E8001A] hover:underline"
                                >
                                    {supportEmail}
                                </a>
                            </p>
                        </div>
                    </div>

                    <div className="lg:col-span-3">
                        {sent ? (
                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-8 py-12 text-center shadow-sm">
                                <CheckCircle2 className="mx-auto size-14 text-emerald-600" />
                                <h2 className="mt-4 text-2xl font-bold text-gray-900">{t('contact.success_title')}</h2>
                                <p className="mt-2 text-gray-600">{t('contact.success_desc')}</p>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="mt-6 rounded-xl"
                                    onClick={() => window.location.reload()}
                                >
                                    {t('contact.send_another')}
                                </Button>
                            </div>
                        ) : (
                            <Form
                                action="/contacto"
                                method="post"
                                options={{ preserveScroll: true }}
                                className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8"
                            >
                                {({ processing, errors }) => (
                                    <div className="space-y-5">
                                        <div>
                                            <Label htmlFor="type">{t('contact.field_type')}</Label>
                                            <select
                                                id="type"
                                                name="type"
                                                value={inquiryType}
                                                onChange={e => setInquiryType(e.target.value as InquiryType)}
                                                className="mt-1.5 flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm shadow-sm focus:border-[#E8001A] focus:outline-none focus:ring-1 focus:ring-[#E8001A]"
                                            >
                                                {TYPE_OPTIONS.map(value => (
                                                    <option key={value} value={value}>
                                                        {t(`contact.type_${value}`)}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.type && (
                                                <p className="mt-1 text-xs text-red-600">{errors.type}</p>
                                            )}
                                        </div>

                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div>
                                                <Label htmlFor="name">{t('contact.field_name')}</Label>
                                                <Input
                                                    id="name"
                                                    name="name"
                                                    defaultValue={defaults.name}
                                                    className="mt-1.5 rounded-xl"
                                                    required
                                                />
                                                {errors.name && (
                                                    <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                                                )}
                                            </div>
                                            <div>
                                                <Label htmlFor="email">{t('contact.field_email')}</Label>
                                                <Input
                                                    id="email"
                                                    name="email"
                                                    type="email"
                                                    defaultValue={defaults.email}
                                                    className="mt-1.5 rounded-xl"
                                                    required
                                                />
                                                {errors.email && (
                                                    <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <Label htmlFor="phone" className="flex items-center gap-1">
                                                <Phone className="size-3.5" />
                                                {t('contact.field_phone')}
                                                <span className="font-normal text-gray-400">
                                                    ({t('contact.optional')})
                                                </span>
                                            </Label>
                                            <Input
                                                id="phone"
                                                name="phone"
                                                className="mt-1.5 rounded-xl"
                                            />
                                            {errors.phone && (
                                                <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
                                            )}
                                        </div>

                                        {showRestaurantFields && (
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <div>
                                                    <Label htmlFor="restaurant_name">
                                                        {t('contact.field_restaurant')}
                                                    </Label>
                                                    <Input
                                                        id="restaurant_name"
                                                        name="restaurant_name"
                                                        className="mt-1.5 rounded-xl"
                                                        required
                                                    />
                                                    {errors.restaurant_name && (
                                                        <p className="mt-1 text-xs text-red-600">
                                                            {errors.restaurant_name}
                                                        </p>
                                                    )}
                                                </div>
                                                <div>
                                                    <Label htmlFor="district">
                                                        {t('contact.field_district')}
                                                        <span className="font-normal text-gray-400">
                                                            {' '}
                                                            ({t('contact.optional')})
                                                        </span>
                                                    </Label>
                                                    <Input
                                                        id="district"
                                                        name="district"
                                                        placeholder="Chiclayo, José Leonardo Ortiz…"
                                                        className="mt-1.5 rounded-xl"
                                                    />
                                                    {errors.district && (
                                                        <p className="mt-1 text-xs text-red-600">
                                                            {errors.district}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <Label htmlFor="message" className="flex items-center gap-1">
                                                <MessageSquare className="size-3.5" />
                                                {t('contact.field_message')}
                                            </Label>
                                            <Textarea
                                                id="message"
                                                name="message"
                                                rows={5}
                                                className="mt-1.5 rounded-xl"
                                                placeholder={t('contact.message_placeholder')}
                                                required
                                            />
                                            {errors.message && (
                                                <p className="mt-1 text-xs text-red-600">{errors.message}</p>
                                            )}
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            className={cn(
                                                'h-12 w-full rounded-xl text-base font-semibold text-white',
                                                processing && 'opacity-70',
                                            )}
                                            style={BTN_PRIMARY}
                                        >
                                            <Send className="mr-2 size-4" />
                                            {processing ? t('contact.sending') : t('contact.submit')}
                                        </Button>
                                    </div>
                                )}
                            </Form>
                        )}
                    </div>
                </div>
            </section>
        </>
    );
}
