import { usePage } from '@inertiajs/react';
import type { PanelContext } from '@/lib/scoped-app-path';

type PageProps = {
    ownerPanelReadOnly?: boolean;
    panel?: PanelContext;
};

/** true cuando el panel no permite guardar (p. ej. vista restringida futura). */
export function useOwnerReadOnly(): boolean {
    const page = usePage<PageProps>();
    const panel = page.props.panel;

    if (panel?.mode === 'admin') {
        return false;
    }

    return !!page.props.ownerPanelReadOnly || !!panel?.readOnly;
}
