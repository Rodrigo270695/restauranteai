<?php

namespace App\Http\Requests\App;

use App\Http\Requests\App\Concerns\HandlesFailedGalleryAuthorization;
use App\Http\Requests\App\Concerns\ResolvesGalleryRestaurant;
use App\Models\Restaurant;
use App\Models\RestaurantImage;
use App\Services\RestaurantScopeService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class GalleryImageRequest extends FormRequest
{
    use HandlesFailedGalleryAuthorization;
    use ResolvesGalleryRestaurant;

    /** Tipos de la galería del local (no incluye platos: eso va en la carta). */
    public const GALLERY_TYPES = ['exterior', 'interior', 'ambiente'];

    public function authorize(): bool
    {
        $user = $this->user();
        if (! $user) {
            return false;
        }

        $scope = app(RestaurantScopeService::class);
        $restaurant = $this->resolveGalleryRestaurant($this, $scope);

        return $restaurant && $scope->canManageGallery($user, $restaurant);
    }

    public function rules(): array
    {
        $isStore = $this->routeIs('app.gallery.store', 'app.admin.restaurants.manage.gallery.store');

        return [
            'image' => [$isStore ? 'required' : 'sometimes', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
            'alt_text' => ['nullable', 'string', 'max:150'],
            'type' => [$isStore ? 'required' : 'sometimes', Rule::in(self::GALLERY_TYPES)],
            'display_order' => ['nullable', 'integer', 'min:0', 'max:255'],
            'is_cover' => ['sometimes', 'boolean'],
        ];
    }
}
