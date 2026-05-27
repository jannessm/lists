FROM php:8.3-cli

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    libzip-dev \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions required by Laravel
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /app

# For production: copy backend and install optimized dependencies
# For development: these will be overridden by volume mounts
ARG BUILD_ENV=production
COPY backend/ /app/

# Install dependencies based on environment
RUN if [ "$BUILD_ENV" = "production" ]; then \
        composer install --no-dev --optimize-autoloader --no-interaction; \
    else \
        composer install --no-interaction; \
    fi

# Set permissions
RUN chown -R www-data:www-data /app/storage /app/bootstrap/cache 2>/dev/null || true

EXPOSE 8000

CMD ["php", "artisan", "serve", "--host=0.0.0.0"]
