import type { FormEvent } from 'react';

import { ResourceModal } from '@/components/modals/resource-modal';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export type OwnerProfileSummary = {
    status: 'pending' | 'approved' | 'rejected';
    business_name?: string | null;
    ruc?: string | null;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    district?: string | null;
    description?: string | null;
    website?: string | null;
    rejection_reason?: string | null;
};

export type OwnerBusinessApprovalModalProps = {
    open: boolean;
    onClose: () => void;
    userName: string;
    userEmail: string;
    profile: OwnerProfileSummary | null;
    onApprove: () => void;
    isProcessing?: boolean;
};

function field(label: string, value: string | null | undefined) {
    const v = value != null && String(value).trim() !== '' ? String(value) : '—';
    return (
        <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="text-sm leading-snug">{v}</p>
        </div>
    );
}

export function OwnerBusinessApprovalModal({
    open,
    onClose,
    userName,
    userEmail,
    profile,
    onApprove,
    isProcessing = false,
}: OwnerBusinessApprovalModalProps) {
    const pending = profile?.status === 'pending';

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onApprove();
    };

    return (
        <ResourceModal
            open={open}
            onClose={onClose}
            title="Revisar solicitud de negocio"
            description="Datos registrados por el dueño. Al aprobar, el negocio queda habilitado para el panel del restaurante."
            onSubmit={handleSubmit}
            isProcessing={isProcessing}
            submitDisabled={!pending || !profile}
            cancelLabel="Cerrar"
            submitLabel={isProcessing ? 'Aprobando…' : 'Aprobar negocio'}
            submitVariant="brand"
        >
            <div className="space-y-4">
                <div>
                    <p className="text-xs font-medium text-muted-foreground">Cuenta</p>
                    <p className="font-medium">{userName}</p>
                    <p className="text-sm text-muted-foreground">{userEmail}</p>
                </div>

                <Separator />

                {!profile ? (
                    <p className="text-sm text-muted-foreground">No hay perfil de negocio asociado.</p>
                ) : (
                    <>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-medium text-muted-foreground">Estado actual</span>
                            <Badge variant="outline" className="font-normal">
                                {profile.status === 'pending' && 'Pendiente'}
                                {profile.status === 'approved' && 'Aprobado'}
                                {profile.status === 'rejected' && 'Rechazado'}
                            </Badge>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            {field('Razón social / nombre comercial', profile.business_name)}
                            {field('RUC', profile.ruc)}
                            {field('Teléfono', profile.phone)}
                            {field('Sitio web', profile.website)}
                            {field('Ciudad', profile.city)}
                            {field('Distrito', profile.district)}
                        </div>
                        <div className="space-y-1">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                Dirección
                            </p>
                            <p className="text-sm leading-snug">
                                {profile.address?.trim() ? profile.address : '—'}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                Descripción
                            </p>
                            <p className="text-sm leading-snug whitespace-pre-wrap">
                                {profile.description?.trim() ? profile.description : '—'}
                            </p>
                        </div>
                        {profile.rejection_reason?.trim() ? (
                            <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100">
                                <span className="font-medium">Motivo de rechazo anterior: </span>
                                {profile.rejection_reason}
                            </div>
                        ) : null}
                    </>
                )}
            </div>
        </ResourceModal>
    );
}
