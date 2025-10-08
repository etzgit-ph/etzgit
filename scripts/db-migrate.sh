#!/bin/bash
# db-migrate.sh: Run database migrations (customize for your migration tool)
# Example for TypeORM, Prisma, or custom runner

# For TypeORM:
# pnpm --filter apps/api run migration:run

# For Prisma:
# pnpm --filter apps/api exec prisma migrate deploy

# For custom runner, edit below:
echo "No migration tool configured. Please update db-migrate.sh for your stack."
