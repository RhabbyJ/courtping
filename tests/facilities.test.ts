import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import { filterFacilities, getLiveStatusLabel, parseFacilitiesCsv } from "../src/lib/facilities";
import { listFacilities, resetStoreForTests } from "../src/lib/data/store";

describe("facility directory", () => {
  beforeEach(() => {
    resetStoreForTests();
  });

  it("filters facilities by sport, live status, city, and neighborhood", () => {
    const facilities = listFacilities();

    expect(filterFacilities(facilities, { sport: "pickleball" }).every((facility) => facility.sports.includes("pickleball"))).toBe(true);
    expect(filterFacilities(facilities, { liveStatus: "live_alerts" })).toHaveLength(1);
    expect(filterFacilities(facilities, { location: "Los Angeles / Los Feliz" }).map((facility) => facility.slug)).toEqual([
      "griffith-riverside-courts"
    ]);
    expect(filterFacilities(facilities, { query: "mar vista" }).map((facility) => facility.slug)).toEqual([
      "mar-vista-recreation-center"
    ]);
  });

  it("maps live statuses to user-facing labels", () => {
    expect(getLiveStatusLabel("live_alerts")).toBe("Live alerts");
    expect(getLiveStatusLabel("manual_beta")).toBe("Manual beta");
    expect(getLiveStatusLabel("booking_link_only")).toBe("Booking link only");
    expect(getLiveStatusLabel("coming_soon")).toBe("Coming soon");
  });

  it("validates the sample CSV import", () => {
    const csv = readFileSync("data/facilities.sample.csv", "utf8");
    const result = parseFacilitiesCsv(csv);

    expect(result.errors).toEqual([]);
    expect(result.facilities).toHaveLength(10);
    expect(result.facilities[0].sourceUrl).toContain("TODO");
  });

  it("rejects invalid CSV live statuses", () => {
    const csv = [
      "id,name,slug,address,city,neighborhood,latitude,longitude,sports,numberOfCourts,indoorOutdoor,lights,publicPrivate,bookingUrl,sourceUrl,liveStatus,sourcePlatform,notes",
      "bad,Bad Facility,bad-facility,123 Test,Los Angeles,Test,34,-118,tennis,1,outdoor,true,public,https://example.com,TODO,instant_live,manual,"
    ].join("\n");
    const result = parseFacilitiesCsv(csv);

    expect(result.errors.join(" ")).toContain("liveStatus is invalid");
    expect(result.facilities).toHaveLength(0);
  });
});

