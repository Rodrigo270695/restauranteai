#!/bin/bash
# Despliegue frontend + cache en cPanel (ejecutar desde ~/repositories/restauranteai)
set -e

cd "$(dirname "$0")/.."

echo "==> Actualizando código..."
git pull --ff-only

echo "==> Limpiando cachés Laravel y archivo hot de Vite..."
rm -f public/hot
php artisan optimize:clear
php artisan route:clear

echo "==> Activando Node (ajusta la ruta si cambió en Setup Node.js App)..."
if [ -f "/home/gostudio/nodevenv/repositories/restauranteai/20/bin/activate" ]; then
  # shellcheck disable=SC1091
  source /home/gostudio/nodevenv/repositories/restauranteai/20/bin/activate
else
  echo "ERROR: No se encontró el venv de Node. Copia el comando 'source ...' desde cPanel → Setup Node.js App."
  exit 1
fi

echo "==> Instalando dependencias npm (incluye dev por si acaso)..."
rm -rf node_modules
export NODE_ENV=development
npm install --include=dev --no-audit --no-fund

if [ ! -d node_modules/@laravel/vite-plugin-wayfinder ]; then
  echo "ERROR: Falta @laravel/vite-plugin-wayfinder. Revisa package.json y vuelve a instalar."
  exit 1
fi

echo "==> Compilando assets..."
npm run build

if [ ! -f public/build/manifest.json ]; then
  echo "ERROR: public/build/manifest.json no existe. El build falló."
  exit 1
fi

if grep -rE 'gallery[^"]*/(delete|remove)"' public/build/assets/*.js 2>/dev/null; then
  echo "ERROR: El build JS aún usa rutas /delete o /remove en galería. Abortando despliegue."
  exit 1
fi

echo "==> Sincronizando build al document root..."
rsync -av --delete public/build/ ~/miskigo.gostudio.pe/build/

echo "==> Verificando rutas de galería..."
php artisan route:list --name=gallery.unlink | grep -F 'gallery.unlink' || {
  echo "ERROR: No existe la ruta app.admin.restaurants.manage.gallery.unlink. ¿git pull completo?"
  exit 1
}

echo "==> Cache de configuración..."
php artisan config:cache

echo ""
echo "Listo. IMPORTANTE: ve a cPanel → Setup Node.js App → DETENER APLICACIÓN"
echo "Luego recarga con Ctrl+Shift+R y prueba eliminar una foto."
