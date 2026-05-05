import { AppPlaceholderShell } from '@/components/layout/app-placeholder-shell';
import { APP_HREF } from '@/config/app-sidebar-nav';
import { appBreadcrumbs } from '@/lib/app-breadcrumbs';

const title = 'Galería';
const description =
    'Imágenes del local (restaurant_images): exterior, interior, platos y ambiente; portada y orden de galería.';

function AppGallery() {
    return <AppPlaceholderShell title={title} description={description} />;
}

export default AppGallery;

AppGallery.layout = {
    breadcrumbs: appBreadcrumbs(title, APP_HREF.gallery),
};
