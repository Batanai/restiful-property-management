# PostGIS Setup Guide

## Local Development (Docker)

PostGIS is automatically enabled when you run the Docker containers.

### Steps:

1. Stop and remove existing containers:

   ```bash
   docker-compose down -v
   ```

2. Start the containers:

   ```bash
   docker-compose up -d
   ```

3. Verify PostGIS is installed:
   ```bash
   docker exec -it restiful-db-server psql -U postgres -d restiful -c "SELECT PostGIS_version();"
   ```

The PostGIS extension is automatically created via the `init-postgis.sql` script.

## AWS RDS Setup

For AWS RDS PostgreSQL, PostGIS must be enabled manually:

### Option 1: Via AWS Console

1. Go to RDS → Databases → Select your database
2. Go to "Query Editor" or connect via psql
3. Run: `CREATE EXTENSION IF NOT EXISTS postgis;`

### Option 2: Via Prisma Migration

Add this to a Prisma migration file:

```sql
-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;
```

### Option 3: Via Application Code (NestJS)

Add to your application startup (e.g., in `main.ts` or a migration script):

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function enablePostGIS() {
  await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS postgis;');
}
```

### AWS RDS Requirements:

- Your RDS instance must support PostGIS (available on PostgreSQL 9.6+)
- The master user has permissions to create extensions
- PostGIS is included in AWS RDS PostgreSQL by default, just needs to be enabled

## Verifying PostGIS

After enabling, verify with:

```sql
SELECT PostGIS_version();
SELECT PostGIS_full_version();
```

## Using PostGIS in Prisma

Example schema with geometry types:

```prisma
model Property {
  id       Int    @id @default(autoincrement())
  name     String
  location Unsupported("geometry(Point, 4326)")
}
```

Use raw queries for spatial operations:

```typescript
const properties = await prisma.$queryRaw`
  SELECT * FROM "Property"
  WHERE ST_DWithin(
    location,
    ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
    1000
  )
`;
```
