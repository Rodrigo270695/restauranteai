import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

export function appBreadcrumbs(lastTitle: string, lastHref: string): BreadcrumbItem[] {
    return [
        { title: 'Dashboard', href: dashboard() },
        { title: lastTitle, href: lastHref },
    ];
}
