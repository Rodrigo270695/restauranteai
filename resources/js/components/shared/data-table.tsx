/**
 * DataTable<TRow> — tabla responsiva reutilizable.
 *
 * Desktop (≥ md): <table> clásica con soporte de sorting.
 * Mobile  (< md): cada fila se convierte en una tarjeta.
 *
 * Uso:
 *   <DataTable
 *     columns={columns}
 *     rows={data}
 *     rowKey="id"
 *     sortKey="name"
 *     sortDir="asc"
 *     onSort={(key) => handleSort(key)}
 *     rowActions={(row) => <RowMenu row={row} />}
 *   />
 */

import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import type { ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// ─── tipos ────────────────────────────────────────────────────────────────────

export type SortDir = 'asc' | 'desc';

export type TableColumn<TRow> = {
    /** Identificador único de la columna */
    key: string;
    /** Cabecera de la columna */
    header: string;
    /** Render personalizado de la celda (por defecto: row[key]) */
    cell?: (row: TRow) => ReactNode;
    /** Clases de la celda */
    className?: string;
    /** Clases de la cabecera */
    headerClassName?: string;
    /** Si `true`, la columna no aparece en la vista de tarjeta móvil */
    hideOnCard?: boolean;
    /** Si `true`, la celda es la que se usa como título de la tarjeta */
    cardTitle?: boolean;
    /** Si `true`, la cabecera muestra botón de ordenar */
    sortable?: boolean;
};

export type DataTableProps<TRow extends object> = {
    columns: TableColumn<TRow>[];
    rows: TRow[];
    /** Campo que actúa como key única de cada fila */
    rowKey: keyof TRow;
    /** Slot de acciones por fila (botones editar/eliminar…) */
    rowActions?: (row: TRow) => ReactNode;
    /** Mensaje cuando no hay datos */
    emptyMessage?: string;
    /** Mensaje vacío secundario */
    emptyDescription?: string;
    /** Muestra skeleton de carga */
    loading?: boolean;
    /** Número de filas del skeleton */
    skeletonRows?: number;
    /** Columna actualmente ordenada */
    sortKey?: string;
    /** Dirección del orden actual */
    sortDir?: SortDir;
    /** Callback al hacer clic en una cabecera sortable */
    onSort?: (key: string, dir: SortDir) => void;
    className?: string;
};

// ─── componente principal ─────────────────────────────────────────────────────

export function DataTable<TRow extends object>({
    columns,
    rows,
    rowKey,
    rowActions,
    emptyMessage = 'Sin resultados',
    emptyDescription = 'No se encontraron registros con los filtros actuales.',
    loading = false,
    skeletonRows = 5,
    sortKey,
    sortDir,
    onSort,
    className,
}: DataTableProps<TRow>) {
    if (loading) {
        return <DataTableSkeleton columns={columns} rows={skeletonRows} hasActions={!!rowActions} />;
    }

    const handleSort = (col: TableColumn<TRow>) => {
        if (!col.sortable || !onSort) return;
        const next: SortDir = sortKey === col.key && sortDir === 'asc' ? 'desc' : 'asc';
        onSort(col.key, next);
    };

    return (
        <>
            {/* ── DESKTOP (≥ md) ─────────────────────────────────────────── */}
            <div
                className={cn(
                    'hidden overflow-hidden rounded-xl border border-border/60 shadow-sm md:block',
                    className,
                )}
            >
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border/60 bg-muted/50">
                            {columns.map((col) => {
                                const isActive = sortKey === col.key;
                                return (
                                    <th
                                        key={col.key}
                                        className={cn(
                                            'px-4 py-3 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase',
                                            col.sortable && 'cursor-pointer select-none hover:text-foreground',
                                            isActive && 'text-foreground',
                                            col.headerClassName,
                                        )}
                                        onClick={() => handleSort(col)}
                                    >
                                        <span className="inline-flex items-center gap-1.5">
                                            {col.header}
                                            {col.sortable && (
                                                <SortIcon
                                                    active={isActive}
                                                    dir={isActive ? sortDir : undefined}
                                                />
                                            )}
                                        </span>
                                    </th>
                                );
                            })}
                            {rowActions && (
                                <th className="w-24 px-4 py-3 text-right text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                    Acciones
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                        {rows.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length + (rowActions ? 1 : 0)}
                                    className="px-4 py-12 text-center"
                                >
                                    <EmptyState
                                        message={emptyMessage}
                                        description={emptyDescription}
                                    />
                                </td>
                            </tr>
                        ) : (
                            rows.map((row, idx) => (
                                <tr
                                    key={String(row[rowKey])}
                                    className={cn(
                                        'group transition-colors hover:bg-primary/3',
                                        idx % 2 === 0 ? 'bg-background' : 'bg-muted/20',
                                    )}
                                >
                                    {columns.map((col) => (
                                        <td
                                            key={col.key}
                                            className={cn(
                                                'px-4 py-3.5 align-middle text-sm text-foreground',
                                                col.className,
                                            )}
                                        >
                                            {col.cell
                                                ? col.cell(row)
                                                : String((row as Record<string, unknown>)[col.key] ?? '—')}
                                        </td>
                                    ))}
                                    {rowActions && (
                                        <td className="px-4 py-3.5 align-middle">
                                            <div className="flex items-center justify-end gap-1.5">
                                                {rowActions(row)}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* ── MOBILE (< md) — tarjetas ───────────────────────────────── */}
            <div className={cn('flex flex-col gap-3 md:hidden', className)}>
                {rows.length === 0 ? (
                    <div className="rounded-xl border border-border/60 bg-card px-4 py-10 text-center">
                        <EmptyState
                            message={emptyMessage}
                            description={emptyDescription}
                        />
                    </div>
                ) : (
                    rows.map((row) => (
                        <MobileCard
                            key={String(row[rowKey])}
                            row={row}
                            columns={columns}
                            rowActions={rowActions}
                        />
                    ))
                )}
            </div>
        </>
    );
}

// ─── icono de ordenamiento ────────────────────────────────────────────────────

function SortIcon({ active, dir }: { active: boolean; dir?: SortDir }) {
    if (!active) {
        return <ArrowUpDown className="size-3 opacity-40" />;
    }
    return dir === 'desc'
        ? <ArrowDown className="size-3 text-primary" />
        : <ArrowUp className="size-3 text-primary" />;
}

// ─── tarjeta mobile ───────────────────────────────────────────────────────────

function MobileCard<TRow extends object>({
    row,
    columns,
    rowActions,
}: {
    row: TRow;
    columns: TableColumn<TRow>[];
    rowActions?: (row: TRow) => ReactNode;
}) {
    const titleCol = columns.find((c) => c.cardTitle) ?? columns[0];
    const bodyColumns = columns.filter((c) => !c.cardTitle && !c.hideOnCard && c !== columns[0]);

    const getCellValue = (col: TableColumn<TRow>) =>
        col.cell ? col.cell(row) : String((row as Record<string, unknown>)[col.key] ?? '—');

    return (
        <div className="rounded-xl border border-border/60 bg-card shadow-sm transition-shadow hover:shadow-md">
            {/* Título — ancho completo, sin competir con acciones */}
            <div className="px-4 pt-4 pb-3">
                <div className="wrap-break-word text-sm font-semibold leading-snug text-foreground">
                    {getCellValue(titleCol)}
                </div>
            </div>

            {/* Campos adicionales */}
            {bodyColumns.length > 0 && (
                <dl
                    className={cn(
                        'border-t border-border/40 px-4 py-3',
                        // 1 campo → 1 col | 2-4 campos → 2 cols | 5+ → 2 cols (sigue apilando hacia abajo)
                        bodyColumns.length === 1
                            ? 'grid grid-cols-1 gap-y-2'
                            : 'grid grid-cols-2 gap-x-4 gap-y-3',
                    )}
                >
                    {bodyColumns.map((col) => {
                        const value = getCellValue(col);
                        const isNode = typeof value !== 'string';
                        return (
                            <div key={col.key} className="flex min-w-0 flex-col gap-0.5">
                                <dt className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                                    {col.header}
                                </dt>
                                <dd className={cn('text-sm text-foreground', !isNode && 'truncate')}
                                    title={!isNode ? String(value) : undefined}
                                >
                                    {value}
                                </dd>
                            </div>
                        );
                    })}
                </dl>
            )}

            {/* Footer: acciones alineadas a la derecha */}
            {rowActions && (
                <div className="flex items-center justify-end gap-1.5 border-t border-border/40 px-4 py-2.5">
                    {rowActions(row)}
                </div>
            )}
        </div>
    );
}

// ─── skeleton ─────────────────────────────────────────────────────────────────

function DataTableSkeleton<TRow extends object>({
    columns,
    rows,
    hasActions,
}: {
    columns: TableColumn<TRow>[];
    rows: number;
    hasActions: boolean;
}) {
    return (
        <>
            {/* Desktop */}
            <div className="hidden overflow-hidden rounded-xl border border-border/60 shadow-sm md:block">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border/60 bg-muted/50">
                            {columns.map((col) => (
                                <th key={col.key} className="px-4 py-3">
                                    <Skeleton className="h-3 w-24" />
                                </th>
                            ))}
                            {hasActions && <th className="w-24 px-4 py-3" />}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                        {Array.from({ length: rows }).map((_, i) => (
                            <tr key={i} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                                {columns.map((col) => (
                                    <td key={col.key} className="px-4 py-3.5">
                                        <Skeleton className="h-4 w-full max-w-[180px]" />
                                    </td>
                                ))}
                                {hasActions && (
                                    <td className="px-4 py-3.5">
                                        <div className="flex justify-end gap-1.5">
                                            <Skeleton className="h-7 w-7 rounded-md" />
                                            <Skeleton className="h-7 w-7 rounded-md" />
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile */}
            <div className="flex flex-col gap-3 md:hidden">
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} className="rounded-xl border border-border/60 bg-card p-4">
                        <Skeleton className="mb-3 h-5 w-1/2" />
                        <div className="grid grid-cols-2 gap-3 border-t border-border/40 pt-3">
                            {columns.slice(1, 5).map((col) => (
                                <div key={col.key} className="flex flex-col gap-1">
                                    <Skeleton className="h-2.5 w-16" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}

// ─── estado vacío ─────────────────────────────────────────────────────────────

function EmptyState({ message, description }: { message: string; description: string }) {
    return (
        <div className="flex flex-col items-center gap-2 py-2">
            <p className="font-medium text-foreground">{message}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
        </div>
    );
}
