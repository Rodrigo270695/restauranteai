# Sistema de Recomendación con IA
## Plataforma Gastronómica · Lambayeque · Modelo Híbrido

> **Arquitecto / Analista:** Diseño basado en la tesis "Plataforma de Recomendación de Restaurantes
> basado en Machine Learning para impulsar el Turismo Gastronómico del Departamento de Lambayeque" (USAT, 2026).
>
> **Modelo elegido:** Sistema de Recomendación Híbrido Mixto
> = Filtrado Colaborativo + Filtrado Basado en Contenido + Sensible al Contexto
>
> **Tecnología IA:** Microservicio Python independiente · Se comunica con Laravel via API REST interna.
> **Metodología de desarrollo del modelo:** CRISP-DM (según la tesis).

---

## 1. ARQUITECTURA GENERAL DEL SISTEMA DE IA

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENTE (Turista/Browser)                    │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────────────┐
│               SERVIDOR WEB · Laravel 13 (PHP)                    │
│                                                                  │
│  ┌──────────────────┐    ┌─────────────────────────────────┐    │
│  │  RecommendationC │───▶│  RecommendationService (PHP)    │    │
│  │  ontroller       │    │  Prepara el payload de contexto │    │
│  └──────────────────┘    └──────────────┬──────────────────┘    │
│                                         │ HTTP interno           │
└─────────────────────────────────────────┼────────────────────────┘
                                          │
┌─────────────────────────────────────────▼────────────────────────┐
│              MICROSERVICIO IA · FastAPI (Python)                  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                  MOTOR HÍBRIDO                            │    │
│  │                                                           │    │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐ │    │
│  │  │ Colaborativo│  │Basado en     │  │Sensible al      │ │    │
│  │  │ (SVD/KNN)   │  │Contenido     │  │Contexto         │ │    │
│  │  │             │  │(TF-IDF/      │  │(Boost/Filtros)  │ │    │
│  │  │             │  │ Cosine Sim)  │  │                 │ │    │
│  │  └──────┬──────┘  └──────┬───────┘  └────────┬────────┘ │    │
│  │         │                │                    │          │    │
│  │         └────────────────▼────────────────────┘          │    │
│  │                   ┌──────────────┐                        │    │
│  │                   │ Combinador   │                        │    │
│  │                   │ Ponderado    │                        │    │
│  │                   │ (α·CB +      │                        │    │
│  │                   │  β·CF + γ·C) │                        │    │
│  │                   └──────┬───────┘                        │    │
│  └──────────────────────────┼───────────────────────────────┘    │
│                              │                                    │
│  ┌───────────────────────────▼───────────────────────────────┐   │
│  │          Lista rankeada de restaurantes + scores           │   │
│  └───────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────┬────────────────────────┘
                                          │
┌─────────────────────────────────────────▼────────────────────────┐
│                  BASE DE DATOS · MySQL                            │
│  users · restaurants · user_interactions · recommendations ···    │
└───────────────────────────────────────────────────────────────────┘
```

---

## 2. METODOLOGÍA CRISP-DM APLICADA AL PROYECTO

### FASE 1 — Comprensión del Negocio

**Objetivo:** Recomendar restaurantes en Lambayeque personalizados para cada turista.

**Preguntas clave que el modelo debe responder:**
- ¿Qué restaurante se adapta al perfil y contexto actual del turista?
- ¿Qué restaurantes prefieren turistas con gustos similares?
- ¿El restaurante está disponible ahora (horario, ubicación, presupuesto)?

**KPIs de éxito del modelo:**
| Métrica              | Umbral mínimo | Objetivo ideal |
|----------------------|---------------|----------------|
| Precisión (Precision@K)| ≥ 80%      | ≥ 90%          |
| Recall@K             | ≥ 70%         | ≥ 85%          |
| NDCG@10              | ≥ 0.75        | ≥ 0.85         |
| MAE (rating pred.)   | ≤ 0.8         | ≤ 0.5          |
| RMSE (rating pred.)  | ≤ 1.0         | ≤ 0.7          |
| Cobertura catálogo   | ≥ 60%         | ≥ 80%          |

---

### FASE 2 — Comprensión de los Datos

#### Fuentes de datos disponibles

| Fuente                      | Tabla en BD              | Tipo de dato    | Uso en modelo          |
|-----------------------------|--------------------------|-----------------|------------------------|
| Perfil del turista          | `tourist_profiles`       | Categórico      | CB + Demográfico       |
| Preferencias declaradas     | `user_preferences`       | Categórico      | CB                     |
| Historial de ratings        | `reviews`                | Numérico 1-5    | CF + CB                |
| Historial de interacciones  | `user_interactions`      | Secuencial      | CF implícito           |
| Atributos del restaurante   | `restaurants`            | Mixto           | CB                     |
| Platos del restaurante      | `dishes`                 | Texto + numérico| CB (TF-IDF)            |
| Tipo de cocina              | `cuisine_types`          | Categórico      | CB                     |
| Ambiente                    | `ambiances`              | Categórico      | CB + Contexto          |
| Servicios                   | `restaurant_service`     | Binario         | CB                     |
| Horarios                    | `restaurant_schedules`   | Temporal        | Filtro de contexto     |
| Geolocalización             | `restaurants.lat/lng`    | Numérico        | Contexto               |
| Contexto de solicitud       | `recommendation_requests`| Mixto           | Contexto               |

#### Análisis de sparsity (problema Cold Start)

```
Matriz Usuario × Restaurante:
  ┌─────────────────────────────────────────┐
  │         R1   R2   R3   R4   R5  ...  Rn │
  │  U1 [   5    -    -    3    -   ...   -  ]
  │  U2 [   -    4    -    -    5   ...   -  ]
  │  U3 [   -    -    2    -    -   ...   4  ]
  │  ...                                     │
  │  Um [   -    3    -    -    -   ...   -  ]
  └─────────────────────────────────────────┘
  - = Sin rating (sparse)

Cold Start → solución con CB puro hasta acumular ≥ 3 interacciones
```

---

### FASE 3 — Preparación de los Datos

#### Pipeline de preprocesamiento

```
RAW DATA (MySQL)
     │
     ▼
┌─────────────────────────────────────────────────────────┐
│  EXTRACCIÓN                                             │
│  - Query a user_interactions (últimos 180 días)         │
│  - Query a reviews (ratings explícitos)                 │
│  - Query a restaurants + attributes                     │
│  - Query a recommendation_requests + contexto           │
└──────────────────────────┬──────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────┐
│  LIMPIEZA                                               │
│  - Eliminar duplicados en interacciones                 │
│  - Normalizar ratings implícitos a escala 1-5           │
│  - Imputar valores nulos en atributos de restaurante    │
│  - Filtrar restaurantes inactivos o sin verificar       │
└──────────────────────────┬──────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────┐
│  TRANSFORMACIÓN                                         │
│  - One-Hot Encoding: cuisine_type, ambiance, price_range│
│  - TF-IDF: descripción + platos del restaurante         │
│  - Normalización geoespacial: distancia Haversine       │
│  - Ponderación de interacciones implícitas (ver tabla)  │
│  - Creación de matriz usuario-ítem                      │
└──────────────────────────┬──────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────┐
│  FEATURE ENGINEERING                                    │
│  - user_vector: embedding de perfil + historial         │
│  - item_vector: embedding de atributos del restaurante  │
│  - context_vector: presupuesto + hora + distancia       │
│  - popularity_score: vistas + ratings ponderados        │
└──────────────────────────┬──────────────────────────────┘
                           ▼
              Dataset listo para modelado
```

#### Tabla de ponderación de interacciones implícitas

| Tipo de interacción         | Peso (confidence) | Justificación                           |
|-----------------------------|-------------------|-----------------------------------------|
| `visit`                     | 5.0               | Máxima señal: el turista fue al local   |
| `recommendation_accepted`   | 4.0               | Aceptó activamente la recomendación     |
| `save`                      | 3.5               | Guardó para luego → alta intención      |
| `click`                     | 2.5               | Interés demostrado                      |
| `view` (> 30 segs)          | 1.5               | Vista prolongada = interés              |
| `view` (≤ 30 segs)          | 0.5               | Vista rápida = interés bajo             |
| `recommendation_rejected`   | -2.0              | Señal negativa explícita                |
| `search` (coincide con restaurante) | 1.0     | Búsqueda relacionada                    |

---

### FASE 4 — Modelado

## 2.1 Componente A: Filtrado Basado en Contenido (CB)

**Algoritmo:** Similitud del Coseno sobre vectores TF-IDF + One-Hot

```python
# Pseudocódigo
item_features = [
    cuisine_type_onehot,       # [1, 0, 0, 1, ...]
    ambiance_onehot,           # [0, 1, 0, ...]
    price_range_onehot,        # [1, 0, 0]
    services_binary,           # [1, 1, 0, 1, ...]
    tfidf_description,         # vector de texto
    tfidf_dishes,              # vector de platos del menú
    avg_rating_normalized,     # [0.0 - 1.0]
]

user_profile_vector = weighted_avg(
    item_features[restaurantes_con_interaccion],
    weights=interaction_confidence
)

cb_score(u, r) = cosine_similarity(user_profile_vector, item_features[r])
```

**Ventaja:** Funciona desde el primer día (no necesita historial).
**Limitación:** Sobrespecialización (recommends siempre lo mismo).

---

## 2.2 Componente B: Filtrado Colaborativo (CF)

**Algoritmo:** SVD (Singular Value Decomposition) — implementado con `Surprise` library

```
Matriz R (usuarios × restaurantes):
- Ratings explícitos de reviews (1-5)
- Ratings implícitos de interacciones (ponderados)

SVD descompone R ≈ U · Σ · Vᵀ
donde:
  U = matriz de factores latentes de usuarios (k dimensiones)
  V = matriz de factores latentes de restaurantes (k dimensiones)
  k = 50 (hiperparámetro, ajustable)

cf_score(u, r) = U[u] · V[r]ᵀ   (producto punto = rating predicho)
```

**Alternativa cuando hay pocos datos (< 50 usuarios):**
KNN colaborativo (similitud entre usuarios o entre ítems).

**Ventaja:** Descubre patrones ocultos entre usuarios similares.
**Limitación:** Cold start para nuevos usuarios/restaurantes.

---

## 2.3 Componente C: Sensible al Contexto (CAR)

**No es un algoritmo separado — es una capa de boosting/filtrado post-scoring.**

```python
def apply_context_boost(scores, context, restaurants):
    for r in restaurants:
        boost = 1.0  # factor neutro

        # Disponibilidad horaria
        if not is_open_now(r, context.time_slot):
            scores[r] = 0  # filtro duro: no recomendar cerrados

        # Proximidad geoespacial
        dist_km = haversine(context.lat, context.lng, r.lat, r.lng)
        if dist_km > context.max_distance_km:
            scores[r] *= 0.1  # penalización fuerte por distancia
        else:
            proximity_boost = 1 - (dist_km / context.max_distance_km)
            boost *= (1 + 0.3 * proximity_boost)

        # Presupuesto compatible
        if r.price_range == context.budget:
            boost *= 1.4
        elif price_distance(r.price_range, context.budget) == 1:
            boost *= 0.8
        else:
            boost *= 0.3  # precio muy lejano al presupuesto

        # Tipo de salida / ambiente
        if context.party_type == 'familia' and r.ambiance == 'familiar':
            boost *= 1.3
        elif context.party_type == 'pareja' and r.ambiance == 'romantico':
            boost *= 1.3

        # Franja horaria → platos disponibles
        if context.time_slot == 'desayuno' and r.has_breakfast_menu:
            boost *= 1.2

        # Promociones activas
        if r.has_active_promotion:
            boost *= 1.15

        scores[r] *= boost

    return scores
```

---

## 2.4 Combinador Híbrido — Fusión Ponderada

```python
def hybrid_score(u, r, context, alpha, beta, gamma):
    """
    alpha = peso del CB   (contenido)
    beta  = peso del CF   (colaborativo)
    gamma = peso del CAR  (contexto) → aplicado como multiplicador

    Los pesos se ajustan dinámicamente según la cantidad de datos:
    """

    # Estrategia adaptativa de pesos según madurez del usuario
    n_interactions = count_interactions(u)

    if n_interactions < 3:
        # Cold Start: solo contenido
        alpha, beta = 0.95, 0.05
    elif n_interactions < 20:
        # Usuario nuevo: mayormente contenido
        alpha, beta = 0.70, 0.30
    elif n_interactions < 100:
        # Usuario activo: equilibrado
        alpha, beta = 0.45, 0.55
    else:
        # Usuario recurrente: más colaborativo
        alpha, beta = 0.30, 0.70

    base_score = alpha * cb_score(u, r) + beta * cf_score(u, r)
    final_score = apply_context_boost(base_score, context, r)

    return final_score


# Resultado: top-N restaurantes ordenados por final_score
recommendations = sorted(all_restaurants, key=lambda r: hybrid_score(u, r, ctx), reverse=True)[:10]
```

---

### FASE 5 — Evaluación del Modelo

#### Protocolo de evaluación

```
Dataset dividido:
  ├── 70% Training set
  ├── 15% Validation set (ajuste de hiperparámetros)
  └── 15% Test set (evaluación final — nunca se toca hasta el final)

Método: Leave-One-Out Cross Validation (LOOCV) para usuarios con ≥ 3 ratings
```

#### Métricas de evaluación implementadas

```python
# Precision@K: ¿cuántas de las K recomendadas son relevantes?
Precision@10 = (restaurantes_relevantes_en_top10) / 10

# Recall@K: ¿qué porción de los relevantes aparecen en las K primeras?
Recall@10 = (restaurantes_relevantes_en_top10) / total_relevantes_del_usuario

# NDCG@K: considera la posición — mejor si el más relevante aparece primero
NDCG@10 = DCG@10 / IDCG@10

# MAE: error promedio en predicción de rating
MAE = (1/N) * Σ|r_real - r_predicho|

# Cobertura: qué % del catálogo puede ser recomendado a alguien
Coverage = (restaurantes_recomendados_al_menos_1_vez) / total_restaurantes
```

#### Criterio de "relevante" para las métricas

Un restaurante es **relevante** para un usuario si:
- Rating ≥ 4 estrellas en `reviews`, O
- `interaction_type` IN ('visit', 'recommendation_accepted', 'save')

---

### FASE 6 — Despliegue

#### Estrategia de reentrenamiento

| Trigger                        | Acción                                  | Frecuencia       |
|--------------------------------|-----------------------------------------|------------------|
| Nuevos ratings acumulados ≥ 50 | Reentrenar modelo CF incremental        | Automático       |
| Nuevo restaurante registrado   | Recalcular vectores CB                  | Al verificar     |
| Cambio en menú de restaurante  | Actualizar item_vector del restaurante  | Al guardar plato |
| Reentrenamiento completo       | Retraining full + evaluación            | Semanal (cron)   |

---

## 3. TECNOLOGÍAS DEL MICROSERVICIO IA

### Stack Python

```
fastapi          ← API REST del microservicio
uvicorn          ← Servidor ASGI
scikit-surprise  ← SVD, KNN colaborativo
scikit-learn     ← TF-IDF, cosine_similarity, preprocessing
pandas           ← Manipulación de datos
numpy            ← Álgebra lineal
SQLAlchemy       ← Acceso a MySQL (misma BD de Laravel)
joblib           ← Serialización/deserialización del modelo entrenado
redis            ← Caché de recomendaciones generadas
python-dotenv    ← Variables de entorno
pydantic         ← Validación de schemas del API
```

### Estructura de carpetas del microservicio

```
ml_service/
├── main.py                    ← Punto de entrada FastAPI
├── requirements.txt
├── .env
│
├── app/
│   ├── api/
│   │   └── v1/
│   │       └── recommend.py   ← Endpoints
│   │
│   ├── core/
│   │   ├── config.py
│   │   └── database.py        ← Conexión SQLAlchemy → MySQL
│   │
│   ├── models/                ← Schemas Pydantic (request/response)
│   │   ├── request.py
│   │   └── response.py
│   │
│   ├── recommender/
│   │   ├── content_based.py   ← Componente CB
│   │   ├── collaborative.py   ← Componente CF (SVD)
│   │   ├── context.py         ← Capa de contexto / boosting
│   │   ├── hybrid.py          ← Combinador ponderado
│   │   └── trainer.py         ← Lógica de entrenamiento
│   │
│   ├── preprocessing/
│   │   ├── extractor.py       ← Queries a MySQL
│   │   ├── cleaner.py         ← Limpieza y normalización
│   │   └── features.py        ← Feature engineering
│   │
│   └── utils/
│       ├── haversine.py       ← Cálculo de distancia geoespacial
│       ├── cache.py           ← Redis cache helper
│       └── metrics.py         ← Cálculo de Precision@K, NDCG, etc.
│
├── models_saved/              ← Modelos serializados con joblib
│   ├── svd_model.pkl
│   ├── tfidf_vectorizer.pkl
│   ├── item_matrix.pkl
│   └── model_metadata.json    ← Versión, fecha, métricas del modelo
│
└── scripts/
    ├── train.py               ← Script de entrenamiento manual
    └── evaluate.py            ← Script de evaluación
```

---

## 4. API DEL MICROSERVICIO (Contratos)

### POST `/api/v1/recommend`
> Laravel llama a este endpoint para obtener las recomendaciones.

**Request body:**
```json
{
  "user_id": 42,
  "context": {
    "latitude": -6.7714,
    "longitude": -79.8409,
    "budget": "moderado",
    "party_type": "familia",
    "time_slot": "almuerzo",
    "max_distance_km": 5.0,
    "cuisine_type_id": 3,
    "ambiance_id": 1,
    "motive": "gastronomico"
  },
  "top_n": 10,
  "exclude_restaurant_ids": [15, 23]
}
```

**Response body:**
```json
{
  "request_id": "uuid-xxxx",
  "user_id": 42,
  "algorithm": "hybrid",
  "recommendations": [
    {
      "restaurant_id": 7,
      "rank": 1,
      "score": 0.923145,
      "content_score": 0.891200,
      "collaborative_score": 0.945000,
      "context_score": 0.980000,
      "distance_km": 1.2,
      "is_open_now": true
    },
    {
      "restaurant_id": 12,
      "rank": 2,
      "score": 0.871200,
      ...
    }
  ],
  "cold_start": false,
  "model_version": "1.3.0",
  "generated_at": "2026-05-03T16:30:00Z"
}
```

---

### POST `/api/v1/feedback`
> Laravel notifica al microservicio cuando el usuario acepta/rechaza una recomendación.
> Actualiza el modelo online (sin necesidad de reentrenar).

**Request body:**
```json
{
  "user_id": 42,
  "restaurant_id": 7,
  "interaction_type": "recommendation_accepted",
  "context": { ... }
}
```

---

### GET `/api/v1/health`
> Verifica que el microservicio esté vivo y el modelo cargado.

**Response:**
```json
{
  "status": "ok",
  "model_loaded": true,
  "model_version": "1.3.0",
  "last_trained_at": "2026-05-02T03:00:00Z",
  "total_users": 1243,
  "total_restaurants": 87
}
```

---

### POST `/api/v1/train`
> Dispara el reentrenamiento del modelo (protegido con API key interna).

---

## 5. INTEGRACIÓN LARAVEL → MICROSERVICIO IA

### Servicio PHP en Laravel

```
app/
└── Services/
    └── RecommendationService.php
```

**Flujo en Laravel:**

```
RecommendationController
       │
       ▼
RecommendationService::getRecommendations($user, $context)
       │
       ├─ Construye el payload con datos del usuario y contexto
       ├─ Verifica en caché Redis (TTL: 10 min)
       │
       ├─ [Si no está en caché]
       │       └─ HTTP POST → ml_service/api/v1/recommend
       │               └─ Recibe JSON con scores
       │
       ├─ Guarda en recommendation_requests + recommendations (BD)
       ├─ Guarda en caché Redis
       │
       └─ Enriquece con datos completos de restaurants (Eloquent)
              └─ Retorna colección para la vista/API
```

---

## 6. ESTRATEGIA COLD START

> El Cold Start es el mayor desafío cuando la plataforma es nueva o para un usuario nuevo.

### Usuarios nuevos (sin historial)

```
IF interacciones_del_usuario < 3:
    → Usar SOLO Filtrado Basado en Contenido
    → Basado en: preferencias declaradas al registrarse
                 + perfil demográfico (nationality, age_range, tourist_type)
                 + contexto actual (location, budget, time_slot)

IF interacciones_del_usuario == 0 Y sin_preferencias_declaradas:
    → Mostrar "Populares en Lambayeque"
    → Ordenados por: avg_rating DESC, total_reviews DESC, is_featured DESC
    → Filtrados por: horario_actual, distancia_del_usuario
```

### Restaurantes nuevos (sin ratings)

```
IF total_reviews_del_restaurante < 5:
    → No aparece en filtrado colaborativo
    → Solo aparece en filtrado por contenido y popularidad
    → Se marca con badge "Nuevo" en la UI

IF restaurante.is_featured == true:
    → Boost adicional de +20% en el score final (promoción del admin)
```

---

## 7. DIAGRAMA DE FLUJO COMPLETO DE UNA RECOMENDACIÓN

```
Turista abre la app
        │
        ▼
¿Está autenticado? ──No──▶ Recomendaciones populares (sin personalizar)
        │ Sí
        ▼
Laravel recoge contexto:
  - GPS actual
  - Preferencias del perfil
  - Hora actual → time_slot
        │
        ▼
¿Está en caché Redis? ──Sí──▶ Devuelve caché (< 10 min)
        │ No
        ▼
Llama a microservicio FastAPI
        │
        ▼
    [Microservicio]
        │
        ├── EXTRACCIÓN: datos del usuario, interacciones, restaurantes activos
        │
        ├── ¿Tiene ≥ 3 interacciones?
        │       ├── Sí → Calcular CF score (SVD)
        │       └── No → CF score = 0
        │
        ├── Calcular CB score (cosine similarity de vectores)
        │
        ├── Combinar: α·CB + β·CF (pesos adaptativos)
        │
        ├── Aplicar Context Boost:
        │       ├── Filtro duro: ¿está abierto ahora?
        │       ├── Boost por proximidad GPS
        │       ├── Boost por presupuesto compatible
        │       ├── Boost por ambiente y tipo de salida
        │       └── Boost por promociones activas
        │
        ├── Ordenar por score final DESC
        │
        └── Retornar top-10 con scores desglosados
        │
        ▼
Laravel guarda en:
  - recommendation_requests (contexto)
  - recommendations (scores + ranking)
        │
        ▼
Laravel enriquece con datos completos (nombre, fotos, horario, dirección)
        │
        ▼
Guarda en Redis (TTL: 10 min)
        │
        ▼
Responde al turista con la lista personalizada
```

---

## 8. REENTRENAMIENTO SEMANAL (Cron)

### Proceso automatizado (Laravel Scheduler → llama al script Python)

```
Domingo 03:00 AM → artisan schedule:run
        │
        ▼
RetrainModelJob (Laravel Queue Job)
        │
        ├── POST ml_service/api/v1/train  (con API key)
        │
        ▼
    [Script Python: train.py]
        │
        ├── Extrae datos de los últimos 180 días
        ├── Limpia y transforma
        ├── Entrena SVD con nuevos datos
        ├── Evalúa: Precision@10, NDCG@10, MAE
        │
        ├── ¿Precisión >= 80%?
        │       ├── Sí → Guarda nuevo modelo en models_saved/
        │       │         Actualiza model_metadata.json
        │       │         Activa nuevo modelo
        │       └── No → Mantiene modelo anterior
        │                 Envía alerta al admin
        │
        └── Registra métricas en logs
```

---

## 9. VARIABLES DEL MODELO (Resumen Tesis — Objetivo 01)

> Mínimo requerido: ≥ 8 variables. El modelo usa **12 variables**.

| # | Variable                     | Tipo          | Componente que la usa      |
|---|------------------------------|---------------|----------------------------|
| 1 | Tipo de cocina preferida     | Categórico    | CB + Contexto              |
| 2 | Rango de precio / presupuesto| Categórico    | CB + Contexto              |
| 3 | Proximidad geoespacial (km)  | Numérico      | Contexto (boost)           |
| 4 | Ambiente del restaurante     | Categórico    | CB + Contexto              |
| 5 | Tipo de salida               | Categórico    | Contexto (boost)           |
| 6 | Ratings explícitos (1-5)     | Numérico      | CF (SVD)                   |
| 7 | Interacciones implícitas     | Ordinal/peso  | CF implícito               |
| 8 | Franja horaria               | Categórico    | Contexto (filtro duro)     |
| 9 | Servicios ofrecidos          | Binario       | CB                         |
|10 | Tipo de turista              | Categórico    | Demográfico (CB inicial)   |
|11 | Restricción dietética        | Categórico    | CB (filtro)                |
|12 | Descripción + platos (texto) | TF-IDF        | CB (similitud semántica)   |

---

## 10. NOTAS FINALES DE IMPLEMENTACIÓN

1. **El microservicio Python lee directamente la misma base de datos MySQL** de Laravel. No hay duplicación de datos.
2. **Redis** se usa como caché compartida entre Laravel y Python para evitar llamadas repetidas.
3. **Los scores se guardan en la BD** (`recommendations` table) para auditoría, mejora del modelo y evaluación TAM.
4. **El microservicio NO gestiona autenticación de usuarios** — eso es responsabilidad de Laravel. Solo recibe `user_id` confiable.
5. **Cold Start para plataforma nueva:** En la fase inicial (Sprint 3 del Scrum), el sistema funcionará 100% con Filtrado por Contenido y datos de restaurantes reales. El CF se activará progresivamente conforme se acumulen interacciones.
6. **El modelo puede mejorar pasivamente:** cada visita, click y valoración que registra Laravel automáticamente mejora el modelo en el siguiente reentrenamiento, sin intervención manual.
