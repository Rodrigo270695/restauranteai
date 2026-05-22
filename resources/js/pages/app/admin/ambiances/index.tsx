import CatalogCrudPage from '@/components/crud/catalog-crud-page';
import { APP_HREF } from '@/config/app-sidebar-nav';
import { appBreadcrumbs } from '@/lib/app-breadcrumbs';

type Props = Parameters<typeof CatalogCrudPage>[0];

function Page(props: Props) {
    return <CatalogCrudPage {...props} />;
}

export default Page;
Page.layout = { breadcrumbs: appBreadcrumbs('Ambientes', APP_HREF.adminAmbiances) };
