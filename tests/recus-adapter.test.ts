import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  RECUS_API_BASE_URL,
  RecUsAdapter,
  buildRecUsAvailabilityUrl,
  buildRecUsLocationsAvailabilityUrl,
  buildRecUsSportsUrl,
  extractRecUsLocationPageMetadata,
  parseRecUsAvailabilityPayload,
  parseRecUsLocationAvailabilitySlots,
  parseRecUsLocationsAvailabilityPayload,
  parseRecUsSiteAvailabilityDateMap,
  parseRecUsSportsPayload,
  type RecUsFetch,
  type RecUsOrganizationConfig,
  type RecUsVenueConfig,
} from "../src/lib/availability/recus-adapter";

const fixtureRoot = path.join(process.cwd(), "tests", "fixtures", "recus");
const checkedAt = "2026-05-18T18:30:00.000Z";

describe("RecUsAdapter feasibility POC", () => {
  it("extracts Rec.us location metadata from a saved public page fixture", () => {
    const metadata = extractRecUsLocationPageMetadata(readFixture("hallmark-location.html"));

    expect(metadata).toEqual({
      buildId: "aPhV4Bi2hBK1ZqHy22JBz",
      locationId: "756355b6-f361-483e-af56-6321ce50d782",
      organizationSlug: undefined,
      page: "/locations/[locationId]",
    });
  });

  it("normalizes saved Rec.us availability JSON into CourtPing slots", () => {
    const payload = JSON.parse(readFixture("hallmark-tennis-availability.json")) as unknown;
    const slots = parseRecUsAvailabilityPayload(payload, {
      venue: hallmarkVenue,
      site: hallmarkVenue.sites[0],
      checkedAt,
      locationMetadata: {
        buildId: "aPhV4Bi2hBK1ZqHy22JBz",
        locationId: "756355b6-f361-483e-af56-6321ce50d782",
      },
    });

    expect(slots).toHaveLength(2);
    expect(slots[0]).toMatchObject({
      id: "recus:slot-hallmark-tennis-1-20260519-1700",
      source: "rec-us-public-poc",
      venueId: "belmont-hallmark-park-courts",
      venueName: "Hallmark Park Courts",
      courtId: "site-hallmark-tennis-1",
      courtName: "Tennis Court 1",
      sport: "tennis",
      startsAt: "2026-05-20T00:00:00.000Z",
      endsAt: "2026-05-20T01:00:00.000Z",
      timeZone: "America/Los_Angeles",
      status: "open",
      checkedAt,
      bookingUrl: "https://www.rec.us/reservations/slot-hallmark-tennis-1-20260519-1700",
    });
    expect(slots[1].status).toBe("reserved");
  });

  it("fetches saved location and availability fixtures without live network calls", async () => {
    const requests: string[] = [];
    const fetch = createFixtureFetch(requests);
    const adapter = new RecUsAdapter({
      venues: [hallmarkVenue],
      checkedAt,
      fetch,
    });

    const snapshot = await adapter.fetchAvailability();

    expect(requests).toEqual([
      "https://www.rec.us/hallmarkcourts",
      buildRecUsAvailabilityUrl(RECUS_API_BASE_URL, "site-hallmark-tennis-1"),
      buildRecUsAvailabilityUrl(RECUS_API_BASE_URL, "site-hallmark-pickleball-a"),
    ]);
    expect(snapshot.source).toBe("rec-us-public-poc");
    expect(snapshot.venues).toHaveLength(1);
    expect(snapshot.venues[0].courts.map((court) => court.name)).toEqual([
      "Tennis Court 1",
      "Pickleball Court A",
    ]);
    expect(snapshot.slots.map((slot) => slot.id)).toEqual([
      "recus:slot-hallmark-tennis-1-20260519-1700",
      "recus:slot-hallmark-tennis-1-20260519-1800",
      "recus:slot-hallmark-pickleball-a-20260520-0800",
    ]);
  });

  it("filters normalized Rec.us slots by sport and time window", async () => {
    const adapter = new RecUsAdapter({
      venues: [hallmarkVenue],
      checkedAt,
      fetch: createFixtureFetch([]),
    });

    const snapshot = await adapter.fetchAvailability({
      sports: ["pickleball"],
      startsAt: "2026-05-20T14:00:00.000Z",
      endsAt: "2026-05-20T17:00:00.000Z",
    });

    expect(snapshot.slots).toHaveLength(1);
    expect(snapshot.slots[0]).toMatchObject({
      courtId: "site-hallmark-pickleball-a",
      sport: "pickleball",
      status: "open",
      startsAt: "2026-05-20T15:00:00.000Z",
      endsAt: "2026-05-20T16:30:00.000Z",
    });
    expect(snapshot.venues[0].courts).toHaveLength(1);
    expect(snapshot.venues[0].courts[0].sport).toBe("pickleball");
  });

  it("discovers Belmont organization courts from real public location availability fixtures", () => {
    const sportMappings = parseRecUsSportsPayload(readJsonFixture("recus-sports.json"));
    const discoveredVenues = parseRecUsLocationsAvailabilityPayload(
      readJsonFixture("city-of-belmont-locations-availability.json"),
      {
        organization: belmontOrganization,
        sportMappings,
      },
    );

    expect(sportMappings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          name: "Pickleball",
          sport: "pickleball",
        }),
        expect.objectContaining({
          id: "bd745b6e-1dd6-43e2-a69f-06f094808a96",
          name: "Tennis",
          sport: "tennis",
        }),
        expect.objectContaining({
          id: "5d391ce4-ef26-44b8-b75b-d2aff5441e37",
          name: "Badminton",
          sport: undefined,
        }),
      ]),
    );
    expect(discoveredVenues.map((venue) => ({
      id: venue.id,
      name: venue.name,
      courts: venue.sites.map((site) => ({
        id: site.id,
        name: site.name,
        sport: site.sport,
        availableSlotCount: site.availableSlots.length,
      })),
    }))).toEqual([
      {
        id: "99e7cd59-15cd-43aa-b0cc-9ed11f826840",
        name: "Alexander Courts",
        courts: [
          {
            id: "fcbda536-882f-44a2-9b27-18cd78b34fbe",
            name: "Pickleball Court 1",
            sport: "pickleball",
            availableSlotCount: 18,
          },
          {
            id: "9f1a2b51-e97c-4ebb-aa57-98741590844e",
            name: "Tennis Court 1",
            sport: "tennis",
            availableSlotCount: 18,
          },
          {
            id: "0c99d34e-c428-40d9-a4f3-743d4deb78ef",
            name: "Tennis Court 2",
            sport: "tennis",
            availableSlotCount: 17,
          },
          {
            id: "7b0a290d-c183-45f7-93bb-5dc309264cd0",
            name: "Pickleball Court 2",
            sport: "pickleball",
            availableSlotCount: 17,
          },
        ],
      },
      {
        id: "756355b6-f361-483e-af56-6321ce50d782",
        name: "Hallmark Courts",
        courts: [
          {
            id: "3fa817ad-4529-47cf-b0ae-a22c0c5b081c",
            name: "Pickleball Court 1",
            sport: "pickleball",
            availableSlotCount: 32,
          },
          {
            id: "b9b7f92a-0357-4b81-ab4a-d9f4208f7b01",
            name: "Tennis Court 2",
            sport: "tennis",
            availableSlotCount: 37,
          },
          {
            id: "a8ab7944-c0b6-432f-bbed-89425a54e099",
            name: "Tennis Court 1",
            sport: "tennis",
            availableSlotCount: 32,
          },
          {
            id: "4c161448-1f7b-402b-8eda-895cf8704678",
            name: "Pickleball Court 2",
            sport: "pickleball",
            availableSlotCount: 37,
          },
        ],
      },
    ]);
  });

  it("filters out non-court and non-target Belmont resources", () => {
    const payload = readJsonFixture("city-of-belmont-locations-availability.json");
    const augmentedPayload = cloneJson(payload);
    const hallmarkCourts = augmentedPayload[1].location.courts;
    const tennisCourt = hallmarkCourts.find((court: { id?: string }) =>
      court.id === "a8ab7944-c0b6-432f-bbed-89425a54e099");

    hallmarkCourts.push({
      ...tennisCourt,
      id: "test-non-court-tennis-resource",
      type: "room",
      courtNumber: "Tennis Meeting Room",
    });
    hallmarkCourts.push({
      ...tennisCourt,
      id: "test-badminton-court",
      type: "court",
      courtNumber: "Badminton Court",
      sports: [
        {
          id: "test-badminton-sport-link",
          sportId: "5d391ce4-ef26-44b8-b75b-d2aff5441e37",
        },
      ],
    });

    const discoveredVenues = parseRecUsLocationsAvailabilityPayload(augmentedPayload, {
      organization: belmontOrganization,
      sportMappings: parseRecUsSportsPayload(readJsonFixture("recus-sports.json")),
    });
    const discoveredSiteIds = discoveredVenues.flatMap((venue) =>
      venue.sites.map((site) => site.id));

    expect(discoveredSiteIds).toHaveLength(8);
    expect(discoveredSiteIds).not.toContain("test-non-court-tennis-resource");
    expect(discoveredSiteIds).not.toContain("test-badminton-court");
  });

  it("normalizes Belmont location.courts availableSlots into CourtPing slots", () => {
    const slots = parseRecUsLocationAvailabilitySlots(
      readJsonFixture("city-of-belmont-locations-availability.json"),
      {
        organization: belmontOrganization,
        sportMappings: parseRecUsSportsPayload(readJsonFixture("recus-sports.json")),
        checkedAt,
      },
    );
    const firstSlot = slots[0];

    expect(slots).toHaveLength(208);
    expect(firstSlot).toMatchObject({
      source: "rec-us-public-poc",
      venueId: "99e7cd59-15cd-43aa-b0cc-9ed11f826840",
      venueName: "Alexander Courts",
      courtId: "fcbda536-882f-44a2-9b27-18cd78b34fbe",
      courtName: "Pickleball Court 1",
      sport: "pickleball",
      startsAt: "2026-05-19T01:30:00.000Z",
      endsAt: "2026-05-19T02:30:00.000Z",
      timeZone: "America/Los_Angeles",
      status: "open",
      checkedAt,
      bookingUrl: "https://www.rec.us/locations/99e7cd59-15cd-43aa-b0cc-9ed11f826840",
      metadata: {
        recUsLocationId: "99e7cd59-15cd-43aa-b0cc-9ed11f826840",
        recUsSiteId: "fcbda536-882f-44a2-9b27-18cd78b34fbe",
        recUsDurationMinutes: 60,
        recUsAvailabilityShape: "location-available-slots",
      },
    });
  });

  it("normalizes Belmont site-level date maps into CourtPing slots", () => {
    const slots = parseRecUsSiteAvailabilityDateMap(
      readJsonFixture("hallmark-tennis-court-1-site-availability.json"),
      {
        venue: hallmarkDiscoveredVenue,
        site: hallmarkDiscoveredVenue.sites[0],
        checkedAt,
      },
    );

    expect(slots).toHaveLength(16);
    expect(slots[0]).toMatchObject({
      source: "rec-us-public-poc",
      venueId: "756355b6-f361-483e-af56-6321ce50d782",
      venueName: "Hallmark Courts",
      courtId: "a8ab7944-c0b6-432f-bbed-89425a54e099",
      courtName: "Tennis Court 1",
      sport: "tennis",
      startsAt: "2026-05-19T15:00:00.000Z",
      endsAt: "2026-05-19T16:00:00.000Z",
      timeZone: "America/Los_Angeles",
      status: "open",
      checkedAt,
      bookingUrl: "https://www.rec.us/locations/756355b6-f361-483e-af56-6321ce50d782",
      metadata: {
        recUsLocationId: "756355b6-f361-483e-af56-6321ce50d782",
        recUsSiteId: "a8ab7944-c0b6-432f-bbed-89425a54e099",
        recUsDurationMinutes: 60,
        recUsAvailabilityShape: "site-date-map",
      },
    });
  });

  it("discovers SF Rec & Park and Rocklin courts from sanitized public org fixtures", () => {
    const sportMappings = parseRecUsSportsPayload(readJsonFixture("recus-sports.json"));
    const sfVenues = parseRecUsLocationsAvailabilityPayload(
      readJsonFixture("sf-rec-park-alice-marble-org-sanitized.json"),
      {
        organization: sfRecParkOrganization,
        sportMappings,
      },
    );
    const rocklinVenues = parseRecUsLocationsAvailabilityPayload(
      readJsonFixture("rocklin-johnson-springview-org-sanitized.json"),
      {
        organization: rocklinOrganization,
        sportMappings,
      },
    );

    expect(sfVenues).toHaveLength(1);
    expect(sfVenues[0]).toMatchObject({
      id: "81cd2b08-8ea6-40ee-8c89-aeba92506576",
      name: "Alice Marble",
      city: "San Francisco",
      sites: [
        {
          id: "c520577d-2c22-4e4e-8a92-c7709b0df07b",
          name: "Court 3",
          sport: "tennis",
          availableSlots: [
            "2026-05-19 07:30:00",
            "2026-05-19 08:00:00",
            "2026-05-19 08:30:00",
          ],
        },
      ],
    });
    expect(rocklinVenues).toHaveLength(1);
    expect(rocklinVenues[0]).toMatchObject({
      id: "bad275ad-738b-4e8d-9707-debd562b058f",
      name: "Johnson Springview Park: Courts",
      city: "Rocklin",
      sites: [
        {
          id: "d0517c95-e3d7-4d2d-978a-1dce12d2daeb",
          name: "Court 3 - Tennis",
          sport: "tennis",
          availableSlots: [
            "2026-05-18 17:30:00",
            "2026-05-18 18:00:00",
            "2026-05-18 18:30:00",
          ],
        },
      ],
    });
  });

  it("normalizes SF Rec & Park and Rocklin sanitized site date maps into CourtPing slots", () => {
    const sfSlots = parseRecUsSiteAvailabilityDateMap(
      readJsonFixture("sf-rec-park-alice-marble-court-3-site-sanitized.json"),
      {
        venue: sfAliceMarbleVenue,
        site: sfAliceMarbleVenue.sites[0],
        checkedAt,
      },
    );
    const rocklinSlots = parseRecUsSiteAvailabilityDateMap(
      readJsonFixture("rocklin-johnson-springview-court-3-site-sanitized.json"),
      {
        venue: rocklinJohnsonSpringviewVenue,
        site: rocklinJohnsonSpringviewVenue.sites[0],
        checkedAt,
      },
    );

    expect(sfSlots).toHaveLength(6);
    expect(sfSlots[0]).toMatchObject({
      venueId: "81cd2b08-8ea6-40ee-8c89-aeba92506576",
      venueName: "Alice Marble",
      courtId: "c520577d-2c22-4e4e-8a92-c7709b0df07b",
      courtName: "Court 3",
      sport: "tennis",
      startsAt: "2026-05-24T14:30:00.000Z",
      endsAt: "2026-05-24T16:00:00.000Z",
      metadata: {
        recUsLocationId: "81cd2b08-8ea6-40ee-8c89-aeba92506576",
        recUsSiteId: "c520577d-2c22-4e4e-8a92-c7709b0df07b",
        recUsDurationMinutes: 90,
        recUsAvailabilityShape: "site-date-map",
      },
    });
    expect(rocklinSlots).toHaveLength(6);
    expect(rocklinSlots[0]).toMatchObject({
      venueId: "bad275ad-738b-4e8d-9707-debd562b058f",
      venueName: "Johnson Springview Park: Courts",
      courtId: "d0517c95-e3d7-4d2d-978a-1dce12d2daeb",
      courtName: "Court 3 - Tennis",
      sport: "tennis",
      startsAt: "2026-06-01T03:30:00.000Z",
      endsAt: "2026-06-01T05:00:00.000Z",
      metadata: {
        recUsLocationId: "bad275ad-738b-4e8d-9707-debd562b058f",
        recUsSiteId: "d0517c95-e3d7-4d2d-978a-1dce12d2daeb",
        recUsDurationMinutes: 90,
        recUsAvailabilityShape: "site-date-map",
      },
    });
  });

  it("filters non-court and non-target resources from sanitized public org fixtures", () => {
    const payload = readJsonFixture("sf-rec-park-alice-marble-org-sanitized.json");
    const augmentedPayload = cloneJson(payload);
    const courts = augmentedPayload[0].location.courts;
    const tennisCourt = courts[0];

    courts.push({
      ...tennisCourt,
      id: "sf-room-with-tennis-sport",
      type: "room",
      courtNumber: "Alice Marble Meeting Room",
    });
    courts.push({
      ...tennisCourt,
      id: "sf-badminton-court",
      type: "court",
      courtNumber: "Badminton Court",
      sports: [
        {
          id: "sf-badminton-sport-link",
          sportId: "5d391ce4-ef26-44b8-b75b-d2aff5441e37",
        },
      ],
    });

    const discoveredVenues = parseRecUsLocationsAvailabilityPayload(augmentedPayload, {
      organization: sfRecParkOrganization,
      sportMappings: parseRecUsSportsPayload(readJsonFixture("recus-sports.json")),
    });
    const discoveredSiteIds = discoveredVenues.flatMap((venue) =>
      venue.sites.map((site) => site.id));

    expect(discoveredSiteIds).toEqual(["c520577d-2c22-4e4e-8a92-c7709b0df07b"]);
  });

  it("fetches SF Rec & Park and Rocklin organization fixtures without live network calls", async () => {
    const requests: string[] = [];
    const fetch = createMultiOrganizationFixtureFetch(requests);
    const adapter = new RecUsAdapter({
      organizations: [sfRecParkAliceMarbleOrganization, rocklinJohnsonSpringviewOrganization],
      checkedAt,
      fetch,
    });

    const snapshot = await adapter.fetchAvailability();

    expect(requests).toEqual([
      buildRecUsSportsUrl(RECUS_API_BASE_URL),
      buildRecUsLocationsAvailabilityUrl(RECUS_API_BASE_URL, "san-francisco-rec-park"),
      buildRecUsAvailabilityUrl(RECUS_API_BASE_URL, "c520577d-2c22-4e4e-8a92-c7709b0df07b"),
      buildRecUsLocationsAvailabilityUrl(RECUS_API_BASE_URL, "rocklin"),
      buildRecUsAvailabilityUrl(RECUS_API_BASE_URL, "d0517c95-e3d7-4d2d-978a-1dce12d2daeb"),
    ]);
    expect(snapshot.slots).toHaveLength(12);
    expect(snapshot.venues.map((venue) => ({
      id: venue.id,
      name: venue.name,
      courts: venue.courts.map((court) => court.id),
    }))).toEqual([
      {
        id: "81cd2b08-8ea6-40ee-8c89-aeba92506576",
        name: "Alice Marble",
        courts: ["c520577d-2c22-4e4e-8a92-c7709b0df07b"],
      },
      {
        id: "bad275ad-738b-4e8d-9707-debd562b058f",
        name: "Johnson Springview Park: Courts",
        courts: ["d0517c95-e3d7-4d2d-978a-1dce12d2daeb"],
      },
    ]);
    await expect(fetch(buildRecUsAvailabilityUrl(RECUS_API_BASE_URL, "unmapped"))).rejects.toThrow(
      "Unexpected live network request in Rec.us fixture test",
    );
  });

  it("fetches Belmont organization fixtures without falling through to live Rec.us", async () => {
    const requests: string[] = [];
    const fetch = createBelmontOrganizationFixtureFetch(requests);
    const adapter = new RecUsAdapter({
      organizations: [belmontHallmarkOrganization],
      checkedAt,
      fetch,
    });

    const snapshot = await adapter.fetchAvailability();

    expect(requests).toEqual([
      buildRecUsSportsUrl(RECUS_API_BASE_URL),
      buildRecUsLocationsAvailabilityUrl(RECUS_API_BASE_URL, "city-of-belmont"),
      buildRecUsAvailabilityUrl(RECUS_API_BASE_URL, "a8ab7944-c0b6-432f-bbed-89425a54e099"),
      buildRecUsAvailabilityUrl(RECUS_API_BASE_URL, "4c161448-1f7b-402b-8eda-895cf8704678"),
    ]);
    expect(snapshot.source).toBe("rec-us-public-poc");
    expect(snapshot.venues).toEqual([
      {
        id: "756355b6-f361-483e-af56-6321ce50d782",
        name: "Hallmark Courts",
        city: "Belmont",
        state: "CA",
        timeZone: "America/Los_Angeles",
        bookingUrl: "https://www.rec.us/locations/756355b6-f361-483e-af56-6321ce50d782",
        courts: [
          {
            id: "a8ab7944-c0b6-432f-bbed-89425a54e099",
            venueId: "756355b6-f361-483e-af56-6321ce50d782",
            name: "Tennis Court 1",
            sport: "tennis",
            indoor: false,
          },
          {
            id: "4c161448-1f7b-402b-8eda-895cf8704678",
            venueId: "756355b6-f361-483e-af56-6321ce50d782",
            name: "Pickleball Court 2",
            sport: "pickleball",
            indoor: false,
          },
        ],
      },
    ]);
    expect(snapshot.slots).toHaveLength(34);
    const tennisSlot = snapshot.slots.find((slot) =>
      slot.courtId === "a8ab7944-c0b6-432f-bbed-89425a54e099"
      && slot.startsAt === "2026-05-19T15:00:00.000Z");
    expect(tennisSlot).toMatchObject({
      source: "rec-us-public-poc",
      venueId: "756355b6-f361-483e-af56-6321ce50d782",
      courtId: "a8ab7944-c0b6-432f-bbed-89425a54e099",
      sport: "tennis",
      startsAt: "2026-05-19T15:00:00.000Z",
      endsAt: "2026-05-19T16:00:00.000Z",
      status: "open",
      bookingUrl: "https://www.rec.us/locations/756355b6-f361-483e-af56-6321ce50d782",
      checkedAt,
      metadata: {
        recUsLocationId: "756355b6-f361-483e-af56-6321ce50d782",
        recUsSiteId: "a8ab7944-c0b6-432f-bbed-89425a54e099",
        recUsDurationMinutes: 60,
        recUsAvailabilityShape: "site-date-map",
      },
    });
    await expect(fetch("https://api.rec.us/v1/sites/unmapped/availability")).rejects.toThrow(
      "Unexpected live network request in Rec.us fixture test",
    );
  });
});

const hallmarkVenue: RecUsVenueConfig = {
  id: "belmont-hallmark-park-courts",
  name: "Hallmark Park Courts",
  city: "Belmont",
  state: "CA",
  timeZone: "America/Los_Angeles",
  bookingUrl: "https://www.rec.us/hallmarkcourts",
  locationPageUrl: "https://www.rec.us/hallmarkcourts",
  locationId: "756355b6-f361-483e-af56-6321ce50d782",
  sites: [
    {
      id: "site-hallmark-tennis-1",
      name: "Tennis Court 1",
      sport: "tennis",
      surface: "hard",
      indoor: false,
    },
    {
      id: "site-hallmark-pickleball-a",
      name: "Pickleball Court A",
      sport: "pickleball",
      surface: "hard",
      indoor: false,
    },
  ],
};

const belmontOrganization: RecUsOrganizationConfig = {
  slug: "city-of-belmont",
  name: "City of Belmont",
  city: "Belmont",
  state: "CA",
  webBaseUrl: "https://www.rec.us",
};

const belmontHallmarkOrganization: RecUsOrganizationConfig = {
  ...belmontOrganization,
  locationIds: ["756355b6-f361-483e-af56-6321ce50d782"],
  siteIds: [
    "a8ab7944-c0b6-432f-bbed-89425a54e099",
    "4c161448-1f7b-402b-8eda-895cf8704678",
  ],
};

const sfRecParkOrganization: RecUsOrganizationConfig = {
  slug: "san-francisco-rec-park",
  name: "San Francisco Rec & Park",
  city: "San Francisco",
  state: "CA",
  webBaseUrl: "https://www.rec.us",
};

const sfRecParkAliceMarbleOrganization: RecUsOrganizationConfig = {
  ...sfRecParkOrganization,
  locationIds: ["81cd2b08-8ea6-40ee-8c89-aeba92506576"],
  siteIds: ["c520577d-2c22-4e4e-8a92-c7709b0df07b"],
};

const rocklinOrganization: RecUsOrganizationConfig = {
  slug: "rocklin",
  name: "City of Rocklin",
  city: "Rocklin",
  state: "CA",
  webBaseUrl: "https://www.rec.us",
};

const rocklinJohnsonSpringviewOrganization: RecUsOrganizationConfig = {
  ...rocklinOrganization,
  locationIds: ["bad275ad-738b-4e8d-9707-debd562b058f"],
  siteIds: ["d0517c95-e3d7-4d2d-978a-1dce12d2daeb"],
};

const hallmarkDiscoveredVenue: RecUsVenueConfig = {
  id: "756355b6-f361-483e-af56-6321ce50d782",
  name: "Hallmark Courts",
  city: "Belmont",
  state: "CA",
  timeZone: "America/Los_Angeles",
  bookingUrl: "https://www.rec.us/locations/756355b6-f361-483e-af56-6321ce50d782",
  locationId: "756355b6-f361-483e-af56-6321ce50d782",
  sites: [
    {
      id: "a8ab7944-c0b6-432f-bbed-89425a54e099",
      name: "Tennis Court 1",
      sport: "tennis",
      indoor: false,
    },
    {
      id: "4c161448-1f7b-402b-8eda-895cf8704678",
      name: "Pickleball Court 2",
      sport: "pickleball",
      indoor: false,
    },
  ],
};

const sfAliceMarbleVenue: RecUsVenueConfig = {
  id: "81cd2b08-8ea6-40ee-8c89-aeba92506576",
  name: "Alice Marble",
  city: "San Francisco",
  state: "CA",
  timeZone: "America/Los_Angeles",
  bookingUrl: "https://www.rec.us/locations/81cd2b08-8ea6-40ee-8c89-aeba92506576",
  locationId: "81cd2b08-8ea6-40ee-8c89-aeba92506576",
  sites: [
    {
      id: "c520577d-2c22-4e4e-8a92-c7709b0df07b",
      name: "Court 3",
      sport: "tennis",
      indoor: false,
    },
  ],
};

const rocklinJohnsonSpringviewVenue: RecUsVenueConfig = {
  id: "bad275ad-738b-4e8d-9707-debd562b058f",
  name: "Johnson Springview Park: Courts",
  city: "Rocklin",
  state: "CA",
  timeZone: "America/Los_Angeles",
  bookingUrl: "https://www.rec.us/locations/bad275ad-738b-4e8d-9707-debd562b058f",
  locationId: "bad275ad-738b-4e8d-9707-debd562b058f",
  sites: [
    {
      id: "d0517c95-e3d7-4d2d-978a-1dce12d2daeb",
      name: "Court 3 - Tennis",
      sport: "tennis",
      indoor: false,
    },
  ],
};

function readFixture(fileName: string): string {
  return readFileSync(path.join(fixtureRoot, fileName), "utf8");
}

function readJsonFixture(fileName: string): any {
  return JSON.parse(readFixture(fileName));
}

function cloneJson<T>(value: T): any {
  return JSON.parse(JSON.stringify(value));
}

function createFixtureFetch(requests: string[]): RecUsFetch {
  const responses = new Map<string, string>([
    ["https://www.rec.us/hallmarkcourts", readFixture("hallmark-location.html")],
    [
      buildRecUsAvailabilityUrl(RECUS_API_BASE_URL, "site-hallmark-tennis-1"),
      readFixture("hallmark-tennis-availability.json"),
    ],
    [
      buildRecUsAvailabilityUrl(RECUS_API_BASE_URL, "site-hallmark-pickleball-a"),
      readFixture("hallmark-pickleball-availability.json"),
    ],
  ]);

  return async (url) => {
    requests.push(url);
    const body = responses.get(url);
    if (!body) {
      throw new Error(`Unexpected live network request in Rec.us fixture test: ${url}`);
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

function createBelmontOrganizationFixtureFetch(requests: string[]): RecUsFetch {
  const responses = new Map<string, string>([
    [buildRecUsSportsUrl(RECUS_API_BASE_URL), readFixture("recus-sports.json")],
    [
      buildRecUsLocationsAvailabilityUrl(RECUS_API_BASE_URL, "city-of-belmont"),
      readFixture("city-of-belmont-locations-availability.json"),
    ],
    [
      buildRecUsAvailabilityUrl(RECUS_API_BASE_URL, "a8ab7944-c0b6-432f-bbed-89425a54e099"),
      readFixture("hallmark-tennis-court-1-site-availability.json"),
    ],
    [
      buildRecUsAvailabilityUrl(RECUS_API_BASE_URL, "4c161448-1f7b-402b-8eda-895cf8704678"),
      readFixture("hallmark-pickleball-court-2-site-availability.json"),
    ],
  ]);

  return async (url) => {
    requests.push(url);
    const body = responses.get(url);
    if (!body) {
      throw new Error(`Unexpected live network request in Rec.us fixture test: ${url}`);
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

function createMultiOrganizationFixtureFetch(requests: string[]): RecUsFetch {
  const responses = new Map<string, string>([
    [buildRecUsSportsUrl(RECUS_API_BASE_URL), readFixture("recus-sports.json")],
    [
      buildRecUsLocationsAvailabilityUrl(RECUS_API_BASE_URL, "san-francisco-rec-park"),
      readFixture("sf-rec-park-alice-marble-org-sanitized.json"),
    ],
    [
      buildRecUsAvailabilityUrl(RECUS_API_BASE_URL, "c520577d-2c22-4e4e-8a92-c7709b0df07b"),
      readFixture("sf-rec-park-alice-marble-court-3-site-sanitized.json"),
    ],
    [
      buildRecUsLocationsAvailabilityUrl(RECUS_API_BASE_URL, "rocklin"),
      readFixture("rocklin-johnson-springview-org-sanitized.json"),
    ],
    [
      buildRecUsAvailabilityUrl(RECUS_API_BASE_URL, "d0517c95-e3d7-4d2d-978a-1dce12d2daeb"),
      readFixture("rocklin-johnson-springview-court-3-site-sanitized.json"),
    ],
  ]);

  return async (url) => {
    requests.push(url);
    const body = responses.get(url);
    if (!body) {
      throw new Error(`Unexpected live network request in Rec.us fixture test: ${url}`);
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
