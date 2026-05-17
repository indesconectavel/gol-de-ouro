#!/usr/bin/env bash
# H3.6C — Gate read-only: /meta.gitCommit deve igualar RELEASE_SHA (uso em CI local ou workflows).
set -euo pipefail

APP_NAME="${FLY_APP_NAME:-goldeouro-backend-v2}"
EXPECT="${RELEASE_SHA:?RELEASE_SHA obrigatório}"
META_URL="https://${APP_NAME}.fly.dev/meta"

BODY=$(curl -fsS --max-time 30 "$META_URL")
ACTUAL=$(echo "$BODY" | jq -r '.data.gitCommit // empty')

echo "Esperado: $EXPECT"
echo "Observado: $ACTUAL"

if [ -z "$ACTUAL" ]; then
  echo "❌ /meta sem gitCommit"
  exit 1
fi

if [ "$ACTUAL" != "$EXPECT" ]; then
  echo "❌ Divergência /meta"
  exit 1
fi

echo "✅ /meta alinhado"
