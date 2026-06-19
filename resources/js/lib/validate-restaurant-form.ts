type GeoSelection = {
    department_id: number | null;
    province_id: number | null;
    district_id: number | null;
};

type RestaurantLocationInput = {
    district_id: number | string | null | '';
    address: string;
    latitude: number | null;
    longitude: number | null;
    geo: GeoSelection;
};

/** @returns mensaje de error o null si la ubicación es válida */
export function validateRestaurantLocation(input: RestaurantLocationInput): string | null {
    if (!input.geo.department_id) {
        return 'Selecciona el departamento.';
    }
    if (!input.geo.province_id) {
        return 'Selecciona la provincia.';
    }
    if (!input.geo.district_id && !input.district_id) {
        return 'Selecciona el distrito.';
    }
    if (!String(input.address ?? '').trim()) {
        return 'La dirección es obligatoria.';
    }
    if (input.latitude == null || input.longitude == null) {
        return 'Marca la ubicación en el mapa (arrastra el pin o haz clic).';
    }

    return null;
}

export function validateRestaurantName(name: string): string | null {
    if (!String(name ?? '').trim()) {
        return 'El nombre del restaurante es obligatorio.';
    }

    return null;
}
