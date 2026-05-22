<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Concerns\ResolvesScopedRestaurant;
use App\Http\Controllers\Controller;
use App\Http\Requests\App\PromotionRequest;
use App\Models\Promotion;
use App\Models\Restaurant;
use App\Services\RestaurantScopeService;
use App\Support\OwnerPanel;
use App\Support\PublicStorage;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PromotionController extends Controller
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

        abort_unless($request->user()?->can('manage_promotions'), 403);

        $now = Carbon::now();

        $promotions = $restaurant->promotions()
            ->orderByDesc('is_active')
            ->orderByDesc('starts_at')
            ->get()
            ->map(fn (Promotion $promo) => $this->formatPromotion($promo, $now));

        $activeCount = $promotions->filter(fn ($p) => $p['status'] === 'active')->count();

        return Inertia::render('app/promotions', [
            ...OwnerPanel::props($restaurant, $admin),
            'promotions' => $promotions->values(),
            'stats' => [
                'total' => $promotions->count(),
                'active' => $activeCount,
                'scheduled' => $promotions->where('status', 'scheduled')->count(),
            ],
        ]);
    }

    public function store(PromotionRequest $request, RestaurantScopeService $scope, ?Restaurant $restaurant = null): RedirectResponse
    {
        $restaurant = $this->scopedRestaurant($request, $scope, $restaurant);
        $data = $request->validated();
        $data['restaurant_id'] = $restaurant->id;

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store("restaurants/{$restaurant->id}/promotions", 'public');
        }

        Promotion::create($data);

        return back()->with('success', 'Promoción creada.');
    }

    public function update(
        PromotionRequest $request,
        Promotion $promotion,
        RestaurantScopeService $scope,
        ?Restaurant $restaurant = null,
    ): RedirectResponse {
        $restaurant = $this->scopedRestaurant($request, $scope, $restaurant);
        abort_unless($promotion->restaurant_id === $restaurant->id, 403);

        $data = $request->validated();

        if ($request->hasFile('image')) {
            if ($promotion->image) {
                Storage::disk('public')->delete($promotion->image);
            }
            $data['image'] = $request->file('image')->store("restaurants/{$restaurant->id}/promotions", 'public');
        }

        $promotion->update($data);

        return back()->with('success', 'Promoción actualizada.');
    }

    public function destroy(Promotion $promotion, RestaurantScopeService $scope, ?Restaurant $restaurant = null): RedirectResponse
    {
        abort_unless(request()->user()?->can('manage_promotions'), 403);

        $restaurant = $this->scopedRestaurant(request(), $scope, $restaurant);
        abort_unless($promotion->restaurant_id === $restaurant->id, 403);

        if ($promotion->image) {
            Storage::disk('public')->delete($promotion->image);
        }
        $promotion->delete();

        return back()->with('success', 'Promoción eliminada.');
    }

    /** @return array<string, mixed> */
    private function formatPromotion(Promotion $promo, Carbon $now): array
    {
        $starts = $promo->starts_at ? Carbon::parse($promo->starts_at) : null;
        $ends = $promo->ends_at ? Carbon::parse($promo->ends_at) : null;

        $status = 'inactive';
        if ($promo->is_active && $starts && $ends) {
            if ($now->lt($starts)) {
                $status = 'scheduled';
            } elseif ($now->gt($ends)) {
                $status = 'expired';
            } else {
                $status = 'active';
            }
        } elseif ($ends && $now->gt($ends)) {
            $status = 'expired';
        }

        return [
            'id' => $promo->id,
            'title' => $promo->title,
            'description' => $promo->description,
            'type' => $promo->type,
            'discount_percent' => $promo->discount_percent !== null ? (float) $promo->discount_percent : null,
            'image_url' => PublicStorage::url($promo->image),
            'has_image' => (bool) $promo->image,
            'starts_at' => $starts?->format('Y-m-d\TH:i'),
            'ends_at' => $ends?->format('Y-m-d\TH:i'),
            'starts_at_label' => $starts?->translatedFormat('d M Y, H:i'),
            'ends_at_label' => $ends?->translatedFormat('d M Y, H:i'),
            'is_active' => (bool) $promo->is_active,
            'status' => $status,
        ];
    }
}
