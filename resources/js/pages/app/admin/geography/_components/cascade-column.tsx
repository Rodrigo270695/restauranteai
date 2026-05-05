/**
 * CascadeColumn — columna completa de la vista en cascada.
 *
 * Composición: ColumnHeader + área de scroll con contenido (children).
 * Acepta las mismas props de ColumnHeader más children para el listado.
 */

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ColumnHeader } from './column-header';
import type { ColumnHeaderProps } from './column-header';

// ─── tipos ────────────────────────────────────────────────────────────────────

type CascadeColumnProps = ColumnHeaderProps & {
    /** Contenido de la lista (filas o estado vacío) */
    children: ReactNode;
    /** Clases adicionales para la columna raíz */
    className?: string;
};

// ─── componente ───────────────────────────────────────────────────────────────

export function CascadeColumn({
    children,
    className,
    // ColumnHeader props
    icon,
    title,
    subtitle,
    canCreate,
    onAdd,
    addLabel,
}: CascadeColumnProps) {
    return (
        <div className={cn(
            'flex min-h-[420px] flex-col overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm',
            className,
        )}>
            <ColumnHeader
                icon={icon}
                title={title}
                subtitle={subtitle}
                canCreate={canCreate}
                onAdd={onAdd}
                addLabel={addLabel}
            />

            <div className="flex-1 divide-y divide-border/40 overflow-y-auto">
                {children}
            </div>
        </div>
    );
}
