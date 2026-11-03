"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { rooms } from "@/data/rooms";
import { useCurrency } from "@/context/CurrencyContext";
import type { PricingTier } from "@/types/room";

interface BookingCheckoutProps {
  variant: "light" | "dark";
  tier: PricingTier;
  checkIn: string;
  checkOut: string;
  nights: number;
  whatsappUrl: string;
  onBack: () => void;
}

type Method = "card" | "momo";

const property = rooms[0];
/** "off" hides MoMo; "sandbox" enables it with MTN's test numbers. Set at build time. */
const MOMO_MODE = process.env.NEXT_PUBLIC_MOMO_MODE ?? "off";
const MOMO_ENABLED = MOMO_MODE === "sandbox" || MOMO_MODE === "live";
const POLL_MS = 4000;
const POLL_LIMIT_MS = 6 * 60_000;

interface MomoWait {
  bookingId: string;
  eventId: string;
  number: string;
}

/** MoMo always charges in cedis, whatever currency the site is showing. */
function formatGhs(amount: number): string {
  return `GH₵${amount.toLocaleString("en-US")}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function BookingCheckout({
  variant,
  tier,
  checkIn,
  checkOut,
  nights,
  whatsappUrl,
  onBack,
}: BookingCheckoutProps) {
  const isDark = variant === "dark";
  const { formatPrice, rate } = useCurrency();
  const maxGuests = property.occupancy * tier.rooms;
  const totalGhs = tier.price * nights;
  const approxUsd = Math.ceil(totalGhs / rate);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [guests, setGuests] = useState(Math.min(2, maxGuests));
  const [method, setMethod] = useState<Method>("card");
  const [momoNumber, setMomoNumber] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [momoWait, setMomoWait] = useState<MomoWait | null>(null);

  // While waiting for MoMo approval, ask the server every few seconds.
  useEffect(() => {
    if (!momoWait) return;
    let stopped = false;
    const started = Date.now();
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const res = await fetch(
          `/api/booking/status?b=${momoWait!.bookingId}&e=${momoWait!.eventId}`,
          { cache: "no-store" }
        );
        const data = await res.json();
        if (stopped) return;
        if (data.status === "confirmed") {
          window.location.assign(`/reserve/confirmed?b=${momoWait!.bookingId}&e=${momoWait!.eventId}`);
          return;
        }
        if (data.status === "failed") {
          setMomoWait(null);
          setSubmitting(false);
          setError(data.message ?? "The MoMo payment didn't go through. Nothing was charged.");
          return;
        }
      } catch {
        // Network blip: keep polling.
      }
      if (Date.now() - started > POLL_LIMIT_MS) {
        setMomoWait(null);
        setSubmitting(false);
        setError("We didn't hear back from MTN in time. If you approved the payment, message us on WhatsApp and we'll confirm it.");
        return;
      }
      timer = setTimeout(poll, POLL_MS);
    }

    timer = setTimeout(poll, POLL_MS);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [momoWait]);

  const label = cn(
    "block font-body text-[10px] font-medium uppercase tracking-[0.2em]",
    isDark ? "text-cream/50" : "text-gray"
  );
  const input = cn(
    "mt-1.5 w-full rounded border bg-transparent px-3 py-2.5 font-body text-small outline-none transition-colors",
    isDark
      ? "border-white/15 text-cream placeholder:text-cream/30 focus:border-cream/50"
      : "border-gray-light text-black placeholder:text-gray/50 focus:border-green"
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rooms: tier.rooms,
          checkIn,
          checkOut,
          name,
          email,
          phone,
          guests,
          method,
          momoNumber: method === "momo" ? momoNumber : undefined,
          website,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.momo) {
        setMomoWait({ ...data.momo, number: momoNumber });
        return;
      }
      if (!res.ok || !data.url) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      window.location.assign(data.url);
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setSubmitting(false);
    }
  }

  const methodOption = (value: Method, title: string, detail: string, disabled = false) => (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded border p-3 transition-colors",
        disabled && "cursor-not-allowed opacity-40",
        method === value && !disabled
          ? isDark
            ? "border-cream/60 bg-white/5"
            : "border-green bg-green/5"
          : isDark
            ? "border-white/15"
            : "border-gray-light"
      )}
    >
      <input
        type="radio"
        name="method"
        value={value}
        checked={method === value}
        disabled={disabled}
        onChange={() => setMethod(value)}
        className={cn("mt-1", isDark ? "accent-cream" : "accent-green")}
      />
      <span>
        <span className={cn("block font-body text-small font-medium", isDark ? "text-cream" : "text-black")}>
          {title}
        </span>
        <span className={cn("block font-body text-xs", isDark ? "text-cream/50" : "text-gray")}>
          {detail}
        </span>
      </span>
    </label>
  );

  if (momoWait) {
    return (
      <div
        role="status"
        aria-live="polite"
        // The form is taller than this screen; bring the instructions into view.
        ref={(el) => el?.scrollIntoView({ block: "center", behavior: "smooth" })}
        className={cn("font-body", isDark ? "text-cream" : "text-black")}
      >
        <span className={label}>MTN Mobile Money</span>
        <h3 className="mt-3 font-heading text-h3 font-light">Approve on your phone</h3>
        <p className={cn("mt-3 text-small", isDark ? "text-cream/70" : "text-gray")}>
          We&apos;ve sent a payment request for <strong>{formatGhs(totalGhs)}</strong> to{" "}
          <strong>{momoWait.number}</strong>. Enter your MoMo PIN on your phone to confirm.
        </p>
        <p className={cn("mt-3 text-xs", isDark ? "text-cream/50" : "text-gray")}>
          No prompt? Dial <strong>*170#</strong>, choose <strong>My Wallet</strong>, then{" "}
          <strong>My Approvals</strong>.
        </p>
        <div className="mt-6 flex items-center gap-3 text-xs">
          <span
            className={cn(
              "h-4 w-4 animate-spin rounded-full border-2 border-t-transparent",
              isDark ? "border-cream/60" : "border-green"
            )}
          />
          <span className={isDark ? "text-cream/60" : "text-gray"}>Waiting for approval… keep this page open.</span>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate={false}>
      {/* Summary */}
      <button
        type="button"
        onClick={onBack}
        className={cn(
          "font-body text-xs uppercase tracking-wide transition-colors",
          isDark ? "text-cream/50 hover:text-cream" : "text-gray hover:text-black"
        )}
      >
        ← Change dates or rooms
      </button>

      <div className={cn("mt-4 font-body text-small", isDark ? "text-cream" : "text-black")}>
        <p className="font-medium">
          {tier.label} · {formatDate(checkIn)} – {formatDate(checkOut)}
        </p>
        <p className={cn("mt-1", isDark ? "text-cream/60" : "text-gray")}>
          {nights} night{nights === 1 ? "" : "s"} × {formatPrice(tier.price)} ={" "}
          <span className={isDark ? "text-cream" : "text-black"}>{formatPrice(totalGhs)}</span>
        </p>
      </div>

      <div className={cn("my-6 border-t", isDark ? "border-white/10" : "border-gray-light")} />

      {/* Guest details */}
      <div className="space-y-4">
        <label className="block">
          <span className={label}>Full name</span>
          <input className={input} required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="block">
          <span className={label}>Email</span>
          <input className={input} required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <div className="flex gap-3">
          <label className="block flex-1">
            <span className={label}>WhatsApp / phone</span>
            <input
              className={input}
              required
              type="tel"
              autoComplete="tel"
              placeholder="+1 555 123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>
          <label className="block w-24">
            <span className={label}>Guests</span>
            <select
              className={cn(input, isDark && "[&>option]:text-black")}
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
            >
              {Array.from({ length: maxGuests }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Honeypot: hidden from people, tempting to bots */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          className="absolute -left-[9999px] h-0 w-0 opacity-0"
          aria-hidden="true"
        />
      </div>

      <div className={cn("my-6 border-t", isDark ? "border-white/10" : "border-gray-light")} />

      {/* Payment method */}
      <fieldset>
        <legend className={label}>How will you pay?</legend>
        <div className="mt-3 space-y-2">
          {methodOption(
            "card",
            "Card issued outside Ghana",
            `Visa, Mastercard, Amex, Apple Pay · charged in USD (about $${approxUsd.toLocaleString("en-US")})`
          )}
          {methodOption(
            "momo",
            "MTN Mobile Money",
            MOMO_ENABLED
              ? `Pay ${formatGhs(totalGhs)} from your MTN wallet · approve with your PIN`
              : "Coming soon",
            !MOMO_ENABLED
          )}
        </div>

        {method === "momo" && (
          <label className="mt-4 block">
            <span className={label}>MTN MoMo number to charge</span>
            <input
              className={input}
              required
              type="tel"
              inputMode="tel"
              placeholder="024 123 4567"
              value={momoNumber}
              onChange={(e) => setMomoNumber(e.target.value)}
            />
            {MOMO_MODE === "sandbox" && (
              <span className={cn("mt-1.5 block font-body text-[11px]", isDark ? "text-amber-200/70" : "text-amber-700")}>
                Sandbox: any number succeeds. 46733123450 fails, 46733123451 is declined.
              </span>
            )}
          </label>
        )}
        <p className={cn("mt-3 font-body text-xs", isDark ? "text-cream/50" : "text-gray")}>
          Paying with a Ghana-issued card, Telecel Cash or AirtelTigo Money?{" "}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn("underline", isDark ? "text-cream/80 hover:text-cream" : "text-green")}
          >
            Book on WhatsApp
          </a>
        </p>
      </fieldset>

      {error && (
        <p role="alert" className="mt-4 rounded border border-red-400/40 bg-red-500/10 px-3 py-2 font-body text-xs text-red-300">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className={cn(
          "mt-6 inline-flex w-full items-center justify-center rounded px-8 py-3.5 font-body text-small font-medium uppercase tracking-wide transition-all duration-300 disabled:cursor-wait disabled:opacity-60",
          isDark ? "bg-cream text-black hover:bg-white" : "bg-green text-white hover:bg-green-light"
        )}
      >
        {submitting
          ? "Holding your dates…"
          : method === "momo"
            ? "Send MoMo payment request"
            : "Continue to secure payment"}
      </button>
      <p className={cn("mt-3 text-center font-body text-[11px]", isDark ? "text-cream/40" : "text-gray")}>
        {method === "momo"
          ? "MTN will ask you to approve the payment on your phone. Your dates are held for 10 minutes."
          : "You'll pay on Stripe's secure page. Your dates are held for 30 minutes."}
      </p>
    </form>
  );
}
