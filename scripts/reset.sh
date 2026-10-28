#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

docker compose down -v
docker compose up -d --build

for _ in $(seq 1 60); do
  if curl -fs http://127.0.0.1:3000/health >/dev/null; then
    break
  fi
  sleep 1
done
curl -fs http://127.0.0.1:3000/health >/dev/null || { echo "api did not become healthy" >&2; exit 1; }

docker compose exec -T api npm run seed
