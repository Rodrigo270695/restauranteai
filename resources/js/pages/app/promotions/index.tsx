import { AppPlaceholderShell } from '@/components/layout/app-placeholder-shell';
import { APP_HREF } from '@/config/app-sidebar-nav';
import { appBreadcrumbs } from '@/lib/app-breadcrumbs';

const title = 'Promociones';
const description =
    'Ofertas y eventos (promotions): descuentos, menús especiales, vigencia e imagen.';

function AppPromotions() {
    return <AppPlaceholderShell title={title} description={description} />;
}

export default AppPromotions;

AppPromotions.layout = {
    breadcrumbs: appBreadcrumbs(title, APP_HREF.promotions),
};
