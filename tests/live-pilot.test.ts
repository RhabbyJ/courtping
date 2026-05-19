import { beforeEach, describe, expect, it } from "vitest";
import { publishManualAvailabilitySlot } from "../src/lib/availability/manual-publish";
import {
  createAlert,
  createMonitoringRequest,
  listCourts,
  listFacilities,
  listMonitoringRequests,
  listNotificationEvents,
  resetStoreForTests,
} from "../src/lib/data/store";
import { validateMonitoringRequestInput } from "../src/lib/monitoring";

describe("live pilot operations", () => {
  beforeEach(() => {
    resetStoreForTests();
  });

  it("publishes a manual slot, matches active alerts, and creates a dry-run notification event", async () => {
    const { facility, court, startAt, endAt } = createMatchingAlertFixture();

    const result = await publishManualAvailabilitySlot({
      venueId: facility.id,
      courtId: court.id,
      sport: court.sport,
      startAt,
      endAt,
    });
    const events = listNotificationEvents();

    expect(result.matchCount).toBe(1);
    expect(result.notificationCount).toBe(1);
    expect(events).toHaveLength(1);
    expect(events[0].status).toBe("dry_run");
    expect(events[0].message).toContain(facility.bookingUrl);
  });

  it("does not spam duplicate notifications for the same manual slot", async () => {
    const { facility, court, startAt, endAt } = createMatchingAlertFixture();
    const input = {
      venueId: facility.id,
      courtId: court.id,
      sport: court.sport,
      startAt,
      endAt,
    };

    await publishManualAvailabilitySlot(input);
    const second = await publishManualAvailabilitySlot(input);

    expect(second.matchCount).toBe(1);
    expect(second.notificationCount).toBe(0);
    expect(second.duplicateCount).toBe(1);
    expect(listNotificationEvents()).toHaveLength(1);
  });

  it("saves monitoring requests with facility, sport, preferred time, and contact details", () => {
    const facility = listFacilities().find((candidate) => candidate.liveStatus === "manual_beta");
    expect(facility).toBeDefined();
    const validation = validateMonitoringRequestInput({
      facilityId: facility!.id,
      sport: facility!.sports[0],
      preferredTime: "Weekday evenings after 6pm",
      email: "pilot@example.com",
      phone: "+15550101010",
    });

    expect(validation.ok).toBe(true);
    if (validation.ok) {
      const saved = createMonitoringRequest(validation.value);

      expect(saved.facilityId).toBe(facility!.id);
      expect(saved.preferredTime).toBe("Weekday evenings after 6pm");
      expect(listMonitoringRequests()).toEqual([saved]);
    }
  });
});

function createMatchingAlertFixture() {
  const facility = listFacilities().find((candidate) => candidate.liveStatus === "live_alerts");
  expect(facility).toBeDefined();
  const court = listCourts().find(
    (candidate) => candidate.venueId === facility!.id && candidate.sport === "tennis",
  );
  expect(court).toBeDefined();
  const start = new Date(2026, 4, 19, 17, 0, 0, 0);
  const end = new Date(2026, 4, 19, 18, 0, 0, 0);

  createAlert({
    venueId: facility!.id,
    courtId: court!.id,
    sport: court!.sport,
    daysOfWeek: [start.getDay()],
    startTime: "17:00",
    endTime: "18:30",
    channels: ["sms"],
    phone: "+15550101010",
    email: "demo@courtping.local",
  });

  return {
    facility: facility!,
    court: court!,
    startAt: start.toISOString(),
    endAt: end.toISOString(),
  };
}
