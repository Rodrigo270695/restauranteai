import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type CatalogItem = { id: number; name: string };
type PriceRangeItem = { value: string; name: string; label?: string };

type Props = {
    cuisineTypes: CatalogItem[];
    priceRanges: PriceRangeItem[];
    ambiances: CatalogItem[];
    environments: CatalogItem[];
    partyTypes: CatalogItem[];
    cuisineIds: number[];
    priceValues: string[];
    ambianceIds: number[];
    environmentIds: number[];
    partyTypeIds: number[];
    onToggleCuisine: (id: number) => void;
    onTogglePrice: (value: string) => void;
    onToggleAmbiance: (id: number) => void;
    onToggleEnvironment: (id: number) => void;
    onToggleParty: (id: number) => void;
    onApply: () => void;
    onClear: () => void;
    total: number;
    loading?: boolean;
    className?: string;
};

function FilterGroup({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <div className="border-b border-gray-100 py-3 last:border-b-0">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-brand-blue">{title}</p>
            <div className="space-y-1.5">{children}</div>
        </div>
    );
}

function CheckRow({
    checked,
    label,
    onChange,
}: {
    checked: boolean;
    label: string;
    onChange: () => void;
}) {
    return (
        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
                className="size-3.5 rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
            />
            <span className="leading-tight">{label}</span>
        </label>
    );
}

export function DiscoverFiltersSidebar({
    cuisineTypes,
    priceRanges,
    ambiances,
    environments,
    partyTypes,
    cuisineIds,
    priceValues,
    ambianceIds,
    environmentIds,
    partyTypeIds,
    onToggleCuisine,
    onTogglePrice,
    onToggleAmbiance,
    onToggleEnvironment,
    onToggleParty,
    onApply,
    onClear,
    total,
    loading,
    className,
}: Props) {
    const { t } = useTranslation();
    const hasFilters =
        cuisineIds.length +
            priceValues.length +
            ambianceIds.length +
            environmentIds.length +
            partyTypeIds.length >
        0;

    return (
        <aside className={cn('flex w-60 shrink-0 flex-col border-r border-gray-100 bg-white', loading && 'opacity-70', className)}>
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <p className="text-sm font-bold text-brand-blue">{t('explore.filters_title')}</p>
                {hasFilters && (
                    <button
                        type="button"
                        onClick={onClear}
                        className="cursor-pointer text-xs font-semibold text-brand-orange hover:underline"
                    >
                        {t('explore.clear_filters')}
                    </button>
                )}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2 scrollbar-thin">
                <FilterGroup title={t('explore.filter_cuisine')}>
                    {cuisineTypes.map((item) => (
                        <CheckRow
                            key={item.id}
                            checked={cuisineIds.includes(item.id)}
                            label={item.name}
                            onChange={() => onToggleCuisine(item.id)}
                        />
                    ))}
                </FilterGroup>
                <FilterGroup title={t('explore.filter_budget')}>
                    {priceRanges.map((item) => (
                        <CheckRow
                            key={item.value}
                            checked={priceValues.includes(item.value)}
                            label={item.name}
                            onChange={() => onTogglePrice(item.value)}
                        />
                    ))}
                </FilterGroup>
                <FilterGroup title={t('explore.filter_ambiance')}>
                    {ambiances.map((item) => (
                        <CheckRow
                            key={item.id}
                            checked={ambianceIds.includes(item.id)}
                            label={item.name}
                            onChange={() => onToggleAmbiance(item.id)}
                        />
                    ))}
                </FilterGroup>
                <FilterGroup title={t('explore.filter_environment')}>
                    {environments.map((item) => (
                        <CheckRow
                            key={item.id}
                            checked={environmentIds.includes(item.id)}
                            label={item.name}
                            onChange={() => onToggleEnvironment(item.id)}
                        />
                    ))}
                </FilterGroup>
                <FilterGroup title={t('explore.filter_party')}>
                    {partyTypes.map((item) => (
                        <CheckRow
                            key={item.id}
                            checked={partyTypeIds.includes(item.id)}
                            label={item.name}
                            onChange={() => onToggleParty(item.id)}
                        />
                    ))}
                </FilterGroup>
            </div>
            <div className="space-y-2 border-t border-gray-100 p-3">
                <button
                    type="button"
                    onClick={onApply}
                    className="w-full cursor-pointer rounded-xl bg-brand-blue py-2.5 text-sm font-semibold text-white hover:bg-brand-blue-light"
                >
                    {t('explore.apply_filters')}
                </button>
                <p className="text-center text-[11px] font-medium text-gray-500">
                    {t('explore.found_count', { count: total })}
                </p>
            </div>
        </aside>
    );
}
