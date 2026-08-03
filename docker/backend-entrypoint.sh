#!/bin/sh
set -e

echo "Waiting for PostgreSQL at ${POSTGRES_HOST:-postgres}:${POSTGRES_PORT:-5432}..."
until python - <<'PY'
import os
import psycopg2

conn = psycopg2.connect(
    host=os.getenv("POSTGRES_HOST", "postgres"),
    port=int(os.getenv("POSTGRES_PORT", "5432")),
    dbname=os.getenv("POSTGRES_DB", "metromind_db"),
    user=os.getenv("POSTGRES_USER", "metromind_user"),
    password=os.getenv("POSTGRES_PASSWORD", "MetroMind@2025"),
)
conn.close()
PY
do
  sleep 2
done

echo "Waiting for Redis at ${REDIS_HOST:-redis}:${REDIS_PORT:-6379}..."
until python - <<'PY'
import os
import redis

client = redis.Redis(
    host=os.getenv("REDIS_HOST", "redis"),
    port=int(os.getenv("REDIS_PORT", "6379")),
    password=os.getenv("REDIS_PASSWORD", "MetroRedis@2024"),
    socket_connect_timeout=5,
)
client.ping()
PY
do
  sleep 2
done

mkdir -p /app/data/uploads /app/data/temp /app/data/processed /app/data/logs /app/models/cache /app/vector_db

exec python start_services.py
