# Laravel Backend

## Important artisan commands

### Start application
```php artisan serve```

### Create Model
```php artisan make:model <name> -mf```

Flags:
- m: add migration script
- f: add factory class

### Inspect Model
```php artisan model:show <name>```

### Create DB
```php artisan migrate```

### add mock data
```php artisan migrate --seed```
 
or

```php artisan db:seed```