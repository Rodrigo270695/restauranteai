<?php

namespace App\Http\Requests\App;

use App\Http\Requests\App\Concerns\HandlesFailedGalleryAuthorization;
use App\Http\Requests\App\Concerns\ResolvesGalleryRestaurant;
use App\Services\RestaurantScopeService;
use Illuminate\Foundation\Http\FormRequest;

/** Autoriza editar, eliminar o marcar portada (misma lógica que subir foto). */
class GalleryMutationRequest extends FormRequest
{
    use HandlesFailedGalleryAuthorization;
    use ResolvesGalleryRestaurant;

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

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [];
    }
}
