import { Head, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    Languages,
    MapPin,
    Save,
    Sparkles,
    Star,
    UtensilsCrossed,
    Wifi,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import TouristExploreLayout from '@/layouts/tourist-explore-layout';
import { index as exploreIndex } from '@/routes/explore';
import { update as updateProfile } from '@/routes/explore/profile';

interface AuthUser {
    id: number;
    name: string;
    email: string;
}

interface ProfileData {
    city: string | null;
    bio: string | null;
    preferred_cuisines: string[];
    budget_preference: 'low' | 'medium' | 'high' | null;
}

type MlPreference = {
    ambiance_id: number | null;
    price_range: 'economico' | 'moderado' | 'premium' | null;
    max_distance_km: number | null;
    party_type_ids: number[];
    dietary_option_ids: number[];
    restaurant_environment_ids: number[];
    recommended_moment_ids: number[];
    service_ids: number[];
    language_ids: number[];
    min_rating: number | null;
};

type CuisineTypeOption = { id: number; name: string; slug: string };
type DistrictOption = { id: number; name: string; province: string };
type BudgetOption = { key: 'low' | 'medium' | 'high'; price_range: string };
type CatalogItem = { id: number; name: string };
type ServiceOption = { id: number; name: string; slug: string };
type LanguageOption = { id: number; name: string; code: string };
type PriceRangeOption = { value: string; label: string; name: string };

interface Props {
    profile: ProfileData | null;
    mlPreference: MlPreference | null;
    catalogs: {
        cuisineTypes: CuisineTypeOption[];
        ambiances: CatalogItem[];
        districts: DistrictOption[];
        budgetOptions: BudgetOption[];
        priceRanges: PriceRangeOption[];
        services: ServiceOption[];
        languages: LanguageOption[];
        partyTypes: CuisineTypeOption[];
        dietaryOptions: CuisineTypeOption[];
        restaurantEnvironments: CuisineTypeOption[];
        recommendedMoments: CuisineTypeOption[];
    };
}

const BTN_STYLE: React.CSSProperties = {
    background: 'linear-gradient(90deg, #E8001A 0%, #CC0010 50%, #8B0008 100%)',
    boxShadow: '0 4px 18px rgba(200,0,10,0.25)',
};

const SELECT_CLS = cn(
    'h-11 w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-800',
    'transition-all focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20',
);

type Budget = 'low' | 'medium' | 'high';

function catalogLabel(slug: string, fallback: string, prefix: string, t: (k: string) => string): string {
    const key = `${prefix}${slug}`;
    const translated = t(key);
    return translated === key ? fallback : translated;
}

function ChipToggle({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'cursor-pointer rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all duration-150',
                active
                    ? 'border-brand-red bg-red-50 text-brand-red shadow-sm'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-red-200 hover:bg-red-50/40',
            )}
        >
            {children}
        </button>
    );
}

function ExploreProfile({ profile, mlPreference, catalogs }: Props) {
    const { t } = useTranslation();
    const { auth } = usePage().props as { auth: { user: AuthUser } };
    const user = auth.user;

    const [city, setCity] = useState(profile?.city ?? '');
    const [bio, setBio] = useState(profile?.bio ?? '');
    const [budget, setBudget] = useState<Budget | null>(profile?.budget_preference ?? null);
    const [cuisines, setCuisines] = useState<string[]>(profile?.preferred_cuisines ?? []);
    const [ambianceId, setAmbianceId] = useState<number | ''>(mlPreference?.ambiance_id ?? '');
    const [priceRange, setPriceRange] = useState<MlPreference['price_range'] | ''>(
        mlPreference?.price_range ?? '',
    );
    const [maxDistance, setMaxDistance] = useState(mlPreference?.max_distance_km?.toString() ?? '');
    const [partyTypeIds, setPartyTypeIds] = useState<number[]>(mlPreference?.party_type_ids ?? []);
    const [dietaryOptionIds, setDietaryOptionIds] = useState<number[]>(
        mlPreference?.dietary_option_ids ?? [],
    );
    const [environmentIds, setEnvironmentIds] = useState<number[]>(
        mlPreference?.restaurant_environment_ids ?? [],
    );
    const [momentIds, setMomentIds] = useState<number[]>(mlPreference?.recommended_moment_ids ?? []);
    const [serviceIds, setServiceIds] = useState<number[]>(mlPreference?.service_ids ?? []);
    const [languageIds, setLanguageIds] = useState<number[]>(mlPreference?.language_ids ?? []);
    const [minRating, setMinRating] = useState<number>(mlPreference?.min_rating ?? 0);
    const [saving, setSaving] = useState(false);

    const toggleCuisine = (slug: string) =>
        setCuisines(prev => (prev.includes(slug) ? prev.filter(x => x !== slug) : [...prev, slug]));

    const toggleId = (ids: number[], id: number, setter: (v: number[]) => void) =>
        setter(ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]);

    const ningunaDietaryId = catalogs.dietaryOptions.find(d => d.slug === 'ninguna')?.id;

    const toggleDietaryOption = (id: number, slug: string) => {
        if (slug === 'ninguna') {
            setDietaryOptionIds([id]);
            return;
        }
        setDietaryOptionIds(prev => {
            const base = ningunaDietaryId ? prev.filter(x => x !== ningunaDietaryId) : prev;
            return base.includes(id) ? base.filter(x => x !== id) : [...base, id];
        });
    };

    const partyTypeOptions = catalogs.partyTypes.map(p => ({
        id: p.id,
        name: catalogLabel(p.slug, p.name, 'explore.party_', t),
    }));

    const dietaryOptions = catalogs.dietaryOptions.map(d => ({
        id: d.id,
        name: catalogLabel(d.slug, d.name, 'explore.dietary_', t),
    }));

    const environmentOptions = catalogs.restaurantEnvironments.map(e => ({
        id: e.id,
        name: catalogLabel(e.slug, e.name, 'explore.environment_', t),
    }));

    const momentOptions = catalogs.recommendedMoments.map(m => ({
        id: m.id,
        name: catalogLabel(m.slug, m.name, 'explore.moment_', t),
    }));

    const budgetLabels: Record<Budget, { label: string; desc: string }> = {
        low: { label: t('explore.budget_low'), desc: t('setup.budget_low_desc') },
        medium: { label: t('explore.budget_medium'), desc: t('setup.budget_medium_desc') },
        high: { label: t('explore.budget_high'), desc: t('setup.budget_high_desc') },
    };

    const handleSave = () => {
        setSaving(true);
        router.post(
            updateProfile.url(),
            {
                city: city || null,
                bio: bio || null,
                budget_preference: budget,
                preferred_cuisines: cuisines,
                ambiance_id: ambianceId || null,
                price_range: priceRange || null,
                max_distance_km: maxDistance ? Number(maxDistance) : null,
                party_type_ids: partyTypeIds,
                dietary_option_ids: dietaryOptionIds,
                restaurant_environment_ids: environmentIds,
                recommended_moment_ids: momentIds,
                service_ids: serviceIds,
                language_ids: languageIds,
                min_rating: minRating >= 3 ? minRating : null,
            },
            { onFinish: () => setSaving(false) },
        );
    };

    const priceRanges =
        catalogs.priceRanges.length > 0
            ? catalogs.priceRanges
            : [
                  { value: 'economico', label: t('explore.budget_low'), name: 'economico' },
                  { value: 'moderado', label: t('explore.budget_medium'), name: 'moderado' },
                  { value: 'premium', label: t('explore.budget_high'), name: 'premium' },
              ];

    return (
        <>
            <Head title={t('explore.profile_title')} />

            <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
                <div className="mb-8">
                    <button
                        type="button"
                        onClick={() => router.visit(exploreIndex.url())}
                        className="mb-4 flex cursor-pointer items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-800"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        {t('explore.back_portal')}
                    </button>

                    <div className="flex items-center gap-4">
                        <div
                            className="flex h-14 w-14 items-center justify-center rounded-2xl"
                            style={BTN_STYLE}
                        >
                            <UtensilsCrossed className="h-7 w-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {t('explore.profile_title')}
                            </h1>
                            <p className="text-sm text-gray-500">{t('explore.profile_subtitle')}</p>
                        </div>
                    </div>
                </div>

                <div className="mb-6 flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div
                        className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white"
                        style={BTN_STYLE}
                    >
                        {user.name
                            .split(' ')
                            .slice(0, 2)
                            .map(w => w[0])
                            .join('')
                            .toUpperCase()}
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-400">{user.email}</p>
                    </div>
                </div>

                <div className="space-y-5">
                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <h2 className="mb-1 flex items-center gap-2 text-sm font-bold text-gray-900">
                            <MapPin className="h-4 w-4 text-brand-red" />
                            {t('explore.district_label')}
                        </h2>
                        <p className="mb-4 text-xs text-gray-500">{t('explore.district_hint')}</p>
                        <div className="relative">
                            <MapPin className="pointer-events-none absolute top-1/2 left-3.5 z-10 h-4 w-4 -translate-y-1/2 text-brand-red opacity-50" />
                            <select
                                value={city}
                                onChange={e => setCity(e.target.value)}
                                className={cn(SELECT_CLS, 'pl-10')}
                            >
                                <option value="">{t('explore.district_placeholder')}</option>
                                {catalogs.districts.map(d => (
                                    <option key={d.id} value={d.name}>
                                        {d.name} — {d.province}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <h2 className="mb-4 text-sm font-bold text-gray-900">{t('explore.budget_label')}</h2>
                        <div className="grid grid-cols-3 gap-3">
                            {catalogs.budgetOptions.map(b => {
                                const labels = budgetLabels[b.key];
                                return (
                                    <button
                                        key={b.key}
                                        type="button"
                                        onClick={() => {
                                            setBudget(b.key);
                                            setPriceRange(b.price_range as MlPreference['price_range']);
                                        }}
                                        className={cn(
                                            'cursor-pointer rounded-xl border-2 p-3 text-center transition-all duration-150',
                                            budget === b.key
                                                ? 'border-brand-red bg-red-50 shadow-sm'
                                                : 'border-gray-100 bg-gray-50 hover:border-red-200 hover:bg-red-50/40',
                                        )}
                                    >
                                        <p
                                            className={cn(
                                                'text-sm font-semibold',
                                                budget === b.key ? 'text-brand-red' : 'text-gray-700',
                                            )}
                                        >
                                            {labels.label}
                                        </p>
                                        <p className="mt-0.5 text-xs text-gray-400">{labels.desc}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <h2 className="mb-1 flex items-center gap-2 text-sm font-bold text-gray-900">
                            <UtensilsCrossed className="h-4 w-4 text-brand-red" />
                            {t('explore.cuisines_label')}
                        </h2>
                        <p className="mb-4 text-xs text-gray-500">{t('explore.cuisines_hint')}</p>
                        <div className="flex flex-wrap gap-2">
                            {catalogs.cuisineTypes.map(c => (
                                <ChipToggle
                                    key={c.slug}
                                    active={cuisines.includes(c.slug)}
                                    onClick={() => toggleCuisine(c.slug)}
                                >
                                    {cuisines.includes(c.slug) ? '✓ ' : ''}
                                    {c.name}
                                </ChipToggle>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <h2 className="mb-1 flex items-center gap-2 text-sm font-bold text-gray-900">
                            <Wifi className="h-4 w-4 text-brand-red" />
                            {t('explore.services_label')}
                        </h2>
                        <p className="mb-4 text-xs text-gray-500">{t('explore.services_hint')}</p>
                        <div className="flex flex-wrap gap-2">
                            {catalogs.services.map(s => (
                                <ChipToggle
                                    key={s.id}
                                    active={serviceIds.includes(s.id)}
                                    onClick={() => toggleId(serviceIds, s.id, setServiceIds)}
                                >
                                    {serviceIds.includes(s.id) ? '✓ ' : ''}
                                    {s.name}
                                </ChipToggle>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <h2 className="mb-1 flex items-center gap-2 text-sm font-bold text-gray-900">
                            <Languages className="h-4 w-4 text-brand-red" />
                            {t('explore.languages_label')}
                        </h2>
                        <p className="mb-4 text-xs text-gray-500">{t('explore.languages_hint')}</p>
                        <div className="flex flex-wrap gap-2">
                            {catalogs.languages.map(l => (
                                <ChipToggle
                                    key={l.id}
                                    active={languageIds.includes(l.id)}
                                    onClick={() => toggleId(languageIds, l.id, setLanguageIds)}
                                >
                                    {languageIds.includes(l.id) ? '✓ ' : ''}
                                    {l.name}
                                </ChipToggle>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-red-100 bg-red-50/30 p-6 shadow-sm">
                        <h2 className="mb-1 flex items-center gap-2 text-sm font-bold text-gray-900">
                            <Sparkles className="h-4 w-4 text-brand-red" />
                            {t('explore.ml_prefs_title')}
                        </h2>
                        <p className="mb-4 text-xs text-gray-500">{t('explore.ml_prefs_desc')}</p>
                        <div className="space-y-4">
                            <div>
                                <Label className="text-xs text-gray-600">{t('explore.ml_ambiance')}</Label>
                                <select
                                    value={ambianceId}
                                    onChange={e =>
                                        setAmbianceId(e.target.value ? Number(e.target.value) : '')
                                    }
                                    className={cn(SELECT_CLS, 'mt-1')}
                                >
                                    <option value="">{t('explore.ml_select_empty')}</option>
                                    {catalogs.ambiances.map(a => (
                                        <option key={a.id} value={a.id}>
                                            {a.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <Label className="text-xs text-gray-600">
                                    {t('explore.ml_price_range')}
                                </Label>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {priceRanges.map(p => (
                                        <button
                                            key={p.value}
                                            type="button"
                                            onClick={() =>
                                                setPriceRange(
                                                    p.value as MlPreference['price_range'],
                                                )
                                            }
                                            className={cn(
                                                'cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium',
                                                priceRange === p.value
                                                    ? 'border-brand-red bg-brand-red text-white'
                                                    : 'border-gray-200 bg-white text-gray-700',
                                            )}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <Label className="flex items-center gap-1 text-xs text-gray-600">
                                    <Star className="h-3.5 w-3.5 text-amber-500" />
                                    {t('explore.min_rating_label')}
                                </Label>
                                <p className="mb-2 text-xs text-gray-400">{t('explore.min_rating_hint')}</p>
                                <div className="flex flex-wrap gap-2">
                                    {[0, 3, 3.5, 4, 4.5, 5].map(r => (
                                        <button
                                            key={r}
                                            type="button"
                                            onClick={() => setMinRating(r)}
                                            className={cn(
                                                'cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium',
                                                minRating === r
                                                    ? 'border-brand-red bg-brand-red text-white'
                                                    : 'border-gray-200 bg-white',
                                            )}
                                        >
                                            {r === 0
                                                ? t('explore.ml_select_empty')
                                                : `${r}+`}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <Label className="text-xs text-gray-600">
                                    {t('explore.ml_max_distance')}
                                </Label>
                                <Input
                                    type="number"
                                    min={0.5}
                                    max={200}
                                    step={0.5}
                                    value={maxDistance}
                                    onChange={e => setMaxDistance(e.target.value)}
                                    placeholder="10"
                                    className="mt-1 h-11"
                                />
                            </div>

                            <div>
                                <Label className="text-xs text-gray-600">
                                    {t('explore.ml_party_type')}
                                </Label>
                                <p className="mb-2 text-xs text-gray-400">{t('explore.ml_multi_hint')}</p>
                                <div className="flex flex-wrap gap-2">
                                    <ChipToggle
                                        active={partyTypeIds.length === 0}
                                        onClick={() => setPartyTypeIds([])}
                                    >
                                        {t('explore.ml_select_empty')}
                                    </ChipToggle>
                                    {partyTypeOptions.map(p => {
                                        const active = partyTypeIds.includes(p.id);
                                        return (
                                            <ChipToggle
                                                key={p.id}
                                                active={active}
                                                onClick={() => toggleId(partyTypeIds, p.id, setPartyTypeIds)}
                                            >
                                                {active ? '✓ ' : ''}
                                                {p.name}
                                            </ChipToggle>
                                        );
                                    })}
                                </div>
                            </div>
                            <div>
                                <Label className="text-xs text-gray-600">
                                    {t('explore.ml_dietary')}
                                </Label>
                                <p className="mb-2 text-xs text-gray-400">{t('explore.ml_multi_hint')}</p>
                                <div className="flex flex-wrap gap-2">
                                    <ChipToggle
                                        active={dietaryOptionIds.length === 0}
                                        onClick={() => setDietaryOptionIds([])}
                                    >
                                        {t('explore.ml_select_empty')}
                                    </ChipToggle>
                                    {dietaryOptions.map(d => {
                                        const slug =
                                            catalogs.dietaryOptions.find(x => x.id === d.id)?.slug ?? '';
                                        const active = dietaryOptionIds.includes(d.id);
                                        return (
                                            <ChipToggle
                                                key={d.id}
                                                active={active}
                                                onClick={() => toggleDietaryOption(d.id, slug)}
                                            >
                                                {active ? '✓ ' : ''}
                                                {d.name}
                                            </ChipToggle>
                                        );
                                    })}
                                </div>
                            </div>
                            <div>
                                <Label className="text-xs text-gray-600">
                                    {t('explore.ml_restaurant_environment')}
                                </Label>
                                <p className="mb-2 text-xs text-gray-400">{t('explore.ml_multi_hint')}</p>
                                <div className="flex flex-wrap gap-2">
                                    <ChipToggle
                                        active={environmentIds.length === 0}
                                        onClick={() => setEnvironmentIds([])}
                                    >
                                        {t('explore.ml_select_empty')}
                                    </ChipToggle>
                                    {environmentOptions.map(e => {
                                        const active = environmentIds.includes(e.id);
                                        return (
                                            <ChipToggle
                                                key={e.id}
                                                active={active}
                                                onClick={() => toggleId(environmentIds, e.id, setEnvironmentIds)}
                                            >
                                                {active ? '✓ ' : ''}
                                                {e.name}
                                            </ChipToggle>
                                        );
                                    })}
                                </div>
                            </div>
                            <div>
                                <Label className="text-xs text-gray-600">
                                    {t('explore.ml_recommended_moment')}
                                </Label>
                                <p className="mb-2 text-xs text-gray-400">{t('explore.ml_multi_hint')}</p>
                                <div className="flex flex-wrap gap-2">
                                    <ChipToggle
                                        active={momentIds.length === 0}
                                        onClick={() => setMomentIds([])}
                                    >
                                        {t('explore.ml_select_empty')}
                                    </ChipToggle>
                                    {momentOptions.map(m => {
                                        const active = momentIds.includes(m.id);
                                        return (
                                            <ChipToggle
                                                key={m.id}
                                                active={active}
                                                onClick={() => toggleId(momentIds, m.id, setMomentIds)}
                                            >
                                                {active ? '✓ ' : ''}
                                                {m.name}
                                            </ChipToggle>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

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

                    <Button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-0 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]"
                        style={BTN_STYLE}
                    >
                        {saving ? (
                            <>
                                <Spinner /> {t('explore.saving')}
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4" /> {t('explore.save_btn')}
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </>
    );
}

ExploreProfile.layout = (page: React.ReactNode) => (
    <TouristExploreLayout>{page}</TouristExploreLayout>
);

export default ExploreProfile;
