#!/bin/bash
php artisan cache:clear
php artisan config:clear
php artisan event:clear
php artisan lighthouse:clear-cache