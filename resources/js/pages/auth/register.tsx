import { Form, Head, Link } from '@inertiajs/react';
import { ArrowLeft, Building2, CheckCircle2, ChefHat, Hash, KeyRound, Mail, MapPin, Phone, UserRound, UtensilsCrossed } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthRegisterStepper } from '@/components/auth/auth-register-stepper';
import InputError from '@/components/common/input-error';
import PasswordInput from '@/components/common/password-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useAuthPageFlip } from '@/hooks/use-auth-page-flip';
import {
    AUTH_BTN_STYLE,
    AUTH_CARD_STYLE,
    AUTH_INPUT_CLS,
    AUTH_REGISTER_BTN_STYLE,
    authIconClass,
    authLinkBlueClass,
    authSubtitleClass,
    authTitleClass,
} from '@/lib/auth-styles';
import { cn } from '@/lib/utils';
import { home, login } from '@/routes';
import { store } from '@/routes/register';

const STEP_MS = 260;

type Role = 'tourist' | 'restaurant_owner';

function GoogleIcon() {
    return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
    );
}

interface RoleCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    selected: boolean;
    onClick: () => void;
}

function RoleCard({ icon, title, description, selected, onClick }: RoleCardProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'group flex w-full cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 p-5 text-center transition-all duration-200',
                selected
                    ? 'border-brand-orange bg-orange-50/70 shadow-md'
                    : 'border-orange-100 bg-white/60 hover:border-orange-200 hover:bg-orange-50/40 hover:shadow-sm',
            )}
        >
            <span
                className={cn(
                    'flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-200',
                    selected ? 'text-white shadow-lg' : 'bg-orange-50 text-brand-orange group-hover:bg-orange-100',
                )}
                style={selected ? AUTH_BTN_STYLE : undefined}
            >
                {icon}
            </span>
            <div>
                <p className={cn('text-sm font-semibold', selected ? 'text-brand-orange' : 'text-gray-800')}>
                    {title}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{description}</p>
            </div>
        </button>
    );
}

export default function Register() {
    const { t } = useTranslation();
    const { wrapStyle, cardWrapStyle, flipBack } = useAuthPageFlip(login.url());

    const [step, setStep] = useState<1 | 2>(1);
    const [role, setRole] = useState<Role | null>(null);
    const [stepVisible, setStepVisible] = useState(true);
    const [acceptTerms, setAcceptTerms] = useState(false);
    const animating = useRef(false);

    const [rucValue, setRucValue] = useState('');
    const [rucStatus, setRucStatus] = useState<'idle' | 'validating' | 'valid' | 'error'>('idle');
    const [businessNameValue, setBusinessNameValue] = useState('');

    const isTouristForm = step === 2 && role === 'tourist';

    const validateRuc = async () => {
        if (rucValue.length !== 11) return;
        setRucStatus('validating');
        try {
            const res = await fetch(`/api/ruc/${rucValue}`, {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            });
            const data = await res.json();
            if (res.ok && data.razon_social) {
                setRucStatus('valid');
                setBusinessNameValue(data.razon_social);
            } else {
                setRucStatus('error');
            }
        } catch {
            setRucStatus('error');
        }
    };

    const goToStep2 = (r: Role) => {
        if (animating.current) return;
        setRole(r);
        setAcceptTerms(false);
        animating.current = true;
        setStepVisible(false);
        setTimeout(() => {
            setStep(2);
            setStepVisible(true);
            animating.current = false;
        }, STEP_MS);
    };

    const goToStep1 = () => {
        if (animating.current) return;
        animating.current = true;
        setStepVisible(false);
        setTimeout(() => {
            setStep(1);
            setStepVisible(true);
            animating.current = false;
        }, STEP_MS);
    };

    const stepStyle: React.CSSProperties = {
        transition: `opacity ${STEP_MS}ms ease, transform ${STEP_MS}ms ease`,
        opacity: stepVisible ? 1 : 0,
        transform: stepVisible ? 'translateX(0)' : step === 1 ? 'translateX(-12px)' : 'translateX(12px)',
    };

    return (
        <>
            <Head title={t('auth.register_title')} />

            <div style={wrapStyle}>
                <div style={cardWrapStyle}>
                    <div
                        className={cn(!isTouristForm && 'w-full rounded-3xl')}
                        style={isTouristForm ? undefined : AUTH_CARD_STYLE}
                    >
                        <div className={cn('flex flex-col gap-0', !isTouristForm && 'p-8')}>
                            {!isTouristForm && (
                                <div className="mb-6">
                                    <button
                                        type="button"
                                        onClick={step === 2 ? goToStep1 : flipBack}
                                        className="mb-4 flex cursor-pointer items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800"
                                    >
                                        ←{' '}
                                        {step === 2 ? t('auth.back_to_roles') : t('auth.back_to_login')}
                                    </button>

                                    <div className="flex items-center gap-3">
                                        <span
                                            className="flex h-10 w-10 items-center justify-center rounded-xl"
                                            style={AUTH_BTN_STYLE}
                                        >
                                            <UserRound className="h-5 w-5 text-white" />
                                        </span>
                                        <div>
                                            <h1 className={authTitleClass}>
                                                {step === 1 ? t('auth.choose_role_title') : t('auth.register_title')}
                                            </h1>
                                            <p className={authSubtitleClass}>
                                                {step === 1
                                                    ? t('auth.choose_role_subtitle')
                                                    : t('auth.role_owner_desc')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex items-center gap-2">
                                        <div className={cn('h-1.5 flex-1 rounded-full transition-all', step >= 1 ? 'bg-brand-orange' : 'bg-gray-200')} />
                                        <div className={cn('h-1.5 flex-1 rounded-full transition-all', step >= 2 ? 'bg-brand-orange' : 'bg-gray-200')} />
                                    </div>
                                </div>
                            )}

                            <div style={stepStyle}>
                                {step === 1 && (
                                    <div className="flex flex-col gap-3">
                                        <RoleCard
                                            icon={<UserRound className="h-6 w-6" />}
                                            title={t('auth.role_tourist')}
                                            description={t('auth.role_tourist_desc')}
                                            selected={role === 'tourist'}
                                            onClick={() => goToStep2('tourist')}
                                        />
                                        <RoleCard
                                            icon={<UtensilsCrossed className="h-6 w-6" />}
                                            title={t('auth.role_owner')}
                                            description={t('auth.role_owner_desc')}
                                            selected={role === 'restaurant_owner'}
                                            onClick={() => goToStep2('restaurant_owner')}
                                        />

                                        <p className="mt-3 text-center text-sm text-gray-500">
                                            {t('auth.already_account')}{' '}
                                            <button type="button" onClick={flipBack} className={authLinkBlueClass}>
                                                {t('auth.sign_in')}
                                            </button>
                                        </p>
                                    </div>
                                )}

                                {step === 2 && role === 'tourist' && (
                                    <div>
                                        <Link
                                            href={home()}
                                            className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-brand-blue hover:text-brand-blue-light"
                                        >
                                            <ArrowLeft className="h-4 w-4" />
                                            {t('auth.back_to_home')}
                                        </Link>

                                        <h1 className="text-3xl font-bold tracking-tight text-brand-blue sm:text-[2rem]">
                                            {t('auth.register_title_lead')}{' '}
                                            <span className="text-brand-orange">{t('auth.register_title_accent')}</span>
                                        </h1>

                                        <div className="mt-3 flex items-start gap-3 rounded-xl border border-orange-100 bg-orange-50/70 px-3.5 py-3">
                                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-brand-orange shadow-sm">
                                                <UserRound className="h-4 w-4" />
                                            </span>
                                            <p className="text-sm leading-relaxed text-gray-600">{t('auth.register_hint')}</p>
                                        </div>

                                        <div className="mt-6 mb-6">
                                            <AuthRegisterStepper current={1} />
                                        </div>

                                        <a
                                            href="/auth/google/redirect"
                                            className="mb-4 flex h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md active:scale-[0.98]"
                                        >
                                            <GoogleIcon />
                                            {t('auth.google')}
                                        </a>

                                        <div className="mb-5 flex items-center gap-3">
                                            <div className="flex-1 border-t border-gray-200" />
                                            <span className="text-xs font-medium text-gray-400">{t('auth.or_register_email')}</span>
                                            <div className="flex-1 border-t border-gray-200" />
                                        </div>

                                        <Form
                                            action={store.url()}
                                            method="post"
                                            resetOnSuccess={['password', 'password_confirmation']}
                                            disableWhileProcessing
                                            className="flex flex-col gap-3.5"
                                        >
                                            {({ processing, errors }) => (
                                                <>
                                                    <input type="hidden" name="role" value="tourist" />

                                                    <div className="space-y-1.5">
                                                        <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                                                            {t('auth.name')} <span className="text-brand-orange">*</span>
                                                        </Label>
                                                        <div className="relative">
                                                            <UserRound className={cn('pointer-events-none absolute top-1/2 left-3.5 z-10 h-4 w-4 -translate-y-1/2', authIconClass)} />
                                                            <Input
                                                                id="name"
                                                                type="text"
                                                                name="name"
                                                                required
                                                                autoFocus
                                                                tabIndex={1}
                                                                autoComplete="name"
                                                                placeholder={t('auth.name_placeholder_example')}
                                                                className={cn(AUTH_INPUT_CLS, errors.name && 'border-red-400 bg-red-50')}
                                                            />
                                                        </div>
                                                        <InputError message={errors.name} />
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                                                            {t('auth.email')} <span className="text-brand-orange">*</span>
                                                        </Label>
                                                        <div className="relative">
                                                            <Mail className={cn('pointer-events-none absolute top-1/2 left-3.5 z-10 h-4 w-4 -translate-y-1/2', authIconClass)} />
                                                            <Input
                                                                id="email"
                                                                type="email"
                                                                name="email"
                                                                required
                                                                tabIndex={2}
                                                                autoComplete="email"
                                                                placeholder={t('auth.email_placeholder_example')}
                                                                className={cn(AUTH_INPUT_CLS, errors.email && 'border-red-400 bg-red-50')}
                                                            />
                                                        </div>
                                                        <InputError message={errors.email} />
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                                                            {t('auth.password')} <span className="text-brand-orange">*</span>
                                                        </Label>
                                                        <PasswordInput
                                                            id="password"
                                                            name="password"
                                                            required
                                                            tabIndex={3}
                                                            autoComplete="new-password"
                                                            placeholder={t('auth.password_placeholder_secure')}
                                                            className={cn(AUTH_INPUT_CLS, errors.password && 'border-red-400 bg-red-50')}
                                                            leftIcon={<KeyRound className={cn('h-4 w-4', authIconClass)} />}
                                                        />
                                                        <InputError message={errors.password} />
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <Label htmlFor="password_confirmation" className="text-sm font-medium text-gray-700">
                                                            {t('auth.confirm_password')} <span className="text-brand-orange">*</span>
                                                        </Label>
                                                        <PasswordInput
                                                            id="password_confirmation"
                                                            name="password_confirmation"
                                                            required
                                                            tabIndex={4}
                                                            autoComplete="new-password"
                                                            placeholder={t('auth.confirm_password_placeholder')}
                                                            className={cn(AUTH_INPUT_CLS, errors.password_confirmation && 'border-red-400 bg-red-50')}
                                                            leftIcon={<KeyRound className={cn('h-4 w-4', authIconClass)} />}
                                                        />
                                                        <InputError message={errors.password_confirmation} />
                                                    </div>

                                                    <div className="flex items-start gap-2.5 pt-1">
                                                        <Checkbox
                                                            id="accept_terms"
                                                            checked={acceptTerms}
                                                            onCheckedChange={(value) => {
                                                                setAcceptTerms(value === true);
                                                            }}
                                                            className="mt-0.5 data-[state=checked]:border-brand-blue data-[state=checked]:bg-brand-blue"
                                                        />
                                                        <label htmlFor="accept_terms" className="cursor-pointer text-sm leading-relaxed text-gray-600">
                                                            {t('auth.terms_agree')}{' '}
                                                            <span className="font-medium text-brand-blue">{t('auth.terms')}</span>{' '}
                                                            {t('auth.terms_and')}{' '}
                                                            <span className="font-medium text-brand-blue">{t('auth.privacy')}</span>
                                                        </label>
                                                    </div>

                                                    <Button
                                                        type="submit"
                                                        tabIndex={5}
                                                        disabled={!acceptTerms}
                                                        className="mt-1 h-12 w-full cursor-pointer rounded-xl border-0 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
                                                        style={AUTH_REGISTER_BTN_STYLE}
                                                        data-test="register-user-button"
                                                    >
                                                        {processing && <Spinner />}
                                                        <ChefHat className="h-4 w-4" />
                                                        {t('auth.create_account')}
                                                    </Button>
                                                </>
                                            )}
                                        </Form>

                                        <p className="mt-4 text-center text-sm text-gray-500">
                                            {t('auth.already_account')}{' '}
                                            <button type="button" onClick={flipBack} className={authLinkBlueClass}>
                                                {t('auth.sign_in')}
                                            </button>
                                        </p>

                                        <button
                                            type="button"
                                            onClick={goToStep1}
                                            className="mt-3 w-full cursor-pointer text-center text-xs text-gray-400 hover:text-gray-600"
                                        >
                                            {t('auth.back_to_roles')}
                                        </button>
                                    </div>
                                )}

                                {step === 2 && role === 'restaurant_owner' && (
                                    <div>
                                        <div
                                            className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/80 p-3.5"
                                        >
                                            <span className="mt-0.5 text-amber-500">⚠</span>
                                            <div>
                                                <p className="text-xs font-semibold text-amber-700">{t('auth.owner_notice_title')}</p>
                                                <p className="text-xs leading-relaxed text-amber-600">{t('auth.owner_notice')}</p>
                                            </div>
                                        </div>

                                        <Form
                                            action={store.url()}
                                            method="post"
                                            resetOnSuccess={['password', 'password_confirmation']}
                                            disableWhileProcessing
                                            className="flex flex-col gap-3.5"
                                        >
                                            {({ processing, errors }) => (
                                                <>
                                                    <input type="hidden" name="role" value={role} />

                                                    <div className="space-y-1.5">
                                                        <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                                                            {t('auth.name')} <span className="text-brand-orange">*</span>
                                                        </Label>
                                                        <div className="relative">
                                                            <UserRound className={cn('pointer-events-none absolute top-1/2 left-3.5 z-10 h-4 w-4 -translate-y-1/2', authIconClass)} />
                                                            <Input
                                                                id="name"
                                                                type="text"
                                                                name="name"
                                                                required
                                                                autoFocus
                                                                tabIndex={1}
                                                                autoComplete="name"
                                                                placeholder={t('auth.name_placeholder')}
                                                                className={cn(AUTH_INPUT_CLS, errors.name && 'border-red-400 bg-red-50')}
                                                            />
                                                        </div>
                                                        <InputError message={errors.name} />
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                                                            {t('auth.email')} <span className="text-brand-orange">*</span>
                                                        </Label>
                                                        <div className="relative">
                                                            <Mail className={cn('pointer-events-none absolute top-1/2 left-3.5 z-10 h-4 w-4 -translate-y-1/2', authIconClass)} />
                                                            <Input
                                                                id="email"
                                                                type="email"
                                                                name="email"
                                                                required
                                                                tabIndex={2}
                                                                autoComplete="email"
                                                                placeholder={t('auth.email_placeholder')}
                                                                className={cn(AUTH_INPUT_CLS, errors.email && 'border-red-400 bg-red-50')}
                                                            />
                                                        </div>
                                                        <InputError message={errors.email} />
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <Label htmlFor="ruc" className="text-sm font-medium text-gray-700">
                                                            {t('auth.ruc')} <span className="text-brand-orange">*</span>
                                                        </Label>
                                                        <div className="flex gap-2">
                                                            <div className="relative flex-1">
                                                                <Hash className={cn('pointer-events-none absolute top-1/2 left-3.5 z-10 h-4 w-4 -translate-y-1/2', authIconClass)} />
                                                                <Input
                                                                    id="ruc"
                                                                    name="ruc"
                                                                    type="text"
                                                                    inputMode="numeric"
                                                                    maxLength={11}
                                                                    value={rucValue}
                                                                    onChange={(e) => {
                                                                        setRucValue(e.target.value.replace(/\D/g, ''));
                                                                        setRucStatus('idle');
                                                                    }}
                                                                    placeholder={t('auth.ruc_placeholder')}
                                                                    className={cn(
                                                                        AUTH_INPUT_CLS,
                                                                        rucStatus === 'error' && 'border-red-400 bg-red-50',
                                                                        errors.ruc && 'border-red-400 bg-red-50',
                                                                    )}
                                                                />
                                                            </div>
                                                            <button
                                                                type="button"
                                                                disabled={rucValue.length !== 11 || rucStatus === 'validating'}
                                                                onClick={validateRuc}
                                                                className={cn(
                                                                    'flex cursor-pointer items-center gap-1.5 rounded-xl px-3 text-xs font-semibold whitespace-nowrap transition-all disabled:opacity-50',
                                                                    rucStatus === 'valid'
                                                                        ? 'bg-green-100 text-green-700'
                                                                        : 'text-white',
                                                                )}
                                                                style={rucStatus !== 'valid' ? AUTH_BTN_STYLE : undefined}
                                                            >
                                                                {rucStatus === 'validating' ? (
                                                                    <><Spinner className="h-3 w-3" /> {t('auth.ruc_validating')}</>
                                                                ) : rucStatus === 'valid' ? (
                                                                    <><CheckCircle2 className="h-3 w-3" /> {t('auth.ruc_validated')}</>
                                                                ) : (
                                                                    t('auth.ruc_validate')
                                                                )}
                                                            </button>
                                                        </div>
                                                        {rucStatus === 'error' && (
                                                            <p className="text-xs text-red-500">{t('auth.ruc_error')}</p>
                                                        )}
                                                        <InputError message={errors.ruc} />
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <Label htmlFor="business_name" className="text-sm font-medium text-gray-700">
                                                            {t('auth.business_name')} <span className="text-brand-orange">*</span>
                                                        </Label>
                                                        <div className="relative">
                                                            <Building2 className={cn('pointer-events-none absolute top-1/2 left-3.5 z-10 h-4 w-4 -translate-y-1/2', authIconClass)} />
                                                            <Input
                                                                id="business_name"
                                                                type="text"
                                                                name="business_name"
                                                                required
                                                                tabIndex={3}
                                                                value={businessNameValue}
                                                                onChange={(e) => setBusinessNameValue(e.target.value)}
                                                                readOnly={rucStatus === 'valid'}
                                                                placeholder={t('auth.business_name_placeholder')}
                                                                className={cn(
                                                                    AUTH_INPUT_CLS,
                                                                    rucStatus === 'valid' && 'cursor-not-allowed border-green-300 bg-green-50/80 text-green-800',
                                                                    errors.business_name && 'border-red-400 bg-red-50',
                                                                )}
                                                            />
                                                        </div>
                                                        <InputError message={errors.business_name} />
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-1.5">
                                                            <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                                                                {t('auth.phone')}
                                                            </Label>
                                                            <div className="relative">
                                                                <Phone className={cn('pointer-events-none absolute top-1/2 left-3.5 z-10 h-4 w-4 -translate-y-1/2', authIconClass)} />
                                                                <Input
                                                                    id="phone"
                                                                    type="tel"
                                                                    name="phone"
                                                                    tabIndex={4}
                                                                    placeholder={t('auth.phone_placeholder')}
                                                                    className={cn(AUTH_INPUT_CLS, errors.phone && 'border-red-400 bg-red-50')}
                                                                />
                                                            </div>
                                                            <InputError message={errors.phone} />
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            <Label htmlFor="city" className="text-sm font-medium text-gray-700">
                                                                {t('auth.city')}
                                                            </Label>
                                                            <div className="relative">
                                                                <MapPin className={cn('pointer-events-none absolute top-1/2 left-3.5 z-10 h-4 w-4 -translate-y-1/2', authIconClass)} />
                                                                <Input
                                                                    id="city"
                                                                    type="text"
                                                                    name="city"
                                                                    tabIndex={5}
                                                                    placeholder={t('auth.city_placeholder')}
                                                                    className={cn(AUTH_INPUT_CLS, errors.city && 'border-red-400 bg-red-50')}
                                                                />
                                                            </div>
                                                            <InputError message={errors.city} />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                                                            {t('auth.password')} <span className="text-brand-orange">*</span>
                                                        </Label>
                                                        <PasswordInput
                                                            id="password"
                                                            name="password"
                                                            required
                                                            tabIndex={6}
                                                            autoComplete="new-password"
                                                            placeholder={t('auth.password_placeholder')}
                                                            className={cn(AUTH_INPUT_CLS, errors.password && 'border-red-400 bg-red-50')}
                                                            leftIcon={<KeyRound className={cn('h-4 w-4', authIconClass)} />}
                                                        />
                                                        <InputError message={errors.password} />
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <Label htmlFor="password_confirmation" className="text-sm font-medium text-gray-700">
                                                            {t('auth.confirm_password')} <span className="text-brand-orange">*</span>
                                                        </Label>
                                                        <PasswordInput
                                                            id="password_confirmation"
                                                            name="password_confirmation"
                                                            required
                                                            tabIndex={7}
                                                            autoComplete="new-password"
                                                            placeholder={t('auth.confirm_password_placeholder')}
                                                            className={cn(AUTH_INPUT_CLS, errors.password && 'border-red-400 bg-red-50')}
                                                            leftIcon={<KeyRound className={cn('h-4 w-4', authIconClass)} />}
                                                        />
                                                        <InputError message={errors.password_confirmation} />
                                                    </div>

                                                    <Button
                                                        type="submit"
                                                        tabIndex={8}
                                                        className="mt-1 h-11 w-full cursor-pointer rounded-xl border-0 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]"
                                                        style={AUTH_BTN_STYLE}
                                                        data-test="register-user-button"
                                                    >
                                                        {processing && <Spinner />}
                                                        {t('auth.create_account')}
                                                    </Button>
                                                </>
                                            )}
                                        </Form>

                                        <p className="mt-4 text-center text-sm text-gray-500">
                                            {t('auth.already_account')}{' '}
                                            <button type="button" onClick={flipBack} className={authLinkBlueClass}>
                                                {t('auth.sign_in')}
                                            </button>
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

Register.layout = {
    title: 'auth.register_title',
    description: 'auth.register_subtitle',
};
