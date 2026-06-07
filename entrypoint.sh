#!/bin/bash
set -e

# Copy environment config
if [ ! -f /configs/.env ]; then
    echo "ERROR: /configs/.env not found!"
    echo "Please ensure the .env file exists in the mounted configs directory."
    echo "For staging/production, copy .env.example to .env and configure it."
    exit 1
fi

cp /configs/.env .env
. .env
echo "Starting $APP_NAME"

# Wait for MySQL to be ready
echo "Waiting for MySQL..."
until php artisan db:show &>/dev/null; do
  echo "MySQL is unavailable - sleeping"
  sleep 2
done
echo "MySQL is up - continuing"

# Run migrations and optimizations
# php artisan migrate --seed
php artisan lighthouse:clear-cache
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Start queue worker in background
php artisan queue:work &

# Start Laravel server
php artisan serve --host=0.0.0.0
