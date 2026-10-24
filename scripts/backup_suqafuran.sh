#!/bin/bash
# ==============================================================================
# Suqafuran Production Backup Script
# ==============================================================================
# This script performs:
# 1. PostgreSQL logical dump (pg_dump) with compression.
# 2. Local uploads directory archive (tar.gz).
# 3. Optional sync to DigitalOcean Spaces / S3-compatible object storage.
# 4. Automatic rotation/retention cleanup of old local backups (e.g., 7 days).
# ==============================================================================

set -euo pipefail

# Auto-detect project directory from script location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="${PROJECT_DIR:-$(cd "${SCRIPT_DIR}/.." && pwd)}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/suqafuran}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

# Safe parser for .env files (avoids 'source' command execution failures on spaces/special characters)
load_env_file() {
    local env_file="$1"
    [ -f "$env_file" ] || return 0
    while IFS= read -r line || [ -n "$line" ]; do
        # Clean carriage returns and leading spaces
        line="$(echo "$line" | tr -d '\r' | sed -e 's/^[[:space:]]*//')"
        # Skip empty lines and comments
        [[ -z "$line" || "$line" =~ ^# ]] && continue
        # Match KEY=VALUE
        if [[ "$line" =~ ^([a-zA-Z_][a-zA-Z0-9_]*)=(.*)$ ]]; then
            local key="${BASH_REMATCH[1]}"
            local val="${BASH_REMATCH[2]}"
            # Strip surrounding double or single quotes if present
            if [[ "$val" =~ ^\"(.*)\"$ ]] || [[ "$val" =~ ^\'(.*)\'$ ]]; then
                val="${BASH_REMATCH[1]}"
            fi
            export "$key=$val"
        fi
    done < "$env_file"
}

# 1. Safely load environment variables from project root .env and backend/.env
load_env_file "${PROJECT_DIR}/.env"
load_env_file "${PROJECT_DIR}/backend/.env"

# Ensure DATABASE_URL is constructed if only individual connection variables are provided
if [ -z "${DATABASE_URL:-}" ] && [ -n "${POSTGRES_SERVER:-}" ]; then
    PG_PORT="${POSTGRES_PORT:-25060}"
    PG_USER="${POSTGRES_USER:-doadmin}"
    PG_PASS="${POSTGRES_PASSWORD:-}"
    PG_DB="${POSTGRES_DB:-defaultdb}"
    DATABASE_URL="postgresql://${PG_USER}:${PG_PASS}@${POSTGRES_SERVER}:${PG_PORT}/${PG_DB}?sslmode=require"
fi

# Restrictive umask: backups contain database credentials and customer records
umask 077

# Ensure backup directories exist with restricted permissions
mkdir -p "${BACKUP_DIR}/database"
mkdir -p "${BACKUP_DIR}/uploads"
chmod 700 "${BACKUP_DIR}" "${BACKUP_DIR}/database" "${BACKUP_DIR}/uploads" 2>/dev/null || true

echo "[$(date)] Starting Suqafuran automated backup..."
echo "[$(date)] Project Directory: ${PROJECT_DIR}"
echo "[$(date)] Backup Destination: ${BACKUP_DIR}"

# 2. PostgreSQL Database Backup
DB_BACKUP_FILE="${BACKUP_DIR}/database/suqafuran_db_${TIMESTAMP}.sql.gz"
echo "[$(date)] Backing up database to ${DB_BACKUP_FILE}..."

if [ -n "${DATABASE_URL:-}" ]; then
    if command -v pg_dump &>/dev/null; then
        echo "[$(date)] Using host pg_dump..."
        pg_dump "${DATABASE_URL}" | gzip -9 > "${DB_BACKUP_FILE}"
    elif command -v docker &>/dev/null; then
        echo "[$(date)] pg_dump not on host; running via docker postgres:alpine..."
        docker run --rm --network host -i postgres:alpine pg_dump "${DATABASE_URL}" | gzip -9 > "${DB_BACKUP_FILE}"
    else
        echo "[!] ERROR: Neither pg_dump nor docker is available to execute dump!"
    fi
else
    echo "[!] WARNING: No DATABASE_URL or POSTGRES_SERVER found in .env files."
fi

if [ -f "${DB_BACKUP_FILE}" ] && [ -s "${DB_BACKUP_FILE}" ]; then
    echo "[$(date)] Database backup completed successfully ($(du -h "${DB_BACKUP_FILE}" | cut -f1))."
else
    rm -f "${DB_BACKUP_FILE}"
    echo "[!] ERROR: Database backup file is empty or missing!"
fi

# 3. Uploaded Media Backup (backend/uploads)
UPLOADS_SRC="${PROJECT_DIR}/backend/uploads"
UPLOADS_BACKUP_FILE="${BACKUP_DIR}/uploads/suqafuran_uploads_${TIMESTAMP}.tar.gz"

if [ -d "${UPLOADS_SRC}" ] && [ -n "$(ls -A "${UPLOADS_SRC}" 2>/dev/null)" ]; then
    echo "[$(date)] Archiving uploaded media from ${UPLOADS_SRC}..."
    tar -czf "${UPLOADS_BACKUP_FILE}" -C "${PROJECT_DIR}/backend" uploads
    echo "[$(date)] Media archive completed ($(du -h "${UPLOADS_BACKUP_FILE}" | cut -f1))."
else
    echo "[$(date)] Uploads directory (${UPLOADS_SRC}) is empty or missing. Skipping media archive."
fi

# 4. Optional: Sync to DigitalOcean Spaces / AWS S3
if [ -n "${SPACES_BUCKET:-}" ]; then
    echo "[$(date)] Uploading backups to remote bucket: ${SPACES_BUCKET}..."
    if command -v s3cmd &> /dev/null; then
        [ -f "${DB_BACKUP_FILE}" ] && s3cmd put "${DB_BACKUP_FILE}" "s3://${SPACES_BUCKET}/backups/database/"
        [ -f "${UPLOADS_BACKUP_FILE}" ] && s3cmd put "${UPLOADS_BACKUP_FILE}" "s3://${SPACES_BUCKET}/backups/uploads/"
    elif command -v aws &> /dev/null; then
        [ -f "${DB_BACKUP_FILE}" ] && aws s3 cp "${DB_BACKUP_FILE}" "s3://${SPACES_BUCKET}/backups/database/"
        [ -f "${UPLOADS_BACKUP_FILE}" ] && aws s3 cp "${UPLOADS_BACKUP_FILE}" "s3://${SPACES_BUCKET}/backups/uploads/"
    fi
fi

# 5. Retention Policy (Clean up backups older than RETENTION_DAYS)
echo "[$(date)] Purging local backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}/database" -type f -name "suqafuran_db_*.sql.gz" -mtime "+${RETENTION_DAYS}" -delete 2>/dev/null || true
find "${BACKUP_DIR}/uploads" -type f -name "suqafuran_uploads_*.tar.gz" -mtime "+${RETENTION_DAYS}" -delete 2>/dev/null || true

echo "[$(date)] Backup process finished."
echo "[$(date)] Current database backups:"
ls -lh "${BACKUP_DIR}/database"
