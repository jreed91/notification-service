# Database Setup Guide

This guide covers how to set up and manage the PostgreSQL database for local development.

## Quick Start

```bash
# 1. Start PostgreSQL using Docker
npm run db:up

# 2. Run migrations to create tables
npm run db:migrate

# 3. (Optional) Open Drizzle Studio to view/edit data
npm run db:studio
```

## Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ and npm

## Local Development with Docker

### Starting the Database

The project includes a `docker-compose.yml` file that sets up PostgreSQL 14:

```bash
npm run db:up
```

This will:
- Start a PostgreSQL container on `localhost:5432`
- Create a database named `notification_service`
- Use credentials: `postgres/postgres`
- Persist data in a Docker volume

### Stopping the Database

```bash
npm run db:down
```

### Removing All Data

```bash
docker compose down -v
```

## Database Configuration

### Environment Variables

Create `packages/backend/.env` with your database connection:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/notification_service
```

For production or other environments:

```env
DATABASE_URL=postgresql://user:password@host:port/database
```

## Migrations

### Using SQL Migrations (Legacy)

The original migration system uses raw SQL:

```bash
# Run SQL migrations
npm run migrate -w packages/backend
```

Schema is defined in: `packages/backend/src/database/schema.sql`

### Using Drizzle Migrations (Recommended)

Drizzle ORM provides type-safe schema management:

```bash
# Generate migration files from schema
npm run db:generate -w packages/backend

# Run Drizzle migrations
npm run db:migrate -w packages/backend

# Or push schema changes directly (development only)
npm run db:push -w packages/backend
```

Schema is defined in: `packages/backend/src/database/schema.ts`

## Drizzle Studio

Drizzle Studio is a web-based GUI for viewing and editing database data:

```bash
npm run db:studio
```

Then open your browser to the URL shown (typically `https://local.drizzle.studio`)

## Schema Overview

### Tables

- **tenants**: Multi-tenant isolation with API keys
  - Stores tenant configuration and API keys for authentication

- **users**: End users with device tokens and contact info
  - Contains user locale, timezone, email, phone, and push notification tokens

- **notification_templates**: Reusable notification templates
  - Supports multiple channels (Email, Push, SMS)
  - Stores translations as JSONB for internationalization
  - Uses Handlebars syntax for variable substitution

- **user_subscriptions**: User notification preferences
  - Per-template subscription settings
  - Channel-specific preferences stored as JSONB

- **notifications**: Notification delivery history
  - Tracks status, rendered content, and delivery timestamps
  - Stores errors for failed deliveries

### JSONB Fields

Several tables use JSONB for flexible data storage:

- `notification_templates.channels`: Array of delivery channels
- `notification_templates.translations`: Locale-specific content
  ```json
  {
    "en-US": {
      "subject": "Welcome!",
      "body": "Hi {{name}}, welcome to our app!"
    },
    "es-ES": {
      "subject": "¡Bienvenido!",
      "body": "Hola {{name}}, ¡bienvenido a nuestra aplicación!"
    }
  }
  ```
- `user_subscriptions.channels`: Per-channel subscription preferences
- `notifications.variables`: Variables used for template rendering
- `notifications.rendered_content`: Final rendered notification content

## Development Tips

### Viewing Database Contents

```bash
# Using Drizzle Studio (recommended)
npm run db:studio

# Using psql CLI
docker exec -it notification-service-db psql -U postgres -d notification_service

# View tables
\dt

# Describe a table
\d notification_templates

# Query data
SELECT * FROM tenants;
```

### Resetting the Database

```bash
# Stop and remove everything
docker compose down -v

# Start fresh
npm run db:up
npm run db:migrate
```

### Troubleshooting

**Connection refused errors:**
- Ensure Docker is running
- Check if port 5432 is already in use: `lsof -i :5432`
- Try restarting Docker

**Migration errors:**
- Ensure `DATABASE_URL` is set correctly in `.env`
- Check if migrations have already been run
- For fresh start, reset the database (see above)

**Drizzle version conflicts:**
- Ensure `drizzle-orm` and `drizzle-kit` are compatible versions
- Check `packages/backend/package.json` for current versions
- Run `npm install` in the backend package

## Production Deployment

For production:

1. Use a managed PostgreSQL service (AWS RDS, Google Cloud SQL, etc.)
2. Set `DATABASE_URL` environment variable securely
3. Run migrations as part of deployment process
4. Enable SSL connections
5. Set up automated backups
6. Monitor connection pool usage

Example production `DATABASE_URL`:
```
postgresql://user:password@host.region.rds.amazonaws.com:5432/dbname?ssl=true
```

## Resources

- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
