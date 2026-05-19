import type { CourtSport } from "./index";
import type { RecUsOrganizationConfig } from "./recus-adapter";

export const RECUS_SOURCE_ID = "rec-us";

export type RecUsSourceId = typeof RECUS_SOURCE_ID;
export type RecUsRiskStatus =
  | "manual-live-check-passed"
  | "production-blocked-terms-rate-limit";

export interface RecUsCourtAllowlistEntry {
  siteId: string;
  name: string;
  sport: CourtSport;
}

export interface RecUsFacilityAllowlistEntry {
  locationId: string;
  name: string;
  city: string;
  state: string;
  bookingUrl: string;
  courts: RecUsCourtAllowlistEntry[];
  notes?: string;
}

export interface RecUsAvailabilitySourceConfig {
  sourceId: RecUsSourceId;
  organizationSlug: string;
  organizationName: string;
  city: string;
  state: string;
  enabled: boolean;
  betaOnly: boolean;
  manualLiveCheckOnly: boolean;
  maxSitesPerCheck: number;
  minCheckIntervalMinutes: number;
  allowedSports: CourtSport[];
  facilityAllowlist: RecUsFacilityAllowlistEntry[];
  bookingBaseUrl: string;
  orgUrl: string;
  riskStatus: RecUsRiskStatus;
  notes: string;
}

export const RECUS_ALLOWED_ORGANIZATION_SLUGS = [
  "city-of-belmont",
  "san-francisco-rec-park",
  "rocklin",
] as const;

export type RecUsAllowedOrganizationSlug = typeof RECUS_ALLOWED_ORGANIZATION_SLUGS[number];

export interface RecUsReservationRuleConfig {
  organizationSlug: RecUsAllowedOrganizationSlug;
  organizationName: string;
  releaseWindowDays: number | null;
  releaseTimeLocal: string | null;
  maxReservationsPerDay: number | null;
  maxReservationsPerWeek: number | null;
  feeNotes: string;
  bookingUrl: string;
  ruleSourceUrl: string | null;
  notes: string;
}

const allowedOrganizationSlugs = new Set<string>(RECUS_ALLOWED_ORGANIZATION_SLUGS);
const targetSports = new Set<CourtSport>(["tennis", "pickleball"]);

export const RECUS_BETA_SOURCE_CONFIGS: RecUsAvailabilitySourceConfig[] = [
  {
    sourceId: RECUS_SOURCE_ID,
    organizationSlug: "city-of-belmont",
    organizationName: "City of Belmont",
    city: "Belmont",
    state: "CA",
    enabled: false,
    betaOnly: true,
    manualLiveCheckOnly: true,
    maxSitesPerCheck: 3,
    minCheckIntervalMinutes: 30,
    allowedSports: ["tennis", "pickleball"],
    bookingBaseUrl: "https://www.rec.us",
    orgUrl: "https://www.rec.us/belmont",
    riskStatus: "production-blocked-terms-rate-limit",
    notes: "Manual live validation passed. Keep disabled until terms, permission, and rate limits are reviewed.",
    facilityAllowlist: [
      {
        locationId: "756355b6-f361-483e-af56-6321ce50d782",
        name: "Hallmark Courts",
        city: "Belmont",
        state: "CA",
        bookingUrl: "https://www.rec.us/locations/756355b6-f361-483e-af56-6321ce50d782",
        notes: "Belmont beta candidate from public Rec.us organization response.",
        courts: [
          {
            siteId: "b9b7f92a-0357-4b81-ab4a-d9f4208f7b01",
            name: "Tennis Court 2",
            sport: "tennis",
          },
          {
            siteId: "a8ab7944-c0b6-432f-bbed-89425a54e099",
            name: "Tennis Court 1",
            sport: "tennis",
          },
          {
            siteId: "3fa817ad-4529-47cf-b0ae-a22c0c5b081c",
            name: "Pickleball Court 1",
            sport: "pickleball",
          },
          {
            siteId: "4c161448-1f7b-402b-8eda-895cf8704678",
            name: "Pickleball Court 2",
            sport: "pickleball",
          },
        ],
      },
      {
        locationId: "99e7cd59-15cd-43aa-b0cc-9ed11f826840",
        name: "Alexander Courts",
        city: "Belmont",
        state: "CA",
        bookingUrl: "https://www.rec.us/locations/99e7cd59-15cd-43aa-b0cc-9ed11f826840",
        notes: "Belmont beta candidate from public Rec.us organization response.",
        courts: [
          {
            siteId: "fcbda536-882f-44a2-9b27-18cd78b34fbe",
            name: "Pickleball Court 1",
            sport: "pickleball",
          },
          {
            siteId: "9f1a2b51-e97c-4ebb-aa57-98741590844e",
            name: "Tennis Court 1",
            sport: "tennis",
          },
        ],
      },
    ],
  },
  {
    sourceId: RECUS_SOURCE_ID,
    organizationSlug: "san-francisco-rec-park",
    organizationName: "San Francisco Rec & Park",
    city: "San Francisco",
    state: "CA",
    enabled: false,
    betaOnly: true,
    manualLiveCheckOnly: true,
    maxSitesPerCheck: 3,
    minCheckIntervalMinutes: 30,
    allowedSports: ["tennis", "pickleball"],
    bookingBaseUrl: "https://www.rec.us",
    orgUrl: "https://www.rec.us/sfrecpark",
    riskStatus: "production-blocked-terms-rate-limit",
    notes: "Manual live validation passed for sampled Alice Marble, Balboa, and Buena Vista courts.",
    facilityAllowlist: [
      {
        locationId: "81cd2b08-8ea6-40ee-8c89-aeba92506576",
        name: "Alice Marble",
        city: "San Francisco",
        state: "CA",
        bookingUrl: "https://www.rec.us/locations/81cd2b08-8ea6-40ee-8c89-aeba92506576",
        notes: "First SF Rec & Park beta sample.",
        courts: [
          {
            siteId: "c520577d-2c22-4e4e-8a92-c7709b0df07b",
            name: "Court 3",
            sport: "tennis",
          },
        ],
      },
    ],
  },
  {
    sourceId: RECUS_SOURCE_ID,
    organizationSlug: "rocklin",
    organizationName: "City of Rocklin",
    city: "Rocklin",
    state: "CA",
    enabled: false,
    betaOnly: true,
    manualLiveCheckOnly: true,
    maxSitesPerCheck: 3,
    minCheckIntervalMinutes: 30,
    allowedSports: ["tennis", "pickleball"],
    bookingBaseUrl: "https://www.rec.us",
    orgUrl: "https://www.rec.us/rocklin",
    riskStatus: "production-blocked-terms-rate-limit",
    notes: "Manual live validation passed for sampled Johnson Springview and Twin Oaks courts.",
    facilityAllowlist: [
      {
        locationId: "bad275ad-738b-4e8d-9707-debd562b058f",
        name: "Johnson Springview Park: Courts",
        city: "Rocklin",
        state: "CA",
        bookingUrl: "https://www.rec.us/locations/bad275ad-738b-4e8d-9707-debd562b058f",
        notes: "Rocklin beta candidate from public Rec.us organization response.",
        courts: [
          {
            siteId: "d0517c95-e3d7-4d2d-978a-1dce12d2daeb",
            name: "Court 3 - Tennis",
            sport: "tennis",
          },
          {
            siteId: "e2c83a28-d7c0-4da7-b104-7babe84512d4",
            name: "Court 1 - Tennis",
            sport: "tennis",
          },
        ],
      },
      {
        locationId: "ed3a514c-b5c8-4128-a199-93a1afbd6b3f",
        name: "Twin Oaks Park",
        city: "Rocklin",
        state: "CA",
        bookingUrl: "https://www.rec.us/locations/ed3a514c-b5c8-4128-a199-93a1afbd6b3f",
        notes: "Rocklin beta candidate from public Rec.us organization response.",
        courts: [
          {
            siteId: "c6d8abb0-8f51-4bad-b99d-ba9ca5182fe2",
            name: "Court 2 - Pickleball",
            sport: "pickleball",
          },
        ],
      },
    ],
  },
];

export const RECUS_SOURCE_REGISTRY_ENTRY = {
  sourceId: RECUS_SOURCE_ID,
  name: "Rec.us",
  enabled: false,
  betaOnly: true,
  manualLiveCheckOnly: true,
  configs: RECUS_BETA_SOURCE_CONFIGS,
} as const;

export const RECUS_RESERVATION_RULE_CONFIGS: RecUsReservationRuleConfig[] = [
  {
    organizationSlug: "city-of-belmont",
    organizationName: "City of Belmont",
    releaseWindowDays: null,
    releaseTimeLocal: null,
    maxReservationsPerDay: null,
    maxReservationsPerWeek: null,
    feeNotes: "TODO: confirm Belmont public reservation fees before production polling.",
    bookingUrl: "https://www.rec.us/belmont",
    ruleSourceUrl: null,
    notes: "Static beta-planning metadata only. Reservation rules are not confirmed and are not used for automation.",
  },
  {
    organizationSlug: "san-francisco-rec-park",
    organizationName: "San Francisco Rec & Park",
    releaseWindowDays: null,
    releaseTimeLocal: null,
    maxReservationsPerDay: null,
    maxReservationsPerWeek: null,
    feeNotes: "TODO: confirm SF Rec & Park public reservation fees before production polling.",
    bookingUrl: "https://www.rec.us/sfrecpark",
    ruleSourceUrl: null,
    notes: "Static beta-planning metadata only. Reservation rules are not confirmed and are not used for automation.",
  },
  {
    organizationSlug: "rocklin",
    organizationName: "City of Rocklin",
    releaseWindowDays: null,
    releaseTimeLocal: null,
    maxReservationsPerDay: null,
    maxReservationsPerWeek: null,
    feeNotes: "TODO: confirm Rocklin public reservation fees before production polling.",
    bookingUrl: "https://www.rec.us/rocklin",
    ruleSourceUrl: null,
    notes: "Static beta-planning metadata only. Reservation rules are not confirmed and are not used for automation.",
  },
];

export function validateRecUsSourceConfig(config: RecUsAvailabilitySourceConfig): {
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (config.sourceId !== RECUS_SOURCE_ID) {
    errors.push(`Unsupported sourceId "${config.sourceId}".`);
  }

  if (!allowedOrganizationSlugs.has(config.organizationSlug)) {
    errors.push(`Unsupported Rec.us organizationSlug "${config.organizationSlug}".`);
  }

  if (config.enabled) {
    warnings.push("Rec.us source config is enabled; production polling remains blocked.");
  }

  if (!config.betaOnly) {
    errors.push("Rec.us source config must remain betaOnly.");
  }

  if (!config.manualLiveCheckOnly) {
    errors.push("Rec.us source config must remain manualLiveCheckOnly.");
  }

  if (!Number.isInteger(config.maxSitesPerCheck) || config.maxSitesPerCheck < 1) {
    errors.push("maxSitesPerCheck must be a positive integer.");
  }

  if (!Number.isInteger(config.minCheckIntervalMinutes) || config.minCheckIntervalMinutes < 1) {
    errors.push("minCheckIntervalMinutes must be a positive integer.");
  }

  if (config.allowedSports.length === 0) {
    errors.push("allowedSports must include at least one target sport.");
  }

  for (const sport of config.allowedSports) {
    if (!targetSports.has(sport)) {
      errors.push(`Unsupported Rec.us sport "${sport}".`);
    }
  }

  if (config.facilityAllowlist.length === 0) {
    warnings.push("Rec.us source config has no facility allowlist.");
  }

  return { errors, warnings };
}

export function validateRecUsReservationRuleConfig(config: RecUsReservationRuleConfig): {
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!allowedOrganizationSlugs.has(config.organizationSlug)) {
    errors.push(`Unsupported Rec.us organizationSlug "${config.organizationSlug}".`);
  }

  validateOptionalPositiveInteger(config.releaseWindowDays, "releaseWindowDays", errors);
  validateOptionalPositiveInteger(config.maxReservationsPerDay, "maxReservationsPerDay", errors);
  validateOptionalPositiveInteger(config.maxReservationsPerWeek, "maxReservationsPerWeek", errors);

  if (config.releaseTimeLocal !== null && !/^([01]\d|2[0-3]):[0-5]\d$/.test(config.releaseTimeLocal)) {
    errors.push("releaseTimeLocal must use HH:mm format when known.");
  }

  if (!config.bookingUrl.startsWith("https://")) {
    errors.push("bookingUrl must be an HTTPS URL.");
  }

  if (config.ruleSourceUrl !== null && !config.ruleSourceUrl.startsWith("https://")) {
    errors.push("ruleSourceUrl must be an HTTPS URL when known.");
  }

  if (config.releaseWindowDays === null) {
    warnings.push("releaseWindowDays is not confirmed.");
  }

  if (config.releaseTimeLocal === null) {
    warnings.push("releaseTimeLocal is not confirmed.");
  }

  if (config.ruleSourceUrl === null) {
    warnings.push("ruleSourceUrl is not confirmed.");
  }

  return { errors, warnings };
}

export function toRecUsOrganizationConfig(
  config: RecUsAvailabilitySourceConfig,
): RecUsOrganizationConfig {
  const allowedSports = new Set(config.allowedSports);
  const locationIds = config.facilityAllowlist.map((facility) => facility.locationId);
  const siteIds = config.facilityAllowlist
    .flatMap((facility) => facility.courts)
    .filter((court) => allowedSports.has(court.sport))
    .map((court) => court.siteId)
    .slice(0, config.maxSitesPerCheck);

  return {
    slug: config.organizationSlug,
    name: config.organizationName,
    city: config.city,
    state: config.state,
    webBaseUrl: config.bookingBaseUrl,
    locationIds,
    siteIds,
  };
}

export function getRecUsSourceConfig(
  organizationSlug: RecUsAllowedOrganizationSlug,
): RecUsAvailabilitySourceConfig | undefined {
  return RECUS_BETA_SOURCE_CONFIGS.find((config) => config.organizationSlug === organizationSlug);
}

export function getRecUsReservationRuleConfig(
  organizationSlug: RecUsAllowedOrganizationSlug,
): RecUsReservationRuleConfig | undefined {
  return RECUS_RESERVATION_RULE_CONFIGS.find((config) => config.organizationSlug === organizationSlug);
}

function validateOptionalPositiveInteger(
  value: number | null,
  fieldName: string,
  errors: string[],
): void {
  if (value === null) {
    return;
  }

  if (!Number.isInteger(value) || value < 1) {
    errors.push(`${fieldName} must be a positive integer when known.`);
  }
}
