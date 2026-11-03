#!/usr/bin/env bash
# Copy the booking env vars to Netlify without printing their values.
#
#   bash scripts/push-netlify-env.sh preview                 # deploy previews + branch deploys
#   bash scripts/push-netlify-env.sh production [env-file]   # the live site
#
# Reads values from .env.local (or the given file). "preview" accepts test
# keys. "production" refuses Stripe test keys and the MoMo sandbox: if MoMo
# isn't live yet it is switched off (NEXT_PUBLIC_MOMO_MODE=off) instead.
# Changing NEXT_PUBLIC_* values needs a new deploy to take effect.

set -euo pipefail
cd "$(dirname "$0")/.."

TARGET="${1:-}"
ENV_FILE="${2:-.env.local}"
case "$TARGET" in
  preview) CONTEXTS=(deploy-preview branch-deploy) ;;
  production) CONTEXTS=(production) ;;
  *) echo "Usage: bash scripts/push-netlify-env.sh preview|production [env-file]" >&2; exit 1 ;;
esac
[[ -f "$ENV_FILE" ]] || { echo "No $ENV_FILE" >&2; exit 1; }

NAMES=(
  GOOGLE_SERVICE_ACCOUNT_EMAIL GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY GOOGLE_BOOKING_CALENDAR_ID
  BLOCKING_ICAL_URLS
  STRIPE_SECRET_KEY STRIPE_WEBHOOK_SECRET
  MOMO_ENVIRONMENT MOMO_COLLECTIONS_USER_ID MOMO_COLLECTIONS_API_KEY MOMO_COLLECTIONS_SUBSCRIPTION_KEY
  NEXT_PUBLIC_MOMO_MODE
  RESEND_API_KEY BOOKING_NOTIFY_EMAIL BOOKING_EMAIL_FROM
)

# Read NAME=value lines (quotes stripped) without sourcing the file.
get() {
  python3 - "$ENV_FILE" "$1" <<'EOF'
import sys
path, name = sys.argv[1], sys.argv[2]
for line in open(path):
    k, _, v = line.rstrip("\n").partition("=")
    if k.strip() == name:
        v = v.strip()
        if len(v) >= 2 and v[0] == v[-1] and v[0] in "\"'":
            v = v[1:-1]
        print(v, end="")
        break
EOF
}

# macOS ships bash 3.2 (no associative arrays): keep values in VAL_<NAME>.
val() { local v="VAL_$1"; printf '%s' "${!v:-}"; }
setval() { printf -v "VAL_$1" '%s' "$2"; }
for n in "${NAMES[@]}"; do setval "$n" "$(get "$n")"; done

if [[ "$TARGET" == production ]]; then
  if [[ "$(val STRIPE_SECRET_KEY)" != sk_live_* ]]; then
    echo "Refusing: STRIPE_SECRET_KEY in $ENV_FILE is not a live key (sk_live_...)." >&2
    exit 1
  fi
  [[ -n "$(val STRIPE_WEBHOOK_SECRET)" ]] || echo "Warning: no STRIPE_WEBHOOK_SECRET; add it once the live webhook exists."
  if [[ "$(val MOMO_ENVIRONMENT)" != mtnghana ]]; then
    echo "MoMo isn't live (MOMO_ENVIRONMENT=$(val MOMO_ENVIRONMENT)); switching MoMo off for production."
    for n in MOMO_ENVIRONMENT MOMO_COLLECTIONS_USER_ID MOMO_COLLECTIONS_API_KEY MOMO_COLLECTIONS_SUBSCRIPTION_KEY; do setval "$n" ""; done
    setval NEXT_PUBLIC_MOMO_MODE off
  fi
fi

SET=()
SKIPPED=()
for n in "${NAMES[@]}"; do
  v="$(val "$n")"
  if [[ -z "$v" ]]; then SKIPPED+=("$n"); continue; fi
  for c in "${CONTEXTS[@]}"; do
    netlify env:set "$n" "$v" --context "$c" > /dev/null
  done
  SET+=("$n")
done

echo "Set on Netlify (${CONTEXTS[*]}): ${SET[*]}"
[[ ${#SKIPPED[@]} -eq 0 ]] || echo "Not set (empty in $ENV_FILE): ${SKIPPED[*]}"
echo "Redeploy for the changes to take effect."
