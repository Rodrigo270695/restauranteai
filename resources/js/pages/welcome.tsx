import { Head, Link, usePage } from '@inertiajs/react';
import { ChefHat, MapPin, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { RestaurantCardData } from '@/components/explore/restaurant-card';
import { WelcomeRestaurantsBrowse } from '@/components/public/welcome-restaurants-browse';
import type { PaginationMeta } from '@/components/shared/pagination-links';
import { useLanguageSync } from '@/hooks/use-language-sync';
import { cn } from '@/lib/utils';
import { login, register } from '@/routes';

const BTN_PRIMARY: React.CSSProperties = {
    background: 'linear-gradient(90deg, #E8001A 0%, #CC0010 50%, #8B0008 100%)',
    boxShadow: '0 4px 18px rgba(200,0,10,0.28)',
};

const FEATURES = [
    { icon: Sparkles, key: 'feature1' },
    { icon: ChefHat, key: 'feature2' },
    { icon: MapPin, key: 'feature3' },
] as const;

type PriceRangeOption = { value: string; label: string; name: string; hint?: string | null };

type Props = {
    canRegister?: boolean;
    restaurants?: PaginationMeta & { data: (RestaurantCardData & { is_featured?: boolean })[] };
    cuisineTypes?: { id: number; name: string }[];
    districts?: { id: number; name: string }[];
    priceRanges?: PriceRangeOption[];
    filters?: {
        search?: string;
        cuisine_type_id?: number | null;
        price_range?: string | null;
        district_id?: number | null;
        sort?: string;
    };
};

export default function Welcome({
    canRegister = true,
    restaurants = { data: [], current_page: 1, last_page: 1, from: null, to: null, total: 0, per_page: 12, path: '/' },
    cuisineTypes = [],
    districts = [],
    priceRanges = [],
    filters = {},
}: Props) {
    const { t } = useTranslation();
    useLanguageSync();
    const { auth } = usePage().props as { auth?: { user?: { name: string } | null; roles?: string[] } };
    const roles = auth?.roles ?? [];
    const isTourist = Boolean(auth?.user && roles.includes('tourist'));
    const isOwner = Boolean(auth?.user && roles.includes('restaurant_owner'));

    return (
        <>
            <Head title={t('welcome.hero_title')} />

            {/* Hero unificado: marca + features */}
            <section
                className="relative overflow-hidden pt-28 pb-10 lg:pt-32 lg:pb-12"
                style={{
                    background:
                        'linear-gradient(135deg, #FFF8F0 0%, #FFFFFF 45%, #FFF0E8 75%, #FFE4D8 100%)',
                }}
            >
                <div
                    className="pointer-events-none absolute -right-20 -top-20 h-[480px] w-[480px] rounded-full opacity-[0.18]"
                    style={{ background: 'radial-gradient(circle, #E8001A, transparent 70%)' }}
                />

                <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-12">
                        <div className="flex-1 space-y-5 text-center lg:text-left">
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E8001A]">
                                Chiclayo · Lambayeque
                            </p>
                            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl xl:text-6xl">
                                {t('welcome.hero_title')}{' '}
                                <span
                                    className="bg-clip-text text-transparent"
                                    style={{ backgroundImage: 'linear-gradient(90deg, #E8001A, #FF6B00)' }}
                                >
                                    {t('welcome.hero_highlight')}
                                </span>
                            </h1>
                            <p className="mx-auto max-w-xl text-base text-gray-600 sm:text-lg lg:mx-0">
                                {t('welcome.hero_subtitle')}
                            </p>

                            <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                                <a
                                    href="#restaurantes"
                                    className="cursor-pointer rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] sm:text-base"
                                    style={BTN_PRIMARY}
                                >
                                    {t('welcome.cta_explore')}
                                </a>
                                {canRegister && (
                                    <Link
                                        href={register()}
                                        className="cursor-pointer rounded-xl border border-gray-200/80 bg-white/90 px-6 py-3 text-sm font-semibold text-gray-800 shadow-sm backdrop-blur-sm transition-all hover:bg-white sm:text-base"
                                    >
                                        {t('welcome.cta_register')}
                                    </Link>
                                )}
                                {isTourist && (
                                    <Link
                                        href="/explore"
                                        className="cursor-pointer rounded-xl border border-gray-200/80 bg-white/90 px-6 py-3 text-sm font-semibold text-gray-800 shadow-sm backdrop-blur-sm transition-all hover:bg-white sm:text-base"
                                    >
                                        {t('welcome.cta_go_explore')}
                                    </Link>
                                )}
                                {isOwner && (
                                    <Link
                                        href="/owner/pending"
                                        className="cursor-pointer rounded-xl border border-gray-200/80 bg-white/90 px-6 py-3 text-sm font-semibold text-gray-800 shadow-sm backdrop-blur-sm transition-all hover:bg-white sm:text-base"
                                    >
                                        {t('nav.my_panel')}
                                    </Link>
                                )}
                            </div>

                            <div className="flex flex-wrap justify-center gap-6 pt-1 sm:gap-10 lg:justify-start">
                                {[
                                    { value: `${restaurants.total ?? 0}`, label: t('welcome.stat_restaurants') },
                                    { value: '4.8★', label: t('welcome.stat_rating') },
                                    { value: '5K+', label: t('welcome.stat_tourists') },
                                ].map(({ value, label }) => (
                                    <div key={label}>
                                        <p className="text-xl font-extrabold text-gray-900 sm:text-2xl">{value}</p>
                                        <p className="text-[11px] text-gray-500">{label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="hidden shrink-0 lg:block">
                            <img src="/logo.png" alt="DiscoverLambo" className="w-56 xl:w-72 drop-shadow-xl" />
                        </div>
                    </div>

                    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:mt-10">
                        {FEATURES.map(({ icon: Icon, key }) => (
                            <div
                                key={key}
                                className={cn(
                                    'group flex gap-4 rounded-2xl border border-white/60 bg-white/75 p-5 shadow-sm backdrop-blur-sm',
                                    'transition-all duration-300 hover:-translate-y-0.5 hover:border-orange-200/80 hover:bg-white hover:shadow-md',
                                )}
                            >
                                <span
                                    className="flex size-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                                    style={BTN_PRIMARY}
                                >
                                    <Icon className="size-5" />
                                </span>
                                <div className="min-w-0">
                                    <h3 className="text-sm font-bold text-gray-900 sm:text-base">
                                        {t(`welcome.${key}_title`)}
                                    </h3>
                                    <p className="mt-1 text-xs leading-relaxed text-gray-600 sm:text-sm">
                                        {t(`welcome.${key}_desc`)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <WelcomeRestaurantsBrowse
                mode="catalog"
                listPath="/"
                restaurants={restaurants}
                cuisineTypes={cuisineTypes}
                districts={districts}
                priceRanges={priceRanges}
                filters={filters}
            />

            <section
                className="py-16 lg:py-20"
                style={{
                    background:
                        'radial-gradient(ellipse 120% 100% at 60% 30%, #E8001A 0%, #CC0010 35%, #9B0008 65%, #620005 100%)',
                }}
            >
                <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
                    <h2 className="mb-4 text-2xl font-extrabold text-white sm:text-3xl lg:text-4xl">
                        {t('welcome.cta_final_title')}
                    </h2>
                    <p className="mb-8 text-base text-white/70 sm:text-lg">{t('welcome.cta_final_desc')}</p>
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        {!auth?.user && (
                            <Link
                                href={login()}
                                className="cursor-pointer rounded-xl border border-white/30 px-7 py-3.5 text-base font-semibold text-white transition-all hover:bg-white/10"
                            >
                                {t('welcome.login')}
                            </Link>
                        )}
                        {canRegister && (
                            <Link
                                href={register()}
                                className="cursor-pointer rounded-xl px-7 py-3.5 text-base font-semibold text-[#1B3A09] transition-all hover:opacity-90 active:scale-[0.98]"
                                style={{ background: '#FFD000' }}
                            >
                                {t('welcome.cta_register')}
                            </Link>
                        )}
                        {isTourist && (
                            <Link
                                href="/explore"
                                className="cursor-pointer rounded-xl px-7 py-3.5 text-base font-semibold text-[#1B3A09] transition-all hover:opacity-90 active:scale-[0.98]"
                                style={{ background: '#FFD000' }}
                            >
                                {t('welcome.cta_go_explore')}
                            </Link>
                        )}
                    </div>
                </div>
            </section>
        </>
    );
}
