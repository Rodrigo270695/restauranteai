import { AppPlaceholderShell } from '@/components/layout/app-placeholder-shell';
import { APP_HREF } from '@/config/app-sidebar-nav';
import { appBreadcrumbs } from '@/lib/app-breadcrumbs';

const title = 'Servicios del local';
const description =
    'Servicios que ofrece tu restaurante (pivot restaurant_service hacia el catálogo services: WiFi, estacionamiento, delivery, etc.).';

function AppRestaurantServices() {
    return <AppPlaceholderShell title={title} description={description} />;
}

export default AppRestaurantServices;

AppRestaurantServices.layout = {
    breadcrumbs: appBreadcrumbs(title, APP_HREF.restaurantServices),
};
