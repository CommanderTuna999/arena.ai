#!/usr/bin/env bash
# Live preview: always a fresh production build on port 3000.
# A stale `next start` (or a cached dev document) is what used to make the
# preview snap back to an old release, so this script owns the port and rebuilds.
set -euo pipefail
cd "$(dirname "$0")/.."

PORT="${PORT:-3000}"

# Kill whatever is already listening so an old build can never keep answering.
if command -v ss >/dev/null 2>&1; then
  pids="$(ss -ltnpH "sport = :${PORT}" 2>/dev/null | grep -o 'pid=[0-9]*' | cut -d= -f2 | sort -u || true)"
  if [ -n "${pids}" ]; then
    # shellcheck disable=SC2086
    kill ${pids} 2>/dev/null || true
    sleep 1
    # shellcheck disable=SC2086
    kill -9 ${pids} 2>/dev/null || true
  fi
fi

rm -rf .next
export DATABASE_URL="${DATABASE_URL:-postgresql://user:pass@127.0.0.1:5432/app_db}"
npx next build
exec npx next start -H 0.0.0.0 -p "${PORT}"
