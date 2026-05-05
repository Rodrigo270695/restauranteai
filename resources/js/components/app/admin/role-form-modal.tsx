import type { FormEvent } from 'react';

import type { InertiaFormProps } from '@inertiajs/react';

import { FormField, ResourceModal } from '@/components/modals/resource-modal';
import { Input } from '@/components/ui/input';

/** Datos del formulario de rol (coincide con `useForm` en la página). */
export type RoleFormData = { name: string; permissions: string[] };

export type RoleFormModalProps = {
    open: boolean;
    onClose: () => void;
    /** Si existe, modo edición y se usa el nombre para el título. */
    editing: { name: string } | null;
    form: Pick<InertiaFormProps<RoleFormData>, 'data' | 'errors' | 'setData' | 'processing'>;
    onSubmit: (e: FormEvent<HTMLFormElement>) => void;
    /** Nombres de roles de sistema: el campo nombre queda deshabilitado al editarlos. */
    protectedRoleNames: readonly string[];
};

export function RoleFormModal({
    open,
    onClose,
    editing,
    form,
    onSubmit,
    protectedRoleNames,
}: RoleFormModalProps) {
    const nameLocked = !!editing && protectedRoleNames.includes(editing.name);

    return (
        <ResourceModal
            open={open}
            onClose={onClose}
            title={editing ? `Editar rol: ${editing.name}` : 'Nuevo rol'}
            description={
                editing
                    ? 'Modifica el nombre del rol. Los roles del sistema no se pueden renombrar.'
                    : 'Define un nombre único en minúsculas (a-z, 0-9, _).'
            }
            onSubmit={onSubmit}
            isProcessing={form.processing}
            submitLabel={editing ? 'Guardar cambios' : 'Crear rol'}
        >
            <FormField label="Nombre del rol" htmlFor="role-name" error={form.errors.name} required>
                <Input
                    id="role-name"
                    placeholder="ej. manager_restaurant"
                    value={form.data.name}
                    onChange={(e) => form.setData('name', e.target.value)}
                    disabled={form.processing || nameLocked}
                    aria-invalid={!!form.errors.name}
                    autoComplete="off"
                />
            </FormField>
        </ResourceModal>
    );
}
