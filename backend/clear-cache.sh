#!/bin/bash
php artisan config:clear
php artisan cache:clear
php artisan lighthouse:clear-cache