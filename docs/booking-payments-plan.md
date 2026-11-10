# Direct booking + payments plan (Aracuya site)

Status: draft, 2026-11-03. Build in the Aracuya site now and move it to Abeiku later.

## Decisions made

| Topic | Decision |
|---|---|
| Where | Aracuya Next.js site (`src/app/api/*`), deployed on Netlify. Paystack is not used for now. |
| Payments | **Stripe** for cards issued outside Ghana. **MTN MoMo (direct Collections API)** for local payers. |
| Calendar | Google Calendar is the source of truth. One event per booking, and each event records how many rooms it takes. |
| Amount | Full amount upfront. A booking is confirmed only once it's paid. |
| Stripe account | US-registered. Charges and payouts are in USD. |
| Google auth | A service account that the Aracuya calendar is shared with. |
| Airbnb | Airbnb syncs into the calendar, and every Airbnb block takes the whole house (the default rule below covers this). |
| MTN live keys | Unknown. Harrison is checking the MTN MoMo developer portal. Until then: ship Stripe first, keep MoMo in sandbox. |

## Current state

- `BookingWidget.tsx` has the room selector (1 room / 2 rooms / Entire House), a date picker, and WhatsApp/Airbnb links. There's no checkout.
- `Calendar.tsx` already fetches `/api/availability?start&end` and disables `bookedDates`, but **that route doesn't exist in this repo**, so nothing is ever blocked today.
- Prices are stored in GHS (`src/data/rooms.ts`): 700 / 1,350 / 2,000 per night. `totalRooms` = 3. `CurrencyContext` converts to USD on the client with open.er-api.com.
- Already installed: `stripe`, `googleapis`, `resend`. Env has Google OAuth client ID/secret and Resend.
- Abeiku has MTN MoMo code that can be copied: `abeiku/src/lib/payments/momo.ts` (`requestPayment`, sandbox/prod switch, callback).

## Guest flow

1. **Dates + rooms**: the calendar greys out nights with 0 rooms free. After dates are picked, room options that don't fit are disabled (for example, "Entire House" is disabled if any night has a room booked).
2. **Guest details**: name, email, WhatsApp/phone, number of guests.
3. **Payment method**: guest chooses one:
   - **"Card issued outside Ghana"** goes to Stripe, charged in USD.
   - **"MTN Mobile Money"** goes to MoMo, charged in GHS.
   - A small "Other / Ghana bank card / Telecel / AirtelTigo? Book on WhatsApp" link as the fallback.
   - We don't show a list of card brands, because Ghana banks issue Visa and Mastercard too. The brand doesn't tell us which processor will accept the card.
4. **Pay**:
   - Stripe: Embedded Checkout session (handles 3DS, Apple Pay and Google Pay). If the guest cancels or the card is declined, the widget shows "Card not working? Pay with MTN MoMo".
   - MoMo: we send a payment request to their number. The guest approves it on their phone with their PIN while the widget polls the booking status for up to about 3 minutes.
5. **Confirmed**: the calendar event changes from hold to confirmed. A confirmation email goes to the guest and to Aracuya through Resend. The guest lands on `/booking/confirmed`.

## Availability model (Google Calendar)

- Each Aracuya booking is **one event** over `[check_in, check_out)` as an all-day event. Room count and metadata are stored in `extendedProperties.private`:
  `{ source: "aracuya-site", rooms: "2", status: "hold" | "confirmed", bookingId, expiresAt, provider: "stripe" | "momo", paymentRef }`
- The event title stays readable for staff, for example `Aracuya · 2 rooms · Jane Doe (paid)`.
- **Rooms booked on a night** = the sum of `rooms` across events covering that night. **Free** = 3 minus that.
- Events without our metadata (added by hand, synced from Airbnb, and so on) are read like this: a title such as "1 room" or "2 rooms" counts as that many, and **anything else blocks the whole house**. This is the safe default.
- Holds:
  - Starting checkout creates a `hold` event that expires after 15 minutes.
  - Holds count toward availability until they expire.
  - Expired holds are deleted lazily whenever availability is read. No cron is needed.
- Race guard: after inserting a hold, re-read that date range. If the range is now overbooked, the newest hold loses and is deleted, and the guest is told the dates just sold.

## Pricing and currency (server-side only)

- The server recalculates the total from the room option and number of nights in `rooms.ts`. It never trusts a price sent by the browser.
- MoMo charges the GHS total.
- Stripe charges USD = GHS total ÷ rate. The rate is fetched on the server and fixed when the checkout session is created. The USD amount and the rate are shown to the guest before they pay, and both are saved on the event.

## Files to add or change

```
src/lib/booking/pricing.ts        quote(roomsOption, checkIn, checkOut) → { ghs, usd, rate, nights }
src/lib/booking/calendar.ts       getNightlyAvailability, createHold, confirmHold, releaseHold
src/lib/payments/stripe.ts        createCheckoutSession (embedded), webhook verify
src/lib/payments/momo.ts          ported from Abeiku: requestToPay + getStatus only (no disbursements)
src/lib/booking/email.ts          guest + owner confirmation (Resend)

src/app/api/availability/route.ts         GET → { nights: { "2026-12-01": 3, ... } } (free rooms per night)
src/app/api/booking/route.ts              POST → validate, quote, hold, start payment → { bookingId, clientSecret | momoRef }
src/app/api/booking/[id]/route.ts         GET status (widget polls for MoMo)
src/app/api/stripe/webhook/route.ts       checkout.session.completed → confirm; expired → release
src/app/api/momo/callback/route.ts        MTN callback → confirm/release (also confirmed by polling getStatus)
src/app/booking/confirmed/page.tsx

src/components/ui/Calendar.tsx      use free-rooms-per-night instead of bookedDates
src/components/ui/BookingWidget.tsx  steps: dates/rooms → details → payment method → pay
```

`src/middleware.ts` already passes `/api` through, so webhook routes aren't affected.

## Env vars to add

```
STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET
MOMO_ENVIRONMENT (sandbox | mtnghana), MOMO_COLLECTIONS_USER_ID, MOMO_COLLECTIONS_API_KEY, MOMO_COLLECTIONS_SUBSCRIPTION_KEY
GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY, GOOGLE_BOOKING_CALENDAR_ID
AIRBNB_ICAL_URL (optional; Airbnb export link, each event blocks the whole house)
BOOKING_CALENDAR_MOCK=1 (optional; sample data, the default in dev without Google keys)
BOOKING_NOTIFY_EMAIL
```

## Risks / open items

1. **Going live with MTN MoMo is the slowest part.** The sandbox only works in EUR with test numbers. Production needs MTN Ghana business onboarding (a registered business plus KYC) to get live Collections keys, which can take weeks. Stripe and the calendar can ship first, with MoMo turned on once the keys arrive.
2. **Gaps in MoMo-direct coverage.** Telecel Cash and AirtelTigo Money users, and Ghana bank-card holders, have no direct payment option. They can try Stripe (some Ghana cards work there) or use the WhatsApp fallback.
3. **Google auth.** A service account that the Aracuya calendar is shared with (with "Make changes to events" permission) is the most reliable option. An OAuth refresh token from an app still in Google's "Testing" mode expires every 7 days.
4. **Stripe decline rate on Ghana-issued cards.** Expected to be high. That's why the decline screen points to MoMo.
5. **Cancellations and refunds.** These are done by hand in the Stripe dashboard or MTN for V1. A written cancellation policy should appear at checkout.
6. **Move to Abeiku later.** The `src/lib/booking/*` and `src/lib/payments/*` modules are written to be portable. In Abeiku, the calendar event plus the payment reference become a `bookings` row.

## Calendar facts found during setup (2026-11-03)

- Staff enter direct bookings by hand as midnight-to-midnight timed events titled e.g. "1 room booked" (one event per night). The parser handles these.
- The calendar subscribes to Airbnb, VRBO and Booking.com iCal feeds. Subscribed calendars can't be shared with a service account, so the server reads the feeds directly (`BLOCKING_ICAL_URLS`). Each feed event blocks the whole house.
- Untitled or other events (e.g. "Tentative Oba Tours") block the whole house, even if they're tentative.
- **Open item:** check that Airbnb, VRBO and Booking.com each import the Aracuya Villas calendar's secret iCal address. Without that, a booking made on the site won't block those platforms.
- **Open item:** Netlify functions have a 4 KB limit on total env vars, and the private key is about 1.7 KB. Check the total when adding these to Netlify.

## Build order

1. ✅ Availability API + calendar room counting (done 2026-11-03: `src/lib/booking/availability.ts`, `calendar.ts`, `/api/availability`, widget + calendar wired). Live against the real calendar in local dev: service account `booking-site@aracuya-booking.iam.gserviceaccount.com` (Google Cloud project `aracuya-booking`, owned by aracuyagh@gmail.com) has "Make changes and see all event details" on the Aracuya Villas calendar (`aracuyagh@gmail.com`). Values are in `.env.local`; they still need adding to Netlify.
2. ✅ Widget steps + server pricing (done 2026-11-03).
3. ✅ Stripe Checkout + webhook + confirmation emails, built 2026-11-03. Waiting on Stripe keys to test end to end.
   - Uses **hosted** Checkout (a redirect) instead of Embedded, so no new npm packages are needed. It handles 3DS, Apple Pay and Google Pay the same way.
   - Stripe sessions must stay open at least 30 minutes, so holds last **35 minutes** (not 15). The session always expires before its hold.
   - Test-mode payments never write to the real calendar. Holds go to an in-memory calendar unless the Stripe key is live or `BOOKING_CALENDAR_WRITES=on`.
   - Guest confirmation emails need `BOOKING_EMAIL_FROM` on a domain verified in Resend. Until then only the owner email goes out, and guests get Stripe's receipt.
   - Paid with no hold (e.g. the hold was deleted by hand): sends an "ACTION NEEDED" email to the owner instead of guessing.
4. ✅ MTN MoMo in sandbox (done 2026-11-03). Goes live once MTN issues live Collections keys.
   - Guest picks "MTN Mobile Money", enters their MTN number, and approves the prompt with their PIN. The widget checks `/api/booking/status` every 4 seconds; holds last 10 minutes.
   - Payment status always comes from MTN's API. MTN's callback (`/api/momo/callback`) is unsigned, so it only triggers a re-check and its body is ignored.
   - MTN's firewall rejects some punctuation in payment messages (e.g. parentheses), so messages are reduced to letters, digits, spaces and hyphens.
   - Live: `MOMO_ENVIRONMENT=mtnghana` (Abeiku uses `production`, which MTN doesn't accept as a target environment), live Collections keys, `NEXT_PUBLIC_MOMO_MODE=live`. Non-MTN numbers (Telecel, AirtelTigo) are rejected with a pointer to WhatsApp.
   - Sandbox credentials were copied from Abeiku's `.env.local`.
5. End-to-end tests: overlapping holds, expired hold, declined card, MoMo timeout, a manual calendar event blocking the whole house.

## Go-live checklist (prepared 2026-11-03)

Netlify site `aracuya` deploys from GitHub `hpriehle/Aracuya`, branch `main`. As of 2026-11-03 it has **no environment variables**, so the live contact form probably can't send email (`RESEND_API_KEY` is missing).

`scripts/push-netlify-env.sh` copies the booking variables from an env file to Netlify without printing them. `preview` writes to the deploy-preview and branch-deploy contexts. `production` refuses Stripe test keys and turns MoMo off until it's live. Without the unused Supabase, JWT and WhatsApp entries, the variables total about 2.5 KB, under Netlify's 4 KB function limit.

### Stage 1: test on a real HTTPS preview (test keys)
1. Push `booking-payments` and open a PR. Netlify builds `deploy-preview-<n>--aracuya.netlify.app`.
2. Make a separate Google calendar, e.g. "Aracuya booking tests", and share it with the service account. On the serverless preview, in-memory test bookings aren't shared between function instances, so preview testing needs a real calendar. Using a test calendar keeps the real one clean. For the preview contexts only, the test calendar comes from `PREVIEW_GOOGLE_BOOKING_CALENDAR_ID`, `PREVIEW_BOOKING_CALENDAR_WRITES=on` and `PREVIEW_STRIPE_WEBHOOK_SECRET` in `.env.local`; `push-netlify-env.sh preview` uses a `PREVIEW_<NAME>` value in place of `<NAME>`. (Done: test calendar, preview webhook and PR #1.)
3. `bash scripts/push-netlify-env.sh preview`, then redeploy the preview.
4. Stripe test mode → Webhooks → endpoint `https://deploy-preview-<n>--aracuya.netlify.app/api/stripe/webhook` (events `checkout.session.completed`, `checkout.session.expired`). Save its secret with `bash scripts/set-stripe-keys.sh --webhook`, then push the preview env again.
5. Test the card (4242), a card cancel, MoMo success/decline, and the MTN callback (it works over HTTPS).

### Stage 2: production
1. **Stripe:** the account stays Automaddie (it's used for other products). Each Aracuya payment adds the statement suffix `ARACUYA` (statements read `AUTOMADDIE* ARACUYA`), and Checkout explains that Automaddie processes Aracuya's payments; other products are unaffected. Create the live webhook `https://aracuya.com/api/stripe/webhook` (`checkout.session.completed`, `checkout.session.expired`).
2. **Live values:** `.env.production.local` (git-ignored) already holds the calendar, feeds, Resend and notify email; add the live Stripe keys with `bash scripts/set-stripe-keys.sh .env.production.local` (and `--webhook`). It needs: `sk_live_` key, live webhook secret, the real calendar ID, the booking-site feeds, Resend, `BOOKING_NOTIFY_EMAIL`. Then run `bash scripts/push-netlify-env.sh production .env.production.local`.
3. **Booking platforms:** Airbnb, VRBO and Booking.com each need to import the Aracuya Villas calendar's secret iCal address.
4. **Resend:** verify a sending domain and set `BOOKING_EMAIL_FROM`, so guests get Aracuya's own confirmation emails.
5. **Deploy:** merge the PR to `main`.
6. **Smoke test:** make one real 1-room card booking, check the calendar event and the emails, then refund it in Stripe and delete the event.
7. **MoMo later:** once MTN Ghana issues live Collections keys, add `MOMO_ENVIRONMENT=mtnghana`, the keys and `NEXT_PUBLIC_MOMO_MODE=live`, re-run the production push and redeploy. Create the live API user with the site's domain as its callback host (`providerCallbackHost`); MTN refuses callbacks to any other host (`INVALID_CALLBACK_URL_HOST`), and the sandbox user copied from Abeiku is registered to Abeiku's host, so the preview runs on polling alone.
