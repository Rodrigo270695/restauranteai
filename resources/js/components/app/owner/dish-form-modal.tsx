import type { FormEvent } from 'react';
import type { InertiaFormProps } from '@inertiajs/react';
import { FormField, ResourceModal } from '@/components/modals/resource-modal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export type DishFormData = {
    name: string;
    description: string;
    price: string | number;
    dish_category_id: string | number;
    image: File | null;
    is_available: boolean;
    is_signature: boolean;
};

type Category = { id: number; name: string };

const selectClass = cn(
    'flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-xs',
    'focus-visible:border-brand-red focus-visible:ring-2 focus-visible:ring-brand-red/20 focus-visible:outline-none',
);

type DishFormModalProps = {
    open: boolean;
    onClose: () => void;
    editing: { name: string } | null;
    form: Pick<InertiaFormProps<DishFormData>, 'data' | 'errors' | 'setData' | 'processing'>;
    categories: Category[];
    onSubmit: (e: FormEvent<HTMLFormElement>) => void;
    previewUrl?: string | null;
};

export function DishFormModal({
    open,
    onClose,
    editing,
    form,
    categories,
    onSubmit,
    previewUrl,
}: DishFormModalProps) {
    const isEdit = !!editing;

    return (
        <ResourceModal
            open={open}
            onClose={onClose}
            title={isEdit ? `Editar: ${editing.name}` : 'Nuevo plato'}
            description={
                isEdit
                    ? 'Actualiza datos y foto del plato. La imagen aparece en tu carta digital.'
                    : 'Registra un plato con precio y foto. Aquí va la imagen del menú, no en Galería.'
            }
            onSubmit={onSubmit}
            isProcessing={form.processing}
            submitLabel={isEdit ? 'Guardar plato' : 'Agregar plato'}
            size="md"
        >
            {(previewUrl || form.data.image) && (
                <div className="overflow-hidden rounded-lg border bg-muted/20">
                    {form.data.image ? (
                        <p className="text-muted-foreground px-3 py-2 text-xs">Vista previa del archivo nuevo</p>
                    ) : null}
                    {previewUrl && !form.data.image && (
                        <img src={previewUrl} alt="" className="aspect-video w-full object-cover" />
                    )}
                </div>
            )}
            <FormField label="Nombre del plato" htmlFor="dish-name" error={form.errors.name} required>
                <Input
                    id="dish-name"
                    value={form.data.name}
                    onChange={(e) => form.setData('name', e.target.value)}
                    disabled={form.processing}
                />
            </FormField>
            <FormField label="Categoría" htmlFor="dish-cat">
                <select
                    id="dish-cat"
                    className={selectClass}
                    value={String(form.data.dish_category_id)}
                    onChange={(e) =>
                        form.setData('dish_category_id', e.target.value ? Number(e.target.value) : '')
                    }
                    disabled={form.processing}
                >
                    <option value="">Sin categoría</option>
                    {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.name}
                        </option>
                    ))}
                </select>
            </FormField>
            <FormField label="Precio (S/)" htmlFor="dish-price" error={form.errors.price} required>
                <Input
                    id="dish-price"
                    type="number"
                    min={0}
                    step="0.5"
                    value={String(form.data.price)}
                    onChange={(e) => form.setData('price', e.target.value)}
                    disabled={form.processing}
                />
            </FormField>
            <FormField label="Descripción" htmlFor="dish-desc">
                <Textarea
                    id="dish-desc"
                    rows={3}
                    value={form.data.description}
                    onChange={(e) => form.setData('description', e.target.value)}
                    disabled={form.processing}
                />
            </FormField>
            <FormField
                label={isEdit ? 'Nueva foto (opcional)' : 'Foto del plato'}
                error={form.errors.image as string | undefined}
            >
                <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5"
                    onChange={(e) => form.setData('image', e.target.files?.[0] ?? null)}
                    disabled={form.processing}
                />
            </FormField>
            <div className="flex flex-col gap-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={form.data.is_available}
                        onChange={(e) => form.setData('is_available', e.target.checked)}
                        disabled={form.processing}
                        className="size-4 rounded accent-[#cc0010]"
                    />
                    Disponible hoy
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={form.data.is_signature}
                        onChange={(e) => form.setData('is_signature', e.target.checked)}
                        disabled={form.processing}
                        className="size-4 rounded accent-[#cc0010]"
                    />
                    Plato emblema (destacado)
                </label>
            </div>
        </ResourceModal>
    );
}
