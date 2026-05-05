import { AppPlaceholderShell } from '@/components/layout/app-placeholder-shell';
import { APP_HREF } from '@/config/app-sidebar-nav';
import { appBreadcrumbs } from '@/lib/app-breadcrumbs';

const title = 'Recomendaciones';
const description =
    'Resultados por solicitud (recommendations): ranking, scores híbridos y señales de aceptación.';

function AppAdminRecommendations() {
    return <AppPlaceholderShell title={title} description={description} />;
}

export default AppAdminRecommendations;

AppAdminRecommendations.layout = {
    breadcrumbs: appBreadcrumbs(title, APP_HREF.adminRecommendations),
};
