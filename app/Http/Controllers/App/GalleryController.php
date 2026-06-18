<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use App\Http\Requests\App\GalleryImageRequest;
use App\Models\Restaurant;
use App\Models\RestaurantImage;
use App\Services\RestaurantScopeService;
use App\Support\OwnerPanel;
use App\Support\PublicStorage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class GalleryController extends Controller
{
    public function index(Request $request, RestaurantScopeService $scope): Response
    {
        return $this->renderGallery($request, $scope->forOwnerPanel($request), admin: false);
    }

    public function indexForRestaurant(Request $request, Restaurant $restaurant): Response
    {
        return $this->renderGallery($request, $restaurant, admin: true);
    }

    private function renderGallery(Request $request, Restaurant $restaurant, bool $admin): Response
    {
        $scope = app(RestaurantScopeService::class);

        abort_unless($scope->canManageGallery($request->user(), $restaurant), 403);

        $images = $restaurant->images()
            ->orderByDesc('is_cover')
            ->orderBy('display_order')
            ->orderBy('id')
            ->get()
            ->map(fn (RestaurantImage $img) => $this->formatImage($img));

        $cover = $images->firstWhere('is_cover', true);

        return Inertia::render('app/gallery', [
            ...OwnerPanel::props($restaurant, $admin),
            'canManageGallery' => $scope->canManageGallery($request->user(), $restaurant),
            'images' => $images->values(),
            'stats' => [
                'total' => $images->count(),
                'has_cover' => $cover !== null,
            ],
        ]);
    }

    public function store(GalleryImageRequest $request, RestaurantScopeService $scope): RedirectResponse
    {
        return $this->persistNewImage($request, $scope->forOwnerPanel($request), $request);
    }

    public function storeForRestaurant(
        Restaurant $restaurant,
        GalleryImageRequest $request,
        RestaurantScopeService $scope,
    ): RedirectResponse {
        abort_unless($scope->canManageGallery($request->user(), $restaurant), 403);

        return $this->persistNewImage($request, $restaurant, $request);
    }

    public function updateGalleryImage(
        Request $request,
        RestaurantImage $image,
        RestaurantScopeService $scope,
    ): RedirectResponse {
        $restaurant = $scope->forOwnerPanel($request);
        abort_unless($image->restaurant_id === $restaurant->id, 403);

        $validated = $request->validate([
            'image' => ['sometimes', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
            'alt_text' => ['nullable', 'string', 'max:150'],
            'type' => ['sometimes', Rule::in(GalleryImageRequest::GALLERY_TYPES)],
            'display_order' => ['nullable', 'integer', 'min:0', 'max:255'],
            'is_cover' => ['sometimes', 'boolean'],
        ]);

        $updates = [
            'alt_text' => $validated['alt_text'] ?? $image->alt_text,
            'type' => $validated['type'] ?? $image->type,
            'display_order' => $validated['display_order'] ?? $image->display_order,
        ];

        if ($request->hasFile('image')) {
            Storage::disk('public')->delete($image->path);
            $updates['path'] = $request->file('image')->store("restaurants/{$restaurant->id}", 'public');
        }

        $image->update($updates);

        if ($request->boolean('is_cover')) {
            $this->setAsCover($restaurant, $image->fresh());
        }

        return back()->with('success', 'Foto actualizada.');
    }

    public function updateGalleryImageForRestaurant(
        Restaurant $restaurant,
        Request $request,
        RestaurantImage $image,
        RestaurantScopeService $scope,
    ): RedirectResponse {
        abort_unless($scope->canManageGallery($request->user(), $restaurant), 403);
        abort_unless($image->restaurant_id === $restaurant->id, 404);

        $validated = $request->validate([
            'image' => ['sometimes', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
            'alt_text' => ['nullable', 'string', 'max:150'],
            'type' => ['sometimes', Rule::in(GalleryImageRequest::GALLERY_TYPES)],
            'display_order' => ['nullable', 'integer', 'min:0', 'max:255'],
            'is_cover' => ['sometimes', 'boolean'],
        ]);

        $updates = [
            'alt_text' => $validated['alt_text'] ?? $image->alt_text,
            'type' => $validated['type'] ?? $image->type,
            'display_order' => $validated['display_order'] ?? $image->display_order,
        ];

        if ($request->hasFile('image')) {
            Storage::disk('public')->delete($image->path);
            $updates['path'] = $request->file('image')->store("restaurants/{$restaurant->id}", 'public');
        }

        $image->update($updates);

        if ($request->boolean('is_cover')) {
            $this->setAsCover($restaurant, $image->fresh());
        }

        return back()->with('success', 'Foto actualizada.');
    }

    public function destroy(
        RestaurantImage $image,
        RestaurantScopeService $scope,
    ): RedirectResponse {
        $request = request();
        $restaurant = $image->restaurant;
        abort_unless($restaurant, 404);

        if (! $scope->canManageGallery($request->user(), $restaurant)) {
            Log::warning('gallery.destroy forbidden', [
                'user_id' => $request->user()?->id,
                'image_id' => $image->id,
                'restaurant_id' => $restaurant->id,
                'route' => $request->route()?->getName(),
            ]);
            abort(403);
        }

        return $this->removeImage($request, $restaurant, $image);
    }

    public function destroyForRestaurant(
        Restaurant $restaurant,
        RestaurantImage $image,
        RestaurantScopeService $scope,
    ): RedirectResponse {
        abort_unless($scope->canManageGallery(request()->user(), $restaurant), 403);
        abort_unless($image->restaurant_id === $restaurant->id, 404);

        return $this->removeImage(request(), $restaurant, $image);
    }

    public function setCover(
        RestaurantImage $image,
        RestaurantScopeService $scope,
    ): RedirectResponse {
        return $this->applyCover(
            request(),
            $scope->forOwnerPanel(request()),
            $image,
        );
    }

    public function setCoverForRestaurant(
        Restaurant $restaurant,
        RestaurantImage $image,
        RestaurantScopeService $scope,
    ): RedirectResponse {
        abort_unless($scope->canManageGallery(request()->user(), $restaurant), 403);

        return $this->applyCover(request(), $restaurant, $image);
    }

    private function persistNewImage(
        GalleryImageRequest $request,
        Restaurant $restaurant,
        Request $authRequest,
    ): RedirectResponse {
        abort_unless(app(RestaurantScopeService::class)->canManageGallery($authRequest->user(), $restaurant), 403);

        $data = $request->validated();

        $path = $request->file('image')->store("restaurants/{$restaurant->id}", 'public');

        $isCover = (bool) ($data['is_cover'] ?? false) || ! $restaurant->images()->exists();

        $image = $restaurant->images()->create([
            'path' => $path,
            'alt_text' => $data['alt_text'] ?? null,
            'type' => $data['type'],
            'display_order' => $data['display_order'] ?? 0,
            'is_cover' => $isCover,
        ]);

        if ($isCover) {
            $this->setAsCover($restaurant, $image);
        }

        return back()->with('success', 'Foto agregada a la galería.');
    }

    private function removeImage(
        Request $request,
        Restaurant $restaurant,
        RestaurantImage $image,
    ): RedirectResponse {
        abort_unless($image->restaurant_id === $restaurant->id, 403);

        $wasCover = $image->is_cover;
        Storage::disk('public')->delete($image->path);
        $image->delete();

        if ($wasCover) {
            $next = $restaurant->images()->orderBy('display_order')->first();
            if ($next) {
                $this->setAsCover($restaurant, $next);
            } else {
                $restaurant->update(['cover_image' => null]);
            }
        }

        return back()->with('success', 'Foto eliminada.');
    }

    private function applyCover(
        Request $request,
        Restaurant $restaurant,
        RestaurantImage $image,
    ): RedirectResponse {
        abort_unless(app(RestaurantScopeService::class)->canManageGallery($request->user(), $restaurant), 403);
        abort_unless($image->restaurant_id === $restaurant->id, 403);

        $this->setAsCover($restaurant, $image);

        return back()->with('success', 'Portada actualizada.');
    }

    private function setAsCover($restaurant, RestaurantImage $image): void
    {
        $restaurant->images()->where('id', '!=', $image->id)->update(['is_cover' => false]);
        $image->update(['is_cover' => true]);
        $restaurant->update(['cover_image' => $image->path]);
    }

    /** @return array<string, mixed> */
    private function formatImage(RestaurantImage $img): array
    {
        return [
            'id' => $img->id,
            'url' => PublicStorage::url($img->path),
            'alt_text' => $img->alt_text,
            'type' => $img->type,
            'display_order' => $img->display_order,
            'is_cover' => (bool) $img->is_cover,
        ];
    }
}
