// POST /api/stripe/webhook
// Stripe dashboard → Developers → Webhooks → endpoint
//   https://<site>/api/stripe/webhook
// events: checkout.session.completed, checkout.session.expired
// Env: STRIPE_WEBHOOK_SECRET (whsec_...)

import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { finalizeStripeSession, releaseStripeSession } from "@/lib/booking/confirm";
import { getStripe } from "@/lib/payments/stripe";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await finalizeStripeSession(event.data.object);
        break;
      case "checkout.session.expired":
        await releaseStripeSession(event.data.object);
        break;
    }
  } catch (err) {
    // 500 makes Stripe retry with backoff; confirm/release are idempotent.
    console.error("[stripe/webhook]", event.type, err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
