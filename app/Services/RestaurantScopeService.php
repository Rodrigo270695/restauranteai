<?php

namespace App\Services;

use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class RestaurantScopeService
{
    public const ACTING_SESSION_KEY = 'acting_restaurant_id';

    public const ACTIVE_SESSION_KEY = 'owner_active_restaurant_id';

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

        return $this->resolveOwnedRestaurant($user, $request);
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
    public function resolveOwnedRestaurant(User $user, ?Request $request = null): Restaurant
    {
        abort_if($user->hasRole('super_admin'), 403, 'El super administrador debe usar suplantación de restaurante.');

        if ($request?->session()->has(self::ACTIVE_SESSION_KEY)) {
            $selected = $user->restaurants()
                ->where('id', $request->session()->get(self::ACTIVE_SESSION_KEY))
                ->first();

            if ($selected) {
                return $selected;
            }
        }

        $existing = $user->restaurants()->orderBy('id')->first();

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

    /** @return \Illuminate\Support\Collection<int, Restaurant> */
    public function ownedRestaurants(User $user): \Illuminate\Support\Collection
    {
        return $user->restaurants()->orderBy('name')->get();
    }

    public function createOwnedRestaurant(User $user, string $name, Request $request): Restaurant
    {
        abort_unless($user->hasRole('restaurant_owner'), 403);

        $restaurant = $user->restaurants()->create([
            'name' => $name,
            'slug' => Str::slug($name.'-'.$user->id.'-'.Str::random(4)),
            'is_active' => false,
        ]);

        $request->session()->put(self::ACTIVE_SESSION_KEY, $restaurant->id);

        return $restaurant;
    }

    public function switchActiveRestaurant(User $user, int $restaurantId, Request $request): Restaurant
    {
        abort_unless($user->hasRole('restaurant_owner'), 403);

        $restaurant = $user->restaurants()->whereKey($restaurantId)->firstOrFail();
        $request->session()->put(self::ACTIVE_SESSION_KEY, $restaurant->id);

        return $restaurant;
    }

    /** @return array<string, mixed> */
    public function formatOwnedListItem(Restaurant $restaurant): array
    {
        return [
            'id' => $restaurant->id,
            'name' => $restaurant->name,
            'slug' => $restaurant->slug,
            'address' => $restaurant->address,
            'latitude' => $restaurant->latitude !== null ? (float) $restaurant->latitude : null,
            'longitude' => $restaurant->longitude !== null ? (float) $restaurant->longitude : null,
            'has_location' => $restaurant->latitude !== null && $restaurant->longitude !== null,
            'is_active' => (bool) $restaurant->is_active,
        ];
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
