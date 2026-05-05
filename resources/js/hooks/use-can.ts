/**
 * useCan — comprueba si el usuario autenticado tiene uno o varios permisos.
 *
 * Lee de `auth.permissions` que comparte HandleInertiaRequests.
 *
 * Uso:
 *   const can = useCan();
 *   can('roles.create')              → boolean
 *   can(['roles.edit','roles.delete']) → true si tiene TODOS
 *   can(['roles.edit','roles.delete'], 'any') → true si tiene AL MENOS UNO
 */

import { usePage } from '@inertiajs/react';

type PagePropsWithAuth = {
    auth: {
        roles: string[];
        permissions: string[];
    };
    [key: string]: unknown;
};

export function useCan() {
    const auth = usePage<PagePropsWithAuth>().props.auth;
    const permissions = new Set(auth?.permissions ?? []);

    return function can(
        permission: string | string[],
        mode: 'all' | 'any' = 'all',
    ): boolean {
        const list = Array.isArray(permission) ? permission : [permission];
        return mode === 'any'
            ? list.some((p) => permissions.has(p))
            : list.every((p) => permissions.has(p));
    };
}
