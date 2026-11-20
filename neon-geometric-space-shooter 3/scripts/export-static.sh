#!/usr/bin/env bash
# Build the playable static bundle and zip it so it can be sent to other people.
#
#   ./scripts/export-static.sh
#
# Next.js static export cannot contain route handlers, so src/app/api is moved
# aside for the build and restored afterwards. The resulting site has no shared
# map / server profiles: progress lives in localStorage and save codes, exactly
# like the browser fallback of the hosted build.
set -euo pipefail
cd "$(dirname "$0")/.."
root="$(pwd)"
api="$root/src/app/api"
stash="$root/.api-stash"
rm -rf "$stash" out "$root/downloads"
if [ -d "$api" ]; then mv "$api" "$stash"; fi
trap 'if [ -d "$stash" ]; then mv "$stash" "$api"; fi' EXIT

STATIC_EXPORT=1 DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@127.0.0.1:5432/app_db}" npx next build

mkdir -p "$root/downloads/wof gue-io"
cp -R out/. "$root/downloads/wof gue-io/site/"
cat > "$root/downloads/wof gue-io/PLAY.txt" <<'TXT'
WOFGUE.IO — offline / portable build
===================================

1. Install Python 3 (python.org) if you do not have it.
2. Open a terminal in this folder.
3. Run:   python3 -m http.server 8000
   (Windows: python -m http.server 8000)
4. Open:  http://localhost:8000

To play on a phone or another computer on the same Wi-Fi:
  - find this computer's local IP (e.g. 192.168.1.20)
  - open http://<that-ip>:8000 on the other device while the server runs

Notes
  - No install, no server account: progress is stored in the browser.
  - Move progress between devices with SETTINGS → SAVE CODE → EXPORT / RESTORE.
  - The shared-map pilot dots are disabled in this offline build.
TXT
cat > "$root/downloads/wof gue-io/serve.py" <<'TXT'
"""Tiny static server for the portable Wofgue.io build.
Run:  python3 serve.py          (opens on http://localhost:8000)
"""
import http.server, socketserver, webbrowser, os

PORT = 8000
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), "site"))
handler = http.server.SimpleHTTPRequestHandler
socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("0.0.0.0", PORT), handler) as httpd:
    print(f"Wofgue.io running at http://localhost:{PORT}  (Ctrl+C to stop)")
    webbrowser.open(f"http://localhost:{PORT}")
    httpd.serve_forever()
TXT
cd "$root/downloads"
rm -f "wof gue-io-v1.4.zip"
zip -qr "wof gue-io-v1.4.zip" "wof gue-io"
mkdir -p "$root/public"
cp "wof gue-io-v1.4.zip" "$root/public/wof gue-io-v1.4.zip"
echo "wrote $root/downloads/wof gue-io-v1.4.zip"
