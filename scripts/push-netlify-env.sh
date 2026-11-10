#!/usr/bin/env bash
# Copy the booking env vars to Netlify without printing their values.
#
#   bash scripts/push-netlify-env.sh preview                 # deploy previews + branch deploys
#   bash scripts/push-netlify-env.sh production [env-file]   # the live site
#
# Reads values from .env.local (or the given file). "preview" accepts test
# keys. "production" refuses Stripe test keys and the MoMo sandbox: if MoMo
# isn't live yet it is switched off (NEXT_PUBLIC_MOMO_MODE=off) instead.
# Changing env vars needs a new deploy to take effect.
#
# Values go straight to Netlify's REST API from Python, never through
# command-line arguments: the Netlify CLI treats values starting with "-"
# (like a PEM private key) as options and prints them in its error message.
# Auth: the Netlify CLI's stored login (netlify login), or NETLIFY_AUTH_TOKEN.

set -euo pipefail
cd "$(dirname "$0")/.."

exec python3 - "$@" <<'PY'
import json, os, sys, urllib.error, urllib.parse, urllib.request

NAMES = [
    "GOOGLE_SERVICE_ACCOUNT_EMAIL", "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY", "GOOGLE_BOOKING_CALENDAR_ID",
    "BLOCKING_ICAL_URLS",
    "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET",
    "MOMO_ENVIRONMENT", "MOMO_COLLECTIONS_USER_ID", "MOMO_COLLECTIONS_API_KEY", "MOMO_COLLECTIONS_SUBSCRIPTION_KEY",
    "NEXT_PUBLIC_MOMO_MODE",
    "RESEND_API_KEY", "BOOKING_NOTIFY_EMAIL", "BOOKING_EMAIL_FROM",
    "BOOKING_CALENDAR_WRITES",
]
MOMO = NAMES[6:10]
# For "preview", PREVIEW_<NAME> in the env file wins over <NAME>, e.g.
# PREVIEW_GOOGLE_BOOKING_CALENDAR_ID=<test calendar>, PREVIEW_BOOKING_CALENDAR_WRITES=on

def die(msg):
    print(msg, file=sys.stderr)
    sys.exit(1)

args = sys.argv[1:]
if not args or args[0] not in ("preview", "production"):
    die("Usage: bash scripts/push-netlify-env.sh preview|production [env-file]")
target = args[0]
env_file = args[1] if len(args) > 1 else ".env.local"
contexts = ["deploy-preview", "branch-deploy"] if target == "preview" else ["production"]
if not os.path.isfile(env_file):
    die(f"No {env_file}")

values, preview_values = {}, {}
for line in open(env_file):
    k, sep, v = line.rstrip("\n").partition("=")
    k, v = k.strip(), v.strip()
    if not sep:
        continue
    if len(v) >= 2 and v[0] == v[-1] and v[0] in "\"'":
        v = v[1:-1]
    if k in NAMES:
        values[k] = v
    elif k.startswith("PREVIEW_") and k[8:] in NAMES:
        preview_values[k[8:]] = v
if target == "preview":
    values.update({k: v for k, v in preview_values.items() if v})

if target == "production":
    if not values.get("STRIPE_SECRET_KEY", "").startswith("sk_live_"):
        die(f"Refusing: STRIPE_SECRET_KEY in {env_file} is not a live key (sk_live_...).")
    if not values.get("STRIPE_WEBHOOK_SECRET"):
        print("Warning: no STRIPE_WEBHOOK_SECRET; add it once the live webhook exists.")
    if values.get("MOMO_ENVIRONMENT") != "mtnghana":
        print(f"MoMo isn't live (MOMO_ENVIRONMENT={values.get('MOMO_ENVIRONMENT', 'unset')}); switching MoMo off for production.")
        for n in MOMO:
            values.pop(n, None)
        values["NEXT_PUBLIC_MOMO_MODE"] = "off"

# Netlify auth + site
token = os.environ.get("NETLIFY_AUTH_TOKEN")
if not token:
    cfg_path = os.path.expanduser("~/Library/Preferences/netlify/config.json")
    try:
        cfg = json.load(open(cfg_path))
        token = cfg["users"][cfg["userId"]]["auth"]["token"]
    except Exception:
        die("Not logged in to Netlify. Run `netlify login` or set NETLIFY_AUTH_TOKEN.")
site_id = json.load(open(".netlify/state.json"))["siteId"]

def api(method, path, body=None):
    req = urllib.request.Request(
        "https://api.netlify.com/api/v1" + path,
        method=method,
        data=None if body is None else json.dumps(body).encode(),
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as res:
            raw = res.read()
            return res.status, (json.loads(raw) if raw else None)
    except urllib.error.HTTPError as e:
        return e.code, None  # never echo the response: it may contain the value

status, site = api("GET", f"/sites/{site_id}")
if status != 200:
    die(f"Couldn't read the Netlify site (HTTP {status}).")
account = site["account_id"]
q = "?" + urllib.parse.urlencode({"site_id": site_id})

set_names, skipped = [], []
for name in NAMES:
    value = values.get(name, "")
    if not value:
        skipped.append(name)
        continue
    for ctx in contexts:
        # Update the value for this context; create the variable if it doesn't exist yet.
        status, _ = api("PATCH", f"/accounts/{account}/env/{name}{q}", {"context": ctx, "value": value})
        if status == 404:
            status, _ = api("POST", f"/accounts/{account}/env{q}",
                            [{"key": name, "values": [{"context": ctx, "value": value}]}])
        if status not in (200, 201):
            die(f"Failed to set {name} for {ctx} (HTTP {status}). Stopped; nothing printed.")
    set_names.append(name)

print(f"Set on Netlify ({' '.join(contexts)}): {' '.join(set_names)}")
if skipped:
    print(f"Not set (empty in {env_file}): {' '.join(skipped)}")
print("Redeploy for the changes to take effect.")
PY
