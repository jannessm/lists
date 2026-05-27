#!/bin/bash
set -e

# Copy environment config
if [ ! -f /configs/.env ]; then
    echo "ERROR: /configs/.env not found!"
    echo "Please ensure the .env file exists in the mounted configs directory."
    exit 1
fi

cp /configs/.env .env
. .env
echo "Starting $APP_NAME (dev mode)"

# Wait for MySQL to be ready
echo "Waiting for MySQL..."
until php artisan db:show &>/dev/null; do
  echo "MySQL is unavailable - sleeping"
  sleep 2
done
echo "MySQL is up - continuing"

# Clear caches for development
./clear-cache.sh

# Run migrations (commented out by default)
# php artisan migrate --seed

# Start queue listener and scheduler in background
php artisan queue:listen &
php artisan schedule:work &

# Start Laravel server
php artisan serve --host=0.0.0.0