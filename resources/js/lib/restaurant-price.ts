export const PRICE_LABEL: Record<string, string> = {
    economico: 'Económico',
    moderado: 'Moderado',
    premium: 'Premium',
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
