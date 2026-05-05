import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import PublicLayout from '@/layouts/public-layout';
import SettingsLayout from '@/layouts/settings/layout';
import TouristLayout from '@/layouts/tourist-layout';
import '@/i18n';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Registra todas las páginas: soporta tanto [name].tsx como [name]/index.tsx
const pages = import.meta.glob('./pages/**/*.tsx');

/** Claves de import.meta.glob pueden usar `\` en Windows; hay que alinear antes de buscar. */
function normalizePath(p: string): string {
    return p.replace(/\\/g, '/');
}

/**
 * Resuelve la clave real del glob para `name` (p. ej. app/admin/roles).
 * No usar solo strings literales: en Windows `pages['./pages/...']` a veces no coincide.
 */
function resolvePageKey(name: string): string {
    const keys = Object.keys(pages);
    const indexSuffix = `/pages/${name}/index.tsx`;
    const directSuffix = `/pages/${name}.tsx`;

    for (const k of keys) {
        const n = normalizePath(k);
        if (n.endsWith(indexSuffix)) {
            return k;
        }
    }
    for (const k of keys) {
        const n = normalizePath(k);
        if (n.endsWith(directSuffix)) {
            return k;
        }
    }

    throw new Error(`Página Inertia no encontrada: ${name}`);
}

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) => resolvePageComponent(resolvePageKey(name), pages),
    layout: (name) => {
        switch (true) {
            case name === 'welcome':
                return PublicLayout;
            case name.startsWith('auth/'):
            case name.startsWith('tourist/'):
                return AuthLayout;
            case name === 'owner/pending':
                return AuthLayout;
            case name.startsWith('owner/'):
                return AppLayout;
            case name.startsWith('explore/'):
                return TouristLayout;
            case name.startsWith('settings/'):
                return [AppLayout, SettingsLayout];
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                {app}
                <Toaster />
            </TooltipProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
