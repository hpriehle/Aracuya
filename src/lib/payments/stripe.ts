// Stripe (server-only). Cards issued outside Ghana pay here, in USD, via
// hosted Stripe Checkout (handles 3-D Secure, Apple Pay and Google Pay).
// Env: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET

import Stripe from "stripe";

/** Stripe requires Checkout sessions to stay open at least 30 minutes. */
export const CHECKOUT_MINUTES = 30;
/** Calendar holds outlive the session so a guest can never pay for lost dates. */
export const HOLD_MINUTES = CHECKOUT_MINUTES + 5;

export class StripeNotConfiguredError extends Error {
  constructor() {
    super("Stripe is not configured");
  }
}

let stripe: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new StripeNotConfiguredError();
  if (!stripe) stripe = new Stripe(key);
  return stripe;
}

export function isStripeTestMode(): boolean {
  return !process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_");
}
