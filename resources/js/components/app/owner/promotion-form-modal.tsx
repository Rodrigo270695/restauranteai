import type { FormEvent } from 'react';
import type { InertiaFormProps } from '@inertiajs/react';
import { FormField, ResourceModal } from '@/components/modals/resource-modal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export const PROMOTION_TYPE_OPTIONS = [
    { value: 'descuento', label: 'Descuento' },
    { value: 'evento', label: 'Evento' },
    { value: 'menu_especial', label: 'Menú especial' },
    { value: '2x1', label: '2x1' },
    { value: 'otro', label: 'Otro' },
] as const;

export type PromotionType = (typeof PROMOTION_TYPE_OPTIONS)[number]['value'];

export type PromotionFormData = {
    title: string;
    description: string;
    type: PromotionType;
    discount_percent: string | number;
    image: File | null;
    starts_at: string;
    ends_at: string;
    is_active: boolean;
};

const selectClass = cn(
    'flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-xs',
    'focus-visible:border-brand-red focus-visible:ring-2 focus-visible:ring-brand-red/20 focus-visible:outline-none',
);

const datetimeClass = cn(
    'flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-xs',
    'focus-visible:border-brand-red focus-visible:ring-2 focus-visible:ring-brand-red/20 focus-visible:outline-none',
);

type PromotionFormModalProps = {
    open: boolean;
    onClose: () => void;
    editing: { title: string } | null;
    form: Pick<InertiaFormProps<PromotionFormData>, 'data' | 'errors' | 'setData' | 'processing'>;
    onSubmit: (e: FormEvent<HTMLFormElement>) => void;
    previewUrl?: string | null;
};

export function PromotionFormModal({
    open,
    onClose,
    editing,
    form,
    onSubmit,
    previewUrl,
}: PromotionFormModalProps) {
    const isEdit = !!editing;
    const showDiscount = form.data.type === 'descuento';

    return (
        <ResourceModal
            open={open}
            onClose={onClose}
            title={isEdit ? `Editar: ${editing.title}` : 'Nueva promoción'}
            description={
                isEdit
                    ? 'Actualiza fechas, tipo y contenido de la oferta.'
                    : 'Crea una oferta con vigencia. Los turistas la verán en tu ficha.'
            }
            onSubmit={onSubmit}
            isProcessing={form.processing}
            submitLabel={isEdit ? 'Guardar promoción' : 'Crear promoción'}
            size="md"
        >
            {previewUrl && !form.data.image && (
                <img src={previewUrl} alt="" className="aspect-video w-full rounded-lg border object-cover" />
            )}
            <FormField label="Título" htmlFor="promo-title" error={form.errors.title} required>
                <Input
                    id="promo-title"
                    value={form.data.title}
                    onChange={(e) => form.setData('title', e.target.value)}
                    disabled={form.processing}
                    placeholder="Ej: 20% en ceviches"
                />
            </FormField>
            <FormField label="Tipo" required error={form.errors.type as string | undefined}>
                <select
                    className={selectClass}
                    value={form.data.type}
                    onChange={(e) => form.setData('type', e.target.value as PromotionType)}
                    disabled={form.processing}
                >
                    {PROMOTION_TYPE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </select>
            </FormField>
            {showDiscount && (
                <FormField
                    label="% de descuento"
                    htmlFor="promo-discount"
                    error={form.errors.discount_percent as string | undefined}
                >
                    <Input
                        id="promo-discount"
                        type="number"
                        min={0}
                        max={100}
                        step="1"
                        value={String(form.data.discount_percent ?? '')}
                        onChange={(e) => form.setData('discount_percent', e.target.value)}
                        disabled={form.processing}
                    />
                </FormField>
            )}
            <FormField label="Descripción" htmlFor="promo-desc">
                <Textarea
                    id="promo-desc"
                    rows={3}
                    value={form.data.description}
                    onChange={(e) => form.setData('description', e.target.value)}
                    disabled={form.processing}
                />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Inicio" htmlFor="promo-start" error={form.errors.starts_at} required>
                    <input
                        id="promo-start"
                        type="datetime-local"
                        className={datetimeClass}
                        value={form.data.starts_at}
                        onChange={(e) => form.setData('starts_at', e.target.value)}
                        disabled={form.processing}
                    />
                </FormField>
                <FormField label="Fin" htmlFor="promo-end" error={form.errors.ends_at} required>
                    <input
                        id="promo-end"
                        type="datetime-local"
                        className={datetimeClass}
                        value={form.data.ends_at}
                        onChange={(e) => form.setData('ends_at', e.target.value)}
                        disabled={form.processing}
                    />
                </FormField>
            </div>
            <FormField label="Imagen (opcional)" error={form.errors.image as string | undefined}>
                <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5"
                    onChange={(e) => form.setData('image', e.target.files?.[0] ?? null)}
                    disabled={form.processing}
                />
            </FormField>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                    type="checkbox"
                    checked={form.data.is_active}
                    onChange={(e) => form.setData('is_active', e.target.checked)}
                    disabled={form.processing}
                    className="size-4 rounded accent-[#cc0010]"
                />
                Promoción activa (visible si está en vigencia)
            </label>
        </ResourceModal>
    );
}
