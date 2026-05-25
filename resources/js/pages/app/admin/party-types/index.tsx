import CatalogCrudPage from '@/components/crud/catalog-crud-page';

type Props = Parameters<typeof CatalogCrudPage>[0];

export default function PartyTypesPage(props: Props) {
    return <CatalogCrudPage {...props} />;
}
