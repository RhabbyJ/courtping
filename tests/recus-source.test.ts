import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildRecUsAvailabilityUrl,
  buildRecUsLocationsAvailabilityUrl,
  buildRecUsSportsUrl,
  RECUS_API_BASE_URL,
  type RecUsFetch,
} from "../src/lib/availability/recus-adapter";
import {
  getRecUsReservationRuleConfig,
  getRecUsSourceConfig,
  RECUS_ALLOWED_ORGANIZATION_SLUGS,
  RECUS_BETA_SOURCE_CONFIGS,
  RECUS_RESERVATION_RULE_CONFIGS,
  RECUS_SOURCE_ID,
  toRecUsOrganizationConfig,
  validateRecUsReservationRuleConfig,
  validateRecUsSourceConfig,
  type RecUsAvailabilitySourceConfig,
  type RecUsReservationRuleConfig,
} from "../src/lib/availability/recus-source-config";
import {
  runAvailabilitySourceCheck,
  runRecUsSourceCheck,
} from "../src/lib/availability/source-runner";
import {
  DEFAULT_AVAILABILITY_TIME_ZONE,
  matchAvailabilitySlotsToAlertPreferences,
  type AvailabilityAlertPreference,
} from "../src/lib/availability";

const fixtureRoot = path.join(process.cwd(), "tests", "fixtures", "recus");
const checkedAt = "2026-05-18T18:30:00.000Z";

describe("Rec.us beta source config", () => {
  it("keeps all beta candidates disabled by default and scoped to allowed orgs", () => {
    expect(RECUS_ALLOWED_ORGANIZATION_SLUGS).toEqual([
      "city-of-belmont",
      "san-francisco-rec-park",
      "rocklin",
    ]);
    expect(RECUS_BETA_SOURCE_CONFIGS.map((config) => config.organizationSlug)).toEqual([
      "city-of-belmont",
      "san-francisco-rec-park",
      "rocklin",
    ]);

    for (const config of RECUS_BETA_SOURCE_CONFIGS) {
      expect(config.sourceId).toBe(RECUS_SOURCE_ID);
      expect(config.enabled).toBe(false);
      expect(config.betaOnly).toBe(true);
      expect(config.manualLiveCheckOnly).toBe(true);
      expect(config.allowedSports).toEqual(["tennis", "pickleball"]);
      expect(validateRecUsSourceConfig(config).errors).toEqual([]);
    }
    expect(RECUS_BETA_SOURCE_CONFIGS.map((config) => config.organizationSlug)).not.toContain("alameda");
  });

  it("rejects unknown Rec.us orgs and keeps Alameda unsupported", () => {
    const invalidConfig = {
      ...RECUS_BETA_SOURCE_CONFIGS[0],
      organizationSlug: "alameda",
    } as RecUsAvailabilitySourceConfig;

    expect(getRecUsSourceConfig("city-of-belmont")).toBeDefined();
    expect(RECUS_ALLOWED_ORGANIZATION_SLUGS).not.toContain("alameda");
    expect(validateRecUsSourceConfig(invalidConfig).errors).toContain(
      'Unsupported Rec.us organizationSlug "alameda".',
    );
  });

  it("builds bounded Rec.us organization configs from the facility allowlist", () => {
    const rocklin = getRecUsSourceConfig("rocklin");

    expect(rocklin).toBeDefined();
    const organization = toRecUsOrganizationConfig(rocklin!);

    expect(organization).toMatchObject({
      slug: "rocklin",
      name: "City of Rocklin",
      city: "Rocklin",
      locationIds: [
        "bad275ad-738b-4e8d-9707-debd562b058f",
        "ed3a514c-b5c8-4128-a199-93a1afbd6b3f",
      ],
      siteIds: [
        "d0517c95-e3d7-4d2d-978a-1dce12d2daeb",
        "e2c83a28-d7c0-4da7-b104-7babe84512d4",
        "c6d8abb0-8f51-4bad-b99d-ba9ca5182fe2",
      ],
    });
    expect(organization.siteIds).toHaveLength(rocklin!.maxSitesPerCheck);
  });

  it("keeps static reservation rules scoped to beta orgs with unknown policy fields explicit", () => {
    expect(RECUS_RESERVATION_RULE_CONFIGS.map((config) => config.organizationSlug)).toEqual([
      "city-of-belmont",
      "san-francisco-rec-park",
      "rocklin",
    ]);
    expect(getRecUsReservationRuleConfig("san-francisco-rec-park")).toMatchObject({
      bookingUrl: "https://www.rec.us/sfrecpark",
      releaseWindowDays: null,
      releaseTimeLocal: null,
    });

    for (const config of RECUS_RESERVATION_RULE_CONFIGS) {
      const validation = validateRecUsReservationRuleConfig(config);

      expect(validation.errors).toEqual([]);
      expect(validation.warnings).toContain("releaseWindowDays is not confirmed.");
      expect(validation.warnings).toContain("releaseTimeLocal is not confirmed.");
      expect(validation.warnings).toContain("ruleSourceUrl is not confirmed.");
    }
    expect(RECUS_RESERVATION_RULE_CONFIGS.map((config) => config.organizationSlug)).not.toContain(
      "alameda",
    );
  });

  it("validates reservation rule guardrails for malformed or unsupported entries", () => {
    const invalidRule = {
      ...RECUS_RESERVATION_RULE_CONFIGS[0],
      organizationSlug: "alameda",
      releaseWindowDays: 0,
      releaseTimeLocal: "7am",
      bookingUrl: "http://www.rec.us/alameda",
      ruleSourceUrl: "http://example.test/rules",
    } as unknown as RecUsReservationRuleConfig;

    expect(validateRecUsReservationRuleConfig(invalidRule).errors).toEqual([
      'Unsupported Rec.us organizationSlug "alameda".',
      "releaseWindowDays must be a positive integer when known.",
      "releaseTimeLocal must use HH:mm format when known.",
      "bookingUrl must be an HTTPS URL.",
      "ruleSourceUrl must be an HTTPS URL when known.",
    ]);
  });
});

describe("Rec.us source runner", () => {
  it("does not call the adapter while the source config is disabled", async () => {
    const sfConfig = getRecUsSourceConfig("san-francisco-rec-park");
    expect(sfConfig).toBeDefined();
    const snapshot = await runAvailabilitySourceCheck(sfConfig!, {
      checkedAt,
      fetch: createFixtureFetch(),
      mode: "manual",
    });

    expect(snapshot).toMatchObject({
      sourceId: "rec-us",
      organizationSlug: "san-francisco-rec-park",
      checkedAt,
      status: "error",
      slotCount: 0,
      normalizedSlots: [],
      errors: ["Rec.us source config is disabled by default."],
      requestCount: 0,
      manualLiveCheckOnly: true,
    });
  });

  it("blocks scheduled mode for manual-live-check-only configs", async () => {
    const enabledSfConfig = enableConfig(getRecUsSourceConfig("san-francisco-rec-park")!);
    const snapshot = await runRecUsSourceCheck(enabledSfConfig, {
      checkedAt,
      fetch: createFixtureFetch(),
      mode: "scheduled",
    });

    expect(snapshot.status).toBe("error");
    expect(snapshot.requestCount).toBe(0);
    expect(snapshot.errors).toEqual([
      "Rec.us source config is manualLiveCheckOnly and cannot run in scheduled mode.",
    ]);
  });

  it("returns a normalized snapshot from SF Rec & Park fixtures in explicit manual mode", async () => {
    const enabledSfConfig = enableConfig(getRecUsSourceConfig("san-francisco-rec-park")!);
    const snapshot = await runRecUsSourceCheck(enabledSfConfig, {
      allowDisabled: true,
      checkedAt,
      fetch: createFixtureFetch(),
      mode: "manual",
    });

    expect(snapshot.status).toBe("success");
    expect(snapshot.sourceId).toBe("rec-us");
    expect(snapshot.organizationSlug).toBe("san-francisco-rec-park");
    expect(snapshot.requestCount).toBe(3);
    expect(snapshot.manualLiveCheckOnly).toBe(true);
    expect(snapshot.slotCount).toBe(6);
    expect(snapshot).not.toHaveProperty("notificationEvents");
    expect(snapshot).not.toHaveProperty("notificationDeliveries");
    expect(snapshot).not.toHaveProperty("smsDeliveries");
    expect(snapshot.normalizedSlots[0]).toMatchObject({
      source: "rec-us-public-poc",
      venueId: "81cd2b08-8ea6-40ee-8c89-aeba92506576",
      venueName: "Alice Marble",
      courtId: "c520577d-2c22-4e4e-8a92-c7709b0df07b",
      courtName: "Court 3",
      sport: "tennis",
      startsAt: "2026-05-24T14:30:00.000Z",
      endsAt: "2026-05-24T16:00:00.000Z",
      status: "open",
      checkedAt,
    });
  });

  it("returns an error snapshot when a fixture URL is not mapped", async () => {
    const badConfig = enableConfig(getRecUsSourceConfig("san-francisco-rec-park")!);
    const snapshot = await runRecUsSourceCheck(badConfig, {
      checkedAt,
      fetch: createFixtureFetch({ includeSiteAvailability: false }),
      mode: "manual",
    });

    expect(snapshot.status).toBe("error");
    expect(snapshot.requestCount).toBe(3);
    expect(snapshot.errors[0]).toContain("Unexpected live network request in Rec.us source fixture test");
  });

  it("dry-run matches Rec.us fixture slots to alert preferences without notifications", async () => {
    const enabledSfConfig = enableConfig(getRecUsSourceConfig("san-francisco-rec-park")!);
    const snapshot = await runRecUsSourceCheck(enabledSfConfig, {
      allowDisabled: true,
      checkedAt,
      fetch: createFixtureFetch(),
      mode: "manual",
    });
    const alert: AvailabilityAlertPreference = {
      id: "alert-rec-us-sf-tennis",
      userId: "user-1",
      active: true,
      sport: "tennis",
      venueIds: ["81cd2b08-8ea6-40ee-8c89-aeba92506576"],
      courtIds: ["c520577d-2c22-4e4e-8a92-c7709b0df07b"],
      daysOfWeek: [0],
      timeWindows: [{ start: "07:00", end: "09:00" }],
      minDurationMinutes: 60,
      timeZone: DEFAULT_AVAILABILITY_TIME_ZONE,
    };

    const matches = matchAvailabilitySlotsToAlertPreferences(snapshot.normalizedSlots, [alert]);

    expect(matches.map((match) => match.slotId)).toEqual([
      "recus:81cd2b08-8ea6-40ee-8c89-aeba92506576:c520577d-2c22-4e4e-8a92-c7709b0df07b:2026-05-24T07:30:00:90",
    ]);
    expect(matches[0]).toMatchObject({
      alertPreferenceId: "alert-rec-us-sf-tennis",
      overlapMinutes: 90,
    });
  });
});

function enableConfig(config: RecUsAvailabilitySourceConfig): RecUsAvailabilitySourceConfig {
  return {
    ...config,
    enabled: true,
    facilityAllowlist: config.facilityAllowlist.map((facility) => ({
      ...facility,
      courts: facility.courts.map((court) => ({ ...court })),
    })),
  };
}

function readFixture(fileName: string): string {
  return readFileSync(path.join(fixtureRoot, fileName), "utf8");
}

function createFixtureFetch(options: { includeSiteAvailability?: boolean } = {}): RecUsFetch {
  const includeSiteAvailability = options.includeSiteAvailability ?? true;
  const responses = new Map<string, string>([
    [buildRecUsSportsUrl(RECUS_API_BASE_URL), readFixture("recus-sports.json")],
    [
      buildRecUsLocationsAvailabilityUrl(RECUS_API_BASE_URL, "san-francisco-rec-park"),
      readFixture("sf-rec-park-alice-marble-org-sanitized.json"),
    ],
  ]);
  if (includeSiteAvailability) {
    responses.set(
      buildRecUsAvailabilityUrl(RECUS_API_BASE_URL, "c520577d-2c22-4e4e-8a92-c7709b0df07b"),
      readFixture("sf-rec-park-alice-marble-court-3-site-sanitized.json"),
    );
  }

  return async (url) => {
    const body = responses.get(url);
    if (!body) {
      throw new Error(`Unexpected live network request in Rec.us source fixture test: ${url}`);
    }

    return {
      ok: true,
      status: 200,
      async text() {
        return body;
      },
    };
  };
}
