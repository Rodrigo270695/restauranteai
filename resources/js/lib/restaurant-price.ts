export const PRICE_RANGES = [
    { value: 'economico', label: 'Económico' },
    { value: 'moderado', label: 'Moderado' },
    { value: 'caro', label: 'Caro' },
] as const;

export type PriceRangeValue = (typeof PRICE_RANGES)[number]['value'];

export const PRICE_LABEL: Record<string, string> = {
    economico: 'Económico',
    moderado: 'Moderado',
    caro: 'Caro',
    premium: 'Caro',
};

export function priceRangeLabel(priceRange: string): string {
    return PRICE_LABEL[priceRange] ?? priceRange;
}

export function formatAvgPriceSoles(amount: number | null | undefined): string | null {
    if (amount == null || Number.isNaN(amount)) {
        return null;
    }
    const rounded = Math.round(amount);
    return `S/ ${rounded}`;
}

export function formatPriceDisplay(
    priceRange: string,
    avgPrice?: number | null,
): { soles: string | null; tierLabel: string } {
    return {
        soles: formatAvgPriceSoles(avgPrice),
        tierLabel: priceRangeLabel(priceRange),
    };
}

export const PRICE_AVG_LIMITS = {
    economico: { label: 'Económico', hint: 'Menos de S/ 30', max: 30, exclusiveMax: true },
    moderado: { label: 'Moderado', hint: 'S/ 30 – 80', min: 30, max: 80 },
    caro: { label: 'Caro', hint: 'Más de S/ 80', min: 80, exclusiveMin: true },
} as const;

export function validateAvgPriceForRange(
    priceRange: string,
    avgPrice: string | number | null | undefined,
): string | null {
    if (avgPrice === '' || avgPrice == null) {
        return null;
    }

    const amount = Number(avgPrice);
    if (Number.isNaN(amount)) {
        return 'Ingresa un precio promedio válido.';
    }

    const normalized = priceRange === 'premium' ? 'caro' : priceRange;

    switch (normalized) {
        case 'economico':
            return amount >= 30
                ? 'El precio promedio para rango Económico debe ser menor a S/ 30.'
                : null;
        case 'moderado':
            return amount < 30 || amount > 80
                ? 'El precio promedio para rango Moderado debe estar entre S/ 30 y S/ 80.'
                : null;
        case 'caro':
            return amount <= 80
                ? 'El precio promedio para rango Caro debe ser mayor a S/ 80.'
                : null;
        default:
            return null;
    }
}

export function avgPriceHintForRange(priceRange: string): string | null {
    const normalized = priceRange === 'premium' ? 'caro' : priceRange;
    return PRICE_AVG_LIMITS[normalized as PriceRangeValue]?.hint ?? null;
}
