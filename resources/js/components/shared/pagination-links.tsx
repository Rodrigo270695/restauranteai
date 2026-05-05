/**
 * PaginationLinks — paginación reutilizable para respuestas Laravel paginate().
 *
 * Incluye:
 *  - Botones de navegación con color
 *  - Selector "por página" (10 / 15 / 25 / 50 / 100)
 *  - Info "Mostrando X–Y de Z registros"
 *
 * Uso:
 *   <PaginationLinks meta={roles} only={['roles']} />
 */

import { router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

// ─── tipos ────────────────────────────────────────────────────────────────────

export type PaginationMeta = {
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    per_page: number;
    path: string;
    links?: { url: string | null; label: string; active: boolean }[];
};

type PaginationLinksProps = {
    meta: PaginationMeta;
    only?: string[];
    /** Opciones de "por página" — por defecto [10, 15, 25, 50, 100] */
    perPageOptions?: number[];
    className?: string;
};

const DEFAULT_PER_PAGE_OPTIONS = [10, 15, 25, 50, 100];

// ─── helpers ──────────────────────────────────────────────────────────────────

function navigate(
    path: string,
    params: Record<string, string | number>,
    only?: string[],
) {
    const url = new URL(window.location.href);
    // Mantener los params existentes y aplicar los nuevos
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
    router.get(
        url.pathname + url.search,
        {},
        { preserveState: true, preserveScroll: true, only },
    );
}

// ─── componente ───────────────────────────────────────────────────────────────

export function PaginationLinks({
    meta,
    only,
    perPageOptions = DEFAULT_PER_PAGE_OPTIONS,
    className,
}: PaginationLinksProps) {
    const { current_page: current, last_page: last, from, to, total, per_page, path } = meta;

    const go = (page: number) => {
        if (page < 1 || page > last) return;
        navigate(path, { page }, only);
    };

    const changePerPage = (value: string) => {
        navigate(path, { per_page: value, page: 1 }, only);
    };

    const range = buildRange(current, last, 5);

    return (
        <div
            className={cn(
                'flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center',
                className,
            )}
        >
            {/* ── Izquierda: info + per-page selector ─────────────────── */}
            <div className="order-2 flex flex-wrap items-center gap-x-3 gap-y-1 sm:order-1">
                <p className="text-sm text-muted-foreground">
                    {from != null && to != null ? (
                        <>
                            Mostrando{' '}
                            <span className="font-semibold text-foreground">{from}</span>–<span className="font-semibold text-foreground">{to}</span>
                            {' '}de{' '}
                            <span className="font-semibold text-foreground">{total}</span>
                        </>
                    ) : (
                        <span className="font-semibold text-foreground">{total}</span>
                    )}{' '}
                    registros
                </p>

                {/* Selector por página */}
                <div className="flex items-center gap-1.5">
                    <span className="hidden text-xs text-muted-foreground sm:inline">Mostrar</span>
                    <Select value={String(per_page)} onValueChange={changePerPage}>
                        <SelectTrigger
                            size="sm"
                            className="h-7 w-[62px] cursor-pointer border-red-200 text-xs text-red-700 hover:border-red-400 dark:border-red-800 dark:text-red-400"
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent align="start" side="top">
                            {perPageOptions.map((n) => (
                                <SelectItem key={n} value={String(n)} className="cursor-pointer text-xs">
                                    {n}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* ── Derecha: botones de página ───────────────────────────── */}
            {last > 1 && (
                <div className="order-1 flex items-center gap-1 sm:order-2">
                    {/* Primera — oculta en móvil */}
                    <NavBtn onClick={() => go(1)} disabled={current === 1} aria-label="Primera página" className="hidden sm:inline-flex">
                        <ChevronsLeft className="size-3.5" />
                    </NavBtn>

                    {/* Anterior */}
                    <NavBtn onClick={() => go(current - 1)} disabled={current === 1} aria-label="Página anterior">
                        <ChevronLeft className="size-3.5" />
                    </NavBtn>

                    {/* Páginas numeradas — ocultas en móvil, se muestran sólo la actual */}
                    <div className="hidden items-center gap-1 sm:flex">
                        {range.map((p, i) =>
                            p === '...' ? (
                                <span
                                    key={`ellipsis-${i}`}
                                    className="flex h-8 w-5 items-center justify-center text-xs text-muted-foreground"
                                >
                                    …
                                </span>
                            ) : (
                                <button
                                    key={p}
                                    onClick={() => go(p as number)}
                                    disabled={p === current}
                                    style={p === current ? {
                                        background: 'linear-gradient(90deg,#e8001a 0%,#cc0010 50%,#8b0008 100%)',
                                        boxShadow: '0 2px 8px rgba(200,0,10,0.30)',
                                        color: '#fff',
                                        borderColor: 'transparent',
                                    } : undefined}
                                    className={cn(
                                        'inline-flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-md border px-2.5 text-xs font-semibold transition-all duration-150',
                                        p === current
                                            ? 'pointer-events-none'
                                            : 'border-border bg-background text-foreground hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:hover:border-red-800 dark:hover:bg-red-950/40 dark:hover:text-red-400',
                                    )}
                                >
                                    {p}
                                </button>
                            ),
                        )}
                    </div>

                    {/* Indicador compacto en móvil: "2 / 5" */}
                    <span className="flex h-8 items-center rounded-md border border-red-300 bg-red-50 px-3 text-xs font-semibold text-red-700 sm:hidden dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
                        {current} / {last}
                    </span>

                    {/* Siguiente */}
                    <NavBtn onClick={() => go(current + 1)} disabled={current === last} aria-label="Página siguiente">
                        <ChevronRight className="size-3.5" />
                    </NavBtn>

                    {/* Última — oculta en móvil */}
                    <NavBtn onClick={() => go(last)} disabled={current === last} aria-label="Última página" className="hidden sm:inline-flex">
                        <ChevronsRight className="size-3.5" />
                    </NavBtn>
                </div>
            )}
        </div>
    );
}

// ─── botón de navegación ──────────────────────────────────────────────────────

function NavBtn({
    children,
    disabled,
    onClick,
    'aria-label': ariaLabel,
    className,
}: {
    children: React.ReactNode;
    disabled?: boolean;
    onClick: () => void;
    'aria-label': string;
    className?: string;
}) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            aria-label={ariaLabel}
            className={cn(
                'inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border transition-all duration-150',
                'border-border bg-background text-muted-foreground',
                'hover:border-red-300 hover:bg-red-50 hover:text-red-700',
                'dark:hover:border-red-800 dark:hover:bg-red-950/40 dark:hover:text-red-400',
                disabled && 'cursor-not-allowed opacity-35 pointer-events-none',
                className,
            )}
        >
            {children}
        </button>
    );
}

// ─── helper: ventana deslizante de páginas ────────────────────────────────────

function buildRange(current: number, last: number, window: number): (number | '...')[] {
    if (last <= window + 2) {
        return Array.from({ length: last }, (_, i) => i + 1);
    }

    const half = Math.floor(window / 2);
    let start = Math.max(2, current - half);
    let end   = Math.min(last - 1, current + half);

    if (current - half <= 2)      end   = Math.min(last - 1, window);
    if (current + half >= last - 1) start = Math.max(2, last - window);

    const pages: (number | '...')[] = [1];
    if (start > 2)      pages.push('...');
    for (let p = start; p <= end; p++) pages.push(p);
    if (end < last - 1) pages.push('...');
    pages.push(last);

    return pages;
}
