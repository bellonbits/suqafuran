#!/bin/sh
set -e

# If DATABASE_JDBC_URL is not set, derive from DATABASE_URL or POSTGRES_*
if [ -z "$DATABASE_JDBC_URL" ]; then
    if [ -n "$DATABASE_URL" ]; then
        # Convert postgresql://[user:pass@]host:port/db?params to jdbc:postgresql://host:port/db?params
        CLEAN_URL=$(echo "$DATABASE_URL" | sed -E 's|^postgres(ql)?://([^@]+@)?|jdbc:postgresql://|')
        export DATABASE_JDBC_URL="$CLEAN_URL"
        
        # If user/password not already set, extract them if present in URL
        if [ -z "$POSTGRES_USER" ]; then
            USER_PASS=$(echo "$DATABASE_URL" | sed -nE 's|^postgres(ql)?://([^@]+)@.*|\2|p')
            if [ -n "$USER_PASS" ]; then
                export POSTGRES_USER="${USER_PASS%%:*}"
                if [ "$USER_PASS" != "$POSTGRES_USER" ]; then
                    export POSTGRES_PASSWORD="${USER_PASS#*:}"
                fi
            fi
        fi
    else
        PG_HOST="${POSTGRES_SERVER:-suqafuran-do-user-31464052-0.f.db.ondigitalocean.com}"
        PG_PORT="${POSTGRES_PORT:-25060}"
        PG_DB="${POSTGRES_DB:-defaultdb}"
        export DATABASE_JDBC_URL="jdbc:postgresql://${PG_HOST}:${PG_PORT}/${PG_DB}?sslmode=require"
    fi
fi

# Fallback credentials if still not set
export POSTGRES_USER="${POSTGRES_USER:-doadmin}"
export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-AVNS_n3l_adWBnU_ieYWiXYS}"

echo "Starting Suqafuran Business Service with JDBC URL: ${DATABASE_JDBC_URL}"

exec java $JAVA_OPTS -jar /app/app.jar "$@"
