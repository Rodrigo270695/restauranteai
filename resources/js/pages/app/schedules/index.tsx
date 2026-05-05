import { AppPlaceholderShell } from '@/components/layout/app-placeholder-shell';
import { APP_HREF } from '@/config/app-sidebar-nav';
import { appBreadcrumbs } from '@/lib/app-breadcrumbs';

const title = 'Horarios';
const description =
    'Horarios de atención por día (restaurant_schedules): apertura, cierre y días cerrados.';

function AppSchedules() {
    return <AppPlaceholderShell title={title} description={description} />;
}

export default AppSchedules;

AppSchedules.layout = {
    breadcrumbs: appBreadcrumbs(title, APP_HREF.schedules),
};
