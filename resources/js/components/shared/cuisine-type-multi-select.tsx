import { Star } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export type CuisineTypeOption = { id: number; name: string };

type Props = {
    options: CuisineTypeOption[];
    selectedIds: number[];
    primaryId: number | null;
    onChange: (selectedIds: number[], primaryId: number | null) => void;
    disabled?: boolean;
    error?: string;
};

export function CuisineTypeMultiSelect({
    options,
    selectedIds,
    primaryId,
    onChange,
    disabled = false,
    error,
}: Props) {
    const toggle = (id: number) => {
        if (disabled) return;

        if (selectedIds.includes(id)) {
            const next = selectedIds.filter(x => x !== id);
            const nextPrimary =
                primaryId === id ? (next[0] ?? null) : primaryId && next.includes(primaryId) ? primaryId : next[0] ?? null;
            onChange(next, nextPrimary);
            return;
        }

        const next = [...selectedIds, id];
        onChange(next, primaryId ?? id);
    };

    const setPrimary = (id: number) => {
        if (disabled || !selectedIds.includes(id)) return;
        onChange(selectedIds, id);
    };

    return (
        <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
                Selecciona uno o más tipos (ej. criolla y ceviche). Marca cuál es la especialidad principal.
            </p>
            <div className="flex flex-wrap gap-2">
                {options.map(c => {
                    const selected = selectedIds.includes(c.id);
                    const isPrimary = primaryId === c.id;

                    return (
                        <div key={c.id} className="flex items-center gap-1">
                            <button
                                type="button"
                                disabled={disabled}
                                onClick={() => toggle(c.id)}
                                className={cn(
                                    'cursor-pointer rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all',
                                    selected
                                        ? 'border-brand-red bg-red-50 text-brand-red shadow-sm'
                                        : 'border-gray-200 bg-white text-gray-600 hover:border-red-200',
                                    disabled && 'cursor-not-allowed opacity-60',
                                )}
                            >
                                {selected ? '✓ ' : ''}
                                {c.name}
                            </button>
                            {selected && (
                                <button
                                    type="button"
                                    title="Marcar como cocina principal"
                                    disabled={disabled}
                                    onClick={() => setPrimary(c.id)}
                                    className={cn(
                                        'flex size-8 cursor-pointer items-center justify-center rounded-full border transition-colors',
                                        isPrimary
                                            ? 'border-amber-300 bg-amber-50 text-amber-600'
                                            : 'border-gray-200 text-gray-400 hover:border-amber-200 hover:text-amber-500',
                                        disabled && 'cursor-not-allowed opacity-60',
                                    )}
                                >
                                    <Star className={cn('size-4', isPrimary && 'fill-current')} />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
            {selectedIds.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <Label className="text-xs font-normal text-gray-500">Vista previa:</Label>
                    {selectedIds.map(id => {
                        const name = options.find(o => o.id === id)?.name ?? '';
                        const isPrimary = primaryId === id;
                        return (
                            <span
                                key={id}
                                className={cn(
                                    'rounded-full px-2.5 py-0.5 font-medium',
                                    isPrimary
                                        ? 'bg-amber-100 text-amber-900 ring-1 ring-amber-200'
                                        : 'bg-gray-100 text-gray-700',
                                )}
                            >
                                {name}
                                {isPrimary ? ' ★' : ''}
                            </span>
                        );
                    })}
                </div>
            )}
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}
