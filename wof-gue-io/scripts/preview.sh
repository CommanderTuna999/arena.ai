#!/usr/bin/env bash
# Development preview uses Next's separate dev output, so production builds do
# not replace files under a running production server.
set -euo pipefail
cd "$(dirname "$0")/.."
exec npx next dev -H 0.0.0.0 -p "${PORT:-3000}"
