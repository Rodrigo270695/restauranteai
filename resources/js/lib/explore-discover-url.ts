import { discover as exploreDiscover } from '@/routes/explore';

type DiscoverQuery = {
    search?: string;
    cuisine_type_id?: number | '';
    favorites_only?: boolean;
    price_range?: string;
    view?: 'map' | 'list';
    lat?: number;
    lng?: number;
};

/** URL de discover con query string explícito (evita rutas inválidas tipo /explore/view-list). */
export function exploreDiscoverUrl(params: DiscoverQuery = {}): string {
    const query: Record<string, string | number> = {};

    if (params.search) {
        query.search = params.search;
    }
    if (params.cuisine_type_id) {
        query.cuisine_type_id = params.cuisine_type_id;
    }
    if (params.favorites_only) {
        query.favorites_only = '1';
    }
    if (params.price_range) {
        query.price_range = params.price_range;
    }
    if (params.view) {
        query.view = params.view;
    }
    if (params.lat != null) {
        query.lat = params.lat;
    }
    if (params.lng != null) {
        query.lng = params.lng;
    }

    return exploreDiscover.url(Object.keys(query).length ? { query } : undefined);
}

/** Discover filtrado solo a favoritos del turista. */
export function exploreFavoritesDiscoverUrl(params: Omit<DiscoverQuery, 'favorites_only'> = {}): string {
    return exploreDiscoverUrl({ ...params, favorites_only: true });
}
