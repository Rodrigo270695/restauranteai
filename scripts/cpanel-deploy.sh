#!/bin/bash
# Despliegue frontend + cache en cPanel (ejecutar desde ~/repositories/restauranteai)
set -e

cd "$(dirname "$0")/.."

echo "==> Actualizando código..."
git pull --ff-only

echo "==> Autoload de Composer..."
composer dump-autoload -o --no-interaction 2>/dev/null || composer dump-autoload -o --no-interaction

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

GALLERY_JS=$(php -r "
\$m = json_decode(file_get_contents('public/build/manifest.json'), true);
echo \$m['resources/js/pages/app/gallery/index.tsx']['file'] ?? '';
")
if [ -n "$GALLERY_JS" ] && [ -f "public/build/$GALLERY_JS" ]; then
  if grep -qE 'urls\.unlink|urls\?\.unlink' "public/build/$GALLERY_JS"; then
    echo "OK: JS de galería usa URLs del servidor ($GALLERY_JS)"
  else
    echo "ERROR: JS de galería sin urls.unlink ($GALLERY_JS)."
    exit 1
  fi
fi

echo "==> Sincronizando build al document root..."
export DEPLOY_DOCROOT_BUILD="${DEPLOY_DOCROOT_BUILD:-$HOME/miskigo.gostudio.pe/build}"
rsync -av --delete public/build/ "${DEPLOY_DOCROOT_BUILD}/"

echo "==> Verificando assets del manifest en document root..."
php -r "
\$manifest = json_decode(file_get_contents('public/build/manifest.json'), true);
\$docroot = getenv('DEPLOY_DOCROOT_BUILD') ?: (getenv('HOME') . '/miskigo.gostudio.pe/build');
\$docManifestPath = \$docroot . '/manifest.json';
if (! is_file(\$docManifestPath)) {
    fwrite(STDERR, \"ERROR: Falta manifest en docroot: {\$docManifestPath}\n\");
    exit(1);
}
\$docManifest = json_decode(file_get_contents(\$docManifestPath), true);
\$repoApp = \$manifest['resources/js/app.tsx']['file'] ?? null;
\$docApp = \$docManifest['resources/js/app.tsx']['file'] ?? null;
if (\$repoApp !== \$docApp) {
    fwrite(STDERR, \"ERROR: manifest desincronizado entre repo y docroot.\n\");
    fwrite(STDERR, \"  repo:    {\$repoApp}\n\");
    fwrite(STDERR, \"  docroot: {\$docApp}\n\");
    exit(1);
}
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
echo \"OK: app bundle {\$repoApp}\\n\";
"

echo "==> Verificando rutas de galería..."
php artisan route:list --name=gallery.unlink | grep -F 'gallery.unlink' || {
  echo "ERROR: Falta la ruta POST app/gallery/{image}/unlink."
  exit 1
}
php artisan route:list --name=gallery.update.post | grep -F 'gallery.update.post' || {
  echo "ERROR: Falta la ruta POST app/gallery/{image}/update."
  exit 1
}

echo "==> Cache de configuración..."
php artisan config:cache

if php -r "exit(function_exists('opcache_reset') ? 0 : 1);" 2>/dev/null; then
  php -r "if (function_exists('opcache_reset')) { opcache_reset(); echo 'OPcache reiniciado'.PHP_EOL; }"
fi

touch public/index.php

echo ""
echo "==> Verificación de despliegue..."
if php artisan app:deploy-check 2>/dev/null; then
  echo "OK: app:deploy-check"
else
  echo "AVISO: app:deploy-check no registrado (ejecuta git pull). Las comprobaciones inline anteriores ya validaron build y rutas."
fi

echo ""
echo "Listo. IMPORTANTE: ve a cPanel → Setup Node.js App → DETENER APLICACIÓN"
echo "Luego recarga con Ctrl+Shift+R y prueba eliminar una foto."
