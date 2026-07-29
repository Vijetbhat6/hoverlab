#!/usr/bin/env bash
# Persistent dev-server launcher. Run via: bash scripts/dev-server.sh
# Then check http://127.0.0.1:3000/  (uses 127.0.0.1 — localhost has IPv6 issues)
cd /home/z/my-project
exec npx next dev -p 3000 -H 0.0.0.0
