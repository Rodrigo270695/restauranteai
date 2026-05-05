import { AppPlaceholderShell } from '@/components/layout/app-placeholder-shell';
import { APP_HREF } from '@/config/app-sidebar-nav';
import { appBreadcrumbs } from '@/lib/app-breadcrumbs';

const title = 'Categorías de platos';
const description =
    'Catálogo dish_categories: entradas, fondos, postres y orden de visualización en la carta.';

function AppAdminDishCategories() {
    return <AppPlaceholderShell title={title} description={description} />;
}

export default AppAdminDishCategories;

AppAdminDishCategories.layout = {
    breadcrumbs: appBreadcrumbs(title, APP_HREF.adminDishCategories),
};
