<?php

use App\Models\Ambiance;
use App\Models\CuisineType;
use App\Models\DietaryOption;
use App\Models\DishCategory;
use App\Models\PartyType;
use App\Models\RecommendedMoment;
use App\Models\RestaurantEnvironment;
use App\Models\Service;
use App\Models\SupportLanguage;

return [
    'cuisine_types' => [
        'model' => CuisineType::class,
        'page' => 'app/admin/cuisine-types',
        'label' => 'especialidad gastronómica',
        'title' => 'Especialidad gastronómica',
        'search' => ['name', 'slug'],
        'fields' => [
            ['key' => 'name', 'label' => 'Nombre', 'type' => 'text', 'required' => true],
            ['key' => 'slug', 'label' => 'Slug', 'type' => 'text'],
            ['key' => 'description', 'label' => 'Descripción', 'type' => 'textarea'],
            ['key' => 'icon', 'label' => 'Ícono', 'type' => 'text'],
            ['key' => 'is_active', 'label' => 'Activo', 'type' => 'boolean', 'default' => true],
        ],
    ],
    'ambiances' => [
        'model' => Ambiance::class,
        'page' => 'app/admin/ambiances',
        'label' => 'ambiente',
        'title' => 'Ambientes',
        'search' => ['name', 'slug'],
        'fields' => [
            ['key' => 'name', 'label' => 'Nombre', 'type' => 'text', 'required' => true],
            ['key' => 'slug', 'label' => 'Slug', 'type' => 'text'],
            ['key' => 'description', 'label' => 'Descripción', 'type' => 'textarea'],
            ['key' => 'is_active', 'label' => 'Activo', 'type' => 'boolean', 'default' => true],
        ],
    ],
    'services' => [
        'model' => Service::class,
        'page' => 'app/admin/services',
        'label' => 'servicio',
        'title' => 'Servicios (catálogo)',
        'search' => ['name', 'slug'],
        'fields' => [
            ['key' => 'name', 'label' => 'Nombre', 'type' => 'text', 'required' => true],
            ['key' => 'slug', 'label' => 'Slug', 'type' => 'text'],
            ['key' => 'icon', 'label' => 'Ícono', 'type' => 'text'],
            ['key' => 'is_active', 'label' => 'Activo', 'type' => 'boolean', 'default' => true],
        ],
    ],
    'dish_categories' => [
        'model' => DishCategory::class,
        'page' => 'app/admin/dish-categories',
        'label' => 'categoría',
        'title' => 'Categorías de platos',
        'search' => ['name', 'slug'],
        'fields' => [
            ['key' => 'name', 'label' => 'Nombre', 'type' => 'text', 'required' => true],
            ['key' => 'slug', 'label' => 'Slug', 'type' => 'text'],
            ['key' => 'display_order', 'label' => 'Orden', 'type' => 'number', 'default' => 0],
            ['key' => 'is_active', 'label' => 'Activo', 'type' => 'boolean', 'default' => true],
        ],
    ],
    'languages' => [
        'model' => SupportLanguage::class,
        'page' => 'app/admin/support-languages',
        'label' => 'idioma',
        'title' => 'Idiomas soportados',
        'search' => ['name', 'code'],
        'fields' => [
            ['key' => 'name', 'label' => 'Nombre', 'type' => 'text', 'required' => true],
            ['key' => 'code', 'label' => 'Código ISO', 'type' => 'text', 'required' => true],
            ['key' => 'is_active', 'label' => 'Activo', 'type' => 'boolean', 'default' => true],
        ],
    ],
    'party_types' => [
        'model' => PartyType::class,
        'page' => 'app/admin/party-types',
        'label' => 'tipo de salida',
        'title' => 'Tipos de salida',
        'search' => ['name', 'slug'],
        'fields' => [
            ['key' => 'name', 'label' => 'Nombre', 'type' => 'text', 'required' => true],
            ['key' => 'slug', 'label' => 'Slug', 'type' => 'text'],
            ['key' => 'description', 'label' => 'Descripción', 'type' => 'textarea'],
            ['key' => 'is_active', 'label' => 'Activo', 'type' => 'boolean', 'default' => true],
        ],
    ],
    'dietary_options' => [
        'model' => DietaryOption::class,
        'page' => 'app/admin/dietary-options',
        'label' => 'opción dietética',
        'title' => 'Opciones dietéticas',
        'search' => ['name', 'slug'],
        'fields' => [
            ['key' => 'name', 'label' => 'Nombre', 'type' => 'text', 'required' => true],
            ['key' => 'slug', 'label' => 'Slug', 'type' => 'text'],
            ['key' => 'description', 'label' => 'Descripción', 'type' => 'textarea'],
            ['key' => 'for_tourist_preference', 'label' => 'Perfil turista', 'type' => 'boolean', 'default' => true],
            ['key' => 'for_restaurant', 'label' => 'Datos del local', 'type' => 'boolean', 'default' => true],
            ['key' => 'is_active', 'label' => 'Activo', 'type' => 'boolean', 'default' => true],
        ],
    ],
    'restaurant_environments' => [
        'model' => RestaurantEnvironment::class,
        'page' => 'app/admin/restaurant-environments',
        'label' => 'entorno',
        'title' => 'Entornos del restaurante',
        'search' => ['name', 'slug'],
        'fields' => [
            ['key' => 'name', 'label' => 'Nombre', 'type' => 'text', 'required' => true],
            ['key' => 'slug', 'label' => 'Slug', 'type' => 'text'],
            ['key' => 'description', 'label' => 'Descripción', 'type' => 'textarea'],
            ['key' => 'is_active', 'label' => 'Activo', 'type' => 'boolean', 'default' => true],
        ],
    ],
    'recommended_moments' => [
        'model' => RecommendedMoment::class,
        'page' => 'app/admin/recommended-moments',
        'label' => 'momento',
        'title' => 'Momentos recomendados',
        'search' => ['name', 'slug'],
        'fields' => [
            ['key' => 'name', 'label' => 'Nombre', 'type' => 'text', 'required' => true],
            ['key' => 'slug', 'label' => 'Slug', 'type' => 'text'],
            ['key' => 'description', 'label' => 'Descripción', 'type' => 'textarea'],
            ['key' => 'is_active', 'label' => 'Activo', 'type' => 'boolean', 'default' => true],
        ],
    ],
];
