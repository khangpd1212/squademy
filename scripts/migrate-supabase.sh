#!/usr/bin/env bash
# One-time migration: Supabase PostgreSQL -> self-hosted PostgreSQL (Oracle VM).
# Prerequisites: pg_dump, psql, DATABASE_URL for target DB set in env.
#
# Usage:
#   1. From Supabase dashboard or CLI, dump auth.users + public tables (see below).
#   2. Transform profiles -> users (merge email from auth.users).
#   3. Import into target and run: yarn workspace @squademy/database db:migrate
#
# This script documents steps; adjust connection strings and paths.

set -euo pipefail

echo "=== Squademy: Supabase -> self-hosted PostgreSQL ==="
echo ""
echo "Step 1: Dump from Supabase (run locally with Supabase DB password):"
echo "  pg_dump \"\$SUPABASE_DB_URL\" \\"
echo "    --schema=public \\"
echo "    --table=profiles --table=groups --table=group_members \\"
echo "    --table=group_invitations --table=lessons --table=exercises \\"
echo "    --data-only --file=supabase_public_data.sql"
echo ""
echo "  For passwords: export auth.users (id, email, encrypted_password) if you need"
echo "  to map to users.password_hash; Supabase uses bcrypt in auth.users."
echo ""
echo "Step 2: Map schema to Prisma models (packages/database/prisma/schema.prisma):"
echo "  - profiles -> users (rename columns: display_name, full_name, avatar_url, etc.)"
echo "  - Preserve UUID ids where possible for FK integrity."
echo ""
echo "Step 3: Import to target:"
echo "  psql \"\$DATABASE_URL\" -f supabase_public_data.sql"
echo ""
echo "Step 4: Baseline Prisma on the imported DB (if no migrations yet):"
echo "  cd packages/database && npx prisma migrate dev --name init"
echo "  # or: prisma db pull then migrate diff as needed"
echo ""
echo "Step 5: Verify NestJS API against imported data."
echo ""
echo "Done (documentation only; no commands executed)."
