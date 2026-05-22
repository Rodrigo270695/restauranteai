import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    ClipboardList,
    Beef,
    ChefHat,
    Coffee,
    Fish,
    Flame,
    IceCream,
    MapPin,
    Pizza,
    Search,
    Sparkles,
    Star,
    UtensilsCrossed,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { profile as exploreProfile, tamSurvey } from '@/routes/explore';

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface AuthUser { id: number; name: string; email: string }

interface TouristProfile {
    city: string | null;
    bio: string | null;
    preferred_cuisines: string[];
    budget_preference: 'low' | 'medium' | 'high' | null;
    completed: boolean;
}

interface MlPreference {
    cuisine: string | null;
    ambiance: string | null;
    price_range: string | null;
    party_type: string | null;
    dietary_restriction: string | null;
    max_distance_km: number | null;
}

interface Props {
    profile: TouristProfile | null;
    mlPreference: MlPreference | null;
    tamCompleted: boolean;
}

// ─── Categorías de cocina con íconos ─────────────────────────────────────────
const CUISINE_CATEGORIES = [
    { name: 'Criolla',       icon: ChefHat,       color: 'bg-orange-50  text-orange-600  border-orange-100' },
    { name: 'Mariscos',      icon: Fish,           color: 'bg-blue-50    text-blue-600    border-blue-100' },
    { name: 'Ceviche',       icon: Fish,           color: 'bg-cyan-50    text-cyan-600    border-cyan-100' },
    { name: 'Parrilla',      icon: Flame,          color: 'bg-red-50     text-red-600     border-red-100' },
    { name: 'Pollo a la brasa', icon: Beef,        color: 'bg-amber-50   text-amber-600   border-amber-100' },
    { name: 'Vegetariana',   icon: UtensilsCrossed,color: 'bg-green-50   text-green-600   border-green-100' },
    { name: 'Pizza',         icon: Pizza,          color: 'bg-yellow-50  text-yellow-600  border-yellow-100' },
    { name: 'Postres',       icon: IceCream,       color: 'bg-pink-50    text-pink-600    border-pink-100' },
    { name: 'Desayunos',     icon: Coffee,         color: 'bg-lime-50    text-lime-600    border-lime-100' },
    { name: 'Chifa',         icon: UtensilsCrossed,color: 'bg-red-50     text-red-700     border-red-100' },
];

// ─── Presupuesto legible ──────────────────────────────────────────────────────
function BudgetBadge({ budget, t }: { budget: string; t: (k: string) => string }) {
    const map: Record<string, { label: string; cls: string }> = {
        low:    { label: t('explore.budget_low'),    cls: 'bg-green-100 text-green-700' },
        medium: { label: t('explore.budget_medium'), cls: 'bg-amber-100 text-amber-700' },
        high:   { label: t('explore.budget_high'),   cls: 'bg-purple-100 text-purple-700' },
    };
    const cfg = map[budget] ?? map['medium'];
    return (
        <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', cfg.cls)}>
            {cfg.label}
        </span>
    );
}

// ─── Placeholder de recomendación ─────────────────────────────────────────────
function RecommendationSkeleton() {
    return (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="h-36 animate-pulse bg-linear-to-br from-gray-100 to-gray-200" />
            <div className="p-4 space-y-2">
                <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
                <div className="flex items-center gap-1 pt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-gray-200 text-gray-200" />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function ExploreIndex({ profile, mlPreference, tamCompleted }: Props) {
    const { t } = useTranslation();
    const { auth } = usePage().props as { auth: { user: AuthUser } };
    const user = auth.user;
    const firstName = user.name.split(' ')[0];

    const [search, setSearch] = useState('');

    const hasProfile = profile?.completed && (profile.preferred_cuisines.length > 0 || profile.city);

    return (
        <>
            <Head title={t('explore.nav_explore')} />

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

                {/* ── Saludo + búsqueda ─────────────────────────────────── */}
                <section className="mb-10">
                    <div
                        className="relative overflow-hidden rounded-3xl px-6 py-8 sm:px-10 sm:py-10"
                        style={{
                            background: 'linear-gradient(135deg, #E8001A 0%, #CC0010 40%, #8B0008 100%)',
                            boxShadow: '0 20px 60px rgba(200,0,10,0.30)',
                        }}
                    >
                        {/* Decoración de fondo */}
                        <div className="pointer-events-none absolute -right-8 -top-8 h-48 w-48 rounded-full bg-white/5" />
                        <div className="pointer-events-none absolute -bottom-12 -left-6 h-40 w-40 rounded-full bg-white/5" />

                        <div className="relative z-10">
                            <p className="text-sm font-medium text-red-200">{t('explore.greeting')}</p>
                            <h1 className="mt-0.5 text-2xl font-bold text-white sm:text-3xl">
                                {firstName} 👋
                            </h1>
                            <p className="mt-1 text-sm text-red-100">{t('explore.portal_subtitle')}</p>

                            {/* Barra de búsqueda */}
                            <div className="relative mt-6 max-w-xl">
                                <Search className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder={t('explore.search_placeholder')}
                                    className="h-12 w-full rounded-2xl border-0 bg-white/95 pl-11 pr-4 text-sm text-gray-800 shadow-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/60"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                <div className="grid gap-8 lg:grid-cols-3">
                    {/* ── Columna principal ──────────────────────────────── */}
                    <div className="space-y-8 lg:col-span-2">

                        {/* Categorías de cocina */}
                        <section>
                            <h2 className="mb-4 text-lg font-bold text-gray-900">{t('explore.categories_title')}</h2>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4">
                                {CUISINE_CATEGORIES.map(({ name, icon: Icon, color }) => (
                                    <button
                                        key={name}
                                        type="button"
                                        className={cn(
                                            'flex cursor-pointer flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all duration-150 hover:shadow-md hover:-translate-y-0.5',
                                            color,
                                        )}
                                    >
                                        <Icon className="h-6 w-6" />
                                        <span className="text-xs font-semibold leading-tight">{name}</span>
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* Recomendaciones — Próximamente */}
                        <section>
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">{t('explore.recommendations_title')}</h2>
                                    <p className="text-xs text-gray-400">{t('explore.recommendations_desc')}</p>
                                </div>
                                <span className="flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-brand-red">
                                    <Sparkles className="h-3 w-3" />
                                    {t('explore.coming_soon')}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <RecommendationSkeleton key={i} />
                                ))}
                            </div>

                            <div className="mt-4 rounded-2xl border border-dashed border-red-200 bg-red-50/60 p-5 text-center">
                                <Sparkles className="mx-auto mb-2 h-6 w-6 text-brand-red opacity-60" />
                                <p className="text-sm font-medium text-gray-700">{t('explore.coming_soon_desc')}</p>
                            </div>
                        </section>
                    </div>

                    {/* ── Panel lateral ──────────────────────────────────── */}
                    <div className="space-y-5">

                        {/* Perfil gastronómico */}
                        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-sm font-bold text-gray-900">{t('explore.preferences_title')}</h3>
                                <Link
                                    href={exploreProfile.url()}
                                    className="flex cursor-pointer items-center gap-1 text-xs font-medium text-brand-red hover:underline"
                                >
                                    Editar <ArrowRight className="h-3 w-3" />
                                </Link>
                            </div>

                            {hasProfile ? (
                                <div className="space-y-3">
                                    {/* Ciudad */}
                                    {profile?.city && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <MapPin className="h-4 w-4 text-brand-red opacity-60" />
                                            <span>{profile.city}</span>
                                        </div>
                                    )}

                                    {/* Presupuesto */}
                                    {profile?.budget_preference && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-400">{t('explore.budget_label')}:</span>
                                            <BudgetBadge budget={profile.budget_preference} t={t} />
                                        </div>
                                    )}

                                    {/* Cocinas favoritas */}
                                    {profile && profile.preferred_cuisines.length > 0 && (
                                        <div>
                                            <p className="mb-2 text-xs text-gray-400">{t('explore.cuisines_label')}:</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {profile.preferred_cuisines.slice(0, 6).map(c => (
                                                    <span
                                                        key={c}
                                                        className="rounded-full border border-red-100 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-brand-red"
                                                    >
                                                        {c}
                                                    </span>
                                                ))}
                                                {profile.preferred_cuisines.length > 6 && (
                                                    <span className="rounded-full border border-gray-100 bg-gray-50 px-2.5 py-0.5 text-xs text-gray-400">
                                                        +{profile.preferred_cuisines.length - 6}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <UtensilsCrossed className="mx-auto mb-2 h-8 w-8 text-gray-200" />
                                    <p className="text-xs text-gray-400 mb-3">{t('explore.no_preferences')}</p>
                                    <Link
                                        href={exploreProfile.url()}
                                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white transition-all hover:brightness-110"
                                        style={{ background: 'linear-gradient(90deg, #E8001A 0%, #8B0008 100%)' }}
                                    >
                                        <Sparkles className="h-3.5 w-3.5" />
                                        {t('explore.complete_profile_btn')}
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Encuesta TAM */}
                        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                            <div className="mb-3 flex items-center justify-between">
                                <h3 className="text-sm font-bold text-gray-900">{t('explore.tam_card_title')}</h3>
                                {tamCompleted && (
                                    <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                                        {t('explore.tam_card_done')}
                                    </span>
                                )}
                            </div>
                            <p className="mb-4 text-xs text-gray-500">{t('explore.tam_card_desc')}</p>
                            <Link
                                href={tamSurvey.url()}
                                className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-xs font-semibold text-brand-red transition hover:bg-red-100"
                            >
                                <ClipboardList className="h-4 w-4" />
                                {tamCompleted ? t('explore.tam_card_view') : t('explore.tam_card_cta')}
                            </Link>
                        </div>

                        {mlPreference && (
                            <div className="rounded-2xl border border-dashed border-red-100 bg-white p-5 text-xs text-gray-600">
                                <p className="font-semibold text-gray-800">{t('explore.ml_active_title')}</p>
                                <ul className="mt-2 space-y-1">
                                    {mlPreference.cuisine && <li>• {mlPreference.cuisine}</li>}
                                    {mlPreference.ambiance && <li>• {mlPreference.ambiance}</li>}
                                    {mlPreference.price_range && <li>• {mlPreference.price_range}</li>}
                                </ul>
                            </div>
                        )}

                        {/* Estadísticas (placeholder) */}
                        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                            <h3 className="mb-4 text-sm font-bold text-gray-900">{t('explore.activity_title')}</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { labelKey: 'explore.stat_reviews',   value: '0', color: 'text-brand-red' },
                                    { labelKey: 'explore.stat_favorites', value: '0', color: 'text-amber-500' },
                                    { labelKey: 'explore.stat_visits',    value: '0', color: 'text-blue-500' },
                                    { labelKey: 'explore.stat_points',    value: '0', color: 'text-green-500' },
                                ].map(s => (
                                    <div key={s.labelKey} className="rounded-xl bg-gray-50 p-3 text-center">
                                        <p className={cn('text-xl font-bold', s.color)}>{s.value}</p>
                                        <p className="text-xs text-gray-400">{t(s.labelKey)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </>
    );
}
