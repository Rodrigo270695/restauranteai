/**
 * useFlashToast — muestra automáticamente toasts Sonner a partir de los
 * mensajes flash compartidos por HandleInertiaRequests.
 *
 * DEBE llamarse desde dentro del árbol de Inertia (p. ej. un layout)
 * porque usa usePage().
 */

import { usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import type { FlashToast } from '@/types/ui';

type PagePropsWithFlash = {
    flash?: FlashToast | Record<string, never>;
    [key: string]: unknown;
};

export function useFlashToast(): void {
    const flash = usePage<PagePropsWithFlash>().props.flash;
    const prev  = useRef<typeof flash>(undefined);

    useEffect(() => {
        // Ignorar el render inicial (misma referencia que el anterior)
        if (flash === prev.current) return;
        prev.current = flash;

        if (!flash || !('type' in flash) || !flash.message) return;

        const { type, message } = flash as FlashToast;

        switch (type) {
            case 'success':
                toast.success(message, { duration: 4000 });
                break;
            case 'error':
                toast.error(message, { duration: 6000 });
                break;
            case 'warning':
                toast.warning(message, { duration: 5000 });
                break;
            case 'info':
                toast.info(message, { duration: 4000 });
                break;
            default:
                toast(message);
        }
    }, [flash]);
}
