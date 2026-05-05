import { Link, useForm } from '@inertiajs/react';
import Heading from '@/components/common/heading';
import InputError from '@/components/common/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { update as profileUpdateRoute } from '@/routes/profile';
import { send } from '@/routes/verification';

const INPUT_CLS =
    'border-gray-200 bg-white placeholder:text-gray-400 focus-visible:border-brand-red focus-visible:ring-brand-red/20';

interface Props {
    user: { name: string; email: string; email_verified_at: string | null };
    mustVerifyEmail: boolean;
    saved?: boolean;
}

export default function UserProfileForm({ user, mustVerifyEmail, saved }: Props) {
    const { data, setData, patch, processing, errors } = useForm({
        name: user.name,
        email: user.email,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        patch(profileUpdateRoute.url(), { preserveScroll: true });
    }

    return (
        <div className="space-y-6">
            <Heading
                variant="small"
                title="Información personal"
                description="Actualiza tu nombre y correo electrónico"
            />

            <form onSubmit={submit} className="space-y-5">
                <div className="grid gap-1.5">
                    <Label htmlFor="name">Nombre completo</Label>
                    <Input
                        id="name"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        autoComplete="name"
                        placeholder="Tu nombre completo"
                        className={cn(INPUT_CLS, errors.name && 'border-red-400 bg-red-50')}
                    />
                    <InputError message={errors.name} />
                </div>

                <div className="grid gap-1.5">
                    <Label htmlFor="email">Correo electrónico</Label>
                    <Input
                        id="email"
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        autoComplete="username"
                        placeholder="tucorreo@ejemplo.com"
                        className={cn(INPUT_CLS, errors.email && 'border-red-400 bg-red-50')}
                    />
                    <InputError message={errors.email} />
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <p className="-mt-3 text-sm text-muted-foreground">
                        Tu correo no está verificado.{' '}
                        <Link
                            href={send()}
                            as="button"
                            className="text-brand-red underline underline-offset-4 hover:opacity-80"
                        >
                            Haz clic aquí para reenviar el correo de verificación.
                        </Link>
                    </p>
                )}

                {saved && (
                    <p className="text-sm font-medium text-green-600">
                        Perfil actualizado correctamente.
                    </p>
                )}

                <Button type="submit" variant="brand" disabled={processing} className="cursor-pointer">
                    Guardar cambios
                </Button>
            </form>
        </div>
    );
}
