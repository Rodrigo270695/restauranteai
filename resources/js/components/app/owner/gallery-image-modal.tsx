import type { FormEvent } from 'react';
import type { InertiaFormProps } from '@inertiajs/react';
import { FormField, ResourceModal } from '@/components/modals/resource-modal';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/** Solo fotos del establecimiento; los platos van en Carta → Platos. */
export const GALLERY_TYPE_OPTIONS = [
    { value: 'exterior', label: 'Exterior del local' },
    { value: 'interior', label: 'Interior / salón' },
    { value: 'ambiente', label: 'Ambiente y detalles' },
] as const;

export type GalleryType = (typeof GALLERY_TYPE_OPTIONS)[number]['value'];

const selectClass = cn(
    'flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-xs',
    'focus-visible:border-brand-red focus-visible:ring-2 focus-visible:ring-brand-red/20 focus-visible:outline-none',
);

export type GalleryFormData = {
    image: File | null;
    type: GalleryType;
    alt_text: string;
};

type GalleryImageModalProps = {
    open: boolean;
    onClose: () => void;
    mode: 'create' | 'edit';
    form: Pick<InertiaFormProps<GalleryFormData>, 'data' | 'errors' | 'setData' | 'processing'>;
    onSubmit: (e: FormEvent<HTMLFormElement>) => void;
    previewUrl?: string | null;
};

export function GalleryImageModal({
    open,
    onClose,
    mode,
    form,
    onSubmit,
    previewUrl,
}: GalleryImageModalProps) {
    const isEdit = mode === 'edit';

    return (
        <ResourceModal
            open={open}
            onClose={onClose}
            title={isEdit ? 'Editar foto del local' : 'Subir foto del local'}
            description={
                isEdit
                    ? 'Actualiza la categoría o reemplaza la imagen. Las fotos de platos se gestionan en Carta → Platos.'
                    : 'Fotos del restaurante: fachada, salón o ambiente. No uses esto para platos del menú.'
            }
            onSubmit={onSubmit}
            isProcessing={form.processing}
            submitLabel={isEdit ? 'Guardar cambios' : 'Subir foto'}
            size="md"
        >
            {isEdit && previewUrl && (
                <img src={previewUrl} alt="" className="aspect-video w-full rounded-lg border object-cover" />
            )}
            <FormField
                label={isEdit ? 'Reemplazar imagen (opcional)' : 'Imagen'}
                error={form.errors.image as string | undefined}
                required={!isEdit}
            >
                <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5"
                    onChange={(e) => form.setData('image', e.target.files?.[0] ?? null)}
                    disabled={form.processing}
                />
            </FormField>
            <FormField label="Tipo de foto" required error={form.errors.type as string | undefined}>
                <select
                    className={selectClass}
                    value={form.data.type}
                    onChange={(e) => form.setData('type', e.target.value as GalleryType)}
                    disabled={form.processing}
                >
                    {GALLERY_TYPE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </select>
            </FormField>
            <FormField label="Descripción (opcional)" htmlFor="gal-alt" error={form.errors.alt_text as string | undefined}>
                <Input
                    id="gal-alt"
                    placeholder="Ej: Fachada principal, salón VIP…"
                    value={form.data.alt_text}
                    onChange={(e) => form.setData('alt_text', e.target.value)}
                    disabled={form.processing}
                />
            </FormField>
        </ResourceModal>
    );
}
