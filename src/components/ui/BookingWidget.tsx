"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { eachNight, rangeFits } from "@/lib/booking/availability";
import { BookingCheckout } from "@/components/ui/BookingCheckout";
import { WHATSAPP_NUMBER, rooms } from "@/data/rooms";
import { useCurrency } from "@/context/CurrencyContext";
import { Calendar } from "@/components/ui/Calendar";
import { BookingHelp } from "@/components/ui/BookingHelp";

interface BookingWidgetProps {
  variant?: "light" | "dark";
  /** The guest just came back from Stripe without paying. */
  paymentCancelled?: boolean;
}

const property = rooms[0];

function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatDateFull(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function BookingWidget({ variant = "light", paymentCancelled = false }: BookingWidgetProps) {
  const [selectedTier, setSelectedTier] = useState(0);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  // Free rooms per night, reported by the calendar as it loads months.
  const [nights, setNights] = useState<Record<string, number>>({});
  const { formatPrice } = useCurrency();
  const calendarRef = useRef<HTMLDivElement>(null);

  const tier = property.pricingTiers[selectedTier];

  const handleAvailability = useCallback((loaded: Record<string, number>) => {
    setNights((prev) => ({ ...prev, ...loaded }));
  }, []);

  // Once dates are picked, an option is only offered if every night fits it.
  const tierFits = (rooms: number) =>
    !checkIn || !checkOut || rangeFits(nights, checkIn, checkOut, rooms);
  const isDark = variant === "dark";

  const [step, setStep] = useState<"select" | "details">("select");
  // Coming back from Stripe without paying (see /api/booking/cancel).
  const [notice, setNotice] = useState(
    paymentCancelled
      ? "Payment wasn't completed, so nothing was charged and your dates were released. If you have any issues, send us a message on WhatsApp."
      : ""
  );
  const stayNights = checkIn && checkOut ? eachNight(checkIn, checkOut).length : 0;
  const canReserve = stayNights > 0 && tierFits(tier.rooms);

  // Drop ?payment=cancelled so a refresh doesn't show the notice again.
  useEffect(() => {
    if (!paymentCancelled) return;
    const params = new URLSearchParams(window.location.search);
    params.delete("payment");
    const query = params.toString();
    window.history.replaceState(null, "", window.location.pathname + (query ? `?${query}` : ""));
  }, [paymentCancelled]);

  // Close calendar when clicking outside
  useEffect(() => {
    if (!calendarOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(e.target as Node)
      ) {
        setCalendarOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [calendarOpen]);

  function getWhatsAppUrl() {
    let message = `Hello, I'd like to book ${tier.label} at Aracuya`;

    if (checkIn && checkOut) {
      message += ` from ${formatDateFull(checkIn)} to ${formatDateFull(checkOut)}`;
    }

    message += `. (${formatPrice(tier.price)}/night)`;

    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  }

  const shell = cn(
    "w-full rounded-lg p-6 md:p-8",
    isDark
      ? "border border-white/10 bg-white/5 backdrop-blur-xl"
      : "border border-gray-light bg-white"
  );

  if (step === "details" && checkIn && checkOut) {
    return (
      <div className={shell}>
        <BookingCheckout
          variant={variant}
          tier={tier}
          checkIn={checkIn}
          checkOut={checkOut}
          nights={stayNights}
          whatsappUrl={getWhatsAppUrl()}
          onBack={() => setStep("select")}
        />
      </div>
    );
  }

  return (
    <div className={shell}>
      {notice && (
        <p
          role="status"
          className={cn(
            "mb-6 rounded border px-3 py-2 font-body text-xs",
            isDark ? "border-white/15 text-cream/80" : "border-gray-light text-gray"
          )}
        >
          {notice}
        </p>
      )}

      {/* Room selector */}
      <div>
        <span
          className={cn(
            "block font-body text-[10px] font-medium uppercase tracking-[0.2em]",
            isDark ? "text-cream/50" : "text-gray"
          )}
        >
          Rooms
        </span>

        <div className="mt-3 flex gap-4 sm:gap-6">
          {property.pricingTiers.map((t, i) => {
            const fits = tierFits(t.rooms);
            return (
            <button
              key={t.rooms}
              onClick={() => setSelectedTier(i)}
              disabled={!fits}
              title={fits ? undefined : "Not available for these dates"}
              className={cn(
                "border-b-2 pb-1 font-body text-small font-medium transition-all duration-200",
                !fits && "cursor-not-allowed line-through opacity-40",
                selectedTier === i
                  ? isDark
                    ? "border-cream text-cream"
                    : "border-green text-black"
                  : cn(
                      "border-transparent",
                      isDark
                        ? "text-cream/40 hover:text-cream/70"
                        : "text-gray hover:text-black"
                    )
              )}
            >
              {t.label}
            </button>
            );
          })}
        </div>

        <p className="mt-3">
          <span
            className={cn(
              "font-heading text-h3 font-light",
              isDark ? "text-cream" : "text-green"
            )}
          >
            {formatPrice(tier.price)}
          </span>
          <span
            className={cn(
              "ml-1.5 font-body text-xs",
              isDark ? "text-cream/40" : "text-gray"
            )}
          >
            / night
          </span>
        </p>
      </div>

      {/* Divider */}
      <div
        className={cn(
          "my-6 border-t",
          isDark ? "border-white/10" : "border-gray-light"
        )}
      />

      {/* Date selector */}
      <div ref={calendarRef} className="relative">
        <span
          className={cn(
            "block font-body text-[10px] font-medium uppercase tracking-[0.2em]",
            isDark ? "text-cream/50" : "text-gray"
          )}
        >
          Dates
        </span>

        <button
          onClick={() => setCalendarOpen(!calendarOpen)}
          className={cn(
            "mt-2 flex w-full items-center justify-between border-b py-2 text-left font-body text-small transition-colors",
            isDark
              ? "border-cream/20 hover:border-cream/40"
              : "border-gray-light hover:border-green/40",
            calendarOpen &&
              (isDark ? "border-cream/50" : "border-green")
          )}
        >
          <span
            className={cn(
              checkIn
                ? isDark
                  ? "text-cream"
                  : "text-black"
                : isDark
                  ? "text-cream/30"
                  : "text-gray/50"
            )}
          >
            {checkIn && checkOut
              ? `${formatDateDisplay(checkIn)} — ${formatDateDisplay(checkOut)}`
              : checkIn
                ? `${formatDateDisplay(checkIn)} — Select check-out`
                : "Select dates"}
          </span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className={cn(
              "transition-transform duration-200",
              isDark ? "text-cream/40" : "text-gray",
              calendarOpen && "rotate-180"
            )}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* Calendar dropdown */}
        {calendarOpen && (
          <div className="absolute left-0 right-0 z-50 mt-2">
            <Calendar
              variant={variant}
              checkIn={checkIn}
              checkOut={checkOut}
              onSelectCheckIn={setCheckIn}
              onSelectCheckOut={setCheckOut}
              onClose={() => setCalendarOpen(false)}
              roomsNeeded={tier.rooms}
              onAvailability={handleAvailability}
            />
          </div>
        )}
      </div>

      {/* Divider */}
      <div
        className={cn(
          "my-6 border-t",
          isDark ? "border-white/10" : "border-gray-light"
        )}
      />

      {/* CTA */}
      <div>
        {stayNights > 0 && (
          <p
            className={cn(
              "mb-4 flex justify-between font-body text-small",
              isDark ? "text-cream/60" : "text-gray"
            )}
          >
            <span>
              {stayNights} night{stayNights === 1 ? "" : "s"} × {formatPrice(tier.price)}
            </span>
            <span className={isDark ? "text-cream" : "text-black"}>
              {formatPrice(tier.price * stayNights)}
            </span>
          </p>
        )}
        <button
          type="button"
          disabled={!canReserve}
          onClick={() => {
            setNotice("");
            setStep("details");
          }}
          className={cn(
            "inline-flex w-full items-center justify-center rounded px-8 py-3.5 font-body text-small font-medium uppercase tracking-wide transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40",
            isDark
              ? "bg-cream text-black hover:bg-white focus-visible:outline-cream"
              : "bg-green text-white hover:bg-green-light focus-visible:outline-green"
          )}
        >
          {checkIn && checkOut ? "Reserve" : "Select dates to reserve"}
        </button>
        <BookingHelp href={getWhatsAppUrl()} isDark={isDark} />
      </div>
    </div>
  );
}
