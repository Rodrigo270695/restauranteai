import { Link, usePage } from '@inertiajs/react';
import { ChevronDown, LayoutDashboard, LogOut, Store, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { logout } from '@/routes';
import { profile as exploreProfile } from '@/routes/explore';
import type { User as UserType } from '@/types';

interface NavUserMenuProps {
    user: UserType;
    scrolled?: boolean;
}

function UserAvatar({ user, size = 'md' }: { user: UserType; size?: 'sm' | 'md' }) {
    const initials = user.name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase();

    const sizeClass = size === 'sm' ? 'h-7 w-7 text-xs' : 'h-9 w-9 text-sm';

    if (user.avatar) {
        return (
            <img
                src={user.avatar}
                alt={user.name}
                className={cn('rounded-full object-cover ring-2 ring-white', sizeClass)}
            />
        );
    }

    return (
        <span
            className={cn(
                'flex items-center justify-center rounded-full font-semibold text-white',
                'bg-linear-to-br from-brand-blue to-brand-orange',
                sizeClass,
            )}
        >
            {initials}
        </span>
    );
}

export function NavUserMenu({ user, scrolled = false }: NavUserMenuProps) {
    const { t } = useTranslation();
    const { auth } = usePage().props as { auth: { user: UserType; roles: string[] } };
    const roles = auth.roles ?? [];

    const isTourist = roles.includes('tourist');
    const isOwner   = roles.includes('restaurant_owner');
    const isAdmin   = roles.includes('super_admin');

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-gray-100 focus:outline-none"
                >
                    <UserAvatar user={user} />
                    <div className="hidden text-left lg:block">
                        <p className="text-sm font-semibold leading-none text-gray-900">{user.name}</p>
                        <p className="mt-0.5 text-xs text-gray-500">{user.email}</p>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                    <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                    <p className="truncate text-xs text-gray-500">{user.email}</p>
                </div>

                <DropdownMenuSeparator />

                {/* Turista → Portal turista */}
                {isTourist && (
                    <DropdownMenuItem asChild>
                        <Link href={exploreProfile.url()} className="flex cursor-pointer items-center gap-2">
                            <User className="h-4 w-4" />
                            {t('explore.my_profile')}
                        </Link>
                    </DropdownMenuItem>
                )}

                {/* Owner → Panel de espera */}
                {isOwner && (
                    <DropdownMenuItem asChild>
                        <Link href="/owner/pending" className="flex cursor-pointer items-center gap-2">
                            <Store className="h-4 w-4" />
                            {t('nav.my_panel')}
                        </Link>
                    </DropdownMenuItem>
                )}

                {/* Admin → Dashboard */}
                {isAdmin && (
                    <DropdownMenuItem asChild>
                        <Link href="/dashboard" className="flex cursor-pointer items-center gap-2">
                            <LayoutDashboard className="h-4 w-4" />
                            Dashboard
                        </Link>
                    </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                    <Link
                        href={logout()}
                        method="post"
                        as="button"
                        className="flex w-full cursor-pointer items-center gap-2 text-red-600 focus:text-red-600"
                    >
                        <LogOut className="h-4 w-4" />
                        {t('nav.logout')}
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
