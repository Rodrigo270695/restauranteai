import { AppPlaceholderShell } from '@/components/layout/app-placeholder-shell';
import { APP_HREF } from '@/config/app-sidebar-nav';
import { appBreadcrumbs } from '@/lib/app-breadcrumbs';

const title = 'Restaurantes (plataforma)';
const description =
    'Todos los locales publicados (restaurants): moderación, verificación y visibilidad global.';

function AppAdminRestaurants() {
    return <AppPlaceholderShell title={title} description={description} />;
}

export default AppAdminRestaurants;

AppAdminRestaurants.layout = {
    breadcrumbs: appBreadcrumbs(title, APP_HREF.adminRestaurants),
};
