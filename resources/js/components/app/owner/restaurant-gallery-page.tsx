import { Head, router, useForm, usePage } from '@inertiajs/react';
import { ImageIcon, ImagePlus, Pencil, Star, Trash2, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FormSection, STAT_COLORS } from '@/components/app/owner/form-section';
import {
    GalleryImageModal,
    GALLERY_TYPE_OPTIONS,
    type GalleryFormData,
    type GalleryType,
} from '@/components/app/owner/gallery-image-modal';
import { ConfirmModal } from '@/components/modals/confirm-modal';
import { PageHeader, type StatBadge } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AdminPanelBanner } from '@/components/layout/admin-panel-banner';
import { useCan } from '@/hooks/use-can';
import { useOwnerReadOnly } from '@/hooks/use-owner-read-only';
import { scopedPath, galleryImageActionUrl, type PanelContext } from '@/lib/scoped-app-path';
import { cn } from '@/lib/utils';

export type GalleryImage = {
    id: number;
    url: string;
    alt_text: string | null;
    type: GalleryType | 'platos';
    display_order: number;
    is_cover: boolean;
};

type Props = {
    restaurant: { id: number; name: string };
    owner: { name: string; business_name?: string | null };
    images: GalleryImage[];
    stats: { total: number; has_cover: boolean };
    canManageGallery?: boolean;
    panel?: PanelContext;
};

const TYPE_LABELS: Record<string, string> = {
    ...Object.fromEntries(GALLERY_TYPE_OPTIONS.map((o) => [o.value, o.label])),
    platos: 'Plato (mover a Carta)',
};

const defaultGalleryForm = (): GalleryFormData => ({
    image: null,
    type: 'interior',
    alt_text: '',
});

export function RestaurantGalleryPage({ restaurant, owner, images, stats, canManageGallery, panel }: Props) {
    const can = useCan();
    const readOnly = useOwnerReadOnly();
    const canManage = (canManageGallery ?? can('manage_gallery')) && !readOnly;
    const galleryBase = scopedPath('/gallery', panel);
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;

    const [uploadOpen, setUploadOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<GalleryImage | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<GalleryImage | null>(null);

    const uploadForm = useForm(defaultGalleryForm());
    const editForm = useForm(defaultGalleryForm());

    useEffect(() => {
        if (!flash?.success && !flash?.error) return;
        import('sonner').then(({ toast }) => {
            if (flash.success) toast.success(flash.success);
            if (flash.error) toast.error(flash.error);
        });
    }, [flash]);

    const displayName = owner.business_name || restaurant.name;

    const statBadges: StatBadge[] = [
        { icon: <ImageIcon className="size-3.5" />, label: 'Fotos', value: stats.total, color: STAT_COLORS.violet },
        {
            icon: <Star className="size-3.5" />,
            label: 'Portada',
            value: stats.has_cover ? 'Sí' : 'No',
            color: stats.has_cover ? STAT_COLORS.emerald : STAT_COLORS.amber,
        },
        { icon: <Upload className="size-3.5" />, label: 'Local', value: displayName, color: STAT_COLORS.sky },
    ];

    const openEdit = (img: GalleryImage) => {
        setEditTarget(img);
        const type = GALLERY_TYPE_OPTIONS.some((o) => o.value === img.type)
            ? (img.type as GalleryType)
            : 'ambiente';
        editForm.setData({
            type,
            alt_text: img.alt_text ?? '',
            image: null,
        });
    };

    const submitUpload = (e: React.FormEvent) => {
        e.preventDefault();
        if (readOnly) return;
        uploadForm.post(galleryBase, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setUploadOpen(false);
                uploadForm.reset();
            },
        });
    };

    const submitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (readOnly || !editTarget) return;
        editForm.post(galleryImageActionUrl(restaurant.id, editTarget.id, 'update', panel), {
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
            <Head title="Galería" />
            <AdminPanelBanner panel={panel} restaurantName={restaurant.name} />

            <div className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                <PageHeader
                    title="Galería"
                    description="Fotos del local: fachada, interior y ambiente. Elige una portada. Las fotos de platos van en Carta → Platos."
                    stats={statBadges}
                    actions={
                        canManage ? (
                            <Button
                                variant="brand"
                                size="sm"
                                className="cursor-pointer gap-1.5 font-semibold transition-opacity hover:opacity-90"
                                onClick={() => setUploadOpen(true)}
                            >
                                <ImagePlus className="size-4" />
                                Subir foto
                            </Button>
                        ) : null
                    }
                />

                <FormSection
                    title="Tus imágenes"
                    description="Vista en cuadrícula. La portada aparece destacada con estrella."
                    icon={<ImageIcon className="size-4" />}
                    palette={STAT_COLORS.violet}
                    contentClassName="p-4 md:p-5"
                >
                    {images.length === 0 ? (
                        <div
                            className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center"
                            style={{ borderColor: STAT_COLORS.violet.border, background: STAT_COLORS.violet.bg }}
                        >
                            <ImagePlus className="size-10 text-muted-foreground/50" />
                            <p className="text-sm font-medium text-foreground">Aún no hay fotos</p>
                            <p className="text-muted-foreground max-w-xs text-xs">
                                Sube fotos del local para que los turistas conozcan tu espacio.
                            </p>
                            {canManage && (
                                <Button variant="brand" size="sm" onClick={() => setUploadOpen(true)}>
                                    Subir primera foto
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {images.map((img) => (
                                <article
                                    key={img.id}
                                    className={cn(
                                        'group overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md',
                                        img.is_cover && 'ring-2 ring-amber-400/80',
                                    )}
                                >
                                    <div className="relative aspect-[4/3] bg-muted/30">
                                        <img
                                            src={img.url}
                                            alt={img.alt_text ?? 'Foto del restaurante'}
                                            className="size-full object-cover"
                                        />
                                        {img.is_cover && (
                                            <Badge className="absolute top-2 left-2 gap-1 border-amber-300 bg-amber-50 text-amber-900">
                                                <Star className="size-3 fill-amber-500 text-amber-500" />
                                                Portada
                                            </Badge>
                                        )}
                                        <Badge
                                            variant="secondary"
                                            className="absolute top-2 right-2 max-w-[55%] truncate text-[10px]"
                                        >
                                            {TYPE_LABELS[img.type] ?? img.type}
                                        </Badge>
                                    </div>
                                    <div className="space-y-2 p-3">
                                        <p className="text-muted-foreground line-clamp-1 text-xs">
                                            {img.alt_text || 'Sin descripción'}
                                        </p>
                                        {canManage && (
                                            <div className="flex flex-wrap gap-1.5">
                                                {!img.is_cover && (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-7 flex-1 cursor-pointer border-amber-200/80 text-[11px] text-amber-800 transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-amber-900"
                                                        onClick={() =>
                                                            router.post(
                                                                galleryImageActionUrl(restaurant.id, img.id, 'cover', panel),
                                                                {},
                                                                { preserveScroll: true },
                                                            )
                                                        }
                                                    >
                                                        <Star className="size-3" />
                                                        Portada
                                                    </Button>
                                                )}
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    title="Editar foto"
                                                    className="h-7 w-7 cursor-pointer rounded-md border p-0 text-violet-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-800 dark:hover:border-violet-800 dark:hover:bg-violet-950/40"
                                                    onClick={() => openEdit(img)}
                                                >
                                                    <Pencil className="size-3.5" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    title="Eliminar foto"
                                                    className="h-7 w-7 cursor-pointer rounded-md border p-0 text-rose-600 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-800 dark:hover:border-rose-800 dark:hover:bg-rose-950/40"
                                                    onClick={() => setDeleteTarget(img)}
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </FormSection>
            </div>

            <GalleryImageModal
                open={uploadOpen}
                onClose={() => setUploadOpen(false)}
                mode="create"
                form={uploadForm}
                onSubmit={submitUpload}
            />

            <GalleryImageModal
                open={!!editTarget}
                onClose={() => setEditTarget(null)}
                mode="edit"
                form={editForm}
                onSubmit={submitEdit}
                previewUrl={editTarget?.url ?? null}
            />

            <ConfirmModal
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                title="Eliminar foto"
                description="Se borrará de la galería y del almacenamiento."
                confirmLabel="Eliminar"
                variant="destructive"
                onConfirm={() => {
                    if (!deleteTarget?.id) return;
                    router.post(galleryImageActionUrl(restaurant.id, deleteTarget.id, 'unlink', panel), {}, {
                        preserveScroll: true,
                        onFinish: () => setDeleteTarget(null),
                    });
                }}
            />
        </>
    );
}

export default RestaurantGalleryPage;
