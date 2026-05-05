import { AppPlaceholderShell } from '@/components/layout/app-placeholder-shell';
import { APP_HREF } from '@/config/app-sidebar-nav';
import { appBreadcrumbs } from '@/lib/app-breadcrumbs';

const title = 'Solicitudes de recomendación';
const description =
    'Cada pedido de recomendaciones (recommendation_requests): presupuesto, compañía, ubicación y franja horaria.';

function AppAdminRecommendationRequests() {
    return <AppPlaceholderShell title={title} description={description} />;
}

export default AppAdminRecommendationRequests;

AppAdminRecommendationRequests.layout = {
    breadcrumbs: appBreadcrumbs(title, APP_HREF.adminRecRequests),
};
