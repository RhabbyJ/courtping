import { describe, expect, it } from "vitest";

import {
  DEFAULT_AVAILABILITY_TIME_ZONE,
  MockAvailabilityAdapter,
  findMatchingAvailabilitySlots,
  matchAvailabilitySlotsToAlertPreferences,
  type AvailabilityAlertPreference,
  type NormalizedAvailabilitySlot,
} from "../src/lib/availability";

describe("MockAvailabilityAdapter", () => {
  it("returns seeded Los Angeles venues and filters slots by sport", async () => {
    const adapter = new MockAvailabilityAdapter();

    const snapshot = await adapter.fetchAvailability({ sports: ["pickleball"] });

    expect(snapshot.source).toBe("mock-seeded-la");
    expect(snapshot.venues.length).toBeGreaterThan(0);
    expect(snapshot.slots.length).toBeGreaterThan(0);
    expect(snapshot.slots.every((slot) => slot.sport === "pickleball")).toBe(true);
    expect(
      snapshot.venues.every((venue) =>
        venue.courts.every((court) => court.sport === "pickleball"),
      ),
    ).toBe(true);
  });

  it("filters by overlapping query windows with exclusive end boundaries", async () => {
    const adapter = new MockAvailabilityAdapter();

    const snapshot = await adapter.fetchAvailability({
      startsAt: "2026-05-19T17:00:00.000Z",
      endsAt: "2026-05-19T18:00:00.000Z",
    });

    expect(snapshot.slots).toHaveLength(0);
  });
});

describe("availability matching", () => {
  it("matches open slots by court, sport, local day, and minimum overlap", () => {
    const slot = makeSlot({
      startsAt: "2026-05-19T16:00:00.000Z",
      endsAt: "2026-05-19T17:00:00.000Z",
    });
    const alert = makeAlert({
      sport: "tennis",
      venueIds: ["griffith-park-riverside"],
      courtIds: ["griffith-tennis-1"],
      daysOfWeek: [2],
      timeWindows: [{ start: "08:30", end: "09:30" }],
      minDurationMinutes: 30,
    });

    const matches = findMatchingAvailabilitySlots(alert, [slot]);

    expect(matches).toHaveLength(1);
    expect(matches[0].slotId).toBe(slot.id);
    expect(matches[0].overlapMinutes).toBe(30);
    expect(matches[0].matchedWindow).toEqual({ start: "08:30", end: "09:30" });
  });

  it("does not match reserved slots or adjacent time windows", () => {
    const reservedSlot = makeSlot({
      id: "reserved-slot",
      status: "reserved",
      startsAt: "2026-05-19T16:00:00.000Z",
      endsAt: "2026-05-19T17:00:00.000Z",
    });
    const openSlot = makeSlot({
      id: "open-slot",
      startsAt: "2026-05-19T16:00:00.000Z",
      endsAt: "2026-05-19T17:00:00.000Z",
    });
    const alert = makeAlert({
      daysOfWeek: [2],
      timeWindows: [{ start: "10:00", end: "11:00" }],
    });

    const matches = findMatchingAvailabilitySlots(alert, [reservedSlot, openSlot]);

    expect(matches).toHaveLength(0);
  });

  it("requires the configured minimum overlap", () => {
    const slot = makeSlot({
      startsAt: "2026-05-19T16:00:00.000Z",
      endsAt: "2026-05-19T17:00:00.000Z",
    });
    const alert = makeAlert({
      daysOfWeek: [2],
      timeWindows: [{ start: "09:45", end: "10:15" }],
      minDurationMinutes: 30,
    });

    const matches = findMatchingAvailabilitySlots(alert, [slot]);

    expect(matches).toHaveLength(0);
  });

  it("sums overlap across an overnight window split across local days", () => {
    const slot = makeSlot({
      id: "overnight-slot",
      startsAt: "2026-05-19T06:30:00.000Z",
      endsAt: "2026-05-19T07:30:00.000Z",
    });
    const alert = makeAlert({
      daysOfWeek: [1],
      timeWindows: [{ start: "22:00", end: "01:00" }],
      minDurationMinutes: 60,
    });

    const matches = findMatchingAvailabilitySlots(alert, [slot]);

    expect(matches).toHaveLength(1);
    expect(matches[0].overlapMinutes).toBe(60);
  });

  it("creates at most one match per alert and slot when windows overlap", () => {
    const slot = makeSlot({
      startsAt: "2026-05-19T16:00:00.000Z",
      endsAt: "2026-05-19T17:00:00.000Z",
    });
    const alert = makeAlert({
      daysOfWeek: [2],
      timeWindows: [
        { start: "08:00", end: "09:30" },
        { start: "09:15", end: "10:15" },
      ],
    });

    const matches = findMatchingAvailabilitySlots(alert, [slot]);

    expect(matches).toHaveLength(1);
    expect(matches[0].overlapMinutes).toBe(45);
    expect(matches[0].matchedWindow).toEqual({ start: "09:15", end: "10:15" });
  });

  it("matches active alert preferences in batches and skips inactive preferences", () => {
    const tennisSlot = makeSlot({ id: "tennis-slot" });
    const pickleballSlot = makeSlot({
      id: "pickleball-slot",
      venueId: "cheviot-hills-recreation-center",
      venueName: "Cheviot Hills Recreation Center",
      courtId: "cheviot-pickleball-a",
      courtName: "Pickleball A",
      sport: "pickleball",
      startsAt: "2026-05-20T01:00:00.000Z",
      endsAt: "2026-05-20T02:00:00.000Z",
    });
    const activeTennisAlert = makeAlert({
      id: "alert-tennis",
      sport: "tennis",
      daysOfWeek: [2],
      timeWindows: [{ start: "09:00", end: "10:00" }],
    });
    const inactivePickleballAlert = makeAlert({
      id: "alert-pickleball",
      active: false,
      sport: "pickleball",
      daysOfWeek: [2],
      timeWindows: [{ start: "18:00", end: "19:00" }],
    });

    const matches = matchAvailabilitySlotsToAlertPreferences(
      [tennisSlot, pickleballSlot],
      [inactivePickleballAlert, activeTennisAlert],
    );

    expect(
      matches.map((match) => match.id),
    ).toEqual(["alert-tennis:tennis-slot"]);
  });
});

function makeAlert(
  overrides: Partial<AvailabilityAlertPreference> = {},
): AvailabilityAlertPreference {
  return {
    id: "alert-1",
    userId: "user-1",
    active: true,
    timeZone: DEFAULT_AVAILABILITY_TIME_ZONE,
    ...overrides,
  };
}

function makeSlot(overrides: Partial<NormalizedAvailabilitySlot> = {}): NormalizedAvailabilitySlot {
  return {
    id: "slot-1",
    source: "test",
    venueId: "griffith-park-riverside",
    venueName: "Griffith Park Riverside Courts",
    courtId: "griffith-tennis-1",
    courtName: "Court 1",
    sport: "tennis",
    startsAt: "2026-05-19T16:00:00.000Z",
    endsAt: "2026-05-19T17:00:00.000Z",
    timeZone: DEFAULT_AVAILABILITY_TIME_ZONE,
    status: "open",
    checkedAt: "2026-05-18T16:00:00.000Z",
    bookingUrl: "mock://courtping/venues/griffith-park-riverside",
    ...overrides,
  };
}
