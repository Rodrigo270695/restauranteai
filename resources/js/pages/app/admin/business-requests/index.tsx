import { AppPlaceholderShell } from '@/components/layout/app-placeholder-shell';
import { APP_HREF } from '@/config/app-sidebar-nav';
import { appBreadcrumbs } from '@/lib/app-breadcrumbs';

const title = 'Solicitudes de negocio';
const description =
    'Registros de dueños pendientes o revisados (restaurant_profiles): aprobación, rechazo y motivos.';

function AppAdminBusinessRequests() {
    return <AppPlaceholderShell title={title} description={description} />;
}

export default AppAdminBusinessRequests;

AppAdminBusinessRequests.layout = {
    breadcrumbs: appBreadcrumbs(title, APP_HREF.adminBusinessRequests),
};
