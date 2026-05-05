import { Head, usePage } from '@inertiajs/react';
import RestaurantProfileForm, {
    type RestaurantProfileData,
} from '@/components/settings/restaurant-profile-form';
import UserProfileForm from '@/components/settings/user-profile-form';
import { edit } from '@/routes/profile';

interface Props {
    mustVerifyEmail: boolean;
    status?: string;
    restaurantProfile?: RestaurantProfileData | null;
}

export default function Profile({ mustVerifyEmail, status, restaurantProfile }: Props) {
    const { auth } = usePage().props as {
        auth: {
            user: { name: string; email: string; email_verified_at: string | null };
        };
    };

    return (
        <>
            <Head title="Configuración de perfil" />
            <h1 className="sr-only">Configuración de perfil</h1>

            <div className="space-y-10">
                <UserProfileForm
                    user={auth.user}
                    mustVerifyEmail={mustVerifyEmail}
                    saved={status === 'profile-updated'}
                />

                {restaurantProfile && (
                    <RestaurantProfileForm
                        restaurantProfile={restaurantProfile}
                        saved={status === 'restaurant-updated'}
                    />
                )}
            </div>
        </>
    );
}

Profile.layout = {
    breadcrumbs: [{ title: 'Configuración de perfil', href: edit() }],
};
