/**
 * EmptyState — estado vacío para columnas de geografía.
 *
 * Muestra un icono tenue y un mensaje descriptivo.
 */

import { MapPin } from 'lucide-react';

// ─── tipos ────────────────────────────────────────────────────────────────────

type EmptyStateProps = {
    message: string;
};

// ─── componente ───────────────────────────────────────────────────────────────

export function EmptyState({ message }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <MapPin className="mb-2 size-8 opacity-30" />
            <p className="text-sm">{message}</p>
        </div>
    );
}
