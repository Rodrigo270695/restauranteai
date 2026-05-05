/**
 * SearchFilter — campo de búsqueda con debounce + slot para filtros adicionales.
 *
 * Al escribir, espera `debounceMs` ms y luego llama a router.get() preservando
 * el estado de la página (scroll + formularios).
 *
 * Uso básico:
 *   <SearchFilter placeholder="Buscar roles…" paramName="search" />
 *
 * Con filtros extra:
 *   <SearchFilter placeholder="Buscar…">
 *     <Select …>…</Select>
 *   </SearchFilter>
 */

import { router } from '@inertiajs/react';
import { Search, X } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type SearchFilterProps = {
    /** Valor inicial (tomado del query string de la URL actual) */
    initialValue?: string;
    placeholder?: string;
    /** Nombre del parámetro GET que se enviará al backend */
    paramName?: string;
    /** Millisegundos antes de disparar la búsqueda */
    debounceMs?: number;
    /** Keys Inertia para recarga parcial */
    only?: string[];
    /** Filtros adicionales (selects, toggles…) alineados a la derecha */
    children?: ReactNode;
    className?: string;
    /** Callback alternativo: recibe el valor actual (sin Inertia) */
    onSearch?: (value: string) => void;
};

export function SearchFilter({
    initialValue = '',
    placeholder = 'Buscar…',
    paramName = 'search',
    debounceMs = 350,
    only,
    children,
    className,
    onSearch,
}: SearchFilterProps) {
    const [value, setValue] = useState(initialValue);
    const isFirstRender = useRef(true);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Sincronizar si el valor inicial cambia (p. ej. al navegar)
    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        if (timerRef.current) clearTimeout(timerRef.current);

        timerRef.current = setTimeout(() => {
            if (onSearch) {
                onSearch(value);
                return;
            }

            const params = new URLSearchParams(window.location.search);
            if (value) {
                params.set(paramName, value);
            } else {
                params.delete(paramName);
            }
            // Resetear a página 1 al buscar
            params.delete('page');

            router.get(
                window.location.pathname + (params.toString() ? `?${params.toString()}` : ''),
                {},
                { preserveState: true, preserveScroll: true, only },
            );
        }, debounceMs);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [value]);

    const handleClear = () => setValue('');

    return (
        <div className={cn('flex flex-col gap-2 sm:flex-row sm:items-stretch', className)}>
            {/* Campo de búsqueda */}
            <div className="relative flex min-h-9 flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="h-9 pl-9 pr-9"
                />
                {value && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleClear}
                        className="absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2 p-0 text-muted-foreground hover:text-foreground"
                        aria-label="Limpiar búsqueda"
                    >
                        <X className="size-3.5" />
                    </Button>
                )}
            </div>

            {/* Filtros adicionales */}
            {children && (
                <div className="flex min-h-9 w-full shrink-0 flex-col flex-wrap gap-2 sm:w-auto sm:flex-row sm:items-stretch sm:gap-2">
                    {children}
                </div>
            )}
        </div>
    );
}
