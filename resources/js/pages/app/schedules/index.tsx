import RestaurantSchedulesPage from '@/components/app/owner/restaurant-schedules-page';
import { APP_HREF } from '@/config/app-sidebar-nav';
import { appBreadcrumbs } from '@/lib/app-breadcrumbs';

type Props = Parameters<typeof RestaurantSchedulesPage>[0];

function Page(props: Props) {
    return <RestaurantSchedulesPage {...props} />;
}

export default Page;
Page.layout = { breadcrumbs: appBreadcrumbs('Horarios', APP_HREF.schedules) };
