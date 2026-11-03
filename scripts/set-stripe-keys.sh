#!/usr/bin/env bash
# Save Stripe keys to .env.local without echoing them to the screen or history.
#
#   bash scripts/set-stripe-keys.sh            # secret key (sk_test_... / sk_live_...)
#   bash scripts/set-stripe-keys.sh --webhook  # webhook signing secret (whsec_...),
#                                              # only once the site is deployed and a
#                                              # webhook endpoint exists in Stripe
#
# Replaces any existing line for the same variable in .env.local.

set -euo pipefail
cd "$(dirname "$0")/.."

ENV_FILE=".env.local"
touch "$ENV_FILE"
chmod 600 "$ENV_FILE"

set_var() {
  local tmp
  tmp=$(mktemp)
  grep -v "^$1=" "$ENV_FILE" > "$tmp" || true
  printf '%s=%s\n' "$1" "$2" >> "$tmp"
  mv "$tmp" "$ENV_FILE"
  chmod 600 "$ENV_FILE"
}

if [[ "${1:-}" == "--webhook" ]]; then
  read -rsp "Webhook signing secret (whsec_...): " WH
  echo
  if [[ "$WH" != whsec_* ]]; then
    echo "The webhook signing secret should start with whsec_. Nothing was saved." >&2
    exit 1
  fi
  set_var STRIPE_WEBHOOK_SECRET "$WH"
  unset WH
  echo "Saved STRIPE_WEBHOOK_SECRET to $ENV_FILE."
  exit 0
fi

read -rsp "Stripe secret key (sk_test_...): " SK
echo
case "$SK" in
  sk_test_*) MODE="test" ;;
  sk_live_*)
    MODE="live"
    echo "That is a LIVE key: real charges, and bookings are written to the real Aracuya calendar."
    read -rp "Continue? [y/N] " OK
    [[ "$OK" == [yY] ]] || { echo "Cancelled."; exit 1; }
    ;;
  rk_*) echo "That's a restricted key. Use the standard secret key (sk_test_...)." >&2; exit 1 ;;
  *) echo "That doesn't look like a Stripe secret key (it should start with sk_test_)." >&2; exit 1 ;;
esac

STATUS=$(curl -s -o /dev/null -w '%{http_code}' -u "$SK:" https://api.stripe.com/v1/balance || echo "000")
if [[ "$STATUS" != "200" ]]; then
  echo "Stripe rejected that key (HTTP $STATUS). Nothing was saved." >&2
  exit 1
fi

set_var STRIPE_SECRET_KEY "$SK"
unset SK
echo "Key works ($MODE mode). Saved STRIPE_SECRET_KEY to $ENV_FILE."
echo "Restart the dev server (npm run dev) so it picks up the new key."
