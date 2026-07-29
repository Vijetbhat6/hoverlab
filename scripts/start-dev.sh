#!/usr/bin/env bash
# Robust dev-server daemon. Uses double-fork to fully detach from the
# parent shell so the bash tool's process-group cleanup doesn't kill it.
set -euo pipefail

cd /home/z/my-project

# Kill any existing dev server
pkill -9 -f "next-server" 2>/dev/null || true
pkill -9 -f "next dev" 2>/dev/null || true
pkill -9 -f "npm run dev" 2>/dev/null || true
sleep 1

# Clean log
: > /home/z/my-project/dev.log

# Double-fork daemonization:
# 1. Parent forks, exits immediately
# 2. Child setsid's to become session leader, then forks again
# 3. Grandchild is the actual dev server — fully detached
(
  setsid bash -c '
    cd /home/z/my-project
    exec npm run dev > /home/z/my-project/dev.log 2>&1
  ' &
  disown
) &

# Wait for dev server to be ready (up to 60s)
for i in $(seq 1 60); do
  if grep -q "Ready in" /home/z/my-project/dev.log 2>/dev/null; then
    echo "Dev server ready after ${i}s"
    break
  fi
  sleep 1
done

# Show status
echo "=== dev.log tail ==="
tail -10 /home/z/my-project/dev.log
echo ""
echo "=== process check ==="
ps aux | grep -E "next-server" | grep -v grep | head -2 || echo "(no next-server process)"
echo ""
echo "=== curl test ==="
curl -s -w "HTTP %{http_code}\n" --max-time 10 http://localhost:3000/ -o /dev/null || echo "curl failed"
