import { AppPlaceholderShell } from '@/components/layout/app-placeholder-shell';
import { APP_HREF } from '@/config/app-sidebar-nav';
import { appBreadcrumbs } from '@/lib/app-breadcrumbs';

const title = 'Idiomas de atención';
const description =
    'Idiomas en los que atiendes (pivot restaurant_language y catálogo support_languages).';

function AppRestaurantLanguages() {
    return <AppPlaceholderShell title={title} description={description} />;
}

export default AppRestaurantLanguages;

AppRestaurantLanguages.layout = {
    breadcrumbs: appBreadcrumbs(title, APP_HREF.restaurantLanguages),
};
