import ReadonlyListPage from '@/components/crud/readonly-list-page';
import { APP_HREF } from '@/config/app-sidebar-nav';
import { appBreadcrumbs } from '@/lib/app-breadcrumbs';

type Props = Parameters<typeof ReadonlyListPage>[0];

function Page(props: Props) {
    return <ReadonlyListPage {...props} />;
}

export default Page;
Page.layout = { breadcrumbs: appBreadcrumbs('Encuestas TAM', APP_HREF.adminTam) };
