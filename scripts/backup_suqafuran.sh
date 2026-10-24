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

# Configuration
PROJECT_DIR="${PROJECT_DIR:-/opt/suqafuran}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/suqafuran}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

# Load environment variables if available
if [ -f "${PROJECT_DIR}/.env" ]; then
    # Export only non-comment variables
    set -a
    # shellcheck disable=SC1090
    source "${PROJECT_DIR}/.env"
    set +a
fi

# Ensure backup directories exist
mkdir -p "${BACKUP_DIR}/database"
mkdir -p "${BACKUP_DIR}/uploads"

echo "[$(date)] Starting Suqafuran automated backup..."

# 1. PostgreSQL Database Backup
DB_BACKUP_FILE="${BACKUP_DIR}/database/suqafuran_db_${TIMESTAMP}.sql.gz"
echo "[$(date)] Backing up database to ${DB_BACKUP_FILE}..."

if [ -n "${DATABASE_URL:-}" ]; then
    # Use pg_dump directly via DATABASE_URL
    pg_dump "${DATABASE_URL}" | gzip -9 > "${DB_BACKUP_FILE}"
elif [ -n "${POSTGRES_SERVER:-}" ]; then
    PGPASSWORD="${POSTGRES_PASSWORD:-}" pg_dump \
        -h "${POSTGRES_SERVER}" \
        -U "${POSTGRES_USER:-suqafuran}" \
        -p "${POSTGRES_PORT:-5432}" \
        -d "${POSTGRES_DB:-suqafuran}" \
        --no-owner --clean | gzip -9 > "${DB_BACKUP_FILE}"
else
    echo "[!] WARNING: No DATABASE_URL or POSTGRES_SERVER set. Skipping direct pg_dump."
fi

if [ -f "${DB_BACKUP_FILE}" ] && [ -s "${DB_BACKUP_FILE}" ]; then
    echo "[$(date)] Database backup completed successfully ($(du -h "${DB_BACKUP_FILE}" | cut -f1))."
else
    echo "[!] ERROR: Database backup file is empty or missing!"
fi

# 2. Uploaded Media Backup (Local uploads directory)
UPLOADS_SRC="${PROJECT_DIR}/backend/uploads"
UPLOADS_BACKUP_FILE="${BACKUP_DIR}/uploads/suqafuran_uploads_${TIMESTAMP}.tar.gz"

if [ -d "${UPLOADS_SRC}" ] && [ "$(ls -A "${UPLOADS_SRC}")" ]; then
    echo "[$(date)] Archiving uploaded media from ${UPLOADS_SRC}..."
    tar -czf "${UPLOADS_BACKUP_FILE}" -C "${PROJECT_DIR}/backend" uploads
    echo "[$(date)] Media archive completed ($(du -h "${UPLOADS_BACKUP_FILE}" | cut -f1))."
else
    echo "[$(date)] Uploads directory is empty or missing. Skipping media archive."
fi

# 3. Optional: Sync to DigitalOcean Spaces / AWS S3
if [ -n "${SPACES_BUCKET:-}" ]; then
    echo "[$(date)] Uploading backups to remote bucket: ${SPACES_BUCKET}..."
    if command -v s3cmd &> /dev/null; then
        s3cmd put "${DB_BACKUP_FILE}" "s3://${SPACES_BUCKET}/backups/database/"
        [ -f "${UPLOADS_BACKUP_FILE}" ] && s3cmd put "${UPLOADS_BACKUP_FILE}" "s3://${SPACES_BUCKET}/backups/uploads/"
    elif command -v aws &> /dev/null; then
        aws s3 cp "${DB_BACKUP_FILE}" "s3://${SPACES_BUCKET}/backups/database/"
        [ -f "${UPLOADS_BACKUP_FILE}" ] && aws s3 cp "${UPLOADS_BACKUP_FILE}" "s3://${SPACES_BUCKET}/backups/uploads/"
    fi
fi

# 4. Retention Policy (Clean up backups older than RETENTION_DAYS)
echo "[$(date)] Purging local backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}/database" -type f -name "suqafuran_db_*.sql.gz" -mtime "+${RETENTION_DAYS}" -delete
find "${BACKUP_DIR}/uploads" -type f -name "suqafuran_uploads_*.tar.gz" -mtime "+${RETENTION_DAYS}" -delete

echo "[$(date)] Backup completed successfully."
