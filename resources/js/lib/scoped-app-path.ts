import adminGallery from '@/routes/app/admin/restaurants/manage/gallery';
import ownerGallery from '@/routes/app/gallery';

export type PanelContext = {
    mode: 'owner' | 'admin';
    baseUrl: string | null;
    hubUrl?: string | null;
    /** Suplantación: super_admin solo puede ver, no editar. */
    readOnly?: boolean;
};

/** Ruta API del panel (dueño o admin por restaurante). */
export function scopedPath(segment: string, panel?: PanelContext | null): string {
    const path = segment.startsWith('/') ? segment : `/${segment}`;
    if (panel?.baseUrl) {
        return `${panel.baseUrl}${path}`;
    }
    return `/app${path}`;
}

/** URL POST para acciones sobre una foto (cover, unlink, update). */
export function galleryImageActionUrl(
    restaurantId: number,
    imageId: number,
    action: 'cover' | 'unlink' | 'update',
    panel?: PanelContext | null,
): string {
    if (!Number.isFinite(imageId) || imageId <= 0) {
        throw new Error('ID de imagen inválido');
    }

    if (panel?.mode === 'admin') {
        const args = { restaurant: restaurantId, image: imageId };
        if (action === 'unlink') {
            return adminGallery.unlink.url(args);
        }
        if (action === 'cover') {
            return adminGallery.cover.url(args);
        }

        return `${panel.baseUrl ?? `/app/admin/restaurants/${restaurantId}`}/gallery/${imageId}/update`;
    }

    const args = { image: imageId };
    if (action === 'unlink') {
        return ownerGallery.unlink.url(args);
    }
    if (action === 'cover') {
        return ownerGallery.cover.url(args);
    }

    return `/app/gallery/${imageId}/update`;
}
