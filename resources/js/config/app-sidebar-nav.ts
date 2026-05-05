import type { LucideIcon } from 'lucide-react';
import {
    BarChart3,
    BookOpen,
    ChefHat,
    ClipboardList,
    Globe2,
    ImageIcon,
    Languages,
    LayoutGrid,
    MapPinned,
    MessageSquareText,
    Network,
    Settings2,
    Shield,
    Sparkles,
    Store,
    Tag,
    Tags,
    Timer,
    Users,
    UtensilsCrossed,
    Wine,
} from 'lucide-react';

export type AppRole = 'super_admin' | 'restaurant_owner';

export type SidebarNavLeaf = {
    title: string;
    href: string;
    icon: LucideIcon;
    /** Permiso Spatie requerido para ver este item (undefined = visible siempre) */
    permission?: string;
};

export type SidebarNavModule = {
    id: string;
    title: string;
    icon: LucideIcon;
    /** Si incluye `super_admin`, el módulo también se muestra a admins. */
    roles: AppRole[];
    items: SidebarNavLeaf[];
};

export const APP_HREF = {
    dashboard: '/dashboard',
    restaurants: '/app/restaurants',
    schedules: '/app/schedules',
    gallery: '/app/gallery',
    restaurantServices: '/app/restaurant-services',
    restaurantLanguages: '/app/restaurant-languages',
    dishes: '/app/dishes',
    promotions: '/app/promotions',
    reviews: '/app/reviews',
    analytics: '/app/analytics',
    adminRoles: '/app/admin/roles',
    adminUsers: '/app/admin/users',
    adminRestaurants: '/app/admin/restaurants',
    adminBusinessRequests: '/app/admin/business-requests',
    adminGeography: '/app/admin/geography',
    adminCuisineTypes: '/app/admin/cuisine-types',
    adminAmbiances: '/app/admin/ambiances',
    adminServices: '/app/admin/services',
    adminDishCategories: '/app/admin/dish-categories',
    adminLanguages: '/app/admin/support-languages',
    adminInteractions: '/app/admin/user-interactions',
    adminRecRequests: '/app/admin/recommendation-requests',
    adminRecommendations: '/app/admin/recommendations',
    adminTam: '/app/admin/tam-surveys',
} as const;

export const sidebarNavModules: SidebarNavModule[] = [
    {
        id: 'business',
        title: 'Mi restaurante',
        icon: Store,
        roles: ['restaurant_owner', 'super_admin'],
        items: [
            { title: 'Datos del local',    href: APP_HREF.restaurants,        icon: Store,    permission: 'manage_own_restaurant' },
            { title: 'Horarios',           href: APP_HREF.schedules,          icon: Timer,    permission: 'manage_schedules' },
            { title: 'Galería',            href: APP_HREF.gallery,            icon: ImageIcon, permission: 'manage_own_restaurant' },
            { title: 'Servicios del local',href: APP_HREF.restaurantServices, icon: Settings2, permission: 'manage_own_restaurant' },
            { title: 'Idiomas de atención',href: APP_HREF.restaurantLanguages,icon: Languages, permission: 'manage_own_restaurant' },
        ],
    },
    {
        id: 'menu',
        title: 'Carta y ofertas',
        icon: UtensilsCrossed,
        roles: ['restaurant_owner', 'super_admin'],
        items: [
            { title: 'Platos',      href: APP_HREF.dishes,     icon: ChefHat, permission: 'manage_dishes' },
            { title: 'Promociones', href: APP_HREF.promotions,  icon: Tag,     permission: 'manage_promotions' },
        ],
    },
    {
        id: 'community',
        title: 'Comunidad',
        icon: MessageSquareText,
        roles: ['restaurant_owner', 'super_admin'],
        items: [
            { title: 'Reseñas', href: APP_HREF.reviews, icon: MessageSquareText, permission: 'write_reviews' },
        ],
    },
    {
        id: 'insights',
        title: 'Rendimiento',
        icon: BarChart3,
        roles: ['restaurant_owner', 'super_admin'],
        items: [
            { title: 'Estadísticas', href: APP_HREF.analytics, icon: BarChart3, permission: 'view_analytics' },
        ],
    },
    {
        id: 'admin',
        title: 'Administración',
        icon: Users,
        roles: ['super_admin'],
        items: [
            { title: 'Roles',                href: APP_HREF.adminRoles,            icon: Shield,       permission: 'roles.view' },
            { title: 'Usuarios',             href: APP_HREF.adminUsers,            icon: Users,        permission: 'users.view' },
            { title: 'Restaurantes',         href: APP_HREF.adminRestaurants,      icon: Wine,         permission: 'restaurants.view' },
            { title: 'Solicitudes de negocio', href: APP_HREF.adminBusinessRequests, icon: ClipboardList, permission: 'business_requests.view' },
        ],
    },
    {
        id: 'catalogs',
        title: 'Catálogos',
        icon: Tags,
        roles: ['super_admin'],
        items: [
            { title: 'Geografía',            href: APP_HREF.adminGeography,     icon: MapPinned,      permission: 'geography.view' },
            { title: 'Tipos de cocina',      href: APP_HREF.adminCuisineTypes,  icon: UtensilsCrossed,permission: 'cuisine_types.view' },
            { title: 'Ambientes',            href: APP_HREF.adminAmbiances,     icon: Sparkles,       permission: 'ambiances.view' },
            { title: 'Servicios (catálogo)', href: APP_HREF.adminServices,      icon: Settings2,      permission: 'services.view' },
            { title: 'Categorías de platos', href: APP_HREF.adminDishCategories,icon: BookOpen,       permission: 'dish_categories.view' },
            { title: 'Idiomas soportados',   href: APP_HREF.adminLanguages,     icon: Globe2,         permission: 'languages.view' },
        ],
    },
    {
        id: 'ml',
        title: 'Motor de recomendación',
        icon: Network,
        roles: ['super_admin'],
        items: [
            { title: 'Interacciones',   href: APP_HREF.adminInteractions,   icon: Network,      permission: 'interactions.view' },
            { title: 'Solicitudes ML',  href: APP_HREF.adminRecRequests,    icon: ClipboardList,permission: 'recommendations.view' },
            { title: 'Recomendaciones', href: APP_HREF.adminRecommendations,icon: Sparkles,     permission: 'recommendations.view' },
        ],
    },
    {
        id: 'tam',
        title: 'Investigación',
        icon: BookOpen,
        roles: ['super_admin'],
        items: [
            { title: 'Encuestas TAM', href: APP_HREF.adminTam, icon: BookOpen, permission: 'tam_surveys.view' },
        ],
    },
];

export const dashboardNavItem: SidebarNavLeaf = {
    title: 'Inicio',
    href: APP_HREF.dashboard,
    icon: LayoutGrid,
    permission: 'dashboard.view',
};
