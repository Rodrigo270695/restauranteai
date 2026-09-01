export type DiscoverQuery = {
    search?: string;
    cuisine_type_id?: number | '';
    cuisine_type_ids?: number[];
    favorites_only?: boolean;
    price_range?: string;
    price_ranges?: string[];
    ambiance_ids?: number[];
    restaurant_environment_ids?: number[];
    party_type_ids?: number[];
    district_id?: number | null;
    open_now?: boolean;
    sort?: string;
    page?: number;
    view?: 'map' | 'list';
    lat?: number;
    lng?: number;
};

function appendIds(query: URLSearchParams, key: string, ids?: number[]): void {
    (ids ?? []).forEach((id) => {
        if (id) {
            query.append(`${key}[]`, String(id));
        }
    });
}

/** URL de discover con query string explícito (evita rutas inválidas tipo /explore/view-list). */
export function exploreDiscoverUrl(params: DiscoverQuery = {}): string {
    return withExploreQuery('/explore/discover', params);
}

/** Buscador de restaurantes (sin mapa ni armado de ruta). */
export function exploreSearchUrl(params: DiscoverQuery = {}): string {
    return withExploreQuery('/explore/search', params);
}

function withExploreQuery(base: string, params: DiscoverQuery): string {
    const query = new URLSearchParams();

    if (params.search) {
        query.set('search', params.search);
    }

    const cuisineIds =
        params.cuisine_type_ids && params.cuisine_type_ids.length > 0
            ? params.cuisine_type_ids
            : params.cuisine_type_id
              ? [Number(params.cuisine_type_id)]
              : [];
    appendIds(query, 'cuisine_type_ids', cuisineIds);

    if (params.favorites_only) {
        query.set('favorites_only', '1');
    }

    const priceRanges =
        params.price_ranges && params.price_ranges.length > 0
            ? params.price_ranges
            : params.price_range
              ? [params.price_range]
              : [];
    priceRanges.forEach((value) => query.append('price_ranges[]', value));

    appendIds(query, 'ambiance_ids', params.ambiance_ids);
    appendIds(query, 'restaurant_environment_ids', params.restaurant_environment_ids);
    appendIds(query, 'party_type_ids', params.party_type_ids);

    if (params.district_id) {
        query.set('district_id', String(params.district_id));
    }
    if (params.open_now) {
        query.set('open_now', '1');
    }
    if (params.sort && params.sort !== 'relevant') {
        query.set('sort', params.sort);
    }
    if (params.page && params.page > 1) {
        query.set('page', String(params.page));
    }
    if (params.view) {
        query.set('view', params.view);
    }
    if (params.lat != null) {
        query.set('lat', String(params.lat));
    }
    if (params.lng != null) {
        query.set('lng', String(params.lng));
    }

    const qs = query.toString();

    return qs ? `${base}?${qs}` : base;
}

/** Página dedicada de favoritos (restaurantes y rutas). */
export function exploreFavoritesDiscoverUrl(): string {
    return '/explore/favorites';
}
