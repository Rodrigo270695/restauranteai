import RestaurantAnalyticsPage from '@/components/app/owner/restaurant-analytics-page';
import { APP_HREF } from '@/config/app-sidebar-nav';
import { appBreadcrumbs } from '@/lib/app-breadcrumbs';

type Props = Parameters<typeof RestaurantAnalyticsPage>[0];

function Page(props: Props) {
    return <RestaurantAnalyticsPage {...props} />;
}

export default Page;
Page.layout = { breadcrumbs: appBreadcrumbs('Estadísticas', APP_HREF.analytics) };
