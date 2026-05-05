import type { FormEvent } from 'react';

import type { InertiaFormProps } from '@inertiajs/react';

import { FormField, ResourceModal } from '@/components/modals/resource-modal';
import { Input } from '@/components/ui/input';

export type UserFormData = {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
};

export type UserFormModalProps = {
    open: boolean;
    onClose: () => void;
    editing: { name: string } | null;
    form: Pick<InertiaFormProps<UserFormData>, 'data' | 'errors' | 'setData' | 'processing'>;
    onSubmit: (e: FormEvent<HTMLFormElement>) => void;
};

export function UserFormModal({ open, onClose, editing, form, onSubmit }: UserFormModalProps) {
    const isEdit = !!editing;

    return (
        <ResourceModal
            open={open}
            onClose={onClose}
            title={isEdit ? `Editar usuario: ${editing.name}` : 'Nuevo usuario'}
            description={
                isEdit
                    ? 'Modifica los datos del usuario. Deja la contraseña en blanco para no cambiarla.'
                    : 'Crea una cuenta con nombre, correo y contraseña. Luego podrás asignar roles.'
            }
            onSubmit={onSubmit}
            isProcessing={form.processing}
            submitLabel={isEdit ? 'Guardar cambios' : 'Crear usuario'}
        >
            <FormField label="Nombre completo" htmlFor="user-name" error={form.errors.name} required>
                <Input
                    id="user-name"
                    placeholder="Nombre y apellido"
                    value={form.data.name}
                    onChange={(e) => form.setData('name', e.target.value)}
                    disabled={form.processing}
                    aria-invalid={!!form.errors.name}
                    autoComplete="name"
                />
            </FormField>
            <FormField label="Correo electrónico" htmlFor="user-email" error={form.errors.email} required>
                <Input
                    id="user-email"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={form.data.email}
                    onChange={(e) => form.setData('email', e.target.value)}
                    disabled={form.processing}
                    aria-invalid={!!form.errors.email}
                    autoComplete="email"
                />
            </FormField>
            <FormField
                label={isEdit ? 'Nueva contraseña (opcional)' : 'Contraseña'}
                htmlFor="user-password"
                error={form.errors.password}
                required={!isEdit}
            >
                <Input
                    id="user-password"
                    type="password"
                    placeholder={isEdit ? 'Sin cambios si vacío' : 'Mínimo 8 caracteres'}
                    value={form.data.password}
                    onChange={(e) => form.setData('password', e.target.value)}
                    disabled={form.processing}
                    aria-invalid={!!form.errors.password}
                    autoComplete="new-password"
                />
            </FormField>
            <FormField
                label="Confirmar contraseña"
                htmlFor="user-password-confirmation"
                error={form.errors.password_confirmation}
                required={!isEdit}
            >
                <Input
                    id="user-password-confirmation"
                    type="password"
                    placeholder="Repite la contraseña"
                    value={form.data.password_confirmation}
                    onChange={(e) => form.setData('password_confirmation', e.target.value)}
                    disabled={form.processing}
                    aria-invalid={!!form.errors.password_confirmation}
                    autoComplete="new-password"
                />
            </FormField>
        </ResourceModal>
    );
}
