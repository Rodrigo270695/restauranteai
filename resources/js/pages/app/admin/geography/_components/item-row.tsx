/**
 * ItemRow — fila de un ítem geográfico.
 *
 * Muestra: código (badge monoespaciado), nombre, contador de hijos,
 * acciones (editar / eliminar) al hover, y chevron de navegación si tiene hijos.
 */

import { ChevronRight, Edit2, Trash2 } from 'lucide-react';

import { cn } from '@/lib/utils';

// ─── tipos ────────────────────────────────────────────────────────────────────

export type ItemRowProps = {
    name: string;
    code: string;
    /** Resalta la fila como seleccionada */
    selected?: boolean;
    /** Si tiene registros hijos que navegar */
    hasChildren?: boolean;
    /** Cantidad de hijos (visible cuando hasChildren = true) */
    childCount?: number;
    onClick?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    canEdit?: boolean;
    canDelete?: boolean;
};

// ─── componente ───────────────────────────────────────────────────────────────

export function ItemRow({
    name,
    code,
    selected,
    hasChildren,
    childCount,
    onClick,
    onEdit,
    onDelete,
    canEdit,
    canDelete,
}: ItemRowProps) {
    function handleEdit(e: React.MouseEvent) {
        e.stopPropagation();
        onEdit?.();
    }

    function handleDelete(e: React.MouseEvent) {
        e.stopPropagation();
        onDelete?.();
    }

    return (
        <div
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            onClick={onClick}
            onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
            className={cn(
                'group flex cursor-pointer select-none items-center gap-2.5 border-l-2 px-4 py-2.5',
                'transition-colors duration-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-400',
                selected
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-transparent hover:bg-muted/50',
            )}
        >
            {/* Badge de código */}
            <span className={cn(
                'shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide',
                selected ? 'bg-brand-100 text-brand-700' : 'bg-muted text-muted-foreground',
            )}>
                {code}
            </span>

            {/* Nombre */}
            <span className={cn(
                'min-w-0 flex-1 truncate text-sm',
                selected ? 'font-semibold text-brand-700' : 'text-foreground',
            )}>
                {name}
            </span>

            {/* Contador de hijos */}
            {hasChildren && childCount !== undefined && (
                <span className={cn(
                    'shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                    selected ? 'bg-brand-200 text-brand-700' : 'bg-muted text-muted-foreground',
                )}>
                    {childCount}
                </span>
            )}

            {/* Acciones (visibles en hover) */}
            <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                {canEdit && onEdit && (
                    <button
                        type="button"
                        onClick={handleEdit}
                        className="cursor-pointer rounded p-1 text-muted-foreground transition-colors hover:bg-amber-100 hover:text-amber-600"
                        title="Editar"
                    >
                        <Edit2 className="size-3.5" />
                    </button>
                )}

                {canDelete && onDelete && (
                    <button
                        type="button"
                        onClick={handleDelete}
                        className="cursor-pointer rounded p-1 text-muted-foreground transition-colors hover:bg-red-100 hover:text-red-600"
                        title="Eliminar"
                    >
                        <Trash2 className="size-3.5" />
                    </button>
                )}
            </div>

            {/* Chevron de navegación */}
            {hasChildren && onClick && (
                <ChevronRight className={cn(
                    'size-3.5 shrink-0 text-muted-foreground transition-transform',
                    selected && 'rotate-90 text-brand-500',
                )} />
            )}
        </div>
    );
}
