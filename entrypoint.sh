#!/bin/bash
. /configs/.env
echo $APP_NAME
./clear-cache.sh
# php artisan migrate --seed
php artisan queue:work &
php artisan schedule:work &
php artisan serve --host=0.0.0.0