import { Form, Head, router } from '@inertiajs/react';
import { Building2, CheckCircle2, Hash, KeyRound, Mail, MapPin, Phone, UserRound, UtensilsCrossed } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import InputError from '@/components/common/input-error';
import PasswordInput from '@/components/common/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { login } from '@/routes';
import { store } from '@/routes/register';

// ─── Estilos compartidos con login.tsx ───────────────────────────────────────
const CARD_STYLE: React.CSSProperties = {
    background:
        'radial-gradient(ellipse 110% 100% at 60% 30%, rgba(232,0,26,0.13) 0%, rgba(180,0,10,0.09) 40%, rgba(100,0,5,0.06) 70%, rgba(255,255,255,0.94) 100%)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(200,0,15,0.18)',
    boxShadow: '0 12px 50px rgba(180,0,10,0.20), 0 1px 0 rgba(255,255,255,0.7) inset',
};

const BTN_STYLE: React.CSSProperties = {
    background: 'linear-gradient(90deg, #E8001A 0%, #CC0010 50%, #8B0008 100%)',
    boxShadow: '0 4px 18px rgba(200,0,10,0.28)',
};

const BTN_GHOST: React.CSSProperties = {
    background: 'rgba(220,0,15,0.07)',
    border: '1.5px solid rgba(200,0,15,0.18)',
};

const INPUT_CLS = cn(
    'h-11 pl-10 transition-all',
    'border-red-100 bg-white/80 placeholder:text-gray-400',
    'focus-visible:border-brand-red focus-visible:bg-white focus-visible:ring-brand-red/20',
);

const FLIP_MS = 540;
const STEP_MS = 260;

type Role = 'tourist' | 'restaurant_owner';

// ─── Hook de flip cross-page ─────────────────────────────────────────────────
function usePageFlip(backUrl: string) {
    const [mounted, setMounted] = useState(false);
    const [exiting, setExiting] = useState(false);

    useLayoutEffect(() => {
        const id = requestAnimationFrame(() => setMounted(true));
        return () => cancelAnimationFrame(id);
    }, []);

    const flipBack = () => {
        if (exiting) return;
        setExiting(true);
        setTimeout(() => router.visit(backUrl), FLIP_MS);
    };

    const wrapStyle: React.CSSProperties = { perspective: '1200px' };
    const cardWrapStyle: React.CSSProperties = {
        transform: exiting ? 'rotateY(-90deg)' : mounted ? 'rotateY(0deg)' : 'rotateY(90deg)',
        transition: mounted ? `transform ${FLIP_MS}ms cubic-bezier(0.4,0,0.2,1)` : 'none',
        willChange: 'transform',
    };

    return { wrapStyle, cardWrapStyle, flipBack };
}

// ─── Icono Google ─────────────────────────────────────────────────────────────
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

// ─── Tarjeta de selección de rol ─────────────────────────────────────────────
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
                    ? 'border-brand-red bg-red-50/70 shadow-md'
                    : 'border-red-100 bg-white/60 hover:border-red-200 hover:bg-red-50/40 hover:shadow-sm',
            )}
        >
            <span
                className={cn(
                    'flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-200',
                    selected ? 'text-white shadow-lg' : 'bg-red-50 text-brand-red group-hover:bg-red-100',
                )}
                style={selected ? BTN_STYLE : undefined}
            >
                {icon}
            </span>
            <div>
                <p className={cn('text-sm font-semibold', selected ? 'text-brand-red' : 'text-gray-800')}>
                    {title}
                </p>
                <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">{description}</p>
            </div>
        </button>
    );
}

export default function Register() {
    const { t } = useTranslation();
    const { wrapStyle, cardWrapStyle, flipBack } = usePageFlip(login.url());

    const [step, setStep] = useState<1 | 2>(1);
    const [role, setRole] = useState<Role | null>(null);
    const [stepVisible, setStepVisible] = useState(true);
    const animating = useRef(false);

    // ─ Estado RUC ─────────────────────────────────────────────────────────────
    const [rucValue, setRucValue]               = useState('');
    const [rucStatus, setRucStatus]             = useState<'idle' | 'validating' | 'valid' | 'error'>('idle');
    const [businessNameValue, setBusinessNameValue] = useState('');

    const validateRuc = async () => {
        if (rucValue.length !== 11) return;
        setRucStatus('validating');
        try {
            const res  = await fetch(`/api/ruc/${rucValue}`, {
                headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
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
                    <div style={CARD_STYLE} className="rounded-2xl">
                        <div className="flex flex-col gap-0 p-8">

                            {/* ── Header ──────────────────────────────────────── */}
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
                                        style={BTN_STYLE}
                                    >
                                        <UserRound className="h-5 w-5 text-white" />
                                    </span>
                                    <div>
                                        <h1 className="text-xl font-bold text-gray-900">
                                            {step === 1 ? t('auth.choose_role_title') : t('auth.register_title')}
                                        </h1>
                                        <p className="text-sm text-gray-500">
                                            {step === 1
                                                ? t('auth.choose_role_subtitle')
                                                : role === 'tourist'
                                                  ? t('auth.role_tourist_desc')
                                                  : t('auth.role_owner_desc')}
                                        </p>
                                    </div>
                                </div>

                                {/* Indicador de paso */}
                                <div className="mt-4 flex items-center gap-2">
                                    <div className={cn('h-1.5 flex-1 rounded-full transition-all', step >= 1 ? 'bg-brand-red' : 'bg-gray-200')} />
                                    <div className={cn('h-1.5 flex-1 rounded-full transition-all', step >= 2 ? 'bg-brand-red' : 'bg-gray-200')} />
                                </div>
                            </div>

                            {/* ── Contenido animado ────────────────────────────── */}
                            <div style={stepStyle}>

                                {/* ─ Paso 1: Selector de rol ─ */}
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
                                            <button
                                                type="button"
                                                onClick={flipBack}
                                                className="cursor-pointer font-semibold text-brand-red hover:text-red-700"
                                            >
                                                {t('auth.sign_in')}
                                            </button>
                                        </p>
                                    </div>
                                )}

                                {/* ─ Paso 2: Formulario ─ */}
                                {step === 2 && role && (
                                    <div>
                                        {/* Google — solo para turistas */}
                                        {role === 'tourist' && (
                                            <>
                                                <a
                                                    href="/auth/google/redirect"
                                                    className="mb-4 flex h-11 w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md active:scale-[0.98]"
                                                >
                                                    <GoogleIcon />
                                                    {t('auth.google')}
                                                </a>
                                                <div className="mb-4 flex items-center gap-3">
                                                    <div className="flex-1 border-t border-gray-300" />
                                                    <span className="text-xs font-medium text-gray-500">{t('auth.or_email')}</span>
                                                    <div className="flex-1 border-t border-gray-300" />
                                                </div>
                                            </>
                                        )}

                                        {/* Aviso para dueños de restaurante */}
                                        {role === 'restaurant_owner' && (
                                            <div
                                                className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/80 p-3.5"
                                            >
                                                <span className="mt-0.5 text-amber-500">⚠</span>
                                                <div>
                                                    <p className="text-xs font-semibold text-amber-700">{t('auth.owner_notice_title')}</p>
                                                    <p className="text-xs text-amber-600 leading-relaxed">{t('auth.owner_notice')}</p>
                                                </div>
                                            </div>
                                        )}

                                        <Form
                                            action={store.url()}
                                            method="post"
                                            resetOnSuccess={['password', 'password_confirmation']}
                                            disableWhileProcessing
                                            className="flex flex-col gap-3.5"
                                        >
                                            {({ processing, errors }) => (
                                                <>
                                                    {/* Campo oculto: rol */}
                                                    <input type="hidden" name="role" value={role} />

                                                    {/* Nombre */}
                                                    <div className="space-y-1.5">
                                                        <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                                                            {t('auth.name')} <span className="text-brand-red">*</span>
                                                        </Label>
                                                        <div className="relative">
                                                            <UserRound className="pointer-events-none absolute top-1/2 left-3.5 z-10 h-4 w-4 -translate-y-1/2 text-brand-red opacity-60" />
                                                            <Input
                                                                id="name"
                                                                type="text"
                                                                name="name"
                                                                required
                                                                autoFocus
                                                                tabIndex={1}
                                                                autoComplete="name"
                                                                placeholder={t('auth.name_placeholder')}
                                                                className={cn(INPUT_CLS, errors.name && 'border-red-400 bg-red-50')}
                                                            />
                                                        </div>
                                                        <InputError message={errors.name} />
                                                    </div>

                                                    {/* Email */}
                                                    <div className="space-y-1.5">
                                                        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                                                            {t('auth.email')} <span className="text-brand-red">*</span>
                                                        </Label>
                                                        <div className="relative">
                                                            <Mail className="pointer-events-none absolute top-1/2 left-3.5 z-10 h-4 w-4 -translate-y-1/2 text-brand-red opacity-60" />
                                                            <Input
                                                                id="email"
                                                                type="email"
                                                                name="email"
                                                                required
                                                                tabIndex={2}
                                                                autoComplete="email"
                                                                placeholder={t('auth.email_placeholder')}
                                                                className={cn(INPUT_CLS, errors.email && 'border-red-400 bg-red-50')}
                                                            />
                                                        </div>
                                                        <InputError message={errors.email} />
                                                    </div>

                                                    {/* Campos extra para dueño de restaurante */}
                                                    {role === 'restaurant_owner' && (
                                                        <>
                                                            {/* RUC con validación SUNAT */}
                                                            <div className="space-y-1.5">
                                                                <Label htmlFor="ruc" className="text-sm font-medium text-gray-700">
                                                                    {t('auth.ruc')} <span className="text-brand-red">*</span>
                                                                </Label>
                                                                <div className="flex gap-2">
                                                                    <div className="relative flex-1">
                                                                        <Hash className="pointer-events-none absolute top-1/2 left-3.5 z-10 h-4 w-4 -translate-y-1/2 text-brand-red opacity-60" />
                                                                        <Input
                                                                            id="ruc"
                                                                            name="ruc"
                                                                            type="text"
                                                                            inputMode="numeric"
                                                                            maxLength={11}
                                                                            value={rucValue}
                                                                            onChange={e => {
                                                                                setRucValue(e.target.value.replace(/\D/g, ''));
                                                                                setRucStatus('idle');
                                                                            }}
                                                                            placeholder={t('auth.ruc_placeholder')}
                                                                            className={cn(
                                                                            INPUT_CLS,
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
                                                                        style={rucStatus !== 'valid' ? BTN_STYLE : undefined}
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

                                                            {/* Razón social (auto-llenado tras validar RUC) */}
                                                            <div className="space-y-1.5">
                                                                <Label htmlFor="business_name" className="text-sm font-medium text-gray-700">
                                                                    {t('auth.business_name')} <span className="text-brand-red">*</span>
                                                                </Label>
                                                                <div className="relative">
                                                                    <Building2 className="pointer-events-none absolute top-1/2 left-3.5 z-10 h-4 w-4 -translate-y-1/2 text-brand-red opacity-60" />
                                                                    <Input
                                                                        id="business_name"
                                                                        type="text"
                                                                        name="business_name"
                                                                        required
                                                                        tabIndex={3}
                                                                        value={businessNameValue}
                                                                        onChange={e => setBusinessNameValue(e.target.value)}
                                                                        readOnly={rucStatus === 'valid'}
                                                                        placeholder={t('auth.business_name_placeholder')}
                                                                        className={cn(
                                                                            INPUT_CLS,
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
                                                                        <Phone className="pointer-events-none absolute top-1/2 left-3.5 z-10 h-4 w-4 -translate-y-1/2 text-brand-red opacity-60" />
                                                                        <Input
                                                                            id="phone"
                                                                            type="tel"
                                                                            name="phone"
                                                                            tabIndex={4}
                                                                            placeholder={t('auth.phone_placeholder')}
                                                                            className={cn(INPUT_CLS, errors.phone && 'border-red-400 bg-red-50')}
                                                                        />
                                                                    </div>
                                                                    <InputError message={errors.phone} />
                                                                </div>

                                                                <div className="space-y-1.5">
                                                                    <Label htmlFor="city" className="text-sm font-medium text-gray-700">
                                                                        {t('auth.city')}
                                                                    </Label>
                                                                    <div className="relative">
                                                                        <MapPin className="pointer-events-none absolute top-1/2 left-3.5 z-10 h-4 w-4 -translate-y-1/2 text-brand-red opacity-60" />
                                                                        <Input
                                                                            id="city"
                                                                            type="text"
                                                                            name="city"
                                                                            tabIndex={5}
                                                                            placeholder={t('auth.city_placeholder')}
                                                                            className={cn(INPUT_CLS, errors.city && 'border-red-400 bg-red-50')}
                                                                        />
                                                                    </div>
                                                                    <InputError message={errors.city} />
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}

                                                    {/* Password */}
                                                    <div className="space-y-1.5">
                                                        <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                                                            {t('auth.password')} <span className="text-brand-red">*</span>
                                                        </Label>
                                                        <PasswordInput
                                                            id="password"
                                                            name="password"
                                                            required
                                                            tabIndex={role === 'restaurant_owner' ? 6 : 3}
                                                            autoComplete="new-password"
                                                            placeholder={t('auth.password_placeholder')}
                                                            className={cn(INPUT_CLS, errors.password && 'border-red-400 bg-red-50')}
                                                            leftIcon={<KeyRound className="h-4 w-4 text-brand-red opacity-60" />}
                                                        />
                                                        <InputError message={errors.password} />
                                                    </div>

                                                    {/* Confirm Password */}
                                                    <div className="space-y-1.5">
                                                        <Label htmlFor="password_confirmation" className="text-sm font-medium text-gray-700">
                                                            {t('auth.confirm_password')} <span className="text-brand-red">*</span>
                                                        </Label>
                                                        <PasswordInput
                                                            id="password_confirmation"
                                                            name="password_confirmation"
                                                            required
                                                            tabIndex={role === 'restaurant_owner' ? 7 : 4}
                                                            autoComplete="new-password"
                                                            placeholder={t('auth.confirm_password_placeholder')}
                                                            className={cn(INPUT_CLS, errors.password_confirmation && 'border-red-400 bg-red-50')}
                                                            leftIcon={<KeyRound className="h-4 w-4 text-brand-red opacity-60" />}
                                                        />
                                                        <InputError message={errors.password_confirmation} />
                                                    </div>

                                                    {/* Submit */}
                                                    <Button
                                                        type="submit"
                                                        tabIndex={role === 'restaurant_owner' ? 8 : 5}
                                                        className="mt-1 h-11 w-full cursor-pointer rounded-xl border-0 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]"
                                                        style={BTN_STYLE}
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
                                            <button
                                                type="button"
                                                onClick={flipBack}
                                                className="cursor-pointer font-semibold text-brand-red hover:text-red-700"
                                            >
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
