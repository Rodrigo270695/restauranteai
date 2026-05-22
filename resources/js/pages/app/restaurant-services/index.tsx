import RestaurantPivotPage from '@/components/app/owner/restaurant-pivot-page';
import { APP_HREF } from '@/config/app-sidebar-nav';
import { appBreadcrumbs } from '@/lib/app-breadcrumbs';

type Props = Omit<Parameters<typeof RestaurantPivotPage>[0], 'variant' | 'permission'> & {
    saveUrl?: string;
};

function Page(props: Props) {
    return (
        <RestaurantPivotPage
            {...props}
            variant="services"
            saveUrl={props.saveUrl ?? '/app/restaurant-services'}
            permission="manage_restaurant_services"
        />
    );
}

export default Page;
Page.layout = { breadcrumbs: appBreadcrumbs('Servicios del local', APP_HREF.restaurantServices) };
