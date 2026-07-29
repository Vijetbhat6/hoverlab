#!/bin/bash
# Start dev server, wait for it, run the verification script, clean up.
set -u

cd /home/z/my-project

# Kill any existing dev server
pkill -f "next dev" 2>/dev/null
sleep 1

# Start dev server in background
npx next dev -p 3000 -H 0.0.0.0 > dev.log 2>&1 &
SERVER_PID=$!
echo "Started dev server, PID=$SERVER_PID"

# Wait up to 30s for the server to come up
for i in $(seq 1 30); do
  if curl -sI http://127.0.0.1:3000/login 2>/dev/null | head -1 | grep -q '200'; then
    echo "Server is up after ${i}s"
    break
  fi
  sleep 1
done

if ! curl -sI http://127.0.0.1:3000/login 2>/dev/null | head -1 | grep -q '200'; then
  echo "Server failed to start. dev.log tail:"
  tail -20 dev.log
  kill $SERVER_PID 2>/dev/null
  exit 1
fi

echo "--- Running verification ---"
node scripts/verify-modern-features.mjs
TEST_RC=$?
echo "--- Verification exit code: $TEST_RC ---"

kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null
exit $TEST_RC
