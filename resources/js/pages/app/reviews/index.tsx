import { AppPlaceholderShell } from '@/components/layout/app-placeholder-shell';
import { APP_HREF } from '@/config/app-sidebar-nav';
import { appBreadcrumbs } from '@/lib/app-breadcrumbs';

const title = 'Reseñas';
const description =
    'Valoraciones de turistas (reviews): puntuación global y por dimensiones, comentarios y respuesta del local.';

function AppReviews() {
    return <AppPlaceholderShell title={title} description={description} />;
}

export default AppReviews;

AppReviews.layout = {
    breadcrumbs: appBreadcrumbs(title, APP_HREF.reviews),
};
