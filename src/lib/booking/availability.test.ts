// Availability math: overlapping stays, the check-out day staying free,
// holds, room counts and Airbnb iCal blocks.

import { describe, expect, it } from "vitest";
import {
  eventToBlock,
  nightlyFreeRooms,
  parseICalBlocks,
  parseRoomCount,
  rangeFits,
  type CalendarBlock,
} from "./availability";

const TOTAL = 3;
const block = (startNight: string, endNight: string, rooms = TOTAL): CalendarBlock => ({
  startNight,
  endNight,
  rooms,
});
const fits = (blocks: CalendarBlock[], checkIn: string, checkOut: string, rooms: number) =>
  rangeFits(nightlyFreeRooms(blocks, checkIn, checkOut, TOTAL), checkIn, checkOut, rooms);

describe("overlap rules", () => {
  const stay = [block("2027-03-10", "2027-03-13")]; // nights 10, 11, 12

  it("a new guest can check in on another's check-out day", () => {
    expect(fits(stay, "2027-03-13", "2027-03-15", 3)).toBe(true);
  });

  it("a new guest can check out on another's check-in day", () => {
    expect(fits(stay, "2027-03-08", "2027-03-10", 3)).toBe(true);
  });

  it.each([
    ["2027-03-09", "2027-03-11"], // overlaps the start
    ["2027-03-12", "2027-03-14"], // overlaps the end
    ["2027-03-11", "2027-03-12"], // inside
    ["2027-03-01", "2027-03-20"], // around
  ])("a whole-house block rejects %s → %s", (checkIn, checkOut) => {
    expect(fits(stay, checkIn, checkOut, 1)).toBe(false);
  });

  it("rooms add up per night and never go negative", () => {
    const blocks = [block("2027-03-10", "2027-03-12", 1), block("2027-03-11", "2027-03-13", 2)];
    expect(nightlyFreeRooms(blocks, "2027-03-09", "2027-03-14", TOTAL)).toEqual({
      "2027-03-09": 3,
      "2027-03-10": 2,
      "2027-03-11": 0,
      "2027-03-12": 1,
      "2027-03-13": 3,
    });
    expect(nightlyFreeRooms([...blocks, ...blocks], "2027-03-11", "2027-03-12", TOTAL)).toEqual({
      "2027-03-11": 0,
    });
  });

  it("one room booked leaves room for 2 but not the whole house", () => {
    const blocks = [block("2027-03-10", "2027-03-12", 1)];
    expect(fits(blocks, "2027-03-10", "2027-03-12", 2)).toBe(true);
    expect(fits(blocks, "2027-03-10", "2027-03-12", 3)).toBe(false);
  });
});

describe("eventToBlock (Google Calendar events)", () => {
  const NOW = Date.parse("2027-03-01T12:00:00Z");

  it("all-day events block [start, end): the end date is the free check-out day", () => {
    expect(
      eventToBlock({ start: { date: "2027-03-10" }, end: { date: "2027-03-12" } }, TOTAL, NOW)
    ).toEqual(block("2027-03-10", "2027-03-12"));
  });

  it("a 15:00 → 11:00 timed stay blocks the nights in between, not the check-out night", () => {
    expect(
      eventToBlock(
        {
          start: { dateTime: "2027-03-10T15:00:00Z" },
          end: { dateTime: "2027-03-13T11:00:00Z" },
        },
        TOTAL,
        NOW
      )
    ).toEqual(block("2027-03-10", "2027-03-13"));
  });

  it("a daytime slot (cleaning) blocks nothing", () => {
    expect(
      eventToBlock(
        { start: { dateTime: "2027-03-10T10:00:00Z" }, end: { dateTime: "2027-03-10T12:00:00Z" } },
        TOTAL,
        NOW
      )
    ).toBeNull();
  });

  it("cancelled events block nothing", () => {
    expect(
      eventToBlock(
        { status: "cancelled", start: { date: "2027-03-10" }, end: { date: "2027-03-12" } },
        TOTAL,
        NOW
      )
    ).toBeNull();
  });

  it("a checkout hold blocks until it expires, then frees the dates", () => {
    const hold = (expiresAt: string) => ({
      start: { date: "2027-03-10" },
      end: { date: "2027-03-12" },
      extendedProperties: {
        private: { source: "aracuya-site", status: "hold", rooms: "1", expiresAt },
      },
    });
    expect(eventToBlock(hold("2027-03-01T12:30:00Z"), TOTAL, NOW)).toEqual(
      block("2027-03-10", "2027-03-12", 1)
    );
    expect(eventToBlock(hold("2027-03-01T12:00:00Z"), TOTAL, NOW)).toBeNull();
    expect(eventToBlock(hold("garbage"), TOTAL, NOW)).toBeNull();
  });
});

describe("parseRoomCount", () => {
  it("trusts rooms from events this site created, capped at the total", () => {
    expect(parseRoomCount("Anything", { source: "aracuya-site", rooms: "2" }, TOTAL)).toBe(2);
    expect(parseRoomCount(null, { source: "aracuya-site", rooms: "9" }, TOTAL)).toBe(3);
  });

  it("ignores a rooms prop on events from elsewhere", () => {
    expect(parseRoomCount("Airbnb", { rooms: "1" }, TOTAL)).toBe(3);
  });

  it("reads '1 room' / '2 rooms' from hand-made titles", () => {
    expect(parseRoomCount("1 room booked", null, TOTAL)).toBe(1);
    expect(parseRoomCount("Kofi – 2 Rooms", null, TOTAL)).toBe(2);
  });

  it("anything else (Airbnb, Blocked) takes the whole house", () => {
    expect(parseRoomCount("Reserved", null, TOTAL)).toBe(3);
    expect(parseRoomCount("Blocked", undefined, TOTAL)).toBe(3);
  });
});

describe("parseICalBlocks (Airbnb feed)", () => {
  it("turns each VEVENT into a whole-house block with exclusive DTEND", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "DTSTART;VALUE=DATE:20270310",
      "DTEND;VALUE=DATE:20270313",
      "SUMMARY:1 room", // titles never reduce an Airbnb block
      "END:VEVENT",
      "BEGIN:VEVENT",
      "DTSTART:20270320T150000Z",
      "DTEND:20270322T110000Z",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    expect(parseICalBlocks(ics, TOTAL)).toEqual([
      block("2027-03-10", "2027-03-13"),
      block("2027-03-20", "2027-03-22"),
    ]);
  });

  it("unfolds continuation lines and skips events without both dates", () => {
    const ics = [
      "BEGIN:VEVENT",
      "DTSTART;VALUE=DATE:2027",
      " 0401",
      "DTEND;VALUE=DATE:20270402",
      "END:VEVENT",
      "BEGIN:VEVENT",
      "DTSTART;VALUE=DATE:20270405",
      "END:VEVENT",
    ].join("\n");
    expect(parseICalBlocks(ics, TOTAL)).toEqual([block("2027-04-01", "2027-04-02")]);
  });

  it("a booked iCal stay blocks the dates but leaves the check-out day free", () => {
    const blocks = parseICalBlocks(
      "BEGIN:VEVENT\nDTSTART;VALUE=DATE:20270310\nDTEND;VALUE=DATE:20270313\nEND:VEVENT",
      TOTAL
    );
    expect(fits(blocks, "2027-03-12", "2027-03-14", 1)).toBe(false);
    expect(fits(blocks, "2027-03-13", "2027-03-14", 3)).toBe(true);
  });
});
