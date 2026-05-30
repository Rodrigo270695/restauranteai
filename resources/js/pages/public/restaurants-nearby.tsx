import { Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import type { RestaurantCardData } from '@/components/explore/restaurant-card';
import { WelcomeRestaurantsBrowse } from '@/components/public/welcome-restaurants-browse';
import { useLanguageSync } from '@/hooks/use-language-sync';
import type { PaginationMeta } from '@/components/shared/pagination-links';

type PriceRangeOption = { value: string; label: string; name: string; hint?: string | null };

type Props = {
    restaurants: PaginationMeta & { data: (RestaurantCardData & { is_featured?: boolean })[] };
    cuisineTypes?: { id: number; name: string }[];
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
        max_distance_km?: number | null;
        sort?: string;
        lat?: number | null;
        lng?: number | null;
        location_active?: boolean;
    };
};

export default function RestaurantsNearby({
    restaurants,
    cuisineTypes = [],
    districts = [],
    ambiances = [],
    priceRanges = [],
    filters = {},
}: Props) {
    const { t } = useTranslation();
    useLanguageSync();

    return (
        <>
            <Head title={t('nearby.page_title')} />

            <section
                className="border-b border-orange-100/80 bg-gradient-to-br from-[#FFF8F0] to-white pt-24 pb-8"
            >
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-orange">
                        Chiclayo · Lambayeque
                    </p>
                    <h1 className="mt-2 text-2xl font-extrabold text-gray-900 sm:text-3xl">
                        {t('nearby.hero_title')}
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm text-gray-600 sm:text-base">{t('nearby.hero_subtitle')}</p>
                </div>
            </section>

            <WelcomeRestaurantsBrowse
                mode="nearby"
                listPath="/restaurantes-cercanos"
                restaurants={restaurants}
                cuisineTypes={cuisineTypes}
                districts={districts}
                ambiances={ambiances}
                priceRanges={priceRanges}
                filters={filters}
                titleKey="nearby.browse_title"
                subtitleKey="nearby.browse_subtitle"
                sectionId="cercanos"
            />
        </>
    );
}
