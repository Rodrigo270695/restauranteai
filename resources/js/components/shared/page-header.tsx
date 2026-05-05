/**
 * PageHeader — cabecera reutilizable para vistas de administración.
 *
 * Estructura:
 *   [Título + descripción]   [Slot de acciones]
 *   ── separador ──────────────────────────────
 *   [Badges de estadísticas]
 */

import type { CSSProperties, ReactNode } from 'react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// Paletas predefinidas exportadas para reutilización
export const STAT_COLORS = {
    blue:    { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', iconColor: '#3b82f6' },
    violet:  { bg: '#f5f3ff', border: '#ddd6fe', text: '#6d28d9', iconColor: '#8b5cf6' },
    amber:   { bg: '#fffbeb', border: '#fde68a', text: '#b45309', iconColor: '#f59e0b' },
    emerald: { bg: '#ecfdf5', border: '#a7f3d0', text: '#065f46', iconColor: '#10b981' },
    rose:    { bg: '#fff1f2', border: '#fecdd3', text: '#be123c', iconColor: '#f43f5e' },
    sky:     { bg: '#f0f9ff', border: '#bae6fd', text: '#0369a1', iconColor: '#0ea5e9' },
    orange:  { bg: '#fff7ed', border: '#fed7aa', text: '#c2410c', iconColor: '#f97316' },
} as const satisfies Record<string, StatBadgeColor>;

// ─── tipos ────────────────────────────────────────────────────────────────────

/** Paleta de colores para el StatBadge (bg, border, text en CSS válido). */
export type StatBadgeColor = {
    bg: string;
    border: string;
    text: string;
    iconColor?: string;
};

export type StatBadge = {
    /** Icono opcional: cualquier ReactNode (lucide, emoji, texto corto…) */
    icon?: ReactNode;
    label: string;
    /** Valor numérico o string a mostrar junto al label */
    value: string | number;
    /** Paleta de colores CSS directa (siempre se aplica, sin conflicto Tailwind) */
    color?: StatBadgeColor;
    /** Clases extra adicionales */
    className?: string;
};

type PageHeaderProps = {
    title: string;
    description?: string;
    /** Slot derecho: botones, menús, etc. */
    actions?: ReactNode;
    /** Lista de badges de estadísticas */
    stats?: StatBadge[];
    /** Clase extra para el contenedor raíz */
    className?: string;
};

// ─── componente ───────────────────────────────────────────────────────────────

export function PageHeader({
    title,
    description,
    actions,
    stats = [],
    className,
}: PageHeaderProps) {
    return (
        <div className={cn('flex flex-col gap-0', className)}>
            {/* Fila: título + acciones */}
            <div className="flex min-h-12 flex-wrap items-center justify-between gap-3 px-1 py-2">
                {/* Bloque izquierdo */}
                <div className="min-w-0 flex-1">
                    <h1 className="truncate text-xl font-semibold tracking-tight text-foreground">
                        {title}
                    </h1>
                    {description && (
                        <p className="mt-0.5 text-sm leading-snug text-muted-foreground">
                            {description}
                        </p>
                    )}
                </div>

                {/* Slot acciones */}
                {actions && (
                    <div className="flex shrink-0 items-center gap-2">
                        {actions}
                    </div>
                )}
            </div>

            {/* Fila de badges de estadísticas */}
            {stats.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 px-1 py-2">
                    {stats.map((stat, i) => (
                        <StatBadgeItem key={i} stat={stat} />
                    ))}
                </div>
            )}

            {/* Separador */}
            <Separator className="bg-border/70" />
        </div>
    );
}

// ─── sub-componente de badge individual ───────────────────────────────────────

function StatBadgeItem({ stat }: { stat: StatBadge }) {
    const inlineStyle: CSSProperties = stat.color
        ? {
              backgroundColor: stat.color.bg,
              borderColor: stat.color.border,
              color: stat.color.text,
          }
        : {};

    return (
        <span
            role="status"
            aria-label={`${stat.label}: ${stat.value}`}
            style={inlineStyle}
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
                !stat.color && 'border-border bg-muted/40 text-foreground',
                stat.className,
            )}
        >
            {stat.icon && (
                <span
                    className="flex shrink-0 items-center"
                    style={stat.color?.iconColor ? { color: stat.color.iconColor } : undefined}
                >
                    {stat.icon}
                </span>
            )}
            <span style={{ opacity: 0.72 }}>{stat.label}</span>
            <span className="font-bold tabular-nums">{stat.value}</span>
        </span>
    );
}
