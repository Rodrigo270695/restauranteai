import { Head, router } from '@inertiajs/react';
import { MapPin, Sparkles, UtensilsCrossed } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { store as storeProfile } from '@/routes/profile/setup';

// ─── Constantes de marca ──────────────────────────────────────────────────────
const BTN_STYLE: React.CSSProperties = {
    background: 'linear-gradient(90deg, #E8001A 0%, #CC0010 50%, #8B0008 100%)',
    boxShadow: '0 4px 18px rgba(200,0,10,0.28)',
};

const CARD_STYLE: React.CSSProperties = {
    background:
        'radial-gradient(ellipse 110% 100% at 60% 30%, rgba(232,0,26,0.10) 0%, rgba(180,0,10,0.06) 40%, rgba(255,255,255,0.97) 100%)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(200,0,15,0.14)',
    boxShadow: '0 12px 50px rgba(180,0,10,0.14), 0 1px 0 rgba(255,255,255,0.8) inset',
};

const INPUT_CLS = cn(
    'h-11 pl-10 transition-all',
    'border-red-100 bg-white/80 placeholder:text-gray-400',
    'focus-visible:border-brand-red focus-visible:bg-white focus-visible:ring-brand-red/20',
);

// Cocinas disponibles para seleccionar
const CUISINES = [
    'Criolla', 'Mariscos', 'Ceviche', 'Parrilla', 'Pollo a la brasa',
    'Vegetariana', 'Pizza', 'Sushi', 'Pasta', 'Hamburguesas',
    'Desayunos', 'Postres', 'Bebidas', 'Chifa', 'Nikkei',
];

type Budget = 'low' | 'medium' | 'high';

interface Props {
    user: { name: string; email: string };
    profile: {
        city: string | null;
        bio: string | null;
        budget_preference: Budget | null;
        preferred_cuisines: string[];
    } | null;
}

export default function ProfileSetup({ user, profile }: Props) {
    const { t } = useTranslation();

    const [city, setCity] = useState(profile?.city ?? '');
    const [bio, setBio] = useState(profile?.bio ?? '');
    const [budget, setBudget] = useState<Budget | null>(profile?.budget_preference ?? null);
    const [cuisines, setCuisines] = useState<string[]>(profile?.preferred_cuisines ?? []);
    const [saving, setSaving] = useState(false);

    const firstName = user.name.split(' ')[0];

    const toggleCuisine = (c: string) => {
        setCuisines(prev =>
            prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c],
        );
    };

    const handleSave = () => {
        setSaving(true);
        router.post(
            storeProfile.url(),
            { city, bio, budget_preference: budget, preferred_cuisines: cuisines },
            { onFinish: () => setSaving(false) },
        );
    };

    const handleSkip = () => {
        router.post(storeProfile.url(), { skip: true });
    };

    const budgets: Array<{ key: Budget; label: string; desc: string }> = [
        { key: 'low',    label: t('setup.budget_low'),    desc: t('setup.budget_low_desc') },
        { key: 'medium', label: t('setup.budget_medium'), desc: t('setup.budget_medium_desc') },
        { key: 'high',   label: t('setup.budget_high'),   desc: t('setup.budget_high_desc') },
    ];

    return (
        <>
            <Head title={t('setup.title')} />

            {/* Fondo con gradiente de marca */}
            <div
                className="min-h-screen"
                style={{
                    background: 'linear-gradient(135deg, #FFF8F0 0%, #FFFFFF 40%, #FFF0E8 70%, #FFE4D8 100%)',
                }}
            >
                {/* Header minimalista */}
                <header className="flex items-center justify-between px-6 py-4">
                    <img src="/logo.png" alt="DiscoverLambo" className="h-10 w-auto" />
                    <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-brand-red">
                        {t('setup.step_label')}
                    </span>
                </header>

                <div className="mx-auto max-w-lg px-4 py-8">
                    {/* Saludo */}
                    <div className="mb-8 text-center">
                        <div
                            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
                            style={BTN_STYLE}
                        >
                            <Sparkles className="h-8 w-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {t('setup.almost')}{' '}
                            <span className="text-brand-red">{firstName}!</span>
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">{t('setup.welcome_note')}</p>
                    </div>

                    {/* Card principal */}
                    <div style={CARD_STYLE} className="rounded-2xl p-6">
                        <div className="flex flex-col gap-6">

                            {/* Ciudad */}
                            <div className="space-y-1.5">
                                <Label className="text-sm font-semibold text-gray-700">
                                    {t('setup.city_label')}
                                </Label>
                                <div className="relative">
                                    <MapPin className="pointer-events-none absolute top-1/2 left-3.5 z-10 h-4 w-4 -translate-y-1/2 text-brand-red opacity-60" />
                                    <Input
                                        type="text"
                                        value={city}
                                        onChange={e => setCity(e.target.value)}
                                        placeholder={t('setup.city_placeholder')}
                                        className={INPUT_CLS}
                                    />
                                </div>
                            </div>

                            {/* Presupuesto */}
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-gray-700">
                                    {t('setup.budget_label')}
                                </Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {budgets.map(b => (
                                        <button
                                            key={b.key}
                                            type="button"
                                            onClick={() => setBudget(b.key)}
                                            className={cn(
                                                'cursor-pointer rounded-xl border-2 p-3 text-center transition-all duration-150',
                                                budget === b.key
                                                    ? 'border-brand-red bg-red-50 shadow-sm'
                                                    : 'border-red-100 bg-white hover:border-red-200 hover:bg-red-50/40',
                                            )}
                                        >
                                            <p className={cn('text-sm font-semibold', budget === b.key ? 'text-brand-red' : 'text-gray-700')}>
                                                {b.label}
                                            </p>
                                            <p className="mt-0.5 text-xs text-gray-400">{b.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Cocinas favoritas */}
                            <div className="space-y-2">
                                <Label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                                    <UtensilsCrossed className="h-4 w-4 text-brand-red opacity-70" />
                                    {t('setup.cuisines_label')}
                                </Label>
                                <div className="flex flex-wrap gap-2">
                                    {CUISINES.map(c => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => toggleCuisine(c)}
                                            className={cn(
                                                'cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-all duration-150',
                                                cuisines.includes(c)
                                                    ? 'border-brand-red bg-red-50 text-brand-red shadow-sm'
                                                    : 'border-gray-200 bg-white text-gray-600 hover:border-red-200 hover:bg-red-50/40',
                                            )}
                                        >
                                            {cuisines.includes(c) ? '✓ ' : ''}{c}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Biografía */}
                            <div className="space-y-1.5">
                                <Label className="text-sm font-semibold text-gray-700">
                                    {t('setup.bio_label')}
                                </Label>
                                <textarea
                                    value={bio}
                                    onChange={e => setBio(e.target.value)}
                                    rows={2}
                                    maxLength={500}
                                    placeholder={t('setup.bio_placeholder')}
                                    className={cn(
                                        'w-full resize-none rounded-xl border border-red-100 bg-white/80 px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400',
                                        'transition-all focus:border-brand-red focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-red/20',
                                    )}
                                />
                            </div>

                        </div>
                    </div>

                    {/* Botones */}
                    <div className="mt-4 flex flex-col gap-2">
                        <Button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className="h-12 w-full cursor-pointer rounded-xl border-0 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]"
                            style={BTN_STYLE}
                        >
                            {saving ? <><Spinner /> {t('setup.saving')}</> : t('setup.save_btn')}
                        </Button>

                        <button
                            type="button"
                            onClick={handleSkip}
                            className="cursor-pointer py-2 text-center text-sm text-gray-400 transition-colors hover:text-gray-600"
                        >
                            {t('setup.skip_btn')}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
