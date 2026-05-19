import type { AvailabilitySlot } from "@/types/domain";
import { listCourts, listVenues } from "@/lib/data/store";
import type { AvailabilityAdapter, AvailabilityQuery } from "./types";

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function atLocalTime(date: Date, hour: number) {
  const next = new Date(date);
  next.setHours(hour, 0, 0, 0);
  return next;
}

export class MockAvailabilityAdapter implements AvailabilityAdapter {
  name = "mock" as const;

  async listAvailability(query: AvailabilityQuery = {}): Promise<AvailabilitySlot[]> {
    const base = startOfDay(query.from ?? new Date());
    const days = query.days ?? 7;
    const slots: AvailabilitySlot[] = [];
    const liveFacilityIds = new Set(
      listVenues()
        .filter((venue) => venue.liveStatus === "live_alerts")
        .map((venue) => venue.id)
    );

    for (let offset = 0; offset < days; offset += 1) {
      const day = addDays(base, offset);

      for (const court of listCourts().filter((candidate) => candidate.active && liveFacilityIds.has(candidate.venueId))) {
        const startHour = court.sport === "tennis" ? 17 : 18;
        const start = atLocalTime(day, startHour);
        const end = atLocalTime(day, startHour + 1);

        slots.push({
          id: `mock-${court.id}-${start.toISOString()}`,
          venueId: court.venueId,
          courtId: court.id,
          sport: court.sport,
          startAt: start.toISOString(),
          endAt: end.toISOString(),
          status: "open",
          source: "mock"
        });
      }
    }

    return slots;
  }
}
