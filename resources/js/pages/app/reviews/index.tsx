import RestaurantReviewsPage from '@/components/app/owner/restaurant-reviews-page';
import { APP_HREF } from '@/config/app-sidebar-nav';
import { appBreadcrumbs } from '@/lib/app-breadcrumbs';

type Props = Parameters<typeof RestaurantReviewsPage>[0];

function Page(props: Props) {
    return <RestaurantReviewsPage {...props} />;
}

export default Page;
Page.layout = { breadcrumbs: appBreadcrumbs('Reseñas', APP_HREF.reviews) };
