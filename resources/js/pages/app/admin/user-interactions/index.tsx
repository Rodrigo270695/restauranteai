import { AppPlaceholderShell } from '@/components/layout/app-placeholder-shell';
import { APP_HREF } from '@/config/app-sidebar-nav';
import { appBreadcrumbs } from '@/lib/app-breadcrumbs';

const title = 'Interacciones';
const description =
    'Historial user_interactions: vistas, clics, búsquedas y contexto — insumo principal del motor ML.';

function AppAdminUserInteractions() {
    return <AppPlaceholderShell title={title} description={description} />;
}

export default AppAdminUserInteractions;

AppAdminUserInteractions.layout = {
    breadcrumbs: appBreadcrumbs(title, APP_HREF.adminInteractions),
};
