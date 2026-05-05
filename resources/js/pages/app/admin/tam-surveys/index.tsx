import { AppPlaceholderShell } from '@/components/layout/app-placeholder-shell';
import { APP_HREF } from '@/config/app-sidebar-nav';
import { appBreadcrumbs } from '@/lib/app-breadcrumbs';

const title = 'Encuestas TAM';
const description =
    'Aceptación tecnológica (tam_surveys): utilidad percibida, facilidad de uso e intención de uso.';

function AppAdminTamSurveys() {
    return <AppPlaceholderShell title={title} description={description} />;
}

export default AppAdminTamSurveys;

AppAdminTamSurveys.layout = {
    breadcrumbs: appBreadcrumbs(title, APP_HREF.adminTam),
};
