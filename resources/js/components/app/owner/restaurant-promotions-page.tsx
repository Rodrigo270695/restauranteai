import { Head, router, useForm, usePage } from '@inertiajs/react';
import { CalendarRange, ImagePlus, Pencil, Plus, Tag, Trash2, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FormSection, STAT_COLORS } from '@/components/app/owner/form-section';
import {
    PROMOTION_TYPE_OPTIONS,
    PromotionFormModal,
    type PromotionFormData,
    type PromotionType,
} from '@/components/app/owner/promotion-form-modal';
import { ConfirmModal } from '@/components/modals/confirm-modal';
import { PageHeader, type StatBadge } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AdminPanelBanner } from '@/components/layout/admin-panel-banner';
import { useCan } from '@/hooks/use-can';
import { useOwnerReadOnly } from '@/hooks/use-owner-read-only';
import { scopedPath, type PanelContext } from '@/lib/scoped-app-path';
import { cn } from '@/lib/utils';

export type PromotionRow = {
    id: number;
    title: string;
    description: string | null;
    type: PromotionType;
    discount_percent: number | null;
    image_url: string | null;
    has_image: boolean;
    starts_at: string;
    ends_at: string;
    starts_at_label: string;
    ends_at_label: string;
    is_active: boolean;
    status: 'active' | 'scheduled' | 'expired' | 'inactive';
};

type Props = {
    restaurant: { id: number; name: string };
    owner: { name: string; business_name?: string | null };
    promotions: PromotionRow[];
    stats: { total: number; active: number; scheduled: number };
    panel?: PanelContext;
};

const TYPE_LABELS = Object.fromEntries(PROMOTION_TYPE_OPTIONS.map((o) => [o.value, o.label])) as Record<
    PromotionType,
    string
>;

const STATUS_META: Record<
    PromotionRow['status'],
    { label: string; className: string }
> = {
    active: { label: 'En vigencia', className: 'border-emerald-300 bg-emerald-50 text-emerald-900' },
    scheduled: { label: 'Programada', className: 'border-sky-300 bg-sky-50 text-sky-900' },
    expired: { label: 'Finalizada', className: 'border-amber-300 bg-amber-50 text-amber-900' },
    inactive: { label: 'Inactiva', className: 'border-border bg-muted/50 text-muted-foreground' },
};

function defaultDatetime(offsetDays = 0): string {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    d.setMinutes(0, 0, 0);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const emptyPromotionForm = (): PromotionFormData => ({
    title: '',
    description: '',
    type: 'descuento',
    discount_percent: '',
    image: null,
    starts_at: defaultDatetime(0),
    ends_at: defaultDatetime(7),
    is_active: true,
});

export function RestaurantPromotionsPage({ restaurant, owner, promotions, stats, panel }: Props) {
    const can = useCan();
    const readOnly = useOwnerReadOnly();
    const canManage = can('manage_promotions') && !readOnly;
    const promotionsBase = scopedPath('/promotions', panel);
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;

    const [createOpen, setCreateOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<PromotionRow | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<PromotionRow | null>(null);

    const createForm = useForm(emptyPromotionForm());
    const editForm = useForm(emptyPromotionForm());

    useEffect(() => {
        if (!flash?.success && !flash?.error) return;
        import('sonner').then(({ toast }) => {
            if (flash.success) toast.success(flash.success);
            if (flash.error) toast.error(flash.error);
        });
    }, [flash]);

    const displayName = owner.business_name || restaurant.name;

    const statBadges: StatBadge[] = [
        { icon: <Tag className="size-3.5" />, label: 'Total', value: stats.total, color: STAT_COLORS.violet },
        {
            icon: <Zap className="size-3.5" />,
            label: 'En vigencia',
            value: stats.active,
            color: stats.active > 0 ? STAT_COLORS.emerald : STAT_COLORS.amber,
        },
        {
            icon: <CalendarRange className="size-3.5" />,
            label: 'Programadas',
            value: stats.scheduled,
            color: STAT_COLORS.sky,
        },
        {
            icon: <Tag className="size-3.5" />,
            label: 'Local',
            value: displayName,
            color: STAT_COLORS.orange,
        },
    ];

    const openEdit = (promo: PromotionRow) => {
        setEditTarget(promo);
        editForm.setData({
            title: promo.title,
            description: promo.description ?? '',
            type: promo.type,
            discount_percent: promo.discount_percent ?? '',
            image: null,
            starts_at: promo.starts_at,
            ends_at: promo.ends_at,
            is_active: promo.is_active,
        });
    };

    const submitCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (readOnly) return;
        createForm.post(promotionsBase, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setCreateOpen(false);
                createForm.reset();
            },
        });
    };

    const submitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (readOnly || !editTarget) return;
        editForm.transform((data) => ({ ...data, _method: 'put' })).post(`${promotionsBase}/${editTarget.id}`, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setEditTarget(null);
                editForm.reset();
            },
        });
    };

    return (
        <>
            <Head title="Promociones" />
            <AdminPanelBanner panel={panel} restaurantName={restaurant.name} />

            <div className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                <PageHeader
                    title="Promociones"
                    description="Ofertas, descuentos y eventos con fecha de inicio y fin. Aparecen en tu ficha cuando están en vigencia."
                    stats={statBadges}
                    actions={
                        canManage ? (
                            <Button
                                variant="brand"
                                size="sm"
                                className="cursor-pointer gap-1.5 font-semibold transition-opacity hover:opacity-90"
                                onClick={() => setCreateOpen(true)}
                            >
                                <Plus className="size-4" />
                                Nueva promoción
                            </Button>
                        ) : null
                    }
                />

                <FormSection
                    title="Tus ofertas"
                    description="Cada tarjeta muestra el estado según fechas y si está activa."
                    icon={<Tag className="size-4" />}
                    palette={STAT_COLORS.orange}
                    contentClassName="p-4 md:p-5"
                >
                    {promotions.length === 0 ? (
                        <div
                            className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center"
                            style={{ borderColor: STAT_COLORS.orange.border, background: STAT_COLORS.orange.bg }}
                        >
                            <Tag className="size-10 text-muted-foreground/50" />
                            <p className="text-sm font-medium text-foreground">Aún no hay promociones</p>
                            <p className="text-muted-foreground max-w-sm text-xs">
                                Publica tu primera oferta para atraer turistas a {displayName}.
                            </p>
                            {canManage && (
                                <Button variant="brand" size="sm" onClick={() => setCreateOpen(true)}>
                                    Crear primera promoción
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {promotions.map((promo) => {
                                const statusMeta = STATUS_META[promo.status];
                                return (
                                    <article
                                        key={promo.id}
                                        className={cn(
                                            'overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md',
                                            promo.status === 'active' && 'ring-2 ring-emerald-400/60',
                                        )}
                                    >
                                        <div className="relative aspect-[16/9] bg-muted/30">
                                            {promo.image_url ? (
                                                <img
                                                    src={promo.image_url}
                                                    alt={promo.title}
                                                    className="size-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex size-full flex-col items-center justify-center gap-1 text-muted-foreground/60">
                                                    <ImagePlus className="size-8" />
                                                    <span className="text-[10px]">Sin imagen</span>
                                                </div>
                                            )}
                                            <Badge className={cn('absolute top-2 left-2 text-[10px]', statusMeta.className)}>
                                                {statusMeta.label}
                                            </Badge>
                                            <Badge
                                                variant="secondary"
                                                className="absolute top-2 right-2 text-[10px] capitalize"
                                            >
                                                {TYPE_LABELS[promo.type]}
                                            </Badge>
                                        </div>
                                        <div className="space-y-2 p-3">
                                            <h3 className="line-clamp-1 text-sm font-semibold">{promo.title}</h3>
                                            {promo.type === 'descuento' && promo.discount_percent != null && (
                                                <p className="text-sm font-bold text-[#cc0010]">
                                                    {promo.discount_percent}% de descuento
                                                </p>
                                            )}
                                            <p className="text-muted-foreground text-[11px] leading-snug">
                                                <CalendarRange className="mr-1 inline size-3" />
                                                {promo.starts_at_label} → {promo.ends_at_label}
                                            </p>
                                            {promo.description && (
                                                <p className="text-muted-foreground line-clamp-2 text-xs">
                                                    {promo.description}
                                                </p>
                                            )}
                                            {canManage && (
                                                <div className="flex gap-1.5 pt-1">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-7 flex-1 cursor-pointer text-[11px] text-violet-700 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-900 dark:hover:border-violet-800 dark:hover:bg-violet-950/40"
                                                        onClick={() => openEdit(promo)}
                                                    >
                                                        <Pencil className="size-3" />
                                                        Editar
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        title="Eliminar promoción"
                                                        className="h-7 w-7 cursor-pointer rounded-md border p-0 text-rose-600 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-800 dark:hover:border-rose-800 dark:hover:bg-rose-950/40"
                                                        onClick={() => setDeleteTarget(promo)}
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </FormSection>
            </div>

            <PromotionFormModal
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                editing={null}
                form={createForm}
                onSubmit={submitCreate}
            />

            <PromotionFormModal
                open={!!editTarget}
                onClose={() => setEditTarget(null)}
                editing={editTarget}
                form={editForm}
                onSubmit={submitEdit}
                previewUrl={editTarget?.image_url ?? null}
            />

            <ConfirmModal
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                title="Eliminar promoción"
                description={`¿Eliminar "${deleteTarget?.title}"?`}
                confirmLabel="Eliminar"
                variant="destructive"
                onConfirm={() => {
                    if (deleteTarget) {
                        router.delete(`${promotionsBase}/${deleteTarget.id}`, {
                            preserveScroll: true,
                            onFinish: () => setDeleteTarget(null),
                        });
                    }
                }}
            />
        </>
    );
}

export default RestaurantPromotionsPage;
