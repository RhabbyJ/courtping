#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

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

const allowed = {
  sports: new Set(["tennis", "pickleball"]),
  indoorOutdoor: new Set(["indoor", "outdoor", "both"]),
  publicPrivate: new Set(["public", "private", "public_private"]),
  liveStatus: new Set(["live_alerts", "manual_beta", "booking_link_only", "coming_soon"]),
  sourcePlatform: new Set(["manual", "courtreserve", "playbypoint", "webtrac", "activenet", "civicrec", "unknown"])
};

const inputPath = process.argv[2] || "data/facilities.sample.csv";
const writeJson = process.argv.includes("--write-json");
const csv = fs.readFileSync(inputPath, "utf8");
const result = parseFacilitiesCsv(csv);

if (result.errors.length > 0) {
  console.error(result.errors.join("\n"));
  process.exit(1);
}

if (writeJson) {
  const outputPath = path.join("data", "facilities.imported.json");
  fs.writeFileSync(outputPath, `${JSON.stringify(result.facilities, null, 2)}\n`);
  console.log(`Imported ${result.facilities.length} facilities to ${outputPath}`);
} else {
  console.log(`Validated ${result.facilities.length} facilities from ${inputPath}`);
}

function parseFacilitiesCsv(csvText) {
  const rows = parseCsvRows(csvText).filter((row) => row.some((cell) => cell.trim().length > 0));
  const errors = [];

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

  const facilities = [];
  rows.slice(1).forEach((row, index) => {
    const rowNumber = index + 2;
    const record = Object.fromEntries(headers.map((header, headerIndex) => [header, row[headerIndex]?.trim() || ""]));
    const facility = parseFacilityRecord(record, rowNumber, errors);
    if (facility) {
      facilities.push(facility);
    }
  });

  return { facilities, errors };
}

function parseFacilityRecord(record, rowNumber, errors) {
  const requiredMissing = requiredHeaders.filter((field) => field !== "notes" && !record[field]);
  for (const field of requiredMissing) {
    errors.push(`Row ${rowNumber}: ${field} is required.`);
  }

  const sports = record.sports.split(/[|;]/).map((sport) => sport.trim()).filter(Boolean);
  for (const sport of sports) {
    if (!allowed.sports.has(sport)) {
      errors.push(`Row ${rowNumber}: invalid sport "${sport}".`);
    }
  }

  for (const field of ["indoorOutdoor", "publicPrivate", "liveStatus", "sourcePlatform"]) {
    if (!allowed[field].has(record[field])) {
      errors.push(`Row ${rowNumber}: ${field} is invalid.`);
    }
  }

  const latitude = Number(record.latitude);
  const longitude = Number(record.longitude);
  const numberOfCourts = Number(record.numberOfCourts);
  const lights = parseBoolean(record.lights);

  if (!Number.isFinite(latitude)) errors.push(`Row ${rowNumber}: latitude must be a number.`);
  if (!Number.isFinite(longitude)) errors.push(`Row ${rowNumber}: longitude must be a number.`);
  if (!Number.isInteger(numberOfCourts) || numberOfCourts < 0) {
    errors.push(`Row ${rowNumber}: numberOfCourts must be a non-negative integer.`);
  }
  if (lights === null) errors.push(`Row ${rowNumber}: lights must be true or false.`);

  if (requiredMissing.length || errors.some((error) => error.startsWith(`Row ${rowNumber}:`))) {
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
    sports,
    numberOfCourts,
    indoorOutdoor: record.indoorOutdoor,
    lights,
    publicPrivate: record.publicPrivate,
    bookingUrl: record.bookingUrl,
    sourceUrl: record.sourceUrl,
    liveStatus: record.liveStatus,
    sourcePlatform: record.sourcePlatform,
    notes: record.notes,
    createdAt: new Date().toISOString()
  };
}

function parseBoolean(value) {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

function parseCsvRows(csvText) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const char = csvText[index];
    const next = csvText[index + 1];

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
      if (char === "\r" && next === "\n") index += 1;
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
