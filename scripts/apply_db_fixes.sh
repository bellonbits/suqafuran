#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="${PROJECT_DIR:-$(cd "${SCRIPT_DIR}/.." && pwd)}"
SQL_FILE="${SCRIPT_DIR}/apply_db_fixes.sql"

# Safe parser for .env files
load_env_file() {
    local env_file="$1"
    [ -f "$env_file" ] || return 0
    while IFS= read -r line || [ -n "$line" ]; do
        line="$(echo "$line" | tr -d '\r' | sed -e 's/^[[:space:]]*//')"
        [[ -z "$line" || "$line" =~ ^# ]] && continue
        if [[ "$line" =~ ^([a-zA-Z_][a-zA-Z0-9_]*)=(.*)$ ]]; then
            local key="${BASH_REMATCH[1]}"
            local val="${BASH_REMATCH[2]}"
            if [[ "$val" =~ ^\"(.*)\"$ ]] || [[ "$val" =~ ^\'(.*)\'$ ]]; then
                val="${BASH_REMATCH[1]}"
            fi
            export "$key=$val"
        fi
    done < "$env_file"
}

load_env_file "${PROJECT_DIR}/.env"
load_env_file "${PROJECT_DIR}/backend/.env"

if [ -z "${DATABASE_URL:-}" ] && [ -n "${POSTGRES_SERVER:-}" ]; then
    PG_PORT="${POSTGRES_PORT:-25060}"
    PG_USER="${POSTGRES_USER:-doadmin}"
    PG_PASS="${POSTGRES_PASSWORD:-}"
    PG_DB="${POSTGRES_DB:-defaultdb}"
    DATABASE_URL="postgresql://${PG_USER}:${PG_PASS}@${POSTGRES_SERVER}:${PG_PORT}/${PG_DB}?sslmode=require"
fi

if [ -z "${DATABASE_URL:-}" ]; then
    echo "[!] ERROR: DATABASE_URL not found."
    exit 1
fi

echo "[$(date)] Applying database schema fixes..."
docker run --rm --network host -i -v "${SQL_FILE}:/tmp/fixes.sql:ro" postgres:alpine \
    psql "${DATABASE_URL}" -f /tmp/fixes.sql

echo "[$(date)] ✅ Schema fixes applied successfully!"
