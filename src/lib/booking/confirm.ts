// Turning a paid Stripe Checkout session into a confirmed booking.
// Called from the webhook and from the confirmation page (whichever runs
// first); confirmBooking() is idempotent so emails go out once.

import type Stripe from "stripe";
import { confirmBooking, releaseHold, type BookingProps } from "./calendar";
import { sendBookingEmails, sendOwnerAlert } from "./email";
import { isStripeTestMode } from "@/lib/payments/stripe";

export function paidLabel(session: Stripe.Checkout.Session): string {
  const amount = (session.amount_total ?? 0) / 100;
  return `$${amount.toFixed(2)} ${(session.currency ?? "usd").toUpperCase()} by card`;
}

export async function finalizeStripeSession(
  session: Stripe.Checkout.Session
): Promise<BookingProps | null> {
  if (session.payment_status !== "paid") return null;
  const eventId = session.metadata?.eventId;
  if (!eventId) return null;

  const label = paidLabel(session);
  const paymentRef =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent?.id ?? session.id);

  try {
    const { newlyConfirmed, props } = await confirmBooking(eventId, {
      paymentRef,
      paidLabel: label,
    });
    if (newlyConfirmed) await sendBookingEmails(props, label, isStripeTestMode());
    return props;
  } catch (err) {
    // The guest paid but the hold is gone (deleted by hand, or expired and
    // cleaned up). Don't guess at availability; get a human to sort it out.
    console.error("[booking] paid session without a hold", session.id, err);
    const m = session.metadata ?? {};
    await sendOwnerAlert(`paid booking ${m.bookingId} has no calendar hold`, [
      "A guest paid, but their calendar hold no longer exists, so the dates are NOT blocked.",
      "Check the calendar, add the booking by hand, or refund in Stripe.",
      "",
      `Booking: ${m.bookingId}`,
      `Stay: ${m.checkIn} → ${m.checkOut}`,
      `Rooms: ${m.roomsLabel}`,
      `Guest: ${m.guestName} (${session.customer_details?.email ?? session.customer_email}, ${m.guestPhone})`,
      `Paid: ${label}`,
      `Stripe session: ${session.id}`,
    ]);
    return null;
  }
}

export async function releaseStripeSession(session: Stripe.Checkout.Session): Promise<void> {
  const eventId = session.metadata?.eventId;
  if (eventId) await releaseHold(eventId);
}
