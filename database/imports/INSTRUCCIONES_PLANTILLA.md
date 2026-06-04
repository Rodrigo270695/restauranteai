# Plantilla de importación — Restaurantes Lambayeque

## Archivo recomendado (Excel con listas)

**`restaurantes_lambayeque_plantilla.xlsx`**

- Hoja **Restaurantes**: copia y pega tus datos (120 filas listas).
- Hoja **Catalogos**: opciones para listas desplegables (no borrar).
- Hoja **Instrucciones**: resumen rápido.

### Regenerar el Excel

```powershell
py -3 database/imports/generar_plantilla_excel.py
```

(Requiere `pip install openpyxl` una sola vez.)

---

## Alternativa CSV

Archivo: **`plantilla_restaurantes.csv`**

1. Abre en Excel o importa en Google Sheets.
2. Rellena **una fila por restaurante**.
3. Guarda como CSV UTF-8.
4. Importación:

```powershell
php artisan db:seed

php artisan restaurants:import "database/imports/restaurantes dataset.xlsx"
```

Opciones útiles:

- `--dry-run` — valida sin guardar
- `--owner=tu@email.com` — usuario dueño de los locales
- `--strict` — detiene al primer error

También acepta `plantilla_restaurantes.csv` o `restaurantes_lambayeque_plantilla.xlsx`.

---

## Columnas (orden fijo)

| Columna | Obligatorio | Ejemplo | Notas |
|---------|-------------|---------|-------|
| `nombre` | Sí | Urumanka Barra Restaurante | Nombre comercial |
| `especialidad_gastronomica` | Sí | Criolla | Cocina principal (catálogo o texto nuevo) |
| `categoria_establecimiento` | No | Restaurante tradicional | Solo referencia; hoy no hay campo en BD |
| `entorno_restaurante` | Recomendado | Urbano | Urbano, Campestre, Centro historico, Vista al mar, Centro comercial |
| `ambiente_restaurante` | Recomendado | Elegante | Casual, Elegante, Moderno, Tradicional, Familiar, Romantico, Cultural, Festivo, Tranquilo |
| `rango_precios` | Sí | moderado | Solo: `economico`, `moderado`, `caro` (minúsculas, sin tildes) |
| `momento_recomendado` | Recomendado | Almuerzo | Varios: `Desayuno\|Almuerzo\|Cena\|Brunch\|Bar` |
| `servicios` | No | WiFi\|Reservas\|Delivery | Separar con **\|** (barra vertical) |
| `ubicacion` | Sí | Chiclayo | Distrito: Chiclayo, Lambayeque, Pimentel, La Victoria, etc. |
| `publico_objetivo` | No | Turistas\|Familias | Separar con **\|** |
| `dias` | Recomendado | lun-dom | `lun-dom` = todos los días; o `lun,mie,vie` |
| `hora_apertura` | Recomendado | 07:00 | Formato 24 h `HH:MM` |
| `hora_cierre` | Recomendado | 21:00 | Si cierra después de medianoche: `01:00` |
| `direccion` | No | Av. Balta 512 | Texto libre |
| `latitud` | Muy recomendado | -6.77137 | Decimal (mapa, rutas IA, cercanos) |
| `longitud` | Muy recomendado | -79.84088 | Decimal |
| `descripcion_corta` | No | Mariscos frescos… | Máx. ~500 caracteres |
| `telefono` | No | +51987654321 | Con código país |

---

## Reglas rápidas

- **No cambies** los nombres de la primera fila (cabeceras).
- **Varios valores** en la misma celda: usa `|` (ej. `WiFi|Reservas|Delivery`).
- **Precios**: escribe exactamente `economico`, `moderado` o `caro`.
- **Ubicación** debe coincidir con un distrito ya cargado (geografía Lambayeque).
- Sin **latitud/longitud** el local no aparece bien en mapa ni en rutas con IA.
- Evita comas dentro de un campo; si necesitas coma, encierra el texto entre comillas `"..."`.

---

## Equivalencia con tu Google Sheet

| Tu columna en Sheets | Columna en plantilla |
|----------------------|----------------------|
| Nombre del restaurante | `nombre` |
| Especialidad gastronómica | `especialidad_gastronomica` |
| Categoría del establecimiento | `categoria_establecimiento` |
| Entorno del restaurante | `entorno_restaurante` |
| Ambiente del restaurante | `ambiente_restaurante` |
| Rango de precios | `rango_precios` |
| Momento recomendado | `momento_recomendado` |
| Servicios ofrecidos | `servicios` (reemplaza " y " por `\|`) |
| Ubicación | `ubicacion` |
| Publico Objetivo | `publico_objetivo` |
| Días | `dias` → usa `lun-dom` si es "Lunes a Domingo" |
| Hora de apertura | `hora_apertura` |
| Hora de cierre | `hora_cierre` |

Columnas extra en la plantilla (útiles para la app): `direccion`, `latitud`, `longitud`, `descripcion_corta`, `telefono`.
