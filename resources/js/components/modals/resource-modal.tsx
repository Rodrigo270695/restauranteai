/**
 * ResourceModal — modal base para crear y editar recursos.
 *
 * Características:
 *  - Un único componente tanto para "Crear" como para "Editar".
 *  - Modo detectado por `defaultValues` (undefined → crear, objeto → editar).
 *  - El título, descripción y campos del formulario son slots.
 *  - Muestra spinner mientras procesa y deshabilita el botón submit.
 *  - Botón cancelar llama a `onClose`.
 *
 * Uso:
 *   <ResourceModal
 *     open={open}
 *     onClose={() => setOpen(false)}
 *     title={isEditing ? 'Editar rol' : 'Nuevo rol'}
 *     onSubmit={handleSubmit}
 *     isProcessing={form.processing}
 *     submitLabel={isEditing ? 'Guardar cambios' : 'Crear rol'}
 *   >
 *     <FormField … />
 *   </ResourceModal>
 */

import type { FormEvent, ReactNode } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// ─── tipos ────────────────────────────────────────────────────────────────────

export type ResourceModalProps = {
    open: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    /** Campos del formulario */
    children: ReactNode;
    onSubmit: (e: FormEvent<HTMLFormElement>) => void;
    /** Mientras `true` el botón submit muestra spinner y queda deshabilitado */
    isProcessing?: boolean;
    /** Deshabilita el submit sin considerar processing (p. ej. acción no disponible) */
    submitDisabled?: boolean;
    /** Texto del botón cancelar (pie izquierdo) */
    cancelLabel?: string;
    /** Texto del botón de confirmación */
    submitLabel?: string;
    /** Variante del botón submit */
    submitVariant?: 'default' | 'brand' | 'destructive';
    /** Ancho máximo del modal */
    size?: 'sm' | 'md' | 'lg' | 'xl';
    /** Clase adicional para el contenido */
    className?: string;
};

const sizeMap: Record<NonNullable<ResourceModalProps['size']>, string> = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-lg',
    lg: 'sm:max-w-2xl',
    xl: 'sm:max-w-4xl',
};

// ─── componente ───────────────────────────────────────────────────────────────

export function ResourceModal({
    open,
    onClose,
    title,
    description,
    children,
    onSubmit,
    isProcessing = false,
    submitDisabled = false,
    cancelLabel = 'Cancelar',
    submitLabel = 'Guardar',
    submitVariant = 'brand',
    size = 'md',
    className,
}: ResourceModalProps) {
    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent
                className={cn(
                    sizeMap[size],
                    'flex max-h-[90dvh] flex-col gap-0 p-0',
                    className,
                )}
                onInteractOutside={(e) => e.preventDefault()}
            >
                {/* Cabecera — fija, no hace scroll */}
                <DialogHeader className="shrink-0 px-6 pt-6 pb-4">
                    <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
                    {description && (
                        <DialogDescription className="text-sm">{description}</DialogDescription>
                    )}
                </DialogHeader>

                <Separator className="shrink-0" />

                {/* Formulario — el cuerpo crece y hace scroll */}
                <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
                    <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
                        {children}
                    </div>

                    <Separator className="shrink-0" />

                    {/* Pie — fijo */}
                    <DialogFooter className="shrink-0 flex-row items-center justify-end gap-2 px-6 py-4">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onClose}
                            disabled={isProcessing}
                            className="cursor-pointer"
                        >
                            {cancelLabel}
                        </Button>
                        <Button
                            type="submit"
                            variant={submitVariant}
                            size="sm"
                            disabled={isProcessing || submitDisabled}
                            className="cursor-pointer gap-1.5 font-semibold"
                        >
                            {isProcessing && <ButtonSpinner />}
                            {submitLabel}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ─── spinner inline ───────────────────────────────────────────────────────────

function ButtonSpinner() {
    return (
        <svg
            className="size-3.5 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
        </svg>
    );
}

// ─── FormField helper — etiqueta + input + mensaje de error ──────────────────

export type FormFieldProps = {
    label: string;
    htmlFor?: string;
    error?: string;
    required?: boolean;
    children: ReactNode;
    className?: string;
};

export function FormField({
    label,
    htmlFor,
    error,
    required,
    children,
    className,
}: FormFieldProps) {
    return (
        <div className={cn('flex flex-col gap-1.5', className)}>
            <label
                htmlFor={htmlFor}
                className="text-sm font-medium text-foreground"
            >
                {label}
                {required && <span className="ml-0.5 text-destructive">*</span>}
            </label>
            {children}
            {error && (
                <p className="text-xs text-destructive" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}
