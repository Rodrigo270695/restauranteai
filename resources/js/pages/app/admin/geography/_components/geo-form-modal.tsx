/**
 * GeoFormModal — modal reutilizable para crear/editar un registro geográfico.
 *
 * Usa ResourceModal como base y GeoField para los campos de nombre y código.
 * Todos los campos tienen soporte de obligatoriedad, error y hint.
 */

import type { FormEvent } from 'react';

import { ResourceModal } from '@/components/modals/resource-modal';

import { GeoField } from './geo-field';
import type { GeoFormState } from './types';

// ─── tipos ────────────────────────────────────────────────────────────────────

export type GeoFormModalProps = {
    open: boolean;
    onClose: () => void;
    title: string;
    description: string;

    /** Estado actual del formulario */
    form: GeoFormState;
    /** Callback para actualizar el estado del formulario */
    onChange: (form: GeoFormState) => void;

    onSubmit: (e: FormEvent) => void;
    isProcessing: boolean;
    submitLabel: string;

    /** Placeholder del campo Nombre */
    namePlaceholder?: string;
    /** Placeholder del campo Código */
    codePlaceholder?: string;

    /** Errores de validación del backend (por nombre de campo) */
    errors?: Partial<Record<'name' | 'code', string>>;
};

// ─── componente ───────────────────────────────────────────────────────────────

export function GeoFormModal({
    open,
    onClose,
    title,
    description,
    form,
    onChange,
    onSubmit,
    isProcessing,
    submitLabel,
    namePlaceholder = 'Ej: Lima',
    codePlaceholder = 'Ej: 15',
    errors,
}: GeoFormModalProps) {
    return (
        <ResourceModal
            open={open}
            onClose={onClose}
            title={title}
            description={description}
            onSubmit={onSubmit}
            isProcessing={isProcessing}
            submitLabel={submitLabel}
            submitVariant="brand"
            size="sm"
        >
            <GeoField
                id="geo-name"
                label="Nombre"
                required
                value={form.name}
                onChange={(v) => onChange({ ...form, name: v })}
                placeholder={namePlaceholder}
                error={errors?.name}
                autoFocus
            />

            <GeoField
                id="geo-code"
                label="Código"
                required
                value={form.code}
                onChange={(v) => onChange({ ...form, code: v })}
                placeholder={codePlaceholder}
                hint="Código oficial único (ubigeo, ISO, etc.)"
                error={errors?.code}
                inputClassName="font-mono uppercase"
            />
        </ResourceModal>
    );
}
