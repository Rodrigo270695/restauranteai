/**
 * ConfirmModal — modal de confirmación reutilizable para acciones destructivas.
 *
 * Uso:
 *   <ConfirmModal
 *     open={confirmOpen}
 *     onClose={() => setConfirmOpen(false)}
 *     onConfirm={handleDelete}
 *     isProcessing={processing}
 *     title="Eliminar rol"
 *     description="¿Estás seguro? Esta acción no se puede deshacer."
 *   />
 */

import { AlertTriangle } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ─── tipos ────────────────────────────────────────────────────────────────────

export type ConfirmModalProps = {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    description?: string;
    /** Texto del item que se va a eliminar (se muestra resaltado) */
    itemLabel?: string;
    /** Texto del botón de confirmación */
    confirmLabel?: string;
    isProcessing?: boolean;
    /** Variante del botón de confirmación */
    variant?: 'destructive' | 'brand';
};

// ─── componente ───────────────────────────────────────────────────────────────

export function ConfirmModal({
    open,
    onClose,
    onConfirm,
    title = 'Confirmar eliminación',
    description = 'Esta acción es irreversible. ¿Deseas continuar?',
    itemLabel,
    confirmLabel = 'Sí, eliminar',
    isProcessing = false,
    variant = 'destructive',
}: ConfirmModalProps) {
    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent
                className="gap-0 p-0 sm:max-w-md"
                onInteractOutside={(e) => e.preventDefault()}
            >
                {/* Cabecera con icono de advertencia */}
                <DialogHeader className="px-6 pt-6 pb-5">
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-destructive/10">
                        <AlertTriangle className="size-5 text-destructive" />
                    </div>
                    <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
                    <DialogDescription className="text-sm leading-relaxed">
                        {description}
                        {itemLabel && (
                            <>
                                {' '}
                                <span className="font-semibold text-foreground">
                                    «{itemLabel}»
                                </span>
                            </>
                        )}
                    </DialogDescription>
                </DialogHeader>

                {/* Pie */}
                <DialogFooter
                    className={cn(
                        'flex-row items-center justify-end gap-2 rounded-b-lg border-t border-border/60 bg-muted/30 px-6 py-4',
                    )}
                >
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onClose}
                        disabled={isProcessing}
                        className="cursor-pointer"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        variant={variant}
                        size="sm"
                        disabled={isProcessing}
                        onClick={onConfirm}
                        className="cursor-pointer gap-1.5 font-semibold"
                    >
                        {isProcessing && <ButtonSpinner />}
                        {confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function ButtonSpinner() {
    return (
        <svg
            className="size-3.5 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
    );
}
