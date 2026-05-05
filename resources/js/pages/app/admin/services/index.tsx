import { AppPlaceholderShell } from '@/components/layout/app-placeholder-shell';
import { APP_HREF } from '@/config/app-sidebar-nav';
import { appBreadcrumbs } from '@/lib/app-breadcrumbs';

const title = 'Servicios (catálogo)';
const description =
    'Catálogo global services: WiFi, estacionamiento, delivery — usado en el pivot por restaurante.';

function AppAdminServices() {
    return <AppPlaceholderShell title={title} description={description} />;
}

export default AppAdminServices;

AppAdminServices.layout = {
    breadcrumbs: appBreadcrumbs(title, APP_HREF.adminServices),
};
