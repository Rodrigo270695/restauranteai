<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;

class RucValidationController extends Controller
{
    public function validate(string $ruc): JsonResponse
    {
        if (!preg_match('/^\d{11}$/', $ruc)) {
            return response()->json(['error' => 'El RUC debe tener 11 dígitos.'], 422);
        }

        $response = Http::withToken(config('services.apiperu.token'))
            ->timeout(10)
            ->get(config('services.apiperu.base_url') . '/ruc/' . $ruc);

        if ($response->failed()) {
            return response()->json(['error' => 'RUC no encontrado o servicio no disponible.'], 422);
        }

        $data = $response->json('data');

        if (empty($data)) {
            return response()->json(['error' => 'RUC no encontrado.'], 404);
        }

        return response()->json([
            'razon_social' => $data['nombre_o_razon_social'] ?? $data['razon_social'] ?? null,
            'estado'       => $data['estado'] ?? null,
            'condicion'    => $data['condicion'] ?? null,
            'departamento' => $data['departamento'] ?? null,
        ]);
    }
}
