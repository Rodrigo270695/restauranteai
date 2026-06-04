import { Head, router } from '@inertiajs/react';
import { MapPin, Sparkles, UtensilsCrossed } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { AUTH_CARD_STYLE, AUTH_BTN_STYLE } from '@/lib/auth-styles';
import { type Budget, normalizeBudgets, toggleBudgetSelection } from '@/lib/tourist-budget';
import { store as storeProfile } from '@/routes/profile/setup';

const SELECT_CLS = cn(
    'h-11 w-full appearance-none rounded-xl border border-orange-100 bg-white/80 px-4 text-sm text-gray-800',
    'transition-all focus:border-brand-orange focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/20',
);

interface CuisineTypeOption {
    id: number;
    name: string;
    slug: string;
}

interface DistrictOption {
    id: number;
    name: string;
    province: string;
}

interface BudgetOption {
    key: Budget;
    price_range: string;
}

interface Props {
    user: { name: string; email: string };
    profile: {
        city: string | null;
        bio: string | null;
        budget_preference: Budget[] | null;
        preferred_cuisines: string[];
    } | null;
    cuisineTypes: CuisineTypeOption[];
    districts: DistrictOption[];
    budgetOptions: BudgetOption[];
}

export default function ProfileSetup({
    user,
    profile,
    cuisineTypes,
    districts,
    budgetOptions,
}: Props) {
    const { t } = useTranslation();

    const [city, setCity] = useState(profile?.city ?? '');
    const [bio, setBio] = useState(profile?.bio ?? '');
    const [budgets, setBudgets] = useState<Budget[]>(normalizeBudgets(profile?.budget_preference ?? null));
    const [cuisines, setCuisines] = useState<string[]>(profile?.preferred_cuisines ?? []);
    const [saving, setSaving] = useState(false);
    const [skipping, setSkipping] = useState(false);

    const firstName = user.name.split(' ')[0];

    const toggleCuisine = (slug: string) => {
        setCuisines(prev =>
            prev.includes(slug) ? prev.filter(x => x !== slug) : [...prev, slug],
        );
    };

    const handleSave = () => {
        setSaving(true);
        router.post(
            storeProfile.url(),
            {
                city: city || null,
                bio: bio || null,
                budget_preference: budgets.length > 0 ? budgets : null,
                preferred_cuisines: cuisines,
            },
            { onFinish: () => setSaving(false) },
        );
    };

    const handleSkip = () => {
        setSkipping(true);
        router.post(
            storeProfile.url(),
            { skip: true },
            { onFinish: () => setSkipping(false) },
        );
    };

    const budgetLabels: Record<Budget, { label: string; desc: string }> = {
        low: { label: t('setup.budget_low'), desc: t('setup.budget_low_desc') },
        medium: { label: t('setup.budget_medium'), desc: t('setup.budget_medium_desc') },
        high: { label: t('setup.budget_high'), desc: t('setup.budget_high_desc') },
    };

    return (
        <>
            <Head title={t('setup.title')} />

            <div
                className="min-h-screen"
                style={{
                    background:
                        'linear-gradient(135deg, #FFF8F0 0%, #FFFFFF 40%, #FFF0E8 70%, #FFE4D8 100%)',
                }}
            >
                <header className="flex items-center justify-between px-6 py-4">
                    <img src="/logo.png" alt="DiscoverLambo" className="h-10 w-auto" />
                    <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-brand-orange">
                        {t('setup.step_label')}
                    </span>
                </header>

                <div className="mx-auto max-w-lg px-4 py-8">
                    <div className="mb-8 text-center">
                        <div
                            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
                            style={AUTH_BTN_STYLE}
                        >
                            <Sparkles className="h-8 w-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {t('setup.almost')}{' '}
                            <span className="text-brand-orange">{firstName}!</span>
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">{t('setup.welcome_note')}</p>
                    </div>

                    <div style={AUTH_CARD_STYLE} className="rounded-2xl p-6">
                        <div className="flex flex-col gap-6">
                            <div className="space-y-1.5">
                                <Label className="text-sm font-semibold text-gray-700">
                                    {t('setup.city_label')}
                                </Label>
                                <div className="relative">
                                    <MapPin className="pointer-events-none absolute top-1/2 left-3.5 z-10 h-4 w-4 -translate-y-1/2 text-brand-orange opacity-60" />
                                    <select
                                        value={city}
                                        onChange={e => setCity(e.target.value)}
                                        className={cn(SELECT_CLS, 'pl-10')}
                                    >
                                        <option value="">{t('setup.city_placeholder')}</option>
                                        {districts.map(d => (
                                            <option key={d.id} value={d.name}>
                                                {d.name} — {d.province}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-gray-700">
                                    {t('setup.budget_label')}
                                </Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {budgetOptions.map(b => {
                                        const labels = budgetLabels[b.key];
                                        return (
                                            <button
                                                key={b.key}
                                                type="button"
                                                onClick={() => setBudgets(prev => toggleBudgetSelection(prev, b.key))}
                                                className={cn(
                                                    'cursor-pointer rounded-xl border-2 p-3 text-center transition-all duration-150',
                                                    budgets.includes(b.key)
                                                        ? 'border-brand-orange bg-orange-50 shadow-sm'
                                                        : 'border-orange-100 bg-white hover:border-orange-200 hover:bg-orange-50/40',
                                                )}
                                            >
                                                <p
                                                    className={cn(
                                                        'text-sm font-semibold',
                                                        budgets.includes(b.key)
                                                            ? 'text-brand-orange'
                                                            : 'text-gray-700',
                                                    )}
                                                >
                                                    {labels.label}
                                                </p>
                                                <p className="mt-0.5 text-xs text-gray-400">
                                                    {labels.desc}
                                                </p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                                    <UtensilsCrossed className="h-4 w-4 text-brand-orange opacity-70" />
                                    {t('setup.cuisines_label')}
                                </Label>
                                {cuisineTypes.length === 0 ? (
                                    <p className="text-xs text-gray-500">{t('setup.cuisines_empty')}</p>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {cuisineTypes.map(c => (
                                            <button
                                                key={c.slug}
                                                type="button"
                                                onClick={() => toggleCuisine(c.slug)}
                                                className={cn(
                                                    'cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-all duration-150',
                                                    cuisines.includes(c.slug)
                                                        ? 'border-brand-orange bg-orange-50 text-brand-orange shadow-sm'
                                                        : 'border-gray-200 bg-white text-gray-600 hover:border-orange-200 hover:bg-orange-50/40',
                                                )}
                                            >
                                                {cuisines.includes(c.slug) ? '✓ ' : ''}
                                                {c.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

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
                                        'w-full resize-none rounded-xl border border-orange-100 bg-white/80 px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400',
                                        'transition-all focus:border-brand-orange focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/20',
                                    )}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-2">
                        <Button
                            type="button"
                            onClick={handleSave}
                            disabled={saving || skipping}
                            className="h-12 w-full cursor-pointer rounded-xl border-0 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]"
                            style={AUTH_BTN_STYLE}
                        >
                            {saving ? (
                                <>
                                    <Spinner /> {t('setup.saving')}
                                </>
                            ) : (
                                t('setup.save_btn')
                            )}
                        </Button>

                        <button
                            type="button"
                            onClick={handleSkip}
                            disabled={saving || skipping}
                            className="cursor-pointer py-2 text-center text-sm text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-50"
                        >
                            {skipping ? t('setup.skipping') : t('setup.skip_btn')}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
