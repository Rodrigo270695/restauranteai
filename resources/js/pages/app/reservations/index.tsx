import RestaurantReservationsPage from '@/components/app/owner/restaurant-reservations-page';
import { APP_HREF } from '@/config/app-sidebar-nav';
import { appBreadcrumbs } from '@/lib/app-breadcrumbs';

type Props = Parameters<typeof RestaurantReservationsPage>[0];

function Page(props: Props) {
    return <RestaurantReservationsPage {...props} />;
}

export default Page;
Page.layout = { breadcrumbs: appBreadcrumbs('Reservas', APP_HREF.reservations) };
