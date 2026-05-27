# Environment Configuration Setup

## Summary

The Docker setup now properly uses environment files from the `configs/` directory based on the profile being used.

## What Was Done

### 1. Created Environment File Templates
- **`configs/staging/.env.example`** - Template for staging environment
- **`configs/prod/.env.example`** - Template for production environment

These templates include:
- Correct database hosts (`mysql-dev` for staging, `mysql` for prod)
- Correct Soketi hosts (`soketi-staging` for staging, `soketi` for prod)
- Appropriate log levels and debug settings
- Pre-configured URLs matching the Traefik setup

### 2. Updated Entrypoint Scripts
Both `entrypoint.sh` and `dev-entrypoint.sh` now:
- Check if `/configs/.env` exists before starting
- Provide helpful error messages if the file is missing
- Copy environment files BEFORE waiting for MySQL (more efficient)
- Load environment variables properly

### 3. Updated .gitignore
Added rules to:
- Ignore all `configs/*/.env` files (sensitive data)
- Keep `configs/*/.env.example` files (templates) in git

### 4. Created Documentation
- **`configs/README.md`** - Complete guide on how to set up environment files for each profile

## How It Works Now

When you start a container with a specific profile:

```bash
# Development (uses configs/dev/.env)
docker compose --profile dev up

# Staging (uses configs/staging/.env)
docker compose --profile staging up

# Production (uses configs/prod/.env)
docker compose --profile prod up
```

The compose.yml file mounts the appropriate config directory:
- Dev: `./configs/dev:/configs`
- Staging: `./configs/staging:/configs`
- Production: `./configs/prod:/configs`

The entrypoint script then copies `/configs/.env` to `/app/.env` inside the container.

## Setup Instructions

### For Development
✅ Already configured - `configs/dev/.env` exists

### For Staging
```bash
cp configs/staging/.env.example configs/staging/.env
# Edit configs/staging/.env and set:
# - APP_KEY (generate with: php artisan key:generate)
# - PUSHER credentials
# - Any staging-specific values
```

### For Production
```bash
cp configs/prod/.env.example configs/prod/.env
# Edit configs/prod/.env and set:
# - APP_KEY (generate with: php artisan key:generate)
# - PUSHER credentials
# - Strong DB_PASSWORD
# - Any production-specific values
```

## Key Differences Between Environments

| Setting | Development | Staging | Production |
|---------|------------|---------|------------|
| APP_ENV | `local` | `staging` | `production` |
| APP_DEBUG | `true` | `false` | `false` |
| LOG_LEVEL | `debug` | `debug` | `error` |
| DB_HOST | `mysql-dev` | `mysql-dev` | `mysql` |
| PUSHER_HOST | `soketi-dev` | `soketi-staging` | `soketi` |
| Cache | Cleared on start | Cached | Cached |

## Security Notes

- ✅ Actual `.env` files are now in .gitignore and won't be committed
- ✅ Only `.env.example` templates are tracked in git
- ⚠️ Make sure to use unique `APP_KEY` values for each environment
- ⚠️ Use strong passwords for production database
