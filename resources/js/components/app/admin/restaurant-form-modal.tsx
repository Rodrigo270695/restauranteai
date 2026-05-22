import type { FormEvent } from 'react';

import type { InertiaFormProps } from '@inertiajs/react';

import { FormField, ResourceModal } from '@/components/modals/resource-modal';
import { CuisineTypeMultiSelect } from '@/components/shared/cuisine-type-multi-select';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export type RestaurantFormData = {
    owner_id: string;
    name: string;
    cuisine_type_ids: number[];
    primary_cuisine_type_id: number | null;
    price_range: string;
    is_active: boolean;
    is_verified: boolean;
};

type Option = { id: number; name: string };

export type RestaurantFormModalProps = {
    open: boolean;
    onClose: () => void;
    editing: { name: string } | null;
    owners: Option[];
    cuisineTypes: Option[];
    form: Pick<
        InertiaFormProps<RestaurantFormData>,
        'data' | 'errors' | 'setData' | 'processing'
    >;
    onSubmit: (e: FormEvent<HTMLFormElement>) => void;
};

const PRICE_OPTIONS = [
    { value: 'economico', label: 'Económico' },
    { value: 'moderado', label: 'Moderado' },
    { value: 'premium', label: 'Premium' },
] as const;

const selectClass = cn(
    'flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-xs',
    'focus-visible:border-brand-red focus-visible:ring-2 focus-visible:ring-brand-red/20 focus-visible:outline-none',
    'disabled:cursor-not-allowed disabled:opacity-50',
);

export function RestaurantFormModal({
    open,
    onClose,
    editing,
    owners,
    cuisineTypes,
    form,
    onSubmit,
}: RestaurantFormModalProps) {
    const isEdit = !!editing;

    return (
        <ResourceModal
            open={open}
            onClose={onClose}
            title={isEdit ? `Editar restaurante: ${editing.name}` : 'Nuevo restaurante'}
            description={
                isEdit
                    ? 'Actualiza nombre, tipos de cocina y flags de visibilidad del local.'
                    : 'Registra un local y asígnalo a un dueño con rol restaurant_owner.'
            }
            onSubmit={onSubmit}
            isProcessing={form.processing}
            submitLabel={isEdit ? 'Guardar cambios' : 'Crear restaurante'}
            size="md"
        >
            {!isEdit && (
                <FormField label="Dueño del local" htmlFor="restaurant-owner" error={form.errors.owner_id} required>
                    <select
                        id="restaurant-owner"
                        className={selectClass}
                        value={String(form.data.owner_id)}
                        onChange={(e) => form.setData('owner_id', e.target.value)}
                        disabled={form.processing}
                        aria-invalid={!!form.errors.owner_id}
                    >
                        <option value="">Seleccionar dueño…</option>
                        {owners.map((o) => (
                            <option key={o.id} value={o.id}>
                                {o.name}
                            </option>
                        ))}
                    </select>
                </FormField>
            )}

            <FormField label="Nombre del restaurante" htmlFor="restaurant-name" error={form.errors.name} required>
                <Input
                    id="restaurant-name"
                    placeholder="Ej. MACGA S.A.C."
                    value={form.data.name}
                    onChange={(e) => form.setData('name', e.target.value)}
                    disabled={form.processing}
                    aria-invalid={!!form.errors.name}
                />
            </FormField>

            <FormField
                label="Tipos de cocina"
                htmlFor="restaurant-cuisines"
                error={
                    (form.errors as Record<string, string | undefined>).cuisine_type_ids ??
                    (form.errors as Record<string, string | undefined>).primary_cuisine_type_id
                }
            >
                <CuisineTypeMultiSelect
                    options={cuisineTypes}
                    selectedIds={form.data.cuisine_type_ids}
                    primaryId={form.data.primary_cuisine_type_id}
                    onChange={(ids, primaryId) => {
                        form.setData('cuisine_type_ids', ids);
                        form.setData('primary_cuisine_type_id', primaryId);
                    }}
                    disabled={form.processing}
                />
            </FormField>

            <FormField label="Rango de precios" htmlFor="restaurant-price" error={form.errors.price_range}>
                <select
                    id="restaurant-price"
                    className={selectClass}
                    value={form.data.price_range}
                    onChange={(e) => form.setData('price_range', e.target.value)}
                    disabled={form.processing}
                >
                    {PRICE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </select>
            </FormField>

            <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-muted/20 px-4 py-3">
                <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                    <input
                        type="checkbox"
                        className="size-4 rounded border-input accent-[#cc0010]"
                        checked={form.data.is_active}
                        onChange={(e) => form.setData('is_active', e.target.checked)}
                        disabled={form.processing}
                    />
                    <span>
                        <span className="font-medium">Activo</span>
                        <span className="text-muted-foreground block text-xs">Visible en exploración</span>
                    </span>
                </label>
                <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                    <input
                        type="checkbox"
                        className="size-4 rounded border-input accent-[#cc0010]"
                        checked={form.data.is_verified}
                        onChange={(e) => form.setData('is_verified', e.target.checked)}
                        disabled={form.processing}
                    />
                    <span>
                        <span className="font-medium">Verificado</span>
                        <span className="text-muted-foreground block text-xs">Muestra sello de confianza</span>
                    </span>
                </label>
            </div>
        </ResourceModal>
    );
}
