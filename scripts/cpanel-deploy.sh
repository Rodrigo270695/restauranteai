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
npm install --include=dev 

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

GALLERY_JS=$(grep -l 'Eliminar foto' public/build/assets/*.js 2>/dev/null | head -1 || true)
if [ -n "$GALLERY_JS" ]; then
  if grep -q '/unlink' "$GALLERY_JS"; then
    echo "OK: JS de galería usa /unlink ($GALLERY_JS)"
  else
    echo "AVISO: JS de galería sin /unlink ($GALLERY_JS). Backend acepta POST .../gallery/{id} con _method=delete."
  fi
fi

echo "==> Sincronizando build al document root..."
DOCROOT_BUILD="${DEPLOY_DOCROOT_BUILD:-$HOME/miskigo.gostudio.pe/build}"
rsync -av --delete public/build/ "${DOCROOT_BUILD}/"

echo "==> Verificando assets del manifest en document root..."
php -r "
\$manifest = json_decode(file_get_contents('public/build/manifest.json'), true);
\$docroot = getenv('DEPLOY_DOCROOT_BUILD') ?: (getenv('HOME') . '/miskigo.gostudio.pe/build');
\$missing = [];
foreach (\$manifest as \$entry) {
    if (! isset(\$entry['file'])) {
        continue;
    }
    \$path = \$docroot . '/' . \$entry['file'];
    if (! is_file(\$path)) {
        \$missing[] = \$entry['file'];
    }
}
if (\$missing !== []) {
    fwrite(STDERR, \"ERROR: Faltan archivos en {\$docroot}:\\n\");
    foreach (\$missing as \$file) {
        fwrite(STDERR, \"  - {\$file}\\n\");
    }
    exit(1);
}
echo \"OK: \" . count(\$manifest) . \" entradas del manifest presentes en {\$docroot}\\n\";
"

echo "==> Verificando rutas de galería..."
php artisan route:list --name=gallery.destroy.post | grep -F 'gallery.destroy.post' || {
  echo "ERROR: Falta la ruta POST app/gallery/{image} (gallery.destroy.post)."
  exit 1
}

echo "==> Cache de configuración..."
php artisan config:cache

if php -r "exit(function_exists('opcache_reset') ? 0 : 1);" 2>/dev/null; then
  php -r "if (function_exists('opcache_reset')) { opcache_reset(); echo 'OPcache reiniciado'.PHP_EOL; }"
fi

echo ""
echo "==> Verificación de despliegue..."
php artisan app:deploy-check

echo ""
echo "Listo. IMPORTANTE: ve a cPanel → Setup Node.js App → DETENER APLICACIÓN"
echo "Luego recarga con Ctrl+Shift+R y prueba eliminar una foto."
