// Turning a paid Stripe Checkout session into a confirmed booking.
// Called from the webhook and from the confirmation page (whichever runs
// first); confirmBooking() is idempotent so emails go out once.

import type Stripe from "stripe";
import { confirmBooking, getEvent, releaseHold, type BookingProps } from "./calendar";
import { sendBookingEmails, sendOwnerAlert } from "./email";
import { ghlBookingConfirmed } from "./ghl-booking";
import { isStripeTestMode } from "@/lib/payments/stripe";
import { getRequestToPayStatus, isMomoSandbox, momoFailureMessage } from "@/lib/payments/momo";

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
    if (newlyConfirmed) {
      await ghlBookingConfirmed(props, label, isStripeTestMode());
      await sendBookingEmails(props, label, isStripeTestMode());
    }
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

export type MomoBookingState =
  | { status: "confirmed" }
  | { status: "pending" }
  | { status: "failed"; message: string };

/**
 * Settle a MoMo booking by asking MTN for the payment status. Used by the
 * widget's polling and by MTN's callback (whose body is never trusted).
 * Idempotent: confirmBooking() only emails the first time.
 */
export async function checkMomoBooking(eventId: string, bookingId: string): Promise<MomoBookingState> {
  const event = await getEvent(eventId);
  const props = event?.extendedProperties?.private;
  if (!event || props?.bookingId !== bookingId) {
    return { status: "failed", message: "This booking request has expired. Please start again." };
  }
  if (props.status === "confirmed") return { status: "confirmed" };
  if (props.provider !== "momo" || !props.paymentRef) return { status: "pending" };

  const result = await getRequestToPayStatus(props.paymentRef);

  if (result.status === "SUCCESSFUL") {
    const label = `GH₵${Number(props.totalGhs).toLocaleString("en-US")} by MTN MoMo${isMomoSandbox() ? " (sandbox)" : ""}`;
    const { newlyConfirmed, props: confirmed } = await confirmBooking(eventId, {
      paymentRef: result.financialTransactionId || props.paymentRef,
      paidLabel: label,
    });
    if (newlyConfirmed) {
      await ghlBookingConfirmed(confirmed, label, isMomoSandbox());
      await sendBookingEmails(confirmed, label, isMomoSandbox());
    }
    return { status: "confirmed" };
  }

  if (result.status === "FAILED") {
    await releaseHold(eventId);
    return { status: "failed", message: momoFailureMessage(result.reason) };
  }

  // Still waiting for the guest to approve. Give up once the hold runs out.
  if (new Date(props.expiresAt ?? 0).getTime() <= Date.now()) {
    await releaseHold(eventId);
    return { status: "failed", message: momoFailureMessage("EXPIRED") };
  }
  return { status: "pending" };
}
