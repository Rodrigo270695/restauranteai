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
            variant="languages"
            saveUrl={props.saveUrl ?? '/app/restaurant-languages'}
            permission="manage_restaurant_languages"
        />
    );
}

export default Page;
Page.layout = { breadcrumbs: appBreadcrumbs('Idiomas de atención', APP_HREF.restaurantLanguages) };
