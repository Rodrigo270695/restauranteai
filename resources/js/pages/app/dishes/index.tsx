import RestaurantDishesPage from '@/components/app/owner/restaurant-dishes-page';
import { APP_HREF } from '@/config/app-sidebar-nav';
import { appBreadcrumbs } from '@/lib/app-breadcrumbs';

type Props = Parameters<typeof RestaurantDishesPage>[0];

function Page(props: Props) {
    return <RestaurantDishesPage {...props} />;
}

export default Page;
Page.layout = { breadcrumbs: appBreadcrumbs('Platos', APP_HREF.dishes) };
