import type {
  Facility,
  IndoorOutdoor,
  LiveStatus,
  PublicPrivate,
  SourcePlatform,
  Sport
} from "@/types/domain";

const requiredHeaders = [
  "id",
  "name",
  "slug",
  "address",
  "city",
  "neighborhood",
  "latitude",
  "longitude",
  "sports",
  "numberOfCourts",
  "indoorOutdoor",
  "lights",
  "publicPrivate",
  "bookingUrl",
  "sourceUrl",
  "liveStatus",
  "sourcePlatform",
  "notes"
];

const sports = new Set<Sport>(["tennis", "pickleball"]);
const indoorOutdoorValues = new Set<IndoorOutdoor>(["indoor", "outdoor", "both"]);
const publicPrivateValues = new Set<PublicPrivate>(["public", "private", "public_private"]);
const liveStatuses = new Set<LiveStatus>(["live_alerts", "manual_beta", "booking_link_only", "coming_soon"]);
const sourcePlatforms = new Set<SourcePlatform>([
  "manual",
  "courtreserve",
  "playbypoint",
  "webtrac",
  "activenet",
  "civicrec",
  "unknown"
]);

export type FacilityCsvResult = {
  facilities: Facility[];
  errors: string[];
};

export function getFacilityCsvHeaders() {
  return [...requiredHeaders];
}

export function parseFacilitiesCsv(csv: string): FacilityCsvResult {
  const rows = parseCsvRows(csv).filter((row) => row.some((cell) => cell.trim().length > 0));
  const errors: string[] = [];

  if (rows.length === 0) {
    return { facilities: [], errors: ["CSV is empty."] };
  }

  const headers = rows[0].map((header) => header.trim());
  for (const header of requiredHeaders) {
    if (!headers.includes(header)) {
      errors.push(`Missing required header: ${header}`);
    }
  }

  if (errors.length > 0) {
    return { facilities: [], errors };
  }

  const facilities: Facility[] = [];

  rows.slice(1).forEach((row, index) => {
    const rowNumber = index + 2;
    const record = Object.fromEntries(headers.map((header, headerIndex) => [header, row[headerIndex]?.trim() ?? ""]));
    const facility = parseFacilityRecord(record, rowNumber, errors);

    if (facility) {
      facilities.push(facility);
    }
  });

  return { facilities, errors };
}

function parseFacilityRecord(record: Record<string, string>, rowNumber: number, errors: string[]): Facility | null {
  const latitude = parseNumber(record.latitude, "latitude", rowNumber, errors);
  const longitude = parseNumber(record.longitude, "longitude", rowNumber, errors);
  const numberOfCourts = parseInteger(record.numberOfCourts, "numberOfCourts", rowNumber, errors);
  const facilitySports = parseSports(record.sports, rowNumber, errors);
  const indoorOutdoor = parseEnum(record.indoorOutdoor, indoorOutdoorValues, "indoorOutdoor", rowNumber, errors);
  const publicPrivate = parseEnum(record.publicPrivate, publicPrivateValues, "publicPrivate", rowNumber, errors);
  const liveStatus = parseEnum(record.liveStatus, liveStatuses, "liveStatus", rowNumber, errors);
  const sourcePlatform = parseEnum(record.sourcePlatform, sourcePlatforms, "sourcePlatform", rowNumber, errors);
  const lights = parseBoolean(record.lights, "lights", rowNumber, errors);

  for (const field of ["id", "name", "slug", "address", "city", "neighborhood", "bookingUrl", "sourceUrl"]) {
    if (!record[field]) {
      errors.push(`Row ${rowNumber}: ${field} is required.`);
    }
  }

  if (
    latitude === null ||
    longitude === null ||
    numberOfCourts === null ||
    facilitySports.length === 0 ||
    !indoorOutdoor ||
    !publicPrivate ||
    !liveStatus ||
    !sourcePlatform ||
    lights === null ||
    requiredHeaders.some((field) => field !== "notes" && !record[field])
  ) {
    return null;
  }

  return {
    id: record.id,
    name: record.name,
    slug: record.slug,
    address: record.address,
    city: record.city,
    neighborhood: record.neighborhood,
    latitude,
    longitude,
    sports: facilitySports,
    numberOfCourts,
    indoorOutdoor,
    lights,
    publicPrivate,
    bookingUrl: record.bookingUrl,
    sourceUrl: record.sourceUrl,
    liveStatus,
    sourcePlatform,
    notes: record.notes,
    createdAt: new Date().toISOString()
  };
}

function parseSports(value: string, rowNumber: number, errors: string[]): Sport[] {
  const values = value
    .split(/[|;]/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (values.length === 0) {
    errors.push(`Row ${rowNumber}: sports must include tennis or pickleball.`);
    return [];
  }

  const parsed: Sport[] = [];
  for (const value of values) {
    if (!sports.has(value as Sport)) {
      errors.push(`Row ${rowNumber}: invalid sport "${value}".`);
      continue;
    }

    parsed.push(value as Sport);
  }

  return Array.from(new Set(parsed));
}

function parseEnum<T extends string>(
  value: string,
  allowed: Set<T>,
  field: string,
  rowNumber: number,
  errors: string[]
): T | null {
  if (allowed.has(value as T)) {
    return value as T;
  }

  errors.push(`Row ${rowNumber}: ${field} is invalid.`);
  return null;
}

function parseNumber(value: string, field: string, rowNumber: number, errors: string[]) {
  const parsed = Number(value);
  if (Number.isFinite(parsed)) {
    return parsed;
  }

  errors.push(`Row ${rowNumber}: ${field} must be a number.`);
  return null;
}

function parseInteger(value: string, field: string, rowNumber: number, errors: string[]) {
  const parsed = Number(value);
  if (Number.isInteger(parsed) && parsed >= 0) {
    return parsed;
  }

  errors.push(`Row ${rowNumber}: ${field} must be a non-negative integer.`);
  return null;
}

function parseBoolean(value: string, field: string, rowNumber: number, errors: string[]) {
  if (value === "true") return true;
  if (value === "false") return false;

  errors.push(`Row ${rowNumber}: ${field} must be true or false.`);
  return null;
}

export function parseCsvRows(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const next = csv[index + 1];

    if (char === "\"" && inQuotes && next === "\"") {
      cell += "\"";
      index += 1;
      continue;
    }

    if (char === "\"") {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell);
  rows.push(row);

  return rows;
}
