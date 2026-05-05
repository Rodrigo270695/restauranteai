import { Head, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Building2, MapPin, Save, UtensilsCrossed } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { index as exploreIndex } from '@/routes/explore';
import { update as updateProfile } from '@/routes/explore/profile';

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface AuthUser { id: number; name: string; email: string }
interface ProfileData {
    city: string | null;
    bio: string | null;
    preferred_cuisines: string[];
    budget_preference: 'low' | 'medium' | 'high' | null;
}
interface Props { profile: ProfileData | null }

// ─── Constantes de marca ──────────────────────────────────────────────────────
const BTN_STYLE: React.CSSProperties = {
    background: 'linear-gradient(90deg, #E8001A 0%, #CC0010 50%, #8B0008 100%)',
    boxShadow: '0 4px 18px rgba(200,0,10,0.25)',
};

const INPUT_CLS = cn(
    'h-11 pl-10 transition-all',
    'border-gray-200 bg-white placeholder:text-gray-400',
    'focus-visible:border-brand-red focus-visible:ring-brand-red/20',
);

const CUISINES = [
    'Criolla', 'Mariscos', 'Ceviche', 'Parrilla', 'Pollo a la brasa',
    'Vegetariana', 'Pizza', 'Sushi', 'Pasta', 'Hamburguesas',
    'Desayunos', 'Postres', 'Bebidas', 'Chifa', 'Nikkei',
];

type Budget = 'low' | 'medium' | 'high';

export default function ExploreProfile({ profile }: Props) {
    const { t } = useTranslation();
    const { auth, flash } = usePage().props as { auth: { user: AuthUser }; flash?: { success?: boolean } };
    const user = auth.user;

    const [city, setCity]     = useState(profile?.city ?? '');
    const [bio, setBio]       = useState(profile?.bio ?? '');
    const [budget, setBudget] = useState<Budget | null>(profile?.budget_preference ?? null);
    const [cuisines, setCuisines] = useState<string[]>(profile?.preferred_cuisines ?? []);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved]   = useState(false);

    useEffect(() => {
        if (flash?.success) {
            setSaved(true);
            const t = setTimeout(() => setSaved(false), 3000);
            return () => clearTimeout(t);
        }
    }, [flash]);

    const toggleCuisine = (c: string) =>
        setCuisines(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);

    const handleSave = () => {
        setSaving(true);
        router.post(
            updateProfile.url(),
            { city, bio, budget_preference: budget, preferred_cuisines: cuisines },
            { onFinish: () => setSaving(false) },
        );
    };

    const budgets: Array<{ key: Budget; label: string; desc: string }> = [
        { key: 'low',    label: t('explore.budget_low'),    desc: 'Menos de S/ 30' },
        { key: 'medium', label: t('explore.budget_medium'), desc: 'S/ 30 – 80' },
        { key: 'high',   label: t('explore.budget_high'),   desc: 'Más de S/ 80' },
    ];

    return (
        <>
            <Head title={t('explore.profile_title')} />

            <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">

                {/* Encabezado */}
                <div className="mb-8">
                    <button
                        type="button"
                        onClick={() => router.visit(exploreIndex.url())}
                        className="mb-4 flex cursor-pointer items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-800"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver al portal
                    </button>

                    <div className="flex items-center gap-4">
                        <div
                            className="flex h-14 w-14 items-center justify-center rounded-2xl"
                            style={BTN_STYLE}
                        >
                            <UtensilsCrossed className="h-7 w-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{t('explore.profile_title')}</h1>
                            <p className="text-sm text-gray-500">{t('explore.profile_subtitle')}</p>
                        </div>
                    </div>
                </div>

                {/* Aviso de guardado exitoso */}
                {saved && (
                    <div className="mb-6 flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-4">
                        <span className="text-green-500">✓</span>
                        <p className="text-sm font-medium text-green-700">{t('explore.saved')}</p>
                    </div>
                )}

                {/* Info del usuario */}
                <div className="mb-6 flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div
                        className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white"
                        style={BTN_STYLE}
                    >
                        {user.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-400">{user.email}</p>
                    </div>
                </div>

                {/* Formulario */}
                <div className="space-y-5">

                    {/* Ciudad */}
                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-900">
                            <MapPin className="h-4 w-4 text-brand-red" />
                            {t('explore.city_label')}
                        </h2>
                        <div className="relative">
                            <MapPin className="pointer-events-none absolute top-1/2 left-3.5 z-10 h-4 w-4 -translate-y-1/2 text-brand-red opacity-50" />
                            <Input
                                type="text"
                                value={city}
                                onChange={e => setCity(e.target.value)}
                                placeholder={t('explore.city_placeholder')}
                                className={INPUT_CLS}
                            />
                        </div>
                    </div>

                    {/* Presupuesto */}
                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <h2 className="mb-4 text-sm font-bold text-gray-900">{t('explore.budget_label')}</h2>
                        <div className="grid grid-cols-3 gap-3">
                            {budgets.map(b => (
                                <button
                                    key={b.key}
                                    type="button"
                                    onClick={() => setBudget(b.key)}
                                    className={cn(
                                        'cursor-pointer rounded-xl border-2 p-3 text-center transition-all duration-150',
                                        budget === b.key
                                            ? 'border-brand-red bg-red-50 shadow-sm'
                                            : 'border-gray-100 bg-gray-50 hover:border-red-200 hover:bg-red-50/40',
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
                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-900">
                            <UtensilsCrossed className="h-4 w-4 text-brand-red" />
                            {t('explore.cuisines_label')}
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {CUISINES.map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => toggleCuisine(c)}
                                    className={cn(
                                        'cursor-pointer rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all duration-150',
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

                    {/* Bio */}
                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-900">
                            <Building2 className="h-4 w-4 text-brand-red" />
                            {t('explore.bio_label')}
                        </h2>
                        <textarea
                            value={bio}
                            onChange={e => setBio(e.target.value)}
                            rows={3}
                            maxLength={500}
                            placeholder={t('explore.bio_placeholder')}
                            className={cn(
                                'w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400',
                                'transition-all focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20',
                            )}
                        />
                        <p className="mt-1 text-right text-xs text-gray-300">{bio.length}/500</p>
                    </div>

                    {/* Botón guardar */}
                    <Button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-0 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]"
                        style={BTN_STYLE}
                    >
                        {saving ? (
                            <><Spinner /> {t('explore.saving')}</>
                        ) : (
                            <><Save className="h-4 w-4" /> {t('explore.save_btn')}</>
                        )}
                    </Button>

                </div>
            </div>
        </>
    );
}
