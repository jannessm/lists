# Configuration Directory

This directory contains environment-specific configurations for the Laravel application.

## Structure

```
configs/
├── dev/
│   ├── .env                    # Development environment variables
│   └── socketi-config.json     # Soketi WebSocket server config for dev
├── staging/
│   ├── .env.example            # Template for staging environment
│   ├── .env                    # Staging environment variables (create from .env.example)
│   └── socketi-config.json     # Soketi WebSocket server config for staging
└── prod/
    ├── .env.example            # Template for production environment
    ├── .env                    # Production environment variables (create from .env.example)
    └── socketi-config.json     # Soketi WebSocket server config for production
```

## Setup

### For Development
The development environment file already exists at `dev/.env`.

### For Staging
1. Copy the example file: `cp staging/.env.example staging/.env`
2. Edit `staging/.env` and set your staging-specific values:
   - `APP_KEY` - Generate with `php artisan key:generate`
   - `PUSHER_APP_ID`, `PUSHER_APP_KEY`, `PUSHER_APP_SECRET` - Set your Pusher/Soketi credentials
   - Any other staging-specific configuration

### For Production
1. Copy the example file: `cp prod/.env.example prod/.env`
2. Edit `prod/.env` and set your production values:
   - `APP_KEY` - Generate with `php artisan key:generate`
   - `PUSHER_APP_ID`, `PUSHER_APP_KEY`, `PUSHER_APP_SECRET` - Set your Pusher/Soketi credentials
   - `DB_PASSWORD` - Use a strong, unique password
   - Any other production-specific configuration

## How It Works

When you start a Docker container with a specific profile, the corresponding config directory is mounted to `/configs` inside the container:

- `docker compose --profile dev up` → mounts `./configs/dev:/configs`
- `docker compose --profile staging up` → mounts `./configs/staging:/configs`
- `docker compose --profile prod up` → mounts `./configs/prod:/configs`

The entrypoint scripts then copy `/configs/.env` to `/app/.env` (the Laravel application directory), ensuring the correct environment configuration is used.

## Important Notes

- **Never commit actual `.env` files to git** - they contain sensitive credentials
- The `.env.example` files are safe to commit as templates
- Each environment should have unique `APP_KEY` values
- Database hosts are environment-specific:
  - Dev/Staging: `mysql-dev`
  - Production: `mysql`
- Soketi hosts are environment-specific:
  - Dev: `soketi-dev`
  - Staging: `soketi-staging`
  - Production: `soketi`
