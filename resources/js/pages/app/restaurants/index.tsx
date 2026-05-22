import RestaurantFormPage from '@/components/crud/restaurant-form-page';
import { APP_HREF } from '@/config/app-sidebar-nav';
import { appBreadcrumbs } from '@/lib/app-breadcrumbs';

type Props = Parameters<typeof RestaurantFormPage>[0];

function Page(props: Props) {
    return <RestaurantFormPage {...props} />;
}

export default Page;
Page.layout = { breadcrumbs: appBreadcrumbs('Datos del local', APP_HREF.restaurants) };
