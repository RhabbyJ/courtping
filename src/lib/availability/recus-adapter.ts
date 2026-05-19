import {
  DEFAULT_AVAILABILITY_TIME_ZONE,
  type AvailabilityAdapter,
  type AvailabilityQuery,
  type AvailabilitySnapshot,
  type AvailabilityStatus,
  type AvailabilityVenue,
  type CourtSport,
  type NormalizedAvailabilitySlot,
} from "./index";

export const RECUS_AVAILABILITY_SOURCE = "rec-us-public-poc";
export const RECUS_API_BASE_URL = "https://api.rec.us";
export const RECUS_WEB_BASE_URL = "https://www.rec.us";

const TARGET_SPORTS: CourtSport[] = ["tennis", "pickleball"];

export interface RecUsSiteConfig {
  id: string;
  name: string;
  sport: CourtSport;
  surface?: string;
  indoor?: boolean;
}

export interface RecUsVenueConfig {
  id: string;
  name: string;
  city: string;
  state?: string;
  timeZone?: string;
  bookingUrl: string;
  locationPageUrl?: string;
  locationId?: string;
  sites: RecUsSiteConfig[];
}

export interface RecUsOrganizationConfig {
  slug: string;
  name: string;
  city: string;
  state?: string;
  bookingUrl?: string;
  webBaseUrl?: string;
  locationIds?: string[];
  siteIds?: string[];
}

export interface RecUsLocationPageMetadata {
  buildId?: string;
  locationId?: string;
  organizationSlug?: string;
  page?: string;
}

export interface RecUsFetchResponse {
  ok: boolean;
  status: number;
  text(): Promise<string>;
}

export type RecUsFetch = (
  url: string,
  init?: RequestInit,
) => Promise<RecUsFetchResponse>;

export interface RecUsAdapterOptions {
  venues?: RecUsVenueConfig[];
  organizations?: RecUsOrganizationConfig[];
  fetch?: RecUsFetch;
  apiBaseUrl?: string;
  checkedAt?: string;
}

interface NormalizeContext {
  venue: RecUsVenueConfig;
  site: RecUsSiteConfig;
  checkedAt: string;
  locationMetadata?: RecUsLocationPageMetadata;
}

interface RecUsSportMapping {
  id: string;
  name: string;
  sport?: CourtSport;
}

interface RecUsDiscoveredSite extends RecUsSiteConfig {
  availableSlots: string[];
  durationMinutes?: number;
}

interface RecUsDiscoveredVenue extends RecUsVenueConfig {
  sites: RecUsDiscoveredSite[];
  organizationSlug: string;
}

interface PublicSlotContext {
  venue: RecUsVenueConfig;
  site: RecUsSiteConfig;
  checkedAt: string;
}

export class RecUsAdapter implements AvailabilityAdapter {
  readonly source = RECUS_AVAILABILITY_SOURCE;

  private readonly venues: RecUsVenueConfig[];
  private readonly organizations: RecUsOrganizationConfig[];
  private readonly fetch: RecUsFetch;
  private readonly apiBaseUrl: string;
  private readonly checkedAt?: string;

  constructor(options: RecUsAdapterOptions) {
    this.venues = (options.venues ?? []).map(cloneVenueConfig);
    this.organizations = (options.organizations ?? []).map((organization) => ({ ...organization }));
    this.fetch = options.fetch ?? ((url, init) => globalThis.fetch(url, init));
    this.apiBaseUrl = options.apiBaseUrl ?? RECUS_API_BASE_URL;
    this.checkedAt = options.checkedAt;
  }

  async fetchAvailability(query: AvailabilityQuery = {}): Promise<AvailabilitySnapshot> {
    const checkedAt = this.checkedAt ?? new Date().toISOString();
    const legacySnapshot = await this.fetchConfiguredVenueAvailability(query, checkedAt);
    const organizationSnapshot = await this.fetchOrganizationAvailability(query, checkedAt);
    const slots = [...legacySnapshot.slots, ...organizationSnapshot.slots]
      .filter((slot) => slotMatchesQuery(slot, query))
      .sort(compareSlots);
    const venues = mergeAvailabilityVenues([...legacySnapshot.venues, ...organizationSnapshot.venues], query, slots);

    return {
      source: this.source,
      checkedAt,
      venues,
      slots,
    };
  }

  private async fetchConfiguredVenueAvailability(
    query: AvailabilityQuery,
    checkedAt: string,
  ): Promise<AvailabilitySnapshot> {
    const slots: NormalizedAvailabilitySlot[] = [];

    for (const venue of this.venues) {
      if (query.venueIds?.length && !query.venueIds.includes(venue.id)) {
        continue;
      }

      const locationMetadata = await this.fetchLocationMetadata(venue);
      const sites = venue.sites
        .filter((site) => !query.sports?.length || query.sports.includes(site.sport))
        .filter((site) => !query.courtIds?.length || query.courtIds.includes(site.id));

      for (const site of sites) {
        const payload = await this.fetchSiteAvailability(site.id);
        const siteSlots = parseRecUsAvailabilityPayload(payload, {
          venue,
          site,
          checkedAt,
          locationMetadata,
        });
        slots.push(...siteSlots);
      }
    }

    return {
      source: this.source,
      checkedAt,
      venues: this.venues.map((venue) => toAvailabilityVenue(venue, query)),
      slots,
    };
  }

  private async fetchOrganizationAvailability(
    query: AvailabilityQuery,
    checkedAt: string,
  ): Promise<AvailabilitySnapshot> {
    if (this.organizations.length === 0) {
      return {
        source: this.source,
        checkedAt,
        venues: [],
        slots: [],
      };
    }

    const sportMappings = await this.fetchSportMappings();
    const venues: RecUsDiscoveredVenue[] = [];
    const slots: NormalizedAvailabilitySlot[] = [];

    for (const organization of this.organizations) {
      const payload = await this.fetchLocationsAvailability(organization.slug);
      const discoveredVenues = parseRecUsLocationsAvailabilityPayload(payload, {
        organization,
        sportMappings,
      });

      for (const venue of discoveredVenues) {
        if (query.venueIds?.length && !query.venueIds.includes(venue.id)) {
          continue;
        }

        venues.push(venue);
        const sites = venue.sites
          .filter((site) => !query.sports?.length || query.sports.includes(site.sport))
          .filter((site) => !query.courtIds?.length || query.courtIds.includes(site.id));

        for (const site of sites) {
          const payload = await this.fetchSiteAvailability(site.id);
          slots.push(...parseRecUsSiteAvailabilityDateMap(payload, {
            venue,
            site,
            checkedAt,
          }));
        }
      }
    }

    return {
      source: this.source,
      checkedAt,
      venues: venues.map((venue) => toAvailabilityVenue(venue, query)),
      slots,
    };
  }

  private async fetchLocationMetadata(
    venue: RecUsVenueConfig,
  ): Promise<RecUsLocationPageMetadata | undefined> {
    const locationPageUrl = venue.locationPageUrl ?? venue.bookingUrl;
    if (!locationPageUrl) {
      return undefined;
    }

    const html = await this.fetchText(locationPageUrl);
    const metadata = extractRecUsLocationPageMetadata(html);

    return {
      ...metadata,
      locationId: metadata.locationId ?? venue.locationId,
    };
  }

  private async fetchSportMappings(): Promise<RecUsSportMapping[]> {
    const text = await this.fetchText(buildRecUsSportsUrl(this.apiBaseUrl));
    return parseRecUsSportsPayload(parseJson(text, "Rec.us sports response"));
  }

  private async fetchLocationsAvailability(organizationSlug: string): Promise<unknown> {
    const text = await this.fetchText(buildRecUsLocationsAvailabilityUrl(this.apiBaseUrl, organizationSlug));
    return parseJson(text, `Rec.us locations availability response for "${organizationSlug}"`);
  }

  private async fetchSiteAvailability(siteId: string): Promise<unknown> {
    const text = await this.fetchText(buildRecUsAvailabilityUrl(this.apiBaseUrl, siteId));
    return parseJson(text, `Rec.us availability response for site "${siteId}"`);
  }

  private async fetchText(url: string): Promise<string> {
    const response = await this.fetch(url, {
      headers: {
        Accept: "application/json,text/html;q=0.9,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      throw new Error(`Rec.us fetch failed for ${url} with status ${response.status}.`);
    }

    return response.text();
  }
}

export function buildRecUsAvailabilityUrl(apiBaseUrl: string, siteId: string): string {
  return `${apiBaseUrl.replace(/\/+$/, "")}/v1/sites/${encodeURIComponent(siteId)}/availability`;
}

export function buildRecUsLocationsAvailabilityUrl(
  apiBaseUrl: string,
  organizationSlug: string,
): string {
  const url = new URL(`${apiBaseUrl.replace(/\/+$/, "")}/v1/locations/availability`);
  url.searchParams.set("publishedSites", "true");
  url.searchParams.set("organizationSlug", organizationSlug);
  return url.toString();
}

export function buildRecUsSportsUrl(apiBaseUrl: string): string {
  return `${apiBaseUrl.replace(/\/+$/, "")}/v1/sports`;
}

export function extractRecUsLocationPageMetadata(html: string): RecUsLocationPageMetadata {
  const nextDataJson = extractNextDataJson(html);
  if (!nextDataJson) {
    return {};
  }

  const nextData = parseJsonObject(nextDataJson);
  if (!nextData) {
    return {};
  }

  const query = asRecord(nextData.query);

  return {
    buildId: readString(nextData, ["buildId"]),
    locationId: query ? readString(query, ["locationId"]) : undefined,
    organizationSlug: query ? readString(query, ["organizationSlug"]) : undefined,
    page: readString(nextData, ["page"]),
  };
}

export function parseRecUsSportsPayload(payload: unknown): RecUsSportMapping[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.flatMap((item) => {
    const record = asRecord(item);
    const id = record ? readString(record, ["id"]) : undefined;
    const name = record ? readString(record, ["name"]) : undefined;
    const sport = normalizeSport(name);

    return id && name ? [{ id, name, sport }] : [];
  });
}

export function parseRecUsLocationsAvailabilityPayload(
  payload: unknown,
  options: {
    organization: RecUsOrganizationConfig;
    sportMappings: RecUsSportMapping[];
  },
): RecUsDiscoveredVenue[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  const sportById = new Map(
    options.sportMappings
      .filter((mapping) => mapping.sport)
      .map((mapping) => [mapping.id, mapping.sport as CourtSport]),
  );
  const locationIds = options.organization.locationIds
    ? new Set(options.organization.locationIds)
    : null;
  const siteIds = options.organization.siteIds
    ? new Set(options.organization.siteIds)
    : null;

  return payload.flatMap((item) => {
    const itemRecord = asRecord(item);
    const location = itemRecord ? asRecord(itemRecord.location) : null;
    const locationId = location ? readString(location, ["id"]) : undefined;
    const locationName = location ? readString(location, ["name"]) : undefined;

    if (!location || !locationId || !locationName || (locationIds && !locationIds.has(locationId))) {
      return [];
    }

    const courts = Array.isArray(location.courts) ? location.courts : [];
    const sites = courts.flatMap((court): RecUsDiscoveredSite[] => {
      const courtRecord = asRecord(court);
      if (!courtRecord || !isPublicCourtResource(courtRecord)) {
        return [];
      }

      const siteId = readString(courtRecord, ["id"]);
      const courtName = readString(courtRecord, ["courtNumber", "name"]);
      const sports = Array.isArray(courtRecord.sports) ? courtRecord.sports : [];
      const targetSports = sports.flatMap((sportRecord): CourtSport[] => {
        const sport = asRecord(sportRecord);
        const sportId = sport ? readString(sport, ["sportId"]) : undefined;
        const mappedSport = sportId ? sportById.get(sportId) : undefined;
        return mappedSport && TARGET_SPORTS.includes(mappedSport) ? [mappedSport] : [];
      });

      if (!siteId || !courtName || targetSports.length === 0 || (siteIds && !siteIds.has(siteId))) {
        return [];
      }

      return [{
        id: siteId,
        name: courtName,
        sport: targetSports[0],
        indoor: false,
        availableSlots: readStringArray(courtRecord.availableSlots),
        durationMinutes: readAllowedDurationMinutes(courtRecord),
      }];
    });

    if (sites.length === 0) {
      return [];
    }

    const timeZone = readString(location, ["timezone"]) ?? DEFAULT_AVAILABILITY_TIME_ZONE;

    return [{
      id: locationId,
      name: locationName,
      city: options.organization.city,
      state: options.organization.state ?? "CA",
      timeZone,
      bookingUrl: buildRecUsLocationUrl(options.organization.webBaseUrl, locationId),
      locationId,
      sites,
      organizationSlug: options.organization.slug,
    }];
  });
}

export function parseRecUsLocationAvailabilitySlots(
  payload: unknown,
  options: {
    organization: RecUsOrganizationConfig;
    sportMappings: RecUsSportMapping[];
    checkedAt: string;
  },
): NormalizedAvailabilitySlot[] {
  return parseRecUsLocationsAvailabilityPayload(payload, options)
    .flatMap((venue) => venue.sites.flatMap((site) =>
      site.availableSlots.map((slot, index) => normalizePublicAvailableSlot(slot, {
        venue,
        site,
        checkedAt: options.checkedAt,
      }, site.durationMinutes ?? 30, index)),
    ))
    .filter((slot): slot is NormalizedAvailabilitySlot => slot !== null);
}

export function parseRecUsSiteAvailabilityDateMap(
  payload: unknown,
  context: PublicSlotContext,
): NormalizedAvailabilitySlot[] {
  const record = asRecord(payload);
  const data = record ? asRecord(record.data) : null;
  if (!data) {
    return [];
  }

  const slots: NormalizedAvailabilitySlot[] = [];

  for (const [date, times] of Object.entries(data)) {
    if (!isLocalDate(date)) {
      continue;
    }

    const timeRecords = asRecord(times);
    if (!timeRecords) {
      continue;
    }

    for (const [time, value] of Object.entries(timeRecords)) {
      if (!isLocalTime(time)) {
        continue;
      }

      const durationMinutes = readAvailableDurationMinutes(value);
      if (!durationMinutes) {
        continue;
      }

      const startsAt = localDateTimeToUtcIso(date, time, context.venue.timeZone ?? DEFAULT_AVAILABILITY_TIME_ZONE);
      const endsAt = addMinutesIso(startsAt, durationMinutes);

      slots.push({
        id: `recus:${context.venue.id}:${context.site.id}:${date}T${time}:${durationMinutes}`,
        source: RECUS_AVAILABILITY_SOURCE,
        venueId: context.venue.id,
        venueName: context.venue.name,
        courtId: context.site.id,
        courtName: context.site.name,
        sport: context.site.sport,
        startsAt,
        endsAt,
        timeZone: context.venue.timeZone ?? DEFAULT_AVAILABILITY_TIME_ZONE,
        status: "open",
        checkedAt: context.checkedAt,
        bookingUrl: context.venue.bookingUrl,
        metadata: {
          recUsLocationId: context.venue.locationId ?? context.venue.id,
          recUsSiteId: context.site.id,
          recUsDurationMinutes: durationMinutes,
          recUsAvailabilityShape: "site-date-map",
        },
      });
    }
  }

  return slots.sort(compareSlots);
}

export function parseRecUsAvailabilityPayload(
  payload: unknown,
  context: NormalizeContext,
): NormalizedAvailabilitySlot[] {
  const dateMapSlots = parseRecUsSiteAvailabilityDateMap(payload, context);
  if (dateMapSlots.length > 0) {
    return dateMapSlots;
  }

  return collectSlotRecords(payload)
    .map((record, index) => normalizeRecUsSlot(record, context, index))
    .filter((slot): slot is NormalizedAvailabilitySlot => slot !== null);
}

function normalizePublicAvailableSlot(
  value: string,
  context: PublicSlotContext,
  durationMinutes: number,
  index: number,
): NormalizedAvailabilitySlot | null {
  const [date, time] = value.split(" ");
  if (!isLocalDate(date) || !isLocalTime(time)) {
    return null;
  }

  const startsAt = localDateTimeToUtcIso(date, time, context.venue.timeZone ?? DEFAULT_AVAILABILITY_TIME_ZONE);
  const endsAt = addMinutesIso(startsAt, durationMinutes);

  return {
    id: `recus:${context.venue.id}:${context.site.id}:${date}T${time}:${durationMinutes}:${index}`,
    source: RECUS_AVAILABILITY_SOURCE,
    venueId: context.venue.id,
    venueName: context.venue.name,
    courtId: context.site.id,
    courtName: context.site.name,
    sport: context.site.sport,
    startsAt,
    endsAt,
    timeZone: context.venue.timeZone ?? DEFAULT_AVAILABILITY_TIME_ZONE,
    status: "open",
    checkedAt: context.checkedAt,
    bookingUrl: context.venue.bookingUrl,
    metadata: {
      recUsLocationId: context.venue.locationId ?? context.venue.id,
      recUsSiteId: context.site.id,
      recUsDurationMinutes: durationMinutes,
      recUsAvailabilityShape: "location-available-slots",
    },
  };
}

function normalizeRecUsSlot(
  record: Record<string, unknown>,
  context: NormalizeContext,
  index: number,
): NormalizedAvailabilitySlot | null {
  const startsAt = readString(record, [
    "startsAt",
    "startTime",
    "start",
    "startAt",
    "startDateTime",
    "start_time",
  ]);
  const endsAt = readString(record, [
    "endsAt",
    "endTime",
    "end",
    "endAt",
    "endDateTime",
    "end_time",
  ]);

  const normalizedStartsAt = startsAt ? toUtcIsoString(startsAt) : null;
  const normalizedEndsAt = endsAt ? toUtcIsoString(endsAt) : null;

  if (!normalizedStartsAt || !normalizedEndsAt) {
    return null;
  }

  const rawStatus = readString(record, ["status", "state", "availabilityStatus"]) ?? "";
  const directBookingUrl = readString(record, [
    "bookingUrl",
    "reservationUrl",
    "reserveUrl",
    "url",
    "href",
    "link",
  ]);
  const rawId = readString(record, ["id", "slotId", "reservationId", "availabilityId"]);
  const siteRecord = asRecord(record.site) ?? asRecord(record.court) ?? asRecord(record.resource);
  const siteId = readString(record, ["siteId", "site_id", "courtId", "court_id", "resourceId"])
    ?? (siteRecord ? readString(siteRecord, ["id"]) : undefined)
    ?? context.site.id;
  const courtName = readString(record, ["courtName", "siteName", "resourceName"])
    ?? (siteRecord ? readString(siteRecord, ["name"]) : undefined)
    ?? context.site.name;
  const sport = normalizeSport(readString(record, ["sport", "activity"])) ?? context.site.sport;

  return {
    id: rawId
      ? `recus:${rawId}`
      : `recus:${context.venue.id}:${siteId}:${normalizedStartsAt}:${index}`,
    source: RECUS_AVAILABILITY_SOURCE,
    venueId: context.venue.id,
    venueName: context.venue.name,
    courtId: siteId,
    courtName,
    sport,
    startsAt: normalizedStartsAt,
    endsAt: normalizedEndsAt,
    timeZone: context.venue.timeZone ?? DEFAULT_AVAILABILITY_TIME_ZONE,
    status: normalizeStatus(record, rawStatus),
    checkedAt: context.checkedAt,
    bookingUrl: directBookingUrl
      ? toAbsoluteRecUsUrl(directBookingUrl, context.venue.bookingUrl)
      : context.venue.bookingUrl,
    metadata: {
      recUsLocationId: context.locationMetadata?.locationId ?? context.venue.locationId ?? null,
      recUsSiteId: siteId,
      recUsRawStatus: rawStatus || null,
      recUsBuildId: context.locationMetadata?.buildId ?? null,
      recUsAvailabilityShape: "legacy-fixture",
    },
  };
}

function extractNextDataJson(html: string): string | null {
  const match = /<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i.exec(html);
  return match?.[1]?.trim() || null;
}

function parseJsonObject(value: string): Record<string, unknown> | null {
  try {
    return asRecord(JSON.parse(value));
  } catch {
    return null;
  }
}

function parseJson(value: string, label: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    throw new Error(`${label} was not valid JSON.`);
  }
}

function collectSlotRecords(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload.flatMap((item) => {
      const record = asRecord(item);
      return record ? [record] : [];
    });
  }

  const record = asRecord(payload);
  if (!record) {
    return [];
  }

  for (const key of ["availability", "slots", "availableSlots", "timeSlots", "items"]) {
    const records = collectSlotRecords(record[key]);
    if (records.length > 0) {
      return records;
    }
  }

  for (const key of ["data", "result", "payload"]) {
    const records = collectSlotRecords(record[key]);
    if (records.length > 0) {
      return records;
    }
  }

  return [];
}

function normalizeStatus(
  record: Record<string, unknown>,
  rawStatus: string,
): AvailabilityStatus {
  if (typeof record.available === "boolean") {
    return record.available ? "open" : "reserved";
  }

  switch (rawStatus.toLowerCase()) {
    case "available":
    case "open":
    case "reservable":
    case "free":
      return "open";
    case "reserved":
    case "booked":
    case "unavailable":
    case "held":
      return "reserved";
    case "closed":
    case "blocked":
      return "closed";
    default:
      return "unknown";
  }
}

function normalizeSport(value: string | undefined): CourtSport | undefined {
  const normalized = value?.toLowerCase();
  if (normalized === "tennis" || normalized === "pickleball") {
    return normalized;
  }

  return undefined;
}

function toUtcIsoString(value: string): string | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function localDateTimeToUtcIso(date: string, time: string, timeZone: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute, second] = time.split(":").map(Number);
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second);
  const offset = getTimeZoneOffsetMs(new Date(utcGuess), timeZone);
  const adjusted = new Date(utcGuess - offset);
  const adjustedOffset = getTimeZoneOffsetMs(adjusted, timeZone);

  return new Date(utcGuess - adjustedOffset).toISOString();
}

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date).reduce<Record<string, string>>((acc, part) => {
    if (part.type !== "literal") {
      acc[part.type] = part.value;
    }

    return acc;
  }, {});

  const localAsUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );

  return localAsUtc - date.getTime();
}

function addMinutesIso(value: string, minutes: number): string {
  return new Date(Date.parse(value) + minutes * 60_000).toISOString();
}

function toAbsoluteRecUsUrl(value: string, baseUrl: string): string {
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return value;
  }
}

function buildRecUsLocationUrl(webBaseUrl: string | undefined, locationId: string): string {
  return `${(webBaseUrl ?? RECUS_WEB_BASE_URL).replace(/\/+$/, "")}/locations/${encodeURIComponent(locationId)}`;
}

function toAvailabilityVenue(
  venue: RecUsVenueConfig,
  query: AvailabilityQuery,
): AvailabilityVenue {
  return {
    id: venue.id,
    name: venue.name,
    city: venue.city,
    state: venue.state ?? "CA",
    timeZone: venue.timeZone ?? DEFAULT_AVAILABILITY_TIME_ZONE,
    bookingUrl: venue.bookingUrl,
    courts: venue.sites
      .filter((site) => !query.sports?.length || query.sports.includes(site.sport))
      .filter((site) => !query.courtIds?.length || query.courtIds.includes(site.id))
      .map((site) => ({
        id: site.id,
        venueId: venue.id,
        name: site.name,
        sport: site.sport,
        surface: site.surface,
        indoor: site.indoor,
      })),
  };
}

function mergeAvailabilityVenues(
  venues: AvailabilityVenue[],
  query: AvailabilityQuery,
  slots: NormalizedAvailabilitySlot[],
): AvailabilityVenue[] {
  const venueIdsWithSlots = new Set(slots.map((slot) => slot.venueId));
  const byId = new Map<string, AvailabilityVenue>();

  for (const venue of venues) {
    if (query.venueIds?.length) {
      if (!query.venueIds.includes(venue.id)) {
        continue;
      }
    } else if (!venueIdsWithSlots.has(venue.id)) {
      continue;
    }

    byId.set(venue.id, {
      ...venue,
      courts: venue.courts.map((court) => ({ ...court })),
    });
  }

  return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function slotMatchesQuery(slot: NormalizedAvailabilitySlot, query: AvailabilityQuery): boolean {
  if (query.sports?.length && !query.sports.includes(slot.sport)) {
    return false;
  }

  if (query.venueIds?.length && !query.venueIds.includes(slot.venueId)) {
    return false;
  }

  if (query.courtIds?.length && !query.courtIds.includes(slot.courtId)) {
    return false;
  }

  if (query.startsAt || query.endsAt) {
    const slotStartsAt = Date.parse(slot.startsAt);
    const slotEndsAt = Date.parse(slot.endsAt);
    const queryStartsAt = query.startsAt ? Date.parse(query.startsAt) : Number.NEGATIVE_INFINITY;
    const queryEndsAt = query.endsAt ? Date.parse(query.endsAt) : Number.POSITIVE_INFINITY;

    if (slotEndsAt <= queryStartsAt || slotStartsAt >= queryEndsAt) {
      return false;
    }
  }

  return true;
}

function compareSlots(a: NormalizedAvailabilitySlot, b: NormalizedAvailabilitySlot): number {
  const startComparison = a.startsAt.localeCompare(b.startsAt);
  return startComparison === 0 ? a.id.localeCompare(b.id) : startComparison;
}

function readString(record: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return undefined;
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function readAllowedDurationMinutes(record: Record<string, unknown>): number | undefined {
  const allowedReservationDurations = asRecord(record.allowedReservationDurations);
  const minutes = allowedReservationDurations?.minutes;
  if (!Array.isArray(minutes)) {
    return undefined;
  }

  const positiveDurations = minutes
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value) && value > 0)
    .sort((a, b) => a - b);

  return positiveDurations[0];
}

function readAvailableDurationMinutes(value: unknown): number | undefined {
  const record = asRecord(value);
  const durations = record?.availableDurationsMinutes;
  if (!Array.isArray(durations)) {
    return undefined;
  }

  const positiveDurations = durations
    .filter((duration): duration is number =>
      typeof duration === "number" && Number.isFinite(duration) && duration > 0)
    .sort((a, b) => b - a);

  return positiveDurations[0];
}

function isPublicCourtResource(record: Record<string, unknown>): boolean {
  const type = readString(record, ["type"]);
  return type === "court" || type === undefined;
}

function isLocalDate(value: string | undefined): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isLocalTime(value: string | undefined): value is string {
  return typeof value === "string" && /^\d{2}:\d{2}:\d{2}$/.test(value);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function cloneVenueConfig(venue: RecUsVenueConfig): RecUsVenueConfig {
  return {
    ...venue,
    sites: venue.sites.map((site) => ({ ...site })),
  };
}
