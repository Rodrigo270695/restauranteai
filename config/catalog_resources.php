<?php

use App\Models\Ambiance;
use App\Models\CuisineType;
use App\Models\DishCategory;
use App\Models\Service;
use App\Models\SupportLanguage;

return [
    'cuisine_types' => [
        'model' => CuisineType::class,
        'page' => 'app/admin/cuisine-types',
        'label' => 'tipo de cocina',
        'title' => 'Tipos de cocina',
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
];
