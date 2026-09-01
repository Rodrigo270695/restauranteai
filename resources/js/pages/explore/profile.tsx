import { Head, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    Check,
    ChevronDown,
    Lock,
    MapPin,
    Settings2,
    Sparkles,
    Star,
    UtensilsCrossed,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import TouristExploreLayout from '@/layouts/tourist-explore-layout';
import { type Budget, normalizeBudgets, toggleBudgetSelection } from '@/lib/tourist-budget';
import { cn } from '@/lib/utils';
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
    budget_preference: Budget[] | null;
}

type MlPreference = {
    ambiance_id: number | null;
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

interface Props {
    profile: ProfileData | null;
    mlPreference: MlPreference | null;
    catalogs: {
        cuisineTypes: CuisineTypeOption[];
        ambiances: CatalogItem[];
        districts: DistrictOption[];
        budgetOptions: BudgetOption[];
        services: ServiceOption[];
        languages: LanguageOption[];
        partyTypes: CuisineTypeOption[];
        dietaryOptions: CuisineTypeOption[];
        restaurantEnvironments: CuisineTypeOption[];
        recommendedMoments: CuisineTypeOption[];
    };
}

type Accent = 'violet' | 'green' | 'orange' | 'sky' | 'pink' | 'indigo';

const ACCENT: Record<
    Accent,
    { icon: string; num: string; pill: string; hint: string; box: string }
> = {
    violet: {
        icon: 'bg-violet-100 text-violet-700',
        num: 'bg-violet-600 text-white',
        pill: 'border-violet-500 bg-violet-50 text-violet-700',
        hint: 'text-violet-600',
        box: 'border-violet-500 bg-violet-50',
    },
    green: {
        icon: 'bg-emerald-100 text-emerald-700',
        num: 'bg-emerald-600 text-white',
        pill: 'border-emerald-500 bg-emerald-50 text-emerald-700',
        hint: 'text-emerald-600',
        box: 'border-emerald-500 bg-emerald-50',
    },
    orange: {
        icon: 'bg-orange-100 text-brand-orange',
        num: 'bg-brand-orange text-white',
        pill: 'border-brand-orange bg-orange-50 text-brand-orange',
        hint: 'text-brand-orange',
        box: 'border-brand-orange bg-orange-50',
    },
    sky: {
        icon: 'bg-sky-100 text-sky-700',
        num: 'bg-sky-600 text-white',
        pill: 'border-sky-500 bg-sky-50 text-sky-700',
        hint: 'text-sky-600',
        box: 'border-sky-500 bg-sky-50',
    },
    pink: {
        icon: 'bg-pink-100 text-pink-700',
        num: 'bg-pink-600 text-white',
        pill: 'border-pink-500 bg-pink-50 text-pink-700',
        hint: 'text-pink-600',
        box: 'border-pink-500 bg-pink-50',
    },
    indigo: {
        icon: 'bg-indigo-100 text-indigo-700',
        num: 'bg-indigo-700 text-white',
        pill: 'border-indigo-500 bg-indigo-50 text-indigo-800',
        hint: 'text-indigo-700',
        box: 'border-indigo-500 bg-indigo-50',
    },
};

const SAVE_BTN: React.CSSProperties = {
    background: 'linear-gradient(90deg, #002366 0%, #FF8C00 100%)',
    boxShadow: '0 8px 22px rgba(0, 35, 102, 0.28)',
};

function catalogLabel(slug: string, fallback: string, prefix: string, t: (k: string) => string): string {
    const key = `${prefix}${slug}`;
    const translated = t(key);
    return translated === key ? fallback : translated;
}

function PreferenceCard({
    accent,
    number,
    icon,
    title,
    subtitle,
    hint,
    children,
}: {
    accent: Accent;
    number: number;
    icon: ReactNode;
    title: string;
    subtitle: string;
    hint: string;
    children: ReactNode;
}) {
    const theme = ACCENT[accent];

    return (
        <article className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-start gap-2.5">
                <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-full', theme.icon)}>
                    {icon}
                </span>
                <span className={cn('flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold', theme.num)}>
                    {number}
                </span>
                <div className="min-w-0">
                    <h2 className="text-sm font-bold text-brand-blue">{title}</h2>
                    <p className="text-xs text-gray-400">{subtitle}</p>
                </div>
            </div>
            <div className="min-h-0 flex-1">{children}</div>
            <p className={cn('mt-3 flex items-center gap-1.5 text-[11px] font-medium', theme.hint)}>
                <span className={cn('size-1.5 rounded-full', theme.num)} />
                {hint}
            </p>
        </article>
    );
}

function Pill({
    active,
    accent,
    onClick,
    starred,
    children,
}: {
    active: boolean;
    accent: Accent;
    onClick: () => void;
    starred?: boolean;
    children: React.ReactNode;
}) {
    const theme = ACCENT[accent];

    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'inline-flex cursor-pointer items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                active ? theme.pill : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300',
            )}
        >
            {active && <Check className="size-3.5" strokeWidth={3} />}
            {starred && <Star className="size-3 fill-current" />}
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
    const [budgets, setBudgets] = useState<Budget[]>(normalizeBudgets(profile?.budget_preference ?? null));
    const [cuisines, setCuisines] = useState<string[]>(profile?.preferred_cuisines ?? []);
    const [ambianceId, setAmbianceId] = useState<number | ''>(mlPreference?.ambiance_id ?? '');
    const [maxDistance, setMaxDistance] = useState(mlPreference?.max_distance_km?.toString() ?? '');
    const [partyTypeIds, setPartyTypeIds] = useState<number[]>(mlPreference?.party_type_ids ?? []);
    const [dietaryOptionIds, setDietaryOptionIds] = useState<number[]>(mlPreference?.dietary_option_ids ?? []);
    const [environmentIds, setEnvironmentIds] = useState<number[]>(mlPreference?.restaurant_environment_ids ?? []);
    const [momentIds, setMomentIds] = useState<number[]>(mlPreference?.recommended_moment_ids ?? []);
    const [serviceIds, setServiceIds] = useState<number[]>(mlPreference?.service_ids ?? []);
    const [languageIds, setLanguageIds] = useState<number[]>(mlPreference?.language_ids ?? []);
    const [minRating, setMinRating] = useState<number>(mlPreference?.min_rating ?? 0);
    const [saving, setSaving] = useState(false);
    const [showMore, setShowMore] = useState(false);

    const toggleCuisine = (slug: string) =>
        setCuisines((prev) => (prev.includes(slug) ? prev.filter((x) => x !== slug) : [...prev, slug]));

    const toggleId = (ids: number[], id: number, setter: (v: number[]) => void) =>
        setter(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);

    const ningunaDietaryId = catalogs.dietaryOptions.find((d) => d.slug === 'ninguna')?.id;

    const toggleDietaryOption = (id: number, slug: string) => {
        if (slug === 'ninguna') {
            setDietaryOptionIds([id]);
            return;
        }
        setDietaryOptionIds((prev) => {
            const base = ningunaDietaryId ? prev.filter((x) => x !== ningunaDietaryId) : prev;
            return base.includes(id) ? base.filter((x) => x !== id) : [...base, id];
        });
    };

    const partyTypeOptions = catalogs.partyTypes.map((p) => ({
        id: p.id,
        name: catalogLabel(p.slug, p.name, 'explore.party_', t),
    }));

    const dietaryOptions = catalogs.dietaryOptions.map((d) => ({
        id: d.id,
        name: catalogLabel(d.slug, d.name, 'explore.dietary_', t),
    }));

    const environmentOptions = catalogs.restaurantEnvironments.map((e) => ({
        id: e.id,
        name: catalogLabel(e.slug, e.name, 'explore.environment_', t),
    }));

    const momentOptions = catalogs.recommendedMoments.map((m) => ({
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
                budget_preference: budgets.length > 0 ? budgets : null,
                preferred_cuisines: cuisines,
                ambiance_id: ambianceId || null,
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

    const initials = user.name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase();

    return (
        <>
            <Head title={t('explore.profile_title')} />

            <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
                <button
                    type="button"
                    onClick={() => router.visit(exploreIndex.url())}
                    className="mb-5 flex cursor-pointer items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-brand-blue"
                >
                    <ArrowLeft className="h-4 w-4" />
                    {t('explore.back_portal')}
                </button>

                <div className="mb-8 grid gap-4 lg:grid-cols-[1fr_minmax(16rem,20rem)] lg:items-start">
                    <div>
                        <div className="mb-3 flex items-center gap-3">
                            <span className="flex size-10 items-center justify-center rounded-xl bg-orange-50 text-brand-orange">
                                <Sparkles className="size-5" />
                            </span>
                            <h1 className="text-3xl font-bold tracking-tight text-brand-blue sm:text-4xl">
                                {t('explore.personalize_lead')}{' '}
                                <span className="text-brand-orange">{t('explore.personalize_rest')}</span>
                            </h1>
                        </div>
                        <p className="max-w-xl text-sm text-gray-500 sm:text-base">{t('explore.personalize_desc')}</p>
                        <div className="mt-4 flex items-center gap-3">
                            <span className="flex size-10 items-center justify-center rounded-full bg-brand-orange text-sm font-bold text-white">
                                {initials}
                            </span>
                            <div>
                                <p className="text-sm font-semibold text-brand-blue">{user.name}</p>
                                <p className="text-xs text-gray-400">{user.email}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-start gap-2.5 rounded-2xl border border-violet-100 bg-violet-50/80 px-4 py-3.5">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">
                            i
                        </span>
                        <p className="text-sm leading-relaxed text-violet-900/80">{t('explore.personalize_info')}</p>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <PreferenceCard
                        accent="violet"
                        number={1}
                        icon={<UtensilsCrossed className="size-4" />}
                        title={t('explore.cuisines_label')}
                        subtitle={t('explore.cuisines_hint')}
                        hint={t('explore.card_cuisine_hint')}
                    >
                        <div className="flex flex-wrap gap-2">
                            {catalogs.cuisineTypes.map((c) => (
                                <Pill
                                    key={c.slug}
                                    accent="violet"
                                    active={cuisines.includes(c.slug)}
                                    starred={cuisines[0] === c.slug}
                                    onClick={() => toggleCuisine(c.slug)}
                                >
                                    {c.name}
                                </Pill>
                            ))}
                        </div>
                    </PreferenceCard>

                    <PreferenceCard
                        accent="green"
                        number={2}
                        icon={<span className="text-sm font-bold">S/</span>}
                        title={t('explore.budget_label')}
                        subtitle={t('explore.card_select_one_or_more')}
                        hint={t('explore.card_select_one_or_more')}
                    >
                        <div className="grid gap-2">
                            {catalogs.budgetOptions.map((b) => {
                                const labels = budgetLabels[b.key];
                                const active = budgets.includes(b.key);
                                return (
                                    <button
                                        key={b.key}
                                        type="button"
                                        onClick={() => setBudgets((prev) => toggleBudgetSelection(prev, b.key))}
                                        className={cn(
                                            'relative cursor-pointer rounded-xl border-2 px-3 py-3 text-left transition-all',
                                            active ? ACCENT.green.box : 'border-gray-100 bg-gray-50 hover:border-emerald-200',
                                        )}
                                    >
                                        {active && (
                                            <Check className="absolute top-2.5 right-2.5 size-4 text-emerald-600" strokeWidth={3} />
                                        )}
                                        <p className={cn('text-sm font-semibold', active ? 'text-emerald-800' : 'text-gray-700')}>
                                            {labels.label}
                                        </p>
                                        <p className="text-xs text-gray-400">{labels.desc}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </PreferenceCard>

                    <PreferenceCard
                        accent="orange"
                        number={3}
                        icon={<Sparkles className="size-4" />}
                        title={t('explore.ml_ambiance')}
                        subtitle={t('explore.card_select_one')}
                        hint={t('explore.card_select_one')}
                    >
                        <div className="flex flex-wrap gap-2">
                            {catalogs.ambiances.map((a) => (
                                <Pill
                                    key={a.id}
                                    accent="orange"
                                    active={ambianceId === a.id}
                                    onClick={() => setAmbianceId(ambianceId === a.id ? '' : a.id)}
                                >
                                    {a.name}
                                </Pill>
                            ))}
                        </div>
                    </PreferenceCard>

                    <PreferenceCard
                        accent="sky"
                        number={4}
                        icon={<MapPin className="size-4" />}
                        title={t('explore.ml_restaurant_environment')}
                        subtitle={t('explore.ml_multi_hint')}
                        hint={t('explore.card_select_one_or_more')}
                    >
                        <div className="flex flex-wrap gap-2">
                            {environmentOptions.map((e) => (
                                <Pill
                                    key={e.id}
                                    accent="sky"
                                    active={environmentIds.includes(e.id)}
                                    onClick={() => toggleId(environmentIds, e.id, setEnvironmentIds)}
                                >
                                    {e.name}
                                </Pill>
                            ))}
                        </div>
                    </PreferenceCard>

                    <PreferenceCard
                        accent="pink"
                        number={5}
                        icon={<Sparkles className="size-4" />}
                        title={t('explore.ml_party_type')}
                        subtitle={t('explore.ml_multi_hint')}
                        hint={t('explore.card_select_one_or_more')}
                    >
                        <div className="flex flex-wrap gap-2">
                            {partyTypeOptions.map((p) => (
                                <Pill
                                    key={p.id}
                                    accent="pink"
                                    active={partyTypeIds.includes(p.id)}
                                    onClick={() => toggleId(partyTypeIds, p.id, setPartyTypeIds)}
                                >
                                    {p.name}
                                </Pill>
                            ))}
                        </div>
                    </PreferenceCard>

                    <PreferenceCard
                        accent="indigo"
                        number={6}
                        icon={<MapPin className="size-4" />}
                        title={t('explore.district_label')}
                        subtitle={t('explore.district_hint')}
                        hint={t('explore.card_select_one')}
                    >
                        <div className="relative">
                            <MapPin className="pointer-events-none absolute top-1/2 left-3.5 z-10 h-4 w-4 -translate-y-1/2 text-indigo-500" />
                            <select
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-white pr-4 pl-10 text-sm text-gray-800 transition-all focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            >
                                <option value="">{t('explore.district_placeholder')}</option>
                                {catalogs.districts.map((d) => (
                                    <option key={d.id} value={d.name}>
                                        {d.name} — {d.province}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </PreferenceCard>
                </div>

                <div className="mt-5 rounded-2xl border border-gray-100 bg-white shadow-sm">
                    <button
                        type="button"
                        onClick={() => setShowMore((v) => !v)}
                        className="flex w-full cursor-pointer items-center justify-between gap-3 px-5 py-4 text-left"
                    >
                        <span className="flex items-center gap-2.5 text-sm font-bold text-brand-blue">
                            <Settings2 className="size-4 text-gray-400" />
                            {t('explore.additional_prefs')}
                        </span>
                        <span className="flex items-center gap-1 text-sm font-medium text-brand-orange">
                            {showMore ? t('explore.show_less') : t('explore.show_more')}
                            <ChevronDown className={cn('size-4 transition-transform', showMore && 'rotate-180')} />
                        </span>
                    </button>

                    {showMore && (
                        <div className="space-y-6 border-t border-gray-100 px-5 py-5">
                            <div>
                                <Label className="text-sm font-semibold text-gray-800">{t('explore.services_label')}</Label>
                                <p className="mb-2 text-xs text-gray-400">{t('explore.services_hint')}</p>
                                <div className="flex flex-wrap gap-2">
                                    {catalogs.services.map((s) => (
                                        <Pill
                                            key={s.id}
                                            accent="orange"
                                            active={serviceIds.includes(s.id)}
                                            onClick={() => toggleId(serviceIds, s.id, setServiceIds)}
                                        >
                                            {s.name}
                                        </Pill>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <Label className="text-sm font-semibold text-gray-800">{t('explore.languages_label')}</Label>
                                <p className="mb-2 text-xs text-gray-400">{t('explore.languages_hint')}</p>
                                <div className="flex flex-wrap gap-2">
                                    {catalogs.languages.map((l) => (
                                        <Pill
                                            key={l.id}
                                            accent="sky"
                                            active={languageIds.includes(l.id)}
                                            onClick={() => toggleId(languageIds, l.id, setLanguageIds)}
                                        >
                                            {l.name}
                                        </Pill>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <Label className="text-sm font-semibold text-gray-800">{t('explore.ml_dietary')}</Label>
                                <p className="mb-2 text-xs text-gray-400">{t('explore.ml_multi_hint')}</p>
                                <div className="flex flex-wrap gap-2">
                                    <Pill
                                        accent="violet"
                                        active={dietaryOptionIds.length === 0}
                                        onClick={() => setDietaryOptionIds([])}
                                    >
                                        {t('explore.ml_select_empty')}
                                    </Pill>
                                    {dietaryOptions.map((d) => {
                                        const slug = catalogs.dietaryOptions.find((x) => x.id === d.id)?.slug ?? '';
                                        return (
                                            <Pill
                                                key={d.id}
                                                accent="violet"
                                                active={dietaryOptionIds.includes(d.id)}
                                                onClick={() => toggleDietaryOption(d.id, slug)}
                                            >
                                                {d.name}
                                            </Pill>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <Label className="text-sm font-semibold text-gray-800">{t('explore.ml_recommended_moment')}</Label>
                                <p className="mb-2 text-xs text-gray-400">{t('explore.ml_multi_hint')}</p>
                                <div className="flex flex-wrap gap-2">
                                    {momentOptions.map((m) => (
                                        <Pill
                                            key={m.id}
                                            accent="pink"
                                            active={momentIds.includes(m.id)}
                                            onClick={() => toggleId(momentIds, m.id, setMomentIds)}
                                        >
                                            {m.name}
                                        </Pill>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <Label className="flex items-center gap-1 text-sm font-semibold text-gray-800">
                                    <Star className="size-3.5 text-amber-500" />
                                    {t('explore.min_rating_label')}
                                </Label>
                                <p className="mb-2 text-xs text-gray-400">{t('explore.min_rating_hint')}</p>
                                <div className="flex flex-wrap gap-2">
                                    {[0, 3, 3.5, 4, 4.5, 5].map((r) => (
                                        <Pill
                                            key={r}
                                            accent="orange"
                                            active={minRating === r}
                                            onClick={() => setMinRating(r)}
                                        >
                                            {r === 0 ? t('explore.ml_select_empty') : `${r}+`}
                                        </Pill>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <Label className="text-sm font-semibold text-gray-800">{t('explore.ml_max_distance')}</Label>
                                <Input
                                    type="number"
                                    min={0.5}
                                    max={200}
                                    step={0.5}
                                    value={maxDistance}
                                    onChange={(e) => setMaxDistance(e.target.value)}
                                    placeholder="10"
                                    className="mt-1 h-11 max-w-xs"
                                />
                            </div>

                            <div>
                                <Label className="text-sm font-semibold text-gray-800">{t('explore.bio_label')}</Label>
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    rows={3}
                                    maxLength={500}
                                    placeholder={t('explore.bio_placeholder')}
                                    className="mt-1 w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange/20"
                                />
                                <p className="mt-1 text-right text-xs text-gray-300">{bio.length}/500</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button
                        type="button"
                        onClick={() => router.visit(exploreIndex.url())}
                        className="cursor-pointer rounded-xl border-2 border-brand-blue px-5 py-2.5 text-sm font-semibold text-brand-blue transition hover:bg-brand-blue/5"
                    >
                        {t('explore.back_portal')}
                    </button>

                    <div className="flex flex-col items-stretch gap-2 sm:items-end">
                        <Button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className="h-12 cursor-pointer rounded-xl border-0 px-6 text-sm font-semibold text-white hover:brightness-110"
                            style={SAVE_BTN}
                        >
                            {saving ? (
                                <>
                                    <Spinner /> {t('explore.saving')}
                                </>
                            ) : (
                                <>
                                    {t('explore.save_continue')}
                                    <ArrowRight className="size-4" />
                                </>
                            )}
                        </Button>
                        <p className="flex items-center gap-1.5 text-[11px] text-gray-400">
                            <Lock className="size-3" />
                            {t('explore.prefs_secure')}
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}

ExploreProfile.layout = (page: React.ReactNode) => (
    <TouristExploreLayout>{page}</TouristExploreLayout>
);

export default ExploreProfile;
