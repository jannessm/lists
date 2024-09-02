#!/bin/bash
# sleep 20
. .env
echo $APP_NAME
# ./clear-cache.sh
# php artisan migrate --seed
php artisan queue:work &
php artisan serve --host=0.0.0.0