#!/bin/bash
# sleep 20
. .env
php artisan cache:clear
php artisan config:clear
# php artisan migrate --seed
php artisan serve --host=0.0.0.0