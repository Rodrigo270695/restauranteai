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
