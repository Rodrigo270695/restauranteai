import { usePage } from '@inertiajs/react';
import type { PanelContext } from '@/lib/scoped-app-path';

type PageProps = {
    ownerPanelReadOnly?: boolean;
    panel?: PanelContext;
};

/** true cuando super_admin suplanta al dueño (solo consulta en /app/*). */
export function useOwnerReadOnly(): boolean {
    const page = usePage<PageProps>();

    return !!page.props.ownerPanelReadOnly || !!page.props.panel?.readOnly;
}
