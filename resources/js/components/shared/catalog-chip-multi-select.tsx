import { cn } from '@/lib/utils';

export type CatalogChipOption = { id: number; name: string };

type Props = {
    options: CatalogChipOption[];
    selectedIds?: number[];
    onChange: (ids: number[]) => void;
    disabled?: boolean;
};

export function CatalogChipMultiSelect({
    options,
    selectedIds = [],
    onChange,
    disabled,
}: Props) {
    const ids = selectedIds ?? [];

    const toggle = (id: number) => {
        if (disabled) return;
        onChange(ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]);
    };

    if (options.length === 0) {
        return <p className="text-xs text-muted-foreground">No hay opciones en el catálogo.</p>;
    }

    return (
        <div className="flex flex-wrap gap-2">
            {options.map(opt => {
                const active = ids.includes(opt.id);
                return (
                    <button
                        key={opt.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => toggle(opt.id)}
                        className={cn(
                            'cursor-pointer rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all duration-150',
                            'disabled:cursor-not-allowed disabled:opacity-50',
                            active
                                ? 'border-brand-red bg-red-50 text-brand-red shadow-sm'
                                : 'border-gray-200 bg-white text-gray-600 hover:border-red-200 hover:bg-red-50/40',
                        )}
                    >
                        {active ? '✓ ' : ''}
                        {opt.name}
                    </button>
                );
            })}
        </div>
    );
}
