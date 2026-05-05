/**
 * ColumnHeader — cabecera de cada columna de cascada.
 *
 * Muestra icono de marca, título, subtítulo opcional y botón "Nuevo" condicional.
 */

import type { ReactNode } from 'react';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';

// ─── tipos ────────────────────────────────────────────────────────────────────

export type ColumnHeaderProps = {
    /** Icono de la columna (lucide component) */
    icon: ReactNode;
    title: string;
    /** Texto secundario bajo el título (nivel padre, cantidad, etc.) */
    subtitle?: string;
    /** Controla si se muestra el botón de agregar */
    canCreate?: boolean;
    onAdd?: () => void;
    /** Texto del botón (por defecto "Nuevo") */
    addLabel?: string;
};

// ─── componente ───────────────────────────────────────────────────────────────

export function ColumnHeader({
    icon,
    title,
    subtitle,
    canCreate,
    onAdd,
    addLabel = 'Nuevo',
}: ColumnHeaderProps) {
    return (
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-linear-to-br from-brand-600 to-rose-500 text-white shadow-sm">
                    {icon}
                </span>

                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold leading-tight text-foreground">
                        {title}
                    </p>
                    {subtitle && (
                        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
                    )}
                </div>
            </div>

            {canCreate && onAdd && (
                <Button
                    size="sm"
                    variant="brand"
                    onClick={onAdd}
                    className="ml-2 h-7 shrink-0 cursor-pointer gap-1 px-2.5 text-xs"
                >
                    <Plus className="size-3.5" />
                    {addLabel}
                </Button>
            )}
        </div>
    );
}
