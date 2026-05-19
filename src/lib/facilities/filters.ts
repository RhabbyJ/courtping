import type { Facility, LiveStatus, Sport } from "@/types/domain";

export type FacilityFilters = {
  query?: string;
  sport?: Sport | "all";
  liveStatus?: LiveStatus | "all";
  location?: string;
};

export function filterFacilities(facilities: Facility[], filters: FacilityFilters) {
  const query = normalize(filters.query);
  const sport = filters.sport && filters.sport !== "all" ? filters.sport : undefined;
  const liveStatus = filters.liveStatus && filters.liveStatus !== "all" ? filters.liveStatus : undefined;
  const location = normalize(filters.location);

  return facilities.filter((facility) => {
    if (query && !matchesQuery(facility, query)) return false;
    if (sport && !facility.sports.includes(sport)) return false;
    if (liveStatus && facility.liveStatus !== liveStatus) return false;
    if (
      location &&
      normalize(`${facility.city} ${facility.neighborhood}`) !== location &&
      normalize(`${facility.city} / ${facility.neighborhood}`) !== location
    ) {
      return false;
    }

    return true;
  });
}

export function getFacilityLocations(facilities: Facility[]) {
  return Array.from(new Set(facilities.map((facility) => `${facility.city} / ${facility.neighborhood}`))).sort();
}

function matchesQuery(facility: Facility, query: string) {
  return normalize(
    [
      facility.name,
      facility.slug,
      facility.address,
      facility.city,
      facility.neighborhood,
      facility.notes,
      facility.sports.join(" ")
    ].join(" ")
  ).includes(query);
}

function normalize(value: string | undefined) {
  return (value ?? "").trim().toLowerCase();
}
