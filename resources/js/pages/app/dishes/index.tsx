import { AppPlaceholderShell } from '@/components/layout/app-placeholder-shell';
import { APP_HREF } from '@/config/app-sidebar-nav';
import { appBreadcrumbs } from '@/lib/app-breadcrumbs';

const title = 'Platos';
const description =
    'Carta digital (dishes): categoría, precio, disponibilidad, foto y etiquetas dietéticas.';

function AppDishes() {
    return <AppPlaceholderShell title={title} description={description} />;
}

export default AppDishes;

AppDishes.layout = {
    breadcrumbs: appBreadcrumbs(title, APP_HREF.dishes),
};
