<?php

namespace App\Http\Requests\App\Concerns;

use Illuminate\Http\Exceptions\HttpResponseException;

trait HandlesFailedGalleryAuthorization
{
    protected function failedAuthorization(): void
    {
        if ($this->header('X-Inertia')) {
            throw new HttpResponseException(
                redirect()->back()->with('error', 'No tienes permiso para gestionar esta galería.')
            );
        }

        abort(403, 'No tienes permiso para gestionar esta galería.');
    }
}
