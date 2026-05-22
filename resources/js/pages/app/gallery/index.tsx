import RestaurantGalleryPage from '@/components/app/owner/restaurant-gallery-page';
import { APP_HREF } from '@/config/app-sidebar-nav';
import { appBreadcrumbs } from '@/lib/app-breadcrumbs';

type Props = Parameters<typeof RestaurantGalleryPage>[0];

function Page(props: Props) {
    return <RestaurantGalleryPage {...props} />;
}

export default Page;
Page.layout = { breadcrumbs: appBreadcrumbs('Galería', APP_HREF.gallery) };
