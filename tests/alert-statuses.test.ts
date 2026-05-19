import { beforeEach, describe, expect, it } from "vitest";
import type { LiveStatus } from "../src/types/domain";
import { validateCreateAlertInput } from "../src/lib/data/validation";
import { listCourts, listFacilities, resetStoreForTests } from "../src/lib/data/store";

describe("alert creation by facility live status", () => {
  beforeEach(() => {
    resetStoreForTests();
  });

  it.each<LiveStatus>(["live_alerts", "manual_beta", "booking_link_only"])(
    "allows alert preferences for %s facilities",
    (liveStatus) => {
      const facility = listFacilities().find((candidate) => candidate.liveStatus === liveStatus);
      expect(facility).toBeDefined();
      const court = listCourts().find((candidate) => candidate.venueId === facility!.id);
      expect(court).toBeDefined();

      const result = validateCreateAlertInput({
        venueId: facility!.id,
        courtId: court!.id,
        sport: court!.sport,
        daysOfWeek: [1],
        startTime: "17:00",
        endTime: "19:00",
        channels: ["sms"],
        phone: "+15550101010",
        email: "demo@courtping.local"
      });

      expect(result.ok).toBe(true);
    }
  );
});

