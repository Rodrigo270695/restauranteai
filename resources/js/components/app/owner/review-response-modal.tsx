import type { FormEvent } from 'react';
import type { InertiaFormProps } from '@inertiajs/react';
import { FormField, ResourceModal } from '@/components/modals/resource-modal';
import { Textarea } from '@/components/ui/textarea';

export type ReviewResponseFormData = {
    owner_response: string;
};

type ReviewResponseModalProps = {
    open: boolean;
    onClose: () => void;
    reviewerName: string;
    rating: number;
    comment: string | null;
    existingResponse?: string | null;
    form: Pick<InertiaFormProps<ReviewResponseFormData>, 'data' | 'errors' | 'setData' | 'processing'>;
    onSubmit: (e: FormEvent<HTMLFormElement>) => void;
};

export function ReviewResponseModal({
    open,
    onClose,
    reviewerName,
    rating,
    comment,
    existingResponse,
    form,
    onSubmit,
}: ReviewResponseModalProps) {
    const isEdit = !!existingResponse;

    return (
        <ResourceModal
            open={open}
            onClose={onClose}
            title={isEdit ? 'Editar respuesta' : 'Responder reseña'}
            description={`Respuesta pública a ${reviewerName} (${rating}★)`}
            onSubmit={onSubmit}
            isProcessing={form.processing}
            submitLabel={isEdit ? 'Actualizar respuesta' : 'Publicar respuesta'}
            size="md"
        >
            {comment && (
                <blockquote className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                    “{comment}”
                </blockquote>
            )}
            <FormField
                label="Tu respuesta"
                htmlFor="owner-response"
                error={form.errors.owner_response}
                required
            >
                <Textarea
                    id="owner-response"
                    rows={4}
                    value={form.data.owner_response}
                    onChange={(e) => form.setData('owner_response', e.target.value)}
                    disabled={form.processing}
                    placeholder="Agradece al turista o aclara algún detalle…"
                />
            </FormField>
        </ResourceModal>
    );
}
