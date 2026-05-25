import { discover as exploreDiscover } from '@/routes/explore';

type DiscoverQuery = {
    search?: string;
    cuisine_type_id?: number | '';
    price_range?: string;
    view?: 'map' | 'list';
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
    if (params.price_range) {
        query.price_range = params.price_range;
    }
    if (params.view) {
        query.view = params.view;
    }

    return exploreDiscover.url(Object.keys(query).length ? { query } : undefined);
}
