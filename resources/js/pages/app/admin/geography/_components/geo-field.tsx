/**
 * GeoField — campo de formulario reutilizable para el módulo de Geografía.
 *
 * Muestra: etiqueta + asterisco si es obligatorio + input + mensaje de error o hint.
 * Puede reutilizarse en cualquier formulario geográfico añadiendo más variantes.
 */

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// ─── tipos ────────────────────────────────────────────────────────────────────

export type GeoFieldProps = {
    /** Identificador que enlaza label e input */
    id: string;
    /** Etiqueta visible del campo */
    label: string;
    /** Muestra un asterisco rojo si es obligatorio */
    required?: boolean;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    /** Texto de ayuda bajo el input */
    hint?: string;
    /** Mensaje de error (reemplaza al hint y cambia el estilo del input) */
    error?: string;
    /** Clases extra para el contenedor */
    className?: string;
    /** Clases extra para el input */
    inputClassName?: string;
    /** Foco automático al montar */
    autoFocus?: boolean;
    /** Deshabilita el campo */
    disabled?: boolean;
};

// ─── componente ───────────────────────────────────────────────────────────────

export function GeoField({
    id,
    label,
    required,
    value,
    onChange,
    placeholder,
    hint,
    error,
    className,
    inputClassName,
    autoFocus,
    disabled,
}: GeoFieldProps) {
    const hasError = !!error;

    return (
        <div className={cn('flex flex-col gap-1.5', className)}>
            {/* Etiqueta */}
            <label
                htmlFor={id}
                className="text-sm font-medium leading-none text-foreground"
            >
                {label}
                {required && (
                    <span className="ml-1 text-red-500" aria-hidden="true">*</span>
                )}
            </label>

            {/* Input */}
            <Input
                id={id}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                autoFocus={autoFocus}
                disabled={disabled}
                aria-invalid={hasError}
                aria-describedby={hint ?? error ? `${id}-desc` : undefined}
                className={cn(
                    hasError && 'border-red-400 focus-visible:ring-red-400',
                    inputClassName,
                )}
            />

            {/* Error o hint */}
            {(error ?? hint) && (
                <p
                    id={`${id}-desc`}
                    className={cn(
                        'text-xs leading-snug',
                        hasError ? 'text-red-500' : 'text-muted-foreground',
                    )}
                >
                    {error ?? hint}
                </p>
            )}
        </div>
    );
}
