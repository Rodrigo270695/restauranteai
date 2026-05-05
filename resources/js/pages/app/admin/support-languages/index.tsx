import { AppPlaceholderShell } from '@/components/layout/app-placeholder-shell';
import { APP_HREF } from '@/config/app-sidebar-nav';
import { appBreadcrumbs } from '@/lib/app-breadcrumbs';

const title = 'Idiomas soportados';
const description =
    'Catálogo support_languages (es, en, …) para multiidioma y pivot con restaurantes.';

function AppAdminSupportLanguages() {
    return <AppPlaceholderShell title={title} description={description} />;
}

export default AppAdminSupportLanguages;

AppAdminSupportLanguages.layout = {
    breadcrumbs: appBreadcrumbs(title, APP_HREF.adminLanguages),
};
