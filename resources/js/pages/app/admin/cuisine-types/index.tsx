import { AppPlaceholderShell } from '@/components/layout/app-placeholder-shell';
import { APP_HREF } from '@/config/app-sidebar-nav';
import { appBreadcrumbs } from '@/lib/app-breadcrumbs';

const title = 'Tipos de cocina';
const description =
    'Catálogo cuisine_types: nombres, slugs e iconos para filtros y el modelo de recomendación.';

function AppAdminCuisineTypes() {
    return <AppPlaceholderShell title={title} description={description} />;
}

export default AppAdminCuisineTypes;

AppAdminCuisineTypes.layout = {
    breadcrumbs: appBreadcrumbs(title, APP_HREF.adminCuisineTypes),
};
