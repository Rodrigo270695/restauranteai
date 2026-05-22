<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Concerns\ResolvesScopedRestaurant;
use App\Http\Controllers\Controller;
use App\Http\Requests\App\DishRequest;
use App\Models\Dish;
use App\Models\DishCategory;
use App\Models\Restaurant;
use App\Services\RestaurantScopeService;
use App\Support\OwnerPanel;
use App\Support\PublicStorage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class DishController extends Controller
{
    use ResolvesScopedRestaurant;

    public function index(Request $request, RestaurantScopeService $scope): Response
    {
        return $this->indexForRestaurant($request, $scope->forOwnerPanel($request), false);
    }

    public function indexForRestaurant(Request $request, Restaurant $restaurant, bool $admin = true): Response
    {
        if ($admin) {
            abort_unless(app(RestaurantScopeService::class)->canManageAsAdmin($request->user(), $restaurant), 403);
        }

        abort_unless($request->user()?->can('manage_dishes'), 403);

        $dishes = $restaurant->dishes()
            ->with('category:id,name')
            ->orderBy('display_order')
            ->orderBy('name')
            ->get()
            ->map(fn (Dish $dish) => $this->formatDish($dish));

        return Inertia::render('app/dishes', [
            ...OwnerPanel::props($restaurant, $admin),
            'dishes' => $dishes,
            'categories' => DishCategory::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'stats' => [
                'total' => $dishes->count(),
                'available' => $dishes->where('is_available', true)->count(),
                'with_photo' => $dishes->where('has_image', true)->count(),
            ],
        ]);
    }

    public function store(DishRequest $request, RestaurantScopeService $scope, ?Restaurant $restaurant = null): RedirectResponse
    {
        $restaurant = $this->scopedRestaurant($request, $scope, $restaurant);
        $data = $request->validated();
        $data['restaurant_id'] = $restaurant->id;

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store("restaurants/{$restaurant->id}/dishes", 'public');
        }

        Dish::create($data);

        return back()->with('success', 'Plato agregado a la carta.');
    }

    public function update(
        DishRequest $request,
        Dish $dish,
        RestaurantScopeService $scope,
        ?Restaurant $restaurant = null,
    ): RedirectResponse {
        $restaurant = $this->scopedRestaurant($request, $scope, $restaurant);
        abort_unless($dish->restaurant_id === $restaurant->id, 403);

        $data = $request->validated();

        if ($request->hasFile('image')) {
            if ($dish->image) {
                Storage::disk('public')->delete($dish->image);
            }
            $data['image'] = $request->file('image')->store("restaurants/{$restaurant->id}/dishes", 'public');
        }

        $dish->update($data);

        return back()->with('success', 'Plato actualizado.');
    }

    public function destroy(Dish $dish, RestaurantScopeService $scope, ?Restaurant $restaurant = null): RedirectResponse
    {
        abort_unless(request()->user()?->can('manage_dishes'), 403);

        $restaurant = $this->scopedRestaurant(request(), $scope, $restaurant);
        abort_unless($dish->restaurant_id === $restaurant->id, 403);

        if ($dish->image) {
            Storage::disk('public')->delete($dish->image);
        }
        $dish->delete();

        return back()->with('success', 'Plato eliminado de la carta.');
    }

    /** @return array<string, mixed> */
    private function formatDish(Dish $dish): array
    {
        return [
            'id' => $dish->id,
            'name' => $dish->name,
            'description' => $dish->description,
            'price' => (float) $dish->price,
            'dish_category_id' => $dish->dish_category_id,
            'category_name' => $dish->category?->name,
            'image_url' => PublicStorage::url($dish->image),
            'has_image' => (bool) $dish->image,
            'is_available' => (bool) $dish->is_available,
            'is_signature' => (bool) $dish->is_signature,
            'display_order' => $dish->display_order,
        ];
    }
}
