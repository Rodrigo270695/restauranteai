# Base de Datos — Plataforma de Recomendación de Restaurantes
## Lambayeque · Machine Learning · Laravel 13

> **Arquitecto:** Diseño basado en la tesis "Plataforma de Recomendación de Restaurantes basado en
> Machine Learning para impulsar el Turismo Gastronómico del Departamento de Lambayeque" (USAT, 2026).
>
> **Modelo de recomendación:** Híbrido (Filtrado Colaborativo + Basado en Contenido + Sensible al Contexto).
> ⚠️ Las tablas de interacciones y recomendaciones están diseñadas para alimentar el modelo de ML,
> pero la lógica de IA se implementará en una fase posterior separada.

---

## ROLES DEL SISTEMA (spatie/laravel-permission)

| Rol               | Descripción                                                         |
|-------------------|---------------------------------------------------------------------|
| `super_admin`     | Administrador total de la plataforma                                |
| `restaurant_owner`| Dueño de restaurante: gestiona su local, platos, horarios, fotos    |
| `tourist`         | Turista/usuario final: busca, recibe recomendaciones, valora        |

### Permisos por módulo

| Permiso                        | super_admin | restaurant_owner | tourist |
|-------------------------------|-------------|------------------|---------|
| `manage_users`                | ✅          | ❌               | ❌      |
| `manage_all_restaurants`      | ✅          | ❌               | ❌      |
| `manage_own_restaurant`       | ✅          | ✅               | ❌      |
| `manage_dishes`               | ✅          | ✅               | ❌      |
| `manage_schedules`            | ✅          | ✅               | ❌      |
| `manage_promotions`           | ✅          | ✅               | ❌      |
| `view_restaurants`            | ✅          | ✅               | ✅      |
| `write_reviews`               | ✅          | ❌               | ✅      |
| `view_recommendations`        | ✅          | ❌               | ✅      |
| `manage_cuisine_types`        | ✅          | ❌               | ❌      |
| `manage_categories`           | ✅          | ❌               | ❌      |
| `view_analytics`              | ✅          | ✅ (solo suyo)   | ❌      |

---

## ORDEN DE MIGRACIONES

> ⚠️ Laravel ejecuta migraciones en orden de timestamp del nombre de archivo.
> Se listan aquí en el orden exacto en que deben crearse para respetar llaves foráneas.

```
01. departments
02. provinces
03. districts
04. cuisine_types
05. ambiances
06. services          ← catálogo de servicios (wifi, parking, etc.)
07. dish_categories
08. [users]           ← ya existe (Laravel default)
09. [sessions]        ← ya existe (Laravel default)
10. [permission_tables] ← ya existe (spatie, 2026_05_03)
11. social_accounts        ← ya existe (OAuth Google, 2026_05_03)
11b. restaurant_profiles  ← nuevo (datos de negocio + aprobación, 2026_05_04)
12. restaurant_owners_profiles
12. tourist_profiles
13. user_preferences
14. restaurants
15. restaurant_images
16. restaurant_schedules
17. restaurant_service   ← pivot
18. dishes
19. reviews
20. user_interactions
21. recommendation_requests
22. recommendations
23. promotions
24. tam_surveys
25. support_languages    ← idiomas soportados
26. restaurant_language  ← pivot restaurante-idioma
```

---

## TABLAS DE GEOGRAFÍA

### `departments`
| Columna       | Tipo            | Descripción                    |
|---------------|-----------------|--------------------------------|
| `id`          | bigint PK AI    |                                |
| `name`        | varchar(100)    | Ej: "Lambayeque"               |
| `code`        | varchar(10)     | Código INEI                    |
| `created_at`  | timestamp       |                                |
| `updated_at`  | timestamp       |                                |

---

### `provinces`
| Columna         | Tipo            | Descripción                    |
|-----------------|-----------------|--------------------------------|
| `id`            | bigint PK AI    |                                |
| `department_id` | bigint FK       | → departments.id               |
| `name`          | varchar(100)    | Ej: "Chiclayo"                 |
| `code`          | varchar(10)     | Código INEI                    |
| `created_at`    | timestamp       |                                |
| `updated_at`    | timestamp       |                                |

---

### `districts`
| Columna       | Tipo            | Descripción                    |
|---------------|-----------------|--------------------------------|
| `id`          | bigint PK AI    |                                |
| `province_id` | bigint FK       | → provinces.id                 |
| `name`        | varchar(100)    | Ej: "José Leonardo Ortiz"      |
| `code`        | varchar(10)     | Código INEI                    |
| `created_at`  | timestamp       |                                |
| `updated_at`  | timestamp       |                                |

---

## CATÁLOGOS / CONFIGURACIÓN

### `cuisine_types`
> Tipos de cocina. Clave para filtrado basado en contenido del modelo ML.

| Columna       | Tipo            | Descripción                               |
|---------------|-----------------|-------------------------------------------|
| `id`          | bigint PK AI    |                                           |
| `name`        | varchar(80)     | Ej: "Criolla", "Marina", "Lambayecana"    |
| `slug`        | varchar(80)     | URL-friendly                              |
| `description` | text NULL       |                                           |
| `icon`        | varchar(100) NULL| Nombre del ícono o path de imagen        |
| `is_active`   | boolean         | default: true                             |
| `created_at`  | timestamp       |                                           |
| `updated_at`  | timestamp       |                                           |

**Índices:** UNIQUE(slug)

---

### `ambiances`
> Tipo de ambiente del restaurante. Variable contextual para el modelo ML.

| Columna       | Tipo            | Descripción                                        |
|---------------|-----------------|----------------------------------------------------|
| `id`          | bigint PK AI    |                                                    |
| `name`        | varchar(80)     | Ej: "Familiar", "Romántico", "Casual", "Cultural"  |
| `slug`        | varchar(80)     |                                                    |
| `description` | text NULL       |                                                    |
| `is_active`   | boolean         | default: true                                      |
| `created_at`  | timestamp       |                                                    |
| `updated_at`  | timestamp       |                                                    |

**Índices:** UNIQUE(slug)

---

### `services`
> Catálogo de servicios que puede ofrecer un restaurante.

| Columna       | Tipo            | Descripción                                            |
|---------------|-----------------|--------------------------------------------------------|
| `id`          | bigint PK AI    |                                                        |
| `name`        | varchar(80)     | Ej: "WiFi", "Estacionamiento", "Delivery", "Reservas" |
| `slug`        | varchar(80)     |                                                        |
| `icon`        | varchar(100) NULL|                                                       |
| `is_active`   | boolean         | default: true                                          |
| `created_at`  | timestamp       |                                                        |
| `updated_at`  | timestamp       |                                                        |

**Índices:** UNIQUE(slug)

---

### `dish_categories`
> Categorías de platos del menú.

| Columna         | Tipo            | Descripción                                      |
|-----------------|-----------------|--------------------------------------------------|
| `id`            | bigint PK AI    |                                                  |
| `name`          | varchar(80)     | Ej: "Entradas", "Platos de Fondo", "Postres"     |
| `slug`          | varchar(80)     |                                                  |
| `display_order` | tinyint         | Orden de aparición en el menú                    |
| `is_active`     | boolean         | default: true                                    |
| `created_at`    | timestamp       |                                                  |
| `updated_at`    | timestamp       |                                                  |

---

### `support_languages`
> Idiomas soportados por la plataforma (requisito funcional: multiidioma).

| Columna       | Tipo            | Descripción                          |
|---------------|-----------------|--------------------------------------|
| `id`          | bigint PK AI    |                                      |
| `name`        | varchar(60)     | Ej: "Español", "English"             |
| `code`        | varchar(10)     | Ej: "es", "en", "pt"                 |
| `is_active`   | boolean         | default: true                        |
| `created_at`  | timestamp       |                                      |
| `updated_at`  | timestamp       |                                      |

---

## USUARIOS Y PERFILES

### `users` ← tabla base existente de Laravel
> Se mantiene la tabla base. Solo se complementa con perfiles específicos por rol.

| Columna            | Tipo             | Descripción                     |
|--------------------|------------------|---------------------------------|
| `id`               | bigint PK AI     |                                 |
| `name`             | varchar(255)     |                                 |
| `email`            | varchar(255)     | UNIQUE                          |
| `email_verified_at`| timestamp NULL   |                                 |
| `password`         | varchar(255)     |                                 |
| `remember_token`   | varchar(100) NULL|                                 |
| `created_at`       | timestamp        |                                 |
| `updated_at`       | timestamp        |                                 |

---

### `restaurant_owners_profiles`
> Perfil extendido del dueño de restaurante (one-to-one con users).

| Columna          | Tipo             | Descripción                          |
|------------------|------------------|--------------------------------------|
| `id`             | bigint PK AI     |                                      |
| `user_id`        | bigint FK UNIQUE | → users.id (onDelete: cascade)       |
| `business_name`  | varchar(150)     | Razón social o nombre comercial      |
| `ruc`            | varchar(11) NULL | RUC del negocio (Perú)               |
| `phone`          | varchar(20) NULL |                                      |
| `profile_photo`  | varchar(255) NULL| Path de la foto de perfil            |
| `is_verified`    | boolean          | Verificado por el admin. default: false|
| `verified_at`    | timestamp NULL   |                                      |
| `created_at`     | timestamp        |                                      |
| `updated_at`     | timestamp        |                                      |

**Índices:** INDEX(user_id)

---

### `social_accounts`
> Cuentas de redes sociales vinculadas a un usuario (OAuth). Soporta Google y futuros proveedores.

| Columna                  | Tipo             | Descripción                                      |
|--------------------------|------------------|--------------------------------------------------|
| `id`                     | bigint PK AI     |                                                  |
| `user_id`                | bigint FK        | → users.id (onDelete: cascade)                   |
| `provider`               | varchar(30)      | 'google', 'facebook', 'github'                   |
| `provider_id`            | varchar(255)     | ID del usuario en el proveedor externo           |
| `provider_token`         | varchar(255) NULL| Access token OAuth                               |
| `provider_refresh_token` | varchar(255) NULL| Refresh token OAuth                              |
| `avatar`                 | varchar(255) NULL| URL del avatar del proveedor                     |
| `created_at`             | timestamp        |                                                  |
| `updated_at`             | timestamp        |                                                  |

**Índices:** UNIQUE(provider, provider_id), INDEX(user_id)

> Un usuario puede tener múltiples proveedores vinculados (Google + Facebook, etc.).
> Al hacer login con Google, si el email ya existe en `users`, se vincula automáticamente.

---

### `restaurant_profiles`
> Perfil de negocio de un dueño de restaurante. Se crea al registrarse con rol `restaurant_owner`.
> Requiere aprobación por parte del `super_admin` antes de que la cuenta quede activa.

| Columna                  | Tipo              | Descripción                                              |
|--------------------------|-------------------|----------------------------------------------------------|
| `id`                     | bigint PK AI      |                                                          |
| `user_id`                | bigint FK         | → users.id (onDelete: cascade)                           |
| `business_name`          | varchar(255)      | Nombre del restaurante / negocio                         |
| `ruc`                    | varchar(11) NULL  | RUC peruano (único si se provee)                         |
| `phone`                  | varchar(20) NULL  | Teléfono de contacto del negocio                         |
| `address`                | text NULL         | Dirección física del restaurante                         |
| `city`                   | varchar(100) NULL | Ciudad (Chiclayo, Lambayeque, etc.)                      |
| `district`               | varchar(100) NULL | Distrito específico                                      |
| `description`            | text NULL         | Descripción breve del restaurante                        |
| `website`                | varchar(255) NULL | URL del sitio web                                        |
| `status`                 | enum              | `pending` \| `approved` \| `rejected` (default: pending) |
| `rejection_reason`       | text NULL         | Motivo de rechazo (si aplica)                            |
| `approved_at`            | timestamp NULL    | Fecha de aprobación                                      |
| `approved_by`            | bigint FK NULL    | → users.id (super_admin que aprobó)                      |
| `created_at`             | timestamp         |                                                          |
| `updated_at`             | timestamp         |                                                          |
| `deleted_at`             | timestamp NULL    | Soft delete                                              |

**Índices:** UNIQUE(ruc), INDEX(user_id), INDEX(status)

> **Flujo de aprobación:**
> 1. El dueño se registra → `status = pending`
> 2. El `super_admin` revisa y aprueba → `status = approved`, se llena `approved_at` y `approved_by`
> 3. El dueño puede entonces subir su restaurante en la tabla `restaurants`
> 4. Si se rechaza → `status = rejected`, se llena `rejection_reason` para notificar al dueño

---

### `tourist_profiles`
> Perfil extendido del turista (one-to-one con users). Usado por el modelo ML.

| Columna              | Tipo             | Descripción                                              |
|----------------------|------------------|----------------------------------------------------------|
| `id`                 | bigint PK AI     |                                                          |
| `user_id`            | bigint FK UNIQUE | → users.id (onDelete: cascade)                           |
| `nationality`        | varchar(100) NULL| País de origen                                           |
| `age_range`          | enum             | '18-24','25-34','35-44','45-54','55-64','65+'            |
| `tourist_type`       | enum             | 'cultural','gastronomico','recreativo','religioso','otro'|
| `preferred_language` | varchar(10)      | Código ISO. default: 'es'                                |
| `profile_photo`      | varchar(255) NULL|                                                          |
| `phone`              | varchar(20) NULL |                                                          |
| `created_at`         | timestamp        |                                                          |
| `updated_at`         | timestamp        |                                                          |

**Índices:** INDEX(user_id), INDEX(nationality), INDEX(tourist_type)

---

### `user_preferences`
> Preferencias gastronómicas del turista. Base para el filtrado basado en contenido del ML.

| Columna              | Tipo             | Descripción                                           |
|----------------------|------------------|-------------------------------------------------------|
| `id`                 | bigint PK AI     |                                                       |
| `user_id`            | bigint FK        | → users.id (onDelete: cascade)                        |
| `cuisine_type_id`    | bigint FK NULL   | → cuisine_types.id (Tipo de cocina preferida)         |
| `ambiance_id`        | bigint FK NULL   | → ambiances.id (Ambiente preferido)                   |
| `price_range`        | enum             | 'economico','moderado','premium'. NULL = sin preferencia|
| `max_distance_km`    | decimal(5,2) NULL| Distancia máxima aceptable en km                      |
| `party_type`         | enum NULL        | 'solo','pareja','familia','amigos','negocios'          |
| `dietary_restriction`| enum NULL        | 'ninguna','vegetariano','vegano','sin_gluten','halal'  |
| `created_at`         | timestamp        |                                                       |
| `updated_at`         | timestamp        |                                                       |

> Un usuario puede tener múltiples preferencias (historial de cambios) pero solo una activa.
> Se determina la activa por el `updated_at` más reciente.

**Índices:** INDEX(user_id), INDEX(cuisine_type_id), INDEX(price_range)

---

## RESTAURANTES

### `restaurants`
> Entidad central de la plataforma.

| Columna            | Tipo               | Descripción                                         |
|--------------------|--------------------|-----------------------------------------------------|
| `id`               | bigint PK AI       |                                                     |
| `owner_id`         | bigint FK          | → users.id (el dueño del restaurante)               |
| `district_id`      | bigint FK          | → districts.id                                      |
| `cuisine_type_id`  | bigint FK          | → cuisine_types.id (tipo principal de cocina)        |
| `ambiance_id`      | bigint FK NULL     | → ambiances.id                                       |
| `name`             | varchar(150)       | Nombre del restaurante                              |
| `slug`             | varchar(180)       | URL-friendly. UNIQUE                                |
| `description`      | text NULL          | Descripción completa                                |
| `short_description`| varchar(255) NULL  | Resumen breve para tarjetas                         |
| `address`          | varchar(255)       | Dirección completa                                  |
| `latitude`         | decimal(10,8) NULL | Coordenada GPS                                      |
| `longitude`        | decimal(11,8) NULL | Coordenada GPS                                      |
| `phone`            | varchar(20) NULL   |                                                     |
| `whatsapp`         | varchar(20) NULL   |                                                     |
| `email`            | varchar(100) NULL  |                                                     |
| `website`          | varchar(255) NULL  |                                                     |
| `instagram`        | varchar(100) NULL  |                                                     |
| `facebook`         | varchar(100) NULL  |                                                     |
| `price_range`      | enum               | 'economico','moderado','premium'                    |
| `avg_price_per_person`| decimal(8,2) NULL| Precio promedio por persona en soles              |
| `capacity`         | smallint NULL      | Capacidad de personas                               |
| `cover_image`      | varchar(255) NULL  | Imagen principal (thumbnail)                        |
| `avg_rating`       | decimal(3,2)       | Promedio calculado. default: 0.00                   |
| `total_reviews`    | int                | Contador de reseñas. default: 0                     |
| `total_views`      | int                | Vistas totales. default: 0                          |
| `is_active`        | boolean            | Visible en la plataforma. default: false            |
| `is_verified`      | boolean            | Verificado por admin. default: false                |
| `is_featured`      | boolean            | Destacado en portada. default: false                |
| `verified_at`      | timestamp NULL     |                                                     |
| `created_at`       | timestamp          |                                                     |
| `updated_at`       | timestamp          |                                                     |
| `deleted_at`       | timestamp NULL     | SoftDelete                                          |

**Índices:**
- UNIQUE(slug)
- INDEX(owner_id)
- INDEX(district_id)
- INDEX(cuisine_type_id)
- INDEX(price_range)
- INDEX(is_active, is_verified)
- INDEX(avg_rating)
- SPATIAL INDEX o INDEX(latitude, longitude) → para búsquedas geoespaciales

---

### `restaurant_images`
> Galería fotográfica del restaurante.

| Columna          | Tipo             | Descripción                               |
|------------------|------------------|-------------------------------------------|
| `id`             | bigint PK AI     |                                           |
| `restaurant_id`  | bigint FK        | → restaurants.id (onDelete: cascade)      |
| `path`           | varchar(255)     | Ruta del archivo en storage               |
| `alt_text`       | varchar(150) NULL| Texto alternativo                         |
| `type`           | enum             | 'exterior','interior','platos','ambiente' |
| `display_order`  | tinyint          | default: 0                                |
| `is_cover`       | boolean          | default: false                            |
| `created_at`     | timestamp        |                                           |
| `updated_at`     | timestamp        |                                           |

**Índices:** INDEX(restaurant_id), INDEX(is_cover)

---

### `restaurant_schedules`
> Horarios de atención por día de la semana.

| Columna          | Tipo             | Descripción                                    |
|------------------|------------------|------------------------------------------------|
| `id`             | bigint PK AI     |                                                |
| `restaurant_id`  | bigint FK        | → restaurants.id (onDelete: cascade)           |
| `day_of_week`    | tinyint          | 0=Lunes, 1=Martes, ..., 6=Domingo             |
| `opens_at`       | time NULL        | Hora de apertura. NULL = cerrado ese día       |
| `closes_at`      | time NULL        | Hora de cierre                                 |
| `is_closed`      | boolean          | default: false (ese día está cerrado)          |
| `created_at`     | timestamp        |                                                |
| `updated_at`     | timestamp        |                                                |

**Índices:** UNIQUE(restaurant_id, day_of_week)

---

### `restaurant_service` (pivot)
> Servicios que ofrece cada restaurante.

| Columna         | Tipo         | Descripción                          |
|-----------------|--------------|--------------------------------------|
| `restaurant_id` | bigint FK    | → restaurants.id (onDelete: cascade) |
| `service_id`    | bigint FK    | → services.id (onDelete: cascade)    |

**Índices:** PRIMARY KEY(restaurant_id, service_id)

---

### `restaurant_language` (pivot)
> Idiomas en los que puede atender el restaurante (menú traducido, personal, etc.).

| Columna            | Tipo         | Descripción                               |
|--------------------|--------------|-------------------------------------------|
| `restaurant_id`    | bigint FK    | → restaurants.id (onDelete: cascade)      |
| `support_language_id` | bigint FK | → support_languages.id (onDelete: cascade)|

**Índices:** PRIMARY KEY(restaurant_id, support_language_id)

---

## MENÚ / PLATOS

### `dishes`
> Platos del restaurante. Clave para el contenido que consume el modelo ML.

| Columna              | Tipo             | Descripción                               |
|----------------------|------------------|-------------------------------------------|
| `id`                 | bigint PK AI     |                                           |
| `restaurant_id`      | bigint FK        | → restaurants.id (onDelete: cascade)      |
| `dish_category_id`   | bigint FK        | → dish_categories.id                      |
| `name`               | varchar(120)     | Nombre del plato                          |
| `description`        | text NULL        |                                           |
| `price`              | decimal(8,2)     | Precio en soles                           |
| `image`              | varchar(255) NULL| Foto del plato                            |
| `is_signature`       | boolean          | Plato emblema/estrella. default: false    |
| `is_available`       | boolean          | Disponible hoy. default: true             |
| `is_featured`        | boolean          | Destacado en la plataforma. default: false|
| `dietary_tags`       | json NULL        | ['vegetariano','sin_gluten', ...]         |
| `display_order`      | tinyint          | Orden en el menú. default: 0              |
| `created_at`         | timestamp        |                                           |
| `updated_at`         | timestamp        |                                           |
| `deleted_at`         | timestamp NULL   | SoftDelete                                |

**Índices:** INDEX(restaurant_id), INDEX(dish_category_id), INDEX(is_available), INDEX(is_featured)

---

## RESEÑAS Y VALORACIONES

### `reviews`
> Valoraciones de los turistas. Alimentan el filtrado colaborativo del modelo ML.

| Columna           | Tipo             | Descripción                                           |
|-------------------|------------------|-------------------------------------------------------|
| `id`              | bigint PK AI     |                                                       |
| `user_id`         | bigint FK        | → users.id (onDelete: cascade)                        |
| `restaurant_id`   | bigint FK        | → restaurants.id (onDelete: cascade)                  |
| `rating`          | tinyint          | 1 a 5 estrellas (NOT NULL)                            |
| `comment`         | text NULL        |                                                       |
| `food_rating`     | tinyint NULL     | Sub-rating: calidad de la comida (1-5)                |
| `service_rating`  | tinyint NULL     | Sub-rating: atención/servicio (1-5)                   |
| `ambiance_rating` | tinyint NULL     | Sub-rating: ambiente (1-5)                            |
| `price_rating`    | tinyint NULL     | Sub-rating: relación calidad-precio (1-5)             |
| `visit_date`      | date NULL        | Fecha aproximada de visita                            |
| `party_type`      | enum NULL        | 'solo','pareja','familia','amigos','negocios'         |
| `is_visible`      | boolean          | Moderación. default: true                             |
| `owner_response`  | text NULL        | Respuesta del dueño a la reseña                       |
| `owner_responded_at`| timestamp NULL |                                                       |
| `created_at`      | timestamp        |                                                       |
| `updated_at`      | timestamp        |                                                       |

**Índices:** 
- UNIQUE(user_id, restaurant_id) ← un turista, una reseña por restaurante
- INDEX(restaurant_id, rating)
- INDEX(is_visible)

---

## HISTORIAL E INTERACCIONES (Motor del ML)

### `user_interactions`
> Registro de cada interacción del turista con la plataforma.
> Esta tabla es el **insumo principal** del modelo de recomendación híbrido.

| Columna            | Tipo             | Descripción                                                   |
|--------------------|------------------|---------------------------------------------------------------|
| `id`               | bigint PK AI     |                                                               |
| `user_id`          | bigint FK        | → users.id (onDelete: cascade)                                |
| `restaurant_id`    | bigint FK NULL   | → restaurants.id (onDelete: set null)                         |
| `interaction_type` | enum             | 'view','search','click','save','recommendation_viewed',       |
|                    |                  | 'recommendation_accepted','recommendation_rejected','visit'   |
| `search_query`     | varchar(255) NULL| Texto de búsqueda si fue una búsqueda                         |
| `context_budget`   | enum NULL        | 'economico','moderado','premium' (contexto al momento)        |
| `context_party`    | enum NULL        | 'solo','pareja','familia','amigos','negocios'                 |
| `context_latitude` | decimal(10,8) NULL| Ubicación del usuario al momento                             |
| `context_longitude`| decimal(11,8) NULL|                                                              |
| `context_time_slot`| enum NULL        | 'desayuno','almuerzo','cena','merienda'                       |
| `session_id`       | varchar(100) NULL| ID de sesión para agrupar interacciones                       |
| `duration_seconds` | int NULL         | Segundos que estuvo viendo el restaurante                     |
| `created_at`       | timestamp        |                                                               |

> No tiene `updated_at` (registro inmutable / append-only).

**Índices:** 
- INDEX(user_id, created_at)
- INDEX(restaurant_id)
- INDEX(interaction_type)
- INDEX(user_id, interaction_type)

---

### `recommendation_requests`
> Cada vez que un turista solicita recomendaciones. Guarda el contexto completo.

| Columna              | Tipo              | Descripción                                       |
|----------------------|-------------------|---------------------------------------------------|
| `id`                 | bigint PK AI      |                                                   |
| `user_id`            | bigint FK         | → users.id (onDelete: cascade)                    |
| `budget`             | enum NULL         | 'economico','moderado','premium'                  |
| `party_type`         | enum NULL         | 'solo','pareja','familia','amigos','negocios'     |
| `motive`             | enum NULL         | 'gastronomico','cultural','ocio','negocios','religioso'|
| `cuisine_type_id`    | bigint FK NULL    | → cuisine_types.id (preferencia en ese momento)  |
| `ambiance_id`        | bigint FK NULL    | → ambiances.id                                    |
| `latitude`           | decimal(10,8) NULL| Ubicación al momento de la solicitud              |
| `longitude`          | decimal(11,8) NULL|                                                   |
| `max_distance_km`    | decimal(5,2) NULL |                                                   |
| `time_slot`          | enum NULL         | 'desayuno','almuerzo','cena','merienda'           |
| `algorithm_used`     | varchar(50) NULL  | 'collaborative','content_based','hybrid'          |
| `created_at`         | timestamp         |                                                   |

**Índices:** INDEX(user_id, created_at), INDEX(cuisine_type_id)

---

### `recommendations`
> Recomendaciones generadas para cada solicitud (resultado del modelo ML).

| Columna               | Tipo             | Descripción                                          |
|-----------------------|------------------|------------------------------------------------------|
| `id`                  | bigint PK AI     |                                                      |
| `request_id`          | bigint FK        | → recommendation_requests.id (onDelete: cascade)     |
| `restaurant_id`       | bigint FK        | → restaurants.id (onDelete: cascade)                 |
| `rank`                | tinyint          | Posición en la lista (1 = más recomendado)           |
| `score`               | decimal(8,6)     | Puntuación del algoritmo (0.000000 - 1.000000)       |
| `content_score`       | decimal(8,6) NULL| Sub-score: filtrado basado en contenido              |
| `collaborative_score` | decimal(8,6) NULL| Sub-score: filtrado colaborativo                     |
| `context_score`       | decimal(8,6) NULL| Sub-score: sensible al contexto                      |
| `was_viewed`          | boolean          | El usuario vio este resultado. default: false        |
| `was_accepted`        | boolean          | El usuario hizo click/visitó. default: false         |
| `was_rejected`        | boolean          | El usuario rechazó explícitamente. default: false    |
| `created_at`          | timestamp        |                                                      |

**Índices:** 
- INDEX(request_id, rank)
- INDEX(restaurant_id)
- INDEX(was_accepted)

---

## PROMOCIONES Y EVENTOS

### `promotions`
> Ofertas, descuentos y eventos gastronómicos publicados por el dueño.

| Columna          | Tipo              | Descripción                                      |
|------------------|-------------------|--------------------------------------------------|
| `id`             | bigint PK AI      |                                                  |
| `restaurant_id`  | bigint FK         | → restaurants.id (onDelete: cascade)             |
| `title`          | varchar(150)      |                                                  |
| `description`    | text NULL         |                                                  |
| `type`           | enum              | 'descuento','evento','menu_especial','2x1','otro'|
| `discount_percent`| decimal(5,2) NULL| Porcentaje de descuento (si aplica)             |
| `image`          | varchar(255) NULL |                                                  |
| `starts_at`      | datetime          |                                                  |
| `ends_at`        | datetime          |                                                  |
| `is_active`      | boolean           | default: true                                    |
| `created_at`     | timestamp         |                                                  |
| `updated_at`     | timestamp         |                                                  |

**Índices:** INDEX(restaurant_id), INDEX(starts_at, ends_at), INDEX(is_active)

---

## EVALUACIÓN TAM (Modelo de Aceptación Tecnológica)

### `tam_surveys`
> Encuestas para evaluar la aceptación tecnológica (Objetivo específico 04 de la tesis).
> Basado en el modelo TAM: Perceived Usefulness + Perceived Ease of Use.

| Columna                        | Tipo         | Descripción                                        |
|--------------------------------|--------------|----------------------------------------------------|
| `id`                           | bigint PK AI |                                                    |
| `user_id`                      | bigint FK    | → users.id (onDelete: cascade)                     |
| `pu1_useful`                   | tinyint      | "El sistema me ayuda a encontrar restaurantes" (1-5)|
| `pu2_faster`                   | tinyint      | "El sistema me ahorra tiempo en la decisión" (1-5) |
| `pu3_productivity`             | tinyint      | "El sistema mejora mi experiencia turística" (1-5) |
| `pu4_effectiveness`            | tinyint      | "Las recomendaciones son relevantes para mí" (1-5) |
| `peou1_easy_to_learn`          | tinyint      | "Aprender a usar el sistema es fácil" (1-5)        |
| `peou2_controllable`           | tinyint      | "Puedo controlar el sistema fácilmente" (1-5)      |
| `peou3_clear_understandable`   | tinyint      | "La interacción con el sistema es clara" (1-5)     |
| `peou4_easy_to_use`            | tinyint      | "En general, el sistema es fácil de usar" (1-5)    |
| `bi1_intend_to_use`            | tinyint      | "Tengo intención de seguir usando el sistema" (1-5)|
| `bi2_recommend`                | tinyint      | "Recomendaría el sistema a otros turistas" (1-5)   |
| `open_comment`                 | text NULL    | Comentario libre                                   |
| `created_at`                   | timestamp    |                                                    |

**Índices:** INDEX(user_id), UNIQUE(user_id) ← un turista, una encuesta

---

## RESUMEN DE RELACIONES

```
users (1) ────────── (N) social_accounts           [provider OAuth]
users (1) ────────── (1) restaurant_owners_profiles
users (1) ────────── (1) tourist_profiles
users (1) ────────── (N) restaurants          [owner_id]
users (1) ────────── (N) user_preferences
users (1) ────────── (N) reviews
users (1) ────────── (N) user_interactions
users (1) ────────── (N) recommendation_requests
users (1) ────────── (1) tam_surveys

restaurants (N) ──── (1) users                [owner_id]
restaurants (N) ──── (1) districts
restaurants (N) ──── (1) cuisine_types
restaurants (N) ──── (1) ambiances
restaurants (1) ──── (N) restaurant_images
restaurants (1) ──── (N) restaurant_schedules
restaurants (N) ──── (N) services             [pivot: restaurant_service]
restaurants (N) ──── (N) support_languages    [pivot: restaurant_language]
restaurants (1) ──── (N) dishes
restaurants (1) ──── (N) reviews
restaurants (1) ──── (N) promotions
restaurants (1) ──── (N) user_interactions
restaurants (1) ──── (N) recommendations

dishes (N) ──────── (1) dish_categories

recommendation_requests (1) ── (N) recommendations
recommendation_requests (N) ── (1) cuisine_types
recommendation_requests (N) ── (1) ambiances

districts (N) ──── (1) provinces
provinces (N) ──── (1) departments
```

---

## VARIABLES PARA EL MODELO DE RECOMENDACIÓN ML

> Identificadas para cumplir el indicador: **≥ 8 variables relevantes** (Objetivo 01).

| # | Variable                    | Fuente en BD                              | Uso en modelo              |
|---|------------------------------|-------------------------------------------|----------------------------|
| 1 | Tipo de cocina               | `user_preferences.cuisine_type_id`        | Contenido + Contexto       |
| 2 | Rango de precio / presupuesto| `user_preferences.price_range`            | Contenido + Contexto       |
| 3 | Proximidad geográfica        | `restaurants.latitude/longitude` vs usuario| Contexto                  |
| 4 | Ambiente preferido           | `user_preferences.ambiance_id`            | Contenido                  |
| 5 | Tipo de salida               | `recommendation_requests.party_type`      | Contexto                   |
| 6 | Historial de ratings         | `reviews.rating`                          | Colaborativo               |
| 7 | Historial de interacciones   | `user_interactions.interaction_type`      | Colaborativo + Contenido   |
| 8 | Franja horaria               | `recommendation_requests.time_slot`       | Contexto                   |
| 9 | Horario de atención          | `restaurant_schedules`                    | Filtro de disponibilidad   |
|10 | Servicios ofrecidos          | `restaurant_service` pivot                | Contenido                  |
|11 | Tipo de turista              | `tourist_profiles.tourist_type`           | Demográfico                |
|12 | Restricciones dietéticas     | `user_preferences.dietary_restriction`    | Contenido                  |

---

## NOTAS DE IMPLEMENTACIÓN

1. **SoftDelete** en `restaurants` y `dishes` para no perder histórico del modelo ML.
2. **`avg_rating` y `total_reviews`** en `restaurants` son columnas desnormalizadas (calculadas) para evitar JOINs costosos en las recomendaciones. Se actualizan con un Observer de Laravel al insertar/actualizar reviews.
3. **`user_interactions`** es append-only (no actualizable). Nunca se borra, solo se archiva.
4. **Columnas de contexto** en `user_interactions` y `recommendation_requests` capturan el estado del usuario *en el momento exacto* de la interacción, no sus preferencias guardadas (que pueden cambiar).
5. **`recommendations.score`** es generado por el microservicio Python de ML y almacenado aquí para auditoría y mejora continua.
6. El campo `algorithm_used` en `recommendation_requests` permite comparar el rendimiento de diferentes variantes del modelo.
7. Las tablas geográficas (`departments`, `provinces`, `districts`) se poblarán con datos del INEI de Lambayeque vía seeders.
