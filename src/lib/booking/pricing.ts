// Server-side booking quotes. Never trust a price sent by the browser:
// the total is always recomputed here from src/data/rooms.ts.

import { rooms } from "@/data/rooms";
import type { PricingTier } from "@/types/room";
import { addDays, eachNight, isDateStr } from "./availability";

const property = rooms[0];
export const MAX_NIGHTS = 30;
/** How far ahead guests can book. */
export const MAX_DAYS_AHEAD = 548;

export interface Quote {
  tier: PricingTier;
  checkIn: string;
  checkOut: string;
  nights: number;
  nightlyGhs: number;
  totalGhs: number;
}

export class QuoteError extends Error {}

/** Today's date in Ghana (Africa/Accra is UTC+0). */
export function todayInGhana(): string {
  return new Date().toISOString().slice(0, 10);
}

export function quote(roomsWanted: unknown, checkIn: unknown, checkOut: unknown): Quote {
  const tier = property.pricingTiers.find((t) => t.rooms === roomsWanted);
  if (!tier) throw new QuoteError("Choose 1 room, 2 rooms or the entire house");
  if (!isDateStr(checkIn) || !isDateStr(checkOut)) {
    throw new QuoteError("Choose check-in and check-out dates");
  }
  const today = todayInGhana();
  if (checkIn < today) throw new QuoteError("Check-in can't be in the past");
  if (checkIn > addDays(today, MAX_DAYS_AHEAD)) {
    throw new QuoteError("That date is too far ahead to book online");
  }
  if (checkOut <= checkIn) throw new QuoteError("Check-out must be after check-in");

  const nights = eachNight(checkIn, checkOut).length;
  if (nights > MAX_NIGHTS) {
    throw new QuoteError(`Online bookings are limited to ${MAX_NIGHTS} nights`);
  }

  return {
    tier,
    checkIn,
    checkOut,
    nights,
    nightlyGhs: tier.price,
    totalGhs: tier.price * nights,
  };
}

/**
 * GHS per 1 USD, from the same source the site's currency toggle uses.
 * Cached for an hour. Throws rather than guessing: we charge real money with it.
 */
export async function getGhsPerUsd(): Promise<number> {
  const res = await fetch("https://open.er-api.com/v6/latest/USD", {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`Exchange rate fetch failed: ${res.status}`);
  const data = (await res.json()) as { rates?: Record<string, number> };
  const rate = data.rates?.GHS;
  // Sanity bounds: reject obviously broken data instead of mischarging.
  if (!rate || rate < 5 || rate > 50) throw new Error(`Implausible GHS rate: ${rate}`);
  return rate;
}

/** USD cents for a GHS amount, rounded up to the next cent. */
export function ghsToUsdCents(ghs: number, ghsPerUsd: number): number {
  return Math.ceil((ghs / ghsPerUsd) * 100);
}
