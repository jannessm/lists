#!/bin/bash
# sleep 20
cp /configs/.env .env
. .env
echo $APP_NAME
# ./clear-cache.sh
# php artisan migrate --seed
php artisan queue:listen &
php artisan schedule:work &
php artisan serve --host=0.0.0.0