"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

interface CalendarProps {
  variant?: "light" | "dark";
  checkIn: string;
  checkOut: string;
  onSelectCheckIn: (date: string) => void;
  onSelectCheckOut: (date: string) => void;
  onClose: () => void;
  /** Rooms the guest wants; nights with fewer free rooms are unavailable. */
  roomsNeeded?: number;
  /** Called with free-room counts per night as months load. */
  onAvailability?: (nights: Record<string, number>) => void;
}

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export function Calendar({
  variant = "light",
  checkIn,
  checkOut,
  onSelectCheckIn,
  onSelectCheckOut,
  onClose,
  roomsNeeded = 1,
  onAvailability,
}: CalendarProps) {
  const today = useMemo(() => {
    const now = new Date();
    return toDateStr(now);
  }, []);

  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());
  // Free rooms per night, merged across every month fetched so far.
  const [nights, setNights] = useState<Record<string, number>>({});
  const [selectingCheckOut, setSelectingCheckOut] = useState(false);

  const isDark = variant === "dark";

  // Fetch availability for current visible month + next month
  useEffect(() => {
    const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const endMonth = month === 11 ? 0 : month + 1;
    const endYear = month === 11 ? year + 1 : year;
    const endDays = getDaysInMonth(endYear, endMonth);
    const end = `${endYear}-${String(endMonth + 1).padStart(2, "0")}-${String(endDays).padStart(2, "0")}`;

    fetch(`/api/availability?start=${start}&end=${end}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.nights) {
          setNights((prev) => ({ ...prev, ...data.nights }));
          onAvailability?.(data.nights);
        }
      })
      .catch(() => {
        // Silently fail — all dates appear available
      });
    // onAvailability is a callback prop; refetching on its identity is pointless
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  const prevMonth = useCallback(() => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }, [month]);

  const nextMonth = useCallback(() => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }, [month]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const isPast = (dateStr: string) => dateStr < today;
  // A night is unavailable when it has fewer free rooms than the guest needs.
  const isNightFull = (dateStr: string) =>
    (nights[dateStr] ?? Number.POSITIVE_INFINITY) < roomsNeeded;

  // Every night in [from, to) has enough rooms.
  const rangeIsFree = (from: string, to: string) => {
    const current = new Date(from + "T12:00:00");
    const end = new Date(to + "T12:00:00");
    while (current < end) {
      if (isNightFull(toDateStr(current))) return false;
      current.setDate(current.getDate() + 1);
    }
    return true;
  };

  // A full night can still be a checkout day: the guest leaves that morning.
  const isValidCheckOut = (dateStr: string) =>
    selectingCheckOut &&
    !!checkIn &&
    !checkOut &&
    dateStr > checkIn &&
    rangeIsFree(checkIn, dateStr);

  const isBooked = (dateStr: string) =>
    isNightFull(dateStr) && !isValidCheckOut(dateStr);
  const isDisabled = (dateStr: string) => isPast(dateStr) || isBooked(dateStr);

  const isCheckIn = (dateStr: string) => dateStr === checkIn;
  const isCheckOut = (dateStr: string) => dateStr === checkOut;
  const isInRange = (dateStr: string) => {
    if (!checkIn || !checkOut) return false;
    return dateStr > checkIn && dateStr < checkOut;
  };

  function handleDayClick(dateStr: string) {
    if (isDisabled(dateStr)) return;

    if (!selectingCheckOut || !checkIn) {
      // Selecting check-in
      onSelectCheckIn(dateStr);
      onSelectCheckOut("");
      setSelectingCheckOut(true);
    } else {
      // Selecting check-out
      if (dateStr <= checkIn) {
        // Clicked before check-in — reset and use as new check-in
        onSelectCheckIn(dateStr);
        onSelectCheckOut("");
      } else {
        if (!rangeIsFree(checkIn, dateStr)) {
          // Can't book across full nights — start over from the clicked date
          // (if that night itself is full, isDisabled already stopped the click).
          onSelectCheckIn(dateStr);
          onSelectCheckOut("");
        } else {
          onSelectCheckOut(dateStr);
          setSelectingCheckOut(false);
          onClose();
        }
      }
    }
  }

  // Can go back only if month is current or future
  const canGoPrev =
    year > new Date().getFullYear() ||
    (year === new Date().getFullYear() && month > new Date().getMonth());

  return (
    <div
      className={cn(
        "w-full rounded-lg p-4",
        isDark
          ? "border border-white/10 bg-black/95 backdrop-blur-xl"
          : "border border-gray-light bg-white shadow-lg"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          disabled={!canGoPrev}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded transition-colors",
            canGoPrev
              ? isDark
                ? "text-cream hover:bg-white/10"
                : "text-black hover:bg-gray-light"
              : "cursor-not-allowed opacity-30"
          )}
          aria-label="Previous month"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <span
          className={cn(
            "font-heading text-body font-light",
            isDark ? "text-cream" : "text-black"
          )}
        >
          {MONTHS[month]} {year}
        </span>

        <button
          onClick={nextMonth}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded transition-colors",
            isDark
              ? "text-cream hover:bg-white/10"
              : "text-black hover:bg-gray-light"
          )}
          aria-label="Next month"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Selecting hint */}
      <p
        className={cn(
          "mt-2 text-center font-body text-[10px] uppercase tracking-[0.2em]",
          isDark ? "text-cream/40" : "text-gray"
        )}
      >
        {selectingCheckOut && checkIn
          ? "Select check-out date"
          : "Select check-in date"}
      </p>

      {/* Day headers */}
      <div className="mt-3 grid grid-cols-7 gap-0">
        {DAYS.map((day) => (
          <div
            key={day}
            className={cn(
              "py-1 text-center font-body text-[10px] font-medium uppercase tracking-wider",
              isDark ? "text-cream/40" : "text-gray"
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-0">
        {/* Empty cells for days before the 1st */}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const disabled = isDisabled(dateStr);
          const booked = isBooked(dateStr);
          const selected = isCheckIn(dateStr) || isCheckOut(dateStr);
          const inRange = isInRange(dateStr);

          return (
            <button
              key={dateStr}
              onClick={() => handleDayClick(dateStr)}
              disabled={disabled}
              className={cn(
                "relative aspect-square flex items-center justify-center font-body text-small transition-colors duration-150",
                // Base states
                disabled && !booked && "cursor-not-allowed opacity-30",
                booked &&
                  (isDark
                    ? "cursor-not-allowed text-cream/20 line-through"
                    : "cursor-not-allowed text-gray/30 line-through"),
                // Selected (check-in or check-out)
                selected &&
                  (isDark
                    ? "bg-cream text-black font-medium"
                    : "bg-green text-white font-medium"),
                // In range
                inRange &&
                  !disabled &&
                  (isDark ? "bg-white/10 text-cream" : "bg-green/10 text-green"),
                // Normal available
                !disabled &&
                  !selected &&
                  !inRange &&
                  (isDark
                    ? "text-cream hover:bg-white/10"
                    : "text-black hover:bg-gray-light")
              )}
              aria-label={`${MONTHS[month]} ${day}, ${year}${booked ? " (booked)" : ""}${selected ? " (selected)" : ""}`}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div
        className={cn(
          "mt-3 flex items-center justify-center gap-4 font-body text-[10px]",
          isDark ? "text-cream/40" : "text-gray"
        )}
      >
        <span className="flex items-center gap-1">
          <span
            className={cn(
              "inline-block h-2 w-2 rounded-full",
              isDark ? "bg-cream/20" : "bg-gray/30"
            )}
          />
          Booked
        </span>
        <span className="flex items-center gap-1">
          <span
            className={cn(
              "inline-block h-2 w-2 rounded-full",
              isDark ? "bg-cream" : "bg-green"
            )}
          />
          Selected
        </span>
      </div>
    </div>
  );
}
