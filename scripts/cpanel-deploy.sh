#!/bin/bash
# Despliegue frontend + cache en cPanel (ejecutar desde ~/repositories/restauranteai)
set -e

cd "$(dirname "$0")/.."

echo "==> Limpiando cachés Laravel y archivo hot de Vite..."
rm -f public/hot
php artisan optimize:clear

echo "==> Activando Node (ajusta la ruta si cambió en Setup Node.js App)..."
if [ -f "/home/gostudio/nodevenv/repositories/restauranteai/20/bin/activate" ]; then
  # shellcheck disable=SC1091
  source /home/gostudio/nodevenv/repositories/restauranteai/20/bin/activate
else
  echo "ERROR: No se encontró el venv de Node. Copia el comando 'source ...' desde cPanel → Setup Node.js App."
  exit 1
fi

echo "==> Instalando dependencias (incluye dev, ver .npmrc)..."
rm -rf node_modules
npm install

echo "==> Compilando assets..."
npm run build

if [ ! -f public/build/manifest.json ]; then
  echo "ERROR: public/build/manifest.json no existe. El build falló."
  exit 1
fi

echo "==> Sincronizando build al document root..."
rsync -av --delete public/build/ ~/miskigo.gostudio.pe/build/

echo "==> Cache de configuración..."
php artisan config:cache
php artisan route:clear

echo ""
echo "Listo. IMPORTANTE: ve a cPanel → Setup Node.js App → DETENER APLICACIÓN"
echo "Luego prueba la galería en el navegador."
