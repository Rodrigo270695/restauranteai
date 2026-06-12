import { Head, Link, usePage } from '@inertiajs/react';
import { Search, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { RestaurantCardData } from '@/components/explore/restaurant-card';
import { WelcomeHeroCarousel } from '@/components/public/welcome-hero-carousel';
import { WelcomeHeroAiBadge, WelcomeHeroMiskiFloat } from '@/components/public/welcome-hero-extras';
import { WelcomeHeroSearch } from '@/components/public/welcome-hero-search';
import { WelcomeRestaurantsBrowse } from '@/components/public/welcome-restaurants-browse';
import type { PaginationMeta } from '@/components/shared/pagination-links';
import { useLanguageSync } from '@/hooks/use-language-sync';
import { cn } from '@/lib/utils';
import { login, register } from '@/routes';

const HERO_CTA_STYLE = {
    backgroundColor: '#ffa300',
    boxShadow: '0 8px 24px rgba(255, 163, 0, 0.35)',
} as const;

type PriceRangeOption = { value: string; label: string; name: string; hint?: string | null };

type Props = {
    canRegister?: boolean;
    restaurants?: PaginationMeta & { data: (RestaurantCardData & { is_featured?: boolean })[] };
    cuisineTypes?: { id: number; name: string; slug?: string }[];
    districts?: { id: number; name: string }[];
    ambiances?: { id: number; name: string }[];
    priceRanges?: PriceRangeOption[];
    filters?: {
        search?: string;
        cuisine_type_id?: number | null;
        price_range?: string | null;
        district_id?: number | null;
        ambiance_id?: number | null;
        min_rating?: number | null;
        open_now?: boolean;
        featured_only?: boolean;
        sort?: string;
    };
};

export default function Welcome({
    canRegister = true,
    restaurants = { data: [], current_page: 1, last_page: 1, from: null, to: null, total: 0, per_page: 12, path: '/' },
    cuisineTypes = [],
    districts = [],
    ambiances = [],
    priceRanges = [],
    filters = {},
}: Props) {
    const { t } = useTranslation();
    useLanguageSync();
    const { auth } = usePage().props as { auth?: { user?: { name: string } | null; roles?: string[] } };
    const roles = auth?.roles ?? [];
    const isTourist = Boolean(auth?.user && roles.includes('tourist'));
    const isOwner = Boolean(auth?.user && roles.includes('restaurant_owner'));

    const recommendHref = isTourist ? '/explore' : canRegister ? register() : login();

    return (
        <>
            <Head title={t('welcome.hero_headline')} />

            <section className="relative min-h-[34rem] overflow-hidden bg-white pt-28 sm:min-h-[36rem] lg:min-h-[40rem] lg:pt-32">
                <WelcomeHeroCarousel />
                <WelcomeHeroMiskiFloat />

                <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex min-h-[26rem] items-center py-10 sm:min-h-[28rem] lg:min-h-[32rem] lg:py-14">
                        <div className="w-full max-w-xl space-y-6 text-center lg:max-w-2xl lg:text-left">
                            <div className="flex justify-center lg:justify-start">
                                <WelcomeHeroAiBadge />
                            </div>
                            <h1 className="text-3xl font-bold leading-tight tracking-tight text-brand-blue sm:text-4xl lg:text-5xl xl:text-[3.25rem]">
                                {t('welcome.hero_headline')}
                                <br />
                                <span className="text-[#ffa300]">{t('welcome.hero_headline_highlight')}</span>
                            </h1>
                            <p className="mx-auto max-w-lg text-base leading-relaxed text-gray-600 sm:text-lg lg:mx-0">
                                {t('welcome.hero_subtitle')}
                            </p>

                            <div className="flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap lg:justify-start">
                                <Link
                                    href={recommendHref}
                                    className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-semibold text-white transition hover:brightness-105 active:scale-[0.98] sm:w-auto sm:text-base"
                                    style={HERO_CTA_STYLE}
                                >
                                    <Sparkles className="size-4" />
                                    {t('welcome.cta_recommend')}
                                </Link>
                                <Link
                                    href="/restaurantes-cercanos"
                                    className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-6 py-3.5 text-sm font-semibold text-brand-blue shadow-sm transition hover:bg-gray-50 sm:w-auto sm:text-base"
                                >
                                    <Search className="size-4" />
                                    {t('welcome.cta_explore')}
                                </Link>
                                {isOwner && (
                                    <Link
                                        href="/owner/pending"
                                        className="inline-flex w-full cursor-pointer items-center justify-center rounded-2xl border border-brand-blue/15 bg-white px-6 py-3.5 text-sm font-semibold text-brand-blue shadow-sm transition hover:bg-gray-50 sm:w-auto"
                                    >
                                        {t('nav.my_panel')}
                                    </Link>
                                )}
                            </div>

                            <div className="flex items-center justify-center gap-3 pt-1 lg:justify-start">
                                <div className="flex -space-x-2">
                                    {['bg-brand-blue', 'bg-[#ffa300]', 'bg-emerald-500', 'bg-violet-500'].map(color => (
                                        <span
                                            key={color}
                                            className={cn(
                                                'inline-flex size-9 items-center justify-center rounded-full border-2 border-white text-xs font-semibold text-white shadow-sm',
                                                color,
                                            )}
                                        >
                                            ★
                                        </span>
                                    ))}
                                </div>
                                <p className="text-sm font-medium text-gray-600">{t('welcome.hero_social_proof')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <WelcomeHeroSearch cuisineTypes={cuisineTypes} />

            <WelcomeRestaurantsBrowse
                mode="catalog"
                listPath="/"
                restaurants={restaurants}
                cuisineTypes={cuisineTypes}
                districts={districts}
                ambiances={ambiances}
                priceRanges={priceRanges}
                filters={filters}
            />

            <section
                className="py-16 lg:py-20"
                style={{
                    background:
                        'radial-gradient(ellipse 120% 100% at 60% 30%, #0d4a9e 0%, #073577 35%, #052a58 65%, #031d3d 100%)',
                }}
            >
                <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
                    <h2 className="mb-4 text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
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
                        {canRegister && !isTourist && (
                            <Link
                                href={register()}
                                className="cursor-pointer rounded-2xl px-7 py-3.5 text-base font-semibold text-white transition hover:brightness-105"
                                style={HERO_CTA_STYLE}
                            >
                                {t('welcome.cta_register')}
                            </Link>
                        )}
                        {isTourist && (
                            <Link
                                href="/explore"
                                className="cursor-pointer rounded-2xl px-7 py-3.5 text-base font-semibold text-white transition hover:brightness-105"
                                style={HERO_CTA_STYLE}
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
