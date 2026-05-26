<?php

namespace App\Services;

use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class RestaurantScopeService
{
    public const ACTING_SESSION_KEY = 'acting_restaurant_id';

    /** Panel del dueño (o suplantación activa). */
    public function forOwnerPanel(Request $request): Restaurant
    {
        $user = $request->user();
        abort_unless($user, 403);

        if ($actingId = $request->session()->get(self::ACTING_SESSION_KEY)) {
            $restaurant = Restaurant::query()->find($actingId);
            abort_unless($restaurant && $this->canManageAsAdmin($user, $restaurant), 403);

            return $restaurant;
        }

        abort_unless($user->hasRole('restaurant_owner'), 403);

        return $this->resolveOwnedRestaurant($user);
    }

    /** Gestión admin sobre un restaurante concreto (ruta con {restaurant}). */
    public function forAdminManage(User $user, Restaurant $restaurant): Restaurant
    {
        abort_unless($this->canManageAsAdmin($user, $restaurant), 403);

        return $restaurant;
    }

    public function canManageAsAdmin(?User $user, Restaurant $restaurant): bool
    {
        return $user?->hasRole('super_admin')
            && $user->can('restaurants.view');
    }

    public function isActing(Request $request): bool
    {
        return $request->session()->has(self::ACTING_SESSION_KEY);
    }

    /** Super admin en suplantación puede editar (moderación del local). */
    public function isOwnerPanelReadOnly(Request $request): bool
    {
        return false;
    }

    public function actingRestaurant(Request $request): ?Restaurant
    {
        $id = $request->session()->get(self::ACTING_SESSION_KEY);

        return $id ? Restaurant::query()->find($id) : null;
    }

    public function startActing(Request $request, Restaurant $restaurant): void
    {
        abort_unless($this->canManageAsAdmin($request->user(), $restaurant), 403);
        $request->session()->put(self::ACTING_SESSION_KEY, $restaurant->id);
    }

    public function stopActing(Request $request): void
    {
        $request->session()->forget(self::ACTING_SESSION_KEY);
    }

    /** Dueño: obtiene su restaurante (crea borrador si no existe). */
    public function resolveOwnedRestaurant(User $user): Restaurant
    {
        abort_if($user->hasRole('super_admin'), 403, 'El super administrador debe usar suplantación de restaurante.');

        $existing = $user->restaurants()->first();

        if ($existing) {
            return $existing;
        }

        $businessName = $user->restaurantProfile?->business_name ?? $user->name;

        return $user->restaurants()->create([
            'name' => $businessName,
            'slug' => Str::slug($businessName.'-'.$user->id),
            'is_active' => false,
        ]);
    }

    /** @return array{name: string, business_name: string|null} */
    public function ownerContext(Restaurant $restaurant): array
    {
        $restaurant->loadMissing(['owner.restaurantProfile']);
        $owner = $restaurant->owner;

        return [
            'name' => $owner?->name ?? '',
            'business_name' => $owner?->restaurantProfile?->business_name,
        ];
    }
}
