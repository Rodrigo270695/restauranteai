export type Budget = 'low' | 'medium' | 'high';

export const BUDGET_KEYS: Budget[] = ['low', 'medium', 'high'];

export function normalizeBudgets(value: Budget | Budget[] | null | undefined): Budget[] {
    if (!value) {
        return [];
    }

    if (Array.isArray(value)) {
        return value.filter((item): item is Budget => BUDGET_KEYS.includes(item));
    }

    return BUDGET_KEYS.includes(value) ? [value] : [];
}

export function toggleBudgetSelection(current: Budget[], key: Budget): Budget[] {
    return current.includes(key) ? current.filter(item => item !== key) : [...current, key];
}

export function budgetToPriceRange(key: Budget): 'economico' | 'moderado' | 'caro' {
    return key === 'low' ? 'economico' : key === 'high' ? 'caro' : 'moderado';
}

export function budgetsToPriceRanges(budgets: Budget[]): Array<'economico' | 'moderado' | 'caro'> {
    return [...new Set(budgets.map(budgetToPriceRange))];
}
