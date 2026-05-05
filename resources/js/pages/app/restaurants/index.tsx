import { AppPlaceholderShell } from '@/components/layout/app-placeholder-shell';
import { APP_HREF } from '@/config/app-sidebar-nav';
import { appBreadcrumbs } from '@/lib/app-breadcrumbs';

const title = 'Datos del local';
const description =
    'Ficha del restaurante (tabla restaurants): nombre, ubicación, cocina principal, precios, contacto y visibilidad en la plataforma.';

function AppRestaurants() {
    return <AppPlaceholderShell title={title} description={description} />;
}

export default AppRestaurants;

AppRestaurants.layout = {
    breadcrumbs: appBreadcrumbs(title, APP_HREF.restaurants),
};
