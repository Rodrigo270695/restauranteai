import { AppPlaceholderShell } from '@/components/layout/app-placeholder-shell';
import { APP_HREF } from '@/config/app-sidebar-nav';
import { appBreadcrumbs } from '@/lib/app-breadcrumbs';

const title = 'Estadísticas';
const description =
    'Métricas de tu negocio (permiso view_analytics): vistas, reservas de contexto y rendimiento de promociones.';

function AppAnalytics() {
    return <AppPlaceholderShell title={title} description={description} />;
}

export default AppAnalytics;

AppAnalytics.layout = {
    breadcrumbs: appBreadcrumbs(title, APP_HREF.analytics),
};
