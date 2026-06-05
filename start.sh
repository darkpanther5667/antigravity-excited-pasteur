#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

# Apply pending migrations
echo "Running database migrations..."
npx prisma migrate deploy --schema=database/schema.prisma

# Start server
echo "Starting server..."
exec node backend/server.js
