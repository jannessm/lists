#!/bin/bash
sleep 10
php artisan cache:clear
php artisan config:cache
# php artisan migrate --seed
php artisan serve --host=0.0.0.0