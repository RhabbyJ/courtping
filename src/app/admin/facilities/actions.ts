"use server";

import { redirect } from "next/navigation";
import { importFacilities, getFacilityById, upsertFacility } from "@/lib/data/store";
import { parseFacilitiesCsv } from "@/lib/facilities";
import type {
  Facility,
  IndoorOutdoor,
  LiveStatus,
  PublicPrivate,
  SourcePlatform,
  Sport
} from "@/types/domain";

const indoorOutdoorValues: IndoorOutdoor[] = ["indoor", "outdoor", "both"];
const publicPrivateValues: PublicPrivate[] = ["public", "private", "public_private"];
const liveStatuses: LiveStatus[] = ["live_alerts", "manual_beta", "booking_link_only", "coming_soon"];
const sourcePlatforms: SourcePlatform[] = [
  "manual",
  "courtreserve",
  "playbypoint",
  "webtrac",
  "activenet",
  "civicrec",
  "unknown"
];

export async function saveFacilityAction(formData: FormData) {
  const id = requiredString(formData, "id") || `facility-${Date.now().toString(36)}`;
  const existing = getFacilityById(id);
  const name = requiredString(formData, "name");
  const slug = requiredString(formData, "slug") || slugify(name);
  const sports = formData.getAll("sports").map(String).filter(isSport);
  const facility: Facility = {
    id,
    name,
    slug,
    address: requiredString(formData, "address"),
    city: requiredString(formData, "city"),
    neighborhood: requiredString(formData, "neighborhood"),
    latitude: numberValue(formData, "latitude"),
    longitude: numberValue(formData, "longitude"),
    sports: sports.length > 0 ? sports : ["tennis"],
    numberOfCourts: Math.max(0, Math.floor(numberValue(formData, "numberOfCourts"))),
    indoorOutdoor: enumValue(formData, "indoorOutdoor", indoorOutdoorValues, "outdoor"),
    lights: formData.has("lights"),
    publicPrivate: enumValue(formData, "publicPrivate", publicPrivateValues, "public"),
    bookingUrl: requiredString(formData, "bookingUrl"),
    sourceUrl: requiredString(formData, "sourceUrl"),
    liveStatus: enumValue(formData, "liveStatus", liveStatuses, "coming_soon"),
    sourcePlatform: enumValue(formData, "sourcePlatform", sourcePlatforms, "unknown"),
    notes: String(formData.get("notes") ?? ""),
    createdAt: existing?.createdAt ?? new Date().toISOString()
  };

  upsertFacility(facility);
  redirect("/admin/facilities?saved=1");
}

export async function importFacilitiesCsvAction(formData: FormData) {
  const csv = String(formData.get("csv") ?? "");
  const result = parseFacilitiesCsv(csv);

  if (result.errors.length > 0) {
    redirect(`/admin/facilities/import?error=${encodeURIComponent(result.errors.slice(0, 5).join(" "))}`);
  }

  importFacilities(result.facilities);
  redirect(`/admin/facilities?imported=${result.facilities.length}`);
}

function requiredString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function numberValue(formData: FormData, key: string) {
  const value = Number(formData.get(key));
  return Number.isFinite(value) ? value : 0;
}

function enumValue<T extends string>(formData: FormData, key: string, values: T[], fallback: T) {
  const value = String(formData.get(key) ?? "");
  return values.includes(value as T) ? (value as T) : fallback;
}

function isSport(value: string): value is Sport {
  return value === "tennis" || value === "pickleball";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
