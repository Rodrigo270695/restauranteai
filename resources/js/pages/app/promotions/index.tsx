import RestaurantPromotionsPage from '@/components/app/owner/restaurant-promotions-page';
import { APP_HREF } from '@/config/app-sidebar-nav';
import { appBreadcrumbs } from '@/lib/app-breadcrumbs';

type Props = Parameters<typeof RestaurantPromotionsPage>[0];

function Page(props: Props) {
    return <RestaurantPromotionsPage {...props} />;
}

export default Page;
Page.layout = { breadcrumbs: appBreadcrumbs('Promociones', APP_HREF.promotions) };
