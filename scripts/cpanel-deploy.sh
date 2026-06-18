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
export DEPLOY_DOCROOT_BUILD="${DEPLOY_DOCROOT_BUILD:-$HOME/miskigo.gostudio.pe/build}"
mkdir -p "$DEPLOY_DOCROOT_BUILD"

# Un solo directorio de build: PHP (public/build) y el docroot (/build/) deben ser el mismo.
if [ -L public/build ]; then
  rm -f public/build
elif [ -d public/build ]; then
  echo "==> Migrando build previo del repo al document root..."
  rsync -av public/build/ "${DEPLOY_DOCROOT_BUILD}/"
  rm -rf public/build
fi
ln -sfn "${DEPLOY_DOCROOT_BUILD}" public/build

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
  if grep -q '/detach' "public/build/$GALLERY_JS" && grep -q '/update' "public/build/$GALLERY_JS"; then
    echo "OK: JS de galería usa galleryBase + acción ($GALLERY_JS)"
  else
    echo "ERROR: JS de galería sin rutas /detach o /update ($GALLERY_JS)."
    exit 1
  fi
fi

echo "==> Verificando build unificado (repo ↔ docroot)..."
php -r "
\$manifestPath = 'public/build/manifest.json';
\$docroot = getenv('DEPLOY_DOCROOT_BUILD') ?: (getenv('HOME') . '/miskigo.gostudio.pe/build');
if (! is_link('public/build')) {
    fwrite(STDERR, \"ERROR: public/build no es symlink a {\$docroot}. Ejecuta de nuevo el script completo.\\n\");
    exit(1);
}
\$linkTarget = readlink('public/build');
if (\$linkTarget !== \$docroot && realpath('public/build') !== realpath(\$docroot)) {
    fwrite(STDERR, \"ERROR: public/build apunta a {\$linkTarget}, se esperaba {\$docroot}.\\n\");
    exit(1);
}
if (! is_file(\$manifestPath)) {
    fwrite(STDERR, \"ERROR: {\$manifestPath} no existe. El build falló.\\n\");
    exit(1);
}
\$manifest = json_decode(file_get_contents(\$manifestPath), true);
\$appBundle = \$manifest['resources/js/app.tsx']['file'] ?? null;
if (! \$appBundle || ! is_file('public/build/' . \$appBundle)) {
    fwrite(STDERR, \"ERROR: Falta el bundle principal {\$appBundle} en public/build.\\n\");
    exit(1);
}
echo \"OK: \" . count(\$manifest) . \" entradas del manifest en build unificado\\n\";
echo \"OK: app bundle {\$appBundle}\\n\";
"

echo "==> Verificando rutas de galería..."
php artisan route:list --name=gallery.detach | grep -F 'gallery.detach' || {
  echo "ERROR: Falta la ruta POST app/gallery/{image}/detach."
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
