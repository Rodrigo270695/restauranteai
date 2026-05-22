<?php

/**
 * Árbol único de permisos (sidebar + modal + seeder).
 * Convención: {recurso}.view|create|edit|delete o manage_* para dueño.
 */
return [
    'dashboard' => [
        'label' => 'Dashboard',
        'items' => [
            'dashboard' => [
                'label' => 'Dashboard',
                'permissions' => [
                    'dashboard.view' => 'Ver dashboard',
                ],
            ],
        ],
    ],
    'admin' => [
        'label' => 'Administración',
        'items' => [
            'roles' => [
                'label' => 'Roles',
                'permissions' => [
                    'roles.view' => 'Ver roles',
                    'roles.create' => 'Crear roles',
                    'roles.edit' => 'Editar roles',
                    'roles.delete' => 'Eliminar roles',
                    'roles.assign_permissions' => 'Asignar permisos',
                ],
            ],
            'users' => [
                'label' => 'Usuarios',
                'permissions' => [
                    'users.view' => 'Ver usuarios',
                    'users.create' => 'Crear usuarios',
                    'users.edit' => 'Editar usuarios',
                    'users.delete' => 'Eliminar usuarios',
                    'users.assign_roles' => 'Asignar roles a usuarios',
                ],
            ],
            'business_approval' => [
                'label' => 'Aprobación de negocios',
                'permissions' => [
                    'owners.approve_business' => 'Aprobar negocios de restaurante',
                ],
            ],
            'restaurants' => [
                'label' => 'Restaurantes',
                'permissions' => [
                    'restaurants.view' => 'Ver restaurantes',
                    'restaurants.create' => 'Crear restaurantes',
                    'restaurants.edit' => 'Editar restaurantes',
                    'restaurants.delete' => 'Eliminar restaurantes',
                ],
            ],
            'business_requests' => [
                'label' => 'Solicitudes de negocio',
                'permissions' => [
                    'business_requests.view' => 'Ver solicitudes',
                    'business_requests.manage' => 'Gestionar solicitudes',
                ],
            ],
        ],
    ],
    'catalogs' => [
        'label' => 'Catálogos',
        'items' => [
            'geography' => [
                'label' => 'Geografía',
                'permissions' => [
                    'geography.view' => 'Ver geografía',
                    'geography.create' => 'Crear registros',
                    'geography.edit' => 'Editar registros',
                    'geography.delete' => 'Eliminar registros',
                ],
            ],
            'cuisine_types' => [
                'label' => 'Tipos de cocina',
                'permissions' => [
                    'cuisine_types.view' => 'Ver tipos de cocina',
                    'cuisine_types.create' => 'Crear tipo',
                    'cuisine_types.edit' => 'Editar tipo',
                    'cuisine_types.delete' => 'Eliminar tipo',
                ],
            ],
            'ambiances' => [
                'label' => 'Ambientes',
                'permissions' => [
                    'ambiances.view' => 'Ver ambientes',
                    'ambiances.create' => 'Crear ambiente',
                    'ambiances.edit' => 'Editar ambiente',
                    'ambiances.delete' => 'Eliminar ambiente',
                ],
            ],
            'services' => [
                'label' => 'Servicios (catálogo)',
                'permissions' => [
                    'services.view' => 'Ver servicios',
                    'services.create' => 'Crear servicio',
                    'services.edit' => 'Editar servicio',
                    'services.delete' => 'Eliminar servicio',
                ],
            ],
            'dish_categories' => [
                'label' => 'Categorías de platos',
                'permissions' => [
                    'dish_categories.view' => 'Ver categorías',
                    'dish_categories.create' => 'Crear categoría',
                    'dish_categories.edit' => 'Editar categoría',
                    'dish_categories.delete' => 'Eliminar categoría',
                ],
            ],
            'languages' => [
                'label' => 'Idiomas soportados',
                'permissions' => [
                    'languages.view' => 'Ver idiomas',
                    'languages.create' => 'Crear idioma',
                    'languages.edit' => 'Editar idioma',
                    'languages.delete' => 'Eliminar idioma',
                ],
            ],
        ],
    ],
    'business' => [
        'label' => 'Mi Restaurante',
        'items' => [
            'own_restaurant' => [
                'label' => 'Datos del local',
                'permissions' => [
                    'manage_own_restaurant' => 'Gestionar mi restaurante',
                ],
            ],
            'schedules' => [
                'label' => 'Horarios',
                'permissions' => [
                    'manage_schedules' => 'Gestionar horarios',
                ],
            ],
            'gallery' => [
                'label' => 'Galería',
                'permissions' => [
                    'manage_gallery' => 'Gestionar galería',
                ],
            ],
            'restaurant_services' => [
                'label' => 'Servicios del local',
                'permissions' => [
                    'manage_restaurant_services' => 'Gestionar servicios del local',
                ],
            ],
            'restaurant_languages' => [
                'label' => 'Idiomas de atención',
                'permissions' => [
                    'manage_restaurant_languages' => 'Gestionar idiomas del local',
                ],
            ],
            'dishes' => [
                'label' => 'Platos',
                'permissions' => [
                    'manage_dishes' => 'Gestionar platos',
                ],
            ],
            'promotions' => [
                'label' => 'Promociones',
                'permissions' => [
                    'manage_promotions' => 'Gestionar promociones',
                ],
            ],
            'reviews' => [
                'label' => 'Reseñas',
                'permissions' => [
                    'reviews.view' => 'Ver reseñas de mi local',
                ],
            ],
            'analytics' => [
                'label' => 'Estadísticas',
                'permissions' => [
                    'view_analytics' => 'Ver estadísticas',
                ],
            ],
        ],
    ],
    'ml' => [
        'label' => 'Motor de recomendación',
        'items' => [
            'interactions' => [
                'label' => 'Interacciones',
                'permissions' => [
                    'interactions.view' => 'Ver interacciones',
                ],
            ],
            'recommendations' => [
                'label' => 'Recomendaciones',
                'permissions' => [
                    'recommendations.view' => 'Ver recomendaciones',
                    'recommendations.manage' => 'Gestionar recomendaciones',
                ],
            ],
            'rec_requests' => [
                'label' => 'Solicitudes ML',
                'permissions' => [
                    'recommendation_requests.view' => 'Ver solicitudes ML',
                ],
            ],
        ],
    ],
    'tam' => [
        'label' => 'Investigación',
        'items' => [
            'tam_surveys' => [
                'label' => 'Encuestas TAM',
                'permissions' => [
                    'tam_surveys.view' => 'Ver encuestas',
                    'tam_surveys.manage' => 'Gestionar encuestas',
                ],
            ],
        ],
    ],
];
