import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { WHATSAPP_NUMBER } from "@/data/rooms";
import { checkMomoBooking, finalizeStripeSession, paidLabel } from "@/lib/booking/confirm";
import { getEvent } from "@/lib/booking/calendar";
import { eachNight } from "@/lib/booking/availability";
import { getStripe } from "@/lib/payments/stripe";
import { CANCELLATION_POLICY } from "@/lib/booking/policy";

export const metadata: Metadata = {
  title: "Booking confirmed",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function formatDate(date: string): string {
  return new Date(date + "T12:00:00Z").toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** MoMo bookings: the widget redirects here with ?b=&e= once MTN confirms. */
async function loadMomoBooking(bookingId: string, eventId: string) {
  try {
    const state = await checkMomoBooking(eventId, bookingId);
    if (state.status !== "confirmed") return { paid: false as const };
    const p = (await getEvent(eventId))?.extendedProperties?.private ?? {};
    return {
      paid: true as const,
      confirmed: true,
      bookingId: p.bookingId,
      roomsLabel: p.roomsLabel,
      checkIn: p.checkIn,
      checkOut: p.checkOut,
      nights: String(eachNight(p.checkIn, p.checkOut).length),
      totalGhs: Number(p.totalGhs),
      paid_label: p.paid ?? "MTN MoMo",
      receiptNote: "MTN will send you an SMS receipt.",
    };
  } catch (err) {
    console.error("[reserve/confirmed] momo", err);
    return null;
  }
}

async function loadBooking(sessionId: string | undefined) {
  if (!sessionId?.startsWith("cs_")) return null;
  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") return { paid: false as const };
    // The webhook normally confirms first; this covers it arriving late.
    // null = paid but the hold was gone; the owner has been alerted.
    const confirmed = (await finalizeStripeSession(session)) !== null;
    const m = session.metadata ?? {};
    return {
      paid: true as const,
      confirmed,
      bookingId: m.bookingId,
      roomsLabel: m.roomsLabel,
      checkIn: m.checkIn,
      checkOut: m.checkOut,
      nights: m.nights,
      totalGhs: Number(m.totalGhs),
      paid_label: paidLabel(session),
      receiptNote: `A receipt is on its way to ${session.customer_details?.email ?? session.customer_email ?? "your email"}.`,
    };
  } catch (err) {
    console.error("[reserve/confirmed]", err);
    return null;
  }
}

export default async function ConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; b?: string; e?: string }>;
}) {
  const { session_id, b, e } = await searchParams;
  const booking =
    b && e && /^ARC-[0-9A-F]{8}$/.test(b) ? await loadMomoBooking(b, e) : await loadBooking(session_id);

  return (
    <section className="relative min-h-dvh w-full overflow-hidden">
      <div className="absolute inset-0 z-10 bg-black/60" />
      <Image
        src="/images/hero/main.jpg"
        alt="Aracuya floating villa"
        fill
        priority
        quality={85}
        sizes="100vw"
        className="object-cover"
      />

      <div className="relative z-20 flex min-h-dvh items-center justify-center px-5 py-32">
        <div className="w-full max-w-md rounded-lg border border-white/10 bg-white/5 p-6 text-cream backdrop-blur-xl md:p-8">
          {booking?.paid ? (
            <>
              <span className="block font-body text-[10px] font-medium uppercase tracking-[0.2em] text-cream/50">
                Booking {booking.bookingId}
              </span>
              <h1 className="mt-3 font-heading text-h3 font-light">
                {booking.confirmed ? "Your stay is confirmed" : "Payment received"}
              </h1>
              <p className="mt-3 font-body text-small text-cream/70">
                {booking.confirmed
                  ? "Thank you. We've received your payment and blocked your dates."
                  : "Thank you. We've received your payment and are confirming your dates by hand. We'll message you on WhatsApp shortly."}
                {" "}
                {booking.receiptNote}
              </p>

              <dl className="my-6 space-y-3 border-y border-white/10 py-6 font-body text-small">
                {[
                  ["Check-in", formatDate(booking.checkIn)],
                  ["Check-out", formatDate(booking.checkOut)],
                  ["Rooms", booking.roomsLabel],
                  ["Nights", booking.nights],
                  ["Total", `GH₵${booking.totalGhs.toLocaleString("en-US")}`],
                  ["Paid", booking.paid_label],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4">
                    <dt className="text-cream/50">{label}</dt>
                    <dd className="text-right">{value}</dd>
                  </div>
                ))}
              </dl>

              <p className="font-body text-xs text-cream/50">
                We&apos;ll message you on WhatsApp with directions and arrival details.
              </p>
              <p className="mt-3 font-body text-xs text-cream/50">{CANCELLATION_POLICY}</p>
            </>
          ) : (
            <>
              <h1 className="font-heading text-h3 font-light">
                {booking ? "Payment not completed" : "We couldn't find that booking"}
              </h1>
              <p className="mt-3 font-body text-small text-cream/70">
                {booking
                  ? "You weren't charged and your dates weren't booked."
                  : "If you were charged, message us and we'll sort it out right away."}
              </p>
            </>
          )}

          <div className="mt-6 flex flex-col gap-3">
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center rounded bg-cream px-8 py-3.5 font-body text-small font-medium uppercase tracking-wide text-black transition-all duration-300 hover:bg-white"
            >
              Message us on WhatsApp
            </a>
            <Link
              href={booking?.paid ? "/" : "/reserve"}
              className="text-center font-body text-xs uppercase tracking-wide text-cream/50 hover:text-cream"
            >
              {booking?.paid ? "Back to home" : "Try again"}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
