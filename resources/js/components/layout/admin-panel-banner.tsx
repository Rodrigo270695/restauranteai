import { Link } from '@inertiajs/react';
import { ArrowLeft, Building2 } from 'lucide-react';
import type { PanelContext } from '@/lib/scoped-app-path';

export function AdminPanelBanner({ panel, restaurantName }: { panel?: PanelContext | null; restaurantName: string }) {
    if (!panel || panel.mode !== 'admin' || !panel.hubUrl) return null;

    return (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-200/80 bg-sky-50 px-4 py-2 text-sm text-sky-950">
            <span className="flex items-center gap-2">
                <Building2 className="size-4" />
                Administrando: <strong>{restaurantName}</strong>
            </span>
            <Link
                href={panel.hubUrl}
                className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium underline-offset-2 hover:underline"
            >
                <ArrowLeft className="size-3.5" />
                Volver al resumen
            </Link>
        </div>
    );
}
