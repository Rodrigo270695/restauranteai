import { AppPlaceholderShell } from '@/components/layout/app-placeholder-shell';
import { APP_HREF } from '@/config/app-sidebar-nav';
import { appBreadcrumbs } from '@/lib/app-breadcrumbs';

const title = 'Ambientes';
const description =
    'Catálogo ambiances: familiar, romántico, casual — variable contextual para ML y búsqueda.';

function AppAdminAmbiances() {
    return <AppPlaceholderShell title={title} description={description} />;
}

export default AppAdminAmbiances;

AppAdminAmbiances.layout = {
    breadcrumbs: appBreadcrumbs(title, APP_HREF.adminAmbiances),
};
