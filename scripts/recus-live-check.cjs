#!/usr/bin/env node

const fs = require("node:fs");
const { execFile } = require("node:child_process");

const ts = require("typescript");

require.extensions[".ts"] = function compileTypeScript(module, filename) {
  const source = fs.readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: filename,
  });

  module._compile(output.outputText, filename);
};

const {
  RECUS_API_BASE_URL,
  RecUsAdapter,
  buildRecUsAvailabilityUrl,
  buildRecUsLocationsAvailabilityUrl,
  buildRecUsSportsUrl,
  parseRecUsLocationsAvailabilityPayload,
  parseRecUsSportsPayload,
} = require("../src/lib/availability/recus-adapter.ts");

const DEFAULT_MAX_SITES = 3;
const MAX_ALLOWED_SITES = 4;
const DEFAULT_TIMEOUT_MS = 10000;
const SAMPLE_LIMIT = 10;
const TARGET_SPORTS = ["tennis", "pickleball"];
const DEFAULT_ORG_SLUG = "city-of-belmont";
const ORG_CONFIGS = {
  "city-of-belmont": {
    slug: "city-of-belmont",
    name: "City of Belmont",
    city: "Belmont",
    state: "CA",
    webBaseUrl: "https://www.rec.us",
    preferredLocationNames: ["Hallmark Courts", "Alexander Courts"],
  },
  "san-francisco-rec-park": {
    slug: "san-francisco-rec-park",
    name: "San Francisco Rec & Park",
    city: "San Francisco",
    state: "CA",
    webBaseUrl: "https://www.rec.us",
    preferredLocationNames: ["Alice Marble", "Balboa", "Buena Vista"],
  },
  rocklin: {
    slug: "rocklin",
    name: "City of Rocklin",
    city: "Rocklin",
    state: "CA",
    webBaseUrl: "https://www.rec.us",
    preferredLocationNames: ["Johnson Springview", "Twin Oaks"],
  },
};

async function main() {
  if (process.env.RECUS_LIVE_CHECK !== "1") {
    throw new Error("Refusing to run live Rec.us check. Set RECUS_LIVE_CHECK=1 explicitly.");
  }

  const args = parseArgs(process.argv.slice(2));
  const orgSlug = readArg(args, "org", DEFAULT_ORG_SLUG);
  const maxSites = readNumberArg(args, "max-sites", DEFAULT_MAX_SITES);
  const timeoutMs = readNumberArg(args, "timeout-ms", DEFAULT_TIMEOUT_MS);
  const targetSports = readSportArg(args);
  const organization = ORG_CONFIGS[orgSlug];

  if (!organization) {
    throw new Error(`Unsupported Rec.us org slug "${orgSlug}". Allowed orgs: ${Object.keys(ORG_CONFIGS).join(", ")}.`);
  }

  if (!Number.isInteger(maxSites) || maxSites < 1 || maxSites > MAX_ALLOWED_SITES) {
    throw new Error(`--max-sites must be an integer from 1 through ${MAX_ALLOWED_SITES}.`);
  }

  if (!Number.isInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 30000) {
    throw new Error("--timeout-ms must be an integer from 1000 through 30000.");
  }

  const allowedSiteIds = new Set();
  const liveFetch = createBoundedPublicFetch({
    allowedSiteIds,
    maxSiteRequests: maxSites,
    orgSlug,
    timeoutMs,
  });
  const sportsPayload = await fetchJson(liveFetch, buildRecUsSportsUrl(RECUS_API_BASE_URL));
  const sportMappings = parseRecUsSportsPayload(sportsPayload);
  const locationsPayload = await fetchJson(
    liveFetch,
    buildRecUsLocationsAvailabilityUrl(RECUS_API_BASE_URL, orgSlug),
  );
  const discoveredVenues = parseRecUsLocationsAvailabilityPayload(locationsPayload, {
    organization,
    sportMappings,
  });
  const selectedSites = selectSites(discoveredVenues, {
    maxSites,
    preferredLocationNames: organization.preferredLocationNames,
    targetSports,
  });

  for (const selected of selectedSites) {
    allowedSiteIds.add(selected.site.id);
  }

  const adapter = new RecUsAdapter({
    checkedAt: new Date().toISOString(),
    fetch: liveFetch.fetch,
    organizations: [{
      ...organization,
      locationIds: Array.from(new Set(selectedSites.map((selected) => selected.venue.id))),
      siteIds: selectedSites.map((selected) => selected.site.id),
    }],
  });
  const snapshot = await adapter.fetchAvailability();
  const targetCourtCount = discoveredVenues.reduce((total, venue) => total + venue.sites.length, 0);
  const siteIdsChecked = selectedSites.map((selected) => selected.site.id);

  const summary = {
    verdict: snapshot.slots.length > 0 ? "passed" : "passed-zero-current-slots",
    orgSlug,
    targetSports,
    checkedAt: snapshot.checkedAt,
    requestSummary: liveFetch.getSummary(),
    locationsDiscovered: discoveredVenues.map((venue) => ({
      id: venue.id,
      name: venue.name,
      targetCourtCount: venue.sites.length,
    })),
    targetCourtsDiscovered: targetCourtCount,
    siteIdsChecked,
    sitesChecked: selectedSites.map((selected) => ({
      locationId: selected.venue.id,
      locationName: selected.venue.name,
      siteId: selected.site.id,
      courtName: selected.site.name,
      sport: selected.site.sport,
    })),
    normalizedSlotCount: snapshot.slots.length,
    sampleNormalizedSlots: snapshot.slots.slice(0, SAMPLE_LIMIT).map((slot) => ({
      id: slot.id,
      venueId: slot.venueId,
      venueName: slot.venueName,
      courtId: slot.courtId,
      courtName: slot.courtName,
      sport: slot.sport,
      startsAt: slot.startsAt,
      endsAt: slot.endsAt,
      status: slot.status,
      bookingUrl: slot.bookingUrl,
      checkedAt: slot.checkedAt,
      metadata: slot.metadata,
    })),
  };

  console.log(JSON.stringify(summary, null, 2));
}

function parseArgs(argv) {
  const parsed = new Map();

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) {
      continue;
    }

    const [rawName, inlineValue] = arg.slice(2).split("=", 2);
    const value = inlineValue ?? argv[index + 1];
    if (inlineValue === undefined) {
      index += 1;
    }

    parsed.set(rawName, value);
  }

  return parsed;
}

function readArg(args, name, fallback) {
  const value = args.get(name);
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function readNumberArg(args, name, fallback) {
  const rawValue = readArg(args, name, String(fallback));
  const value = Number(rawValue);
  return Number.isFinite(value) ? value : Number.NaN;
}

function readSportArg(args) {
  const value = readArg(args, "sport", "all");
  if (value === "all") {
    return TARGET_SPORTS;
  }

  if (TARGET_SPORTS.includes(value)) {
    return [value];
  }

  throw new Error("--sport must be tennis, pickleball, or all.");
}

async function fetchJson(liveFetch, url) {
  const response = await liveFetch.fetch(url);
  if (!response.ok) {
    throw new Error(`Rec.us live check failed for ${url} with status ${response.status}.`);
  }

  return JSON.parse(await response.text());
}

function selectSites(venues, { maxSites, preferredLocationNames, targetSports }) {
  const rankedVenues = venues
    .slice()
    .sort((a, b) => preferredLocationRank(a.name, preferredLocationNames)
      - preferredLocationRank(b.name, preferredLocationNames)
      || a.name.localeCompare(b.name))
    .filter((venue) => venue.sites.some((site) => targetSports.includes(site.sport)));
  const candidates = rankedVenues
    .flatMap((venue) => venue.sites
      .filter((site) => targetSports.includes(site.sport))
      .sort(compareCandidateSites)
      .map((site) => ({ venue, site })));
  const selected = [];

  for (const locationName of preferredLocationNames) {
    if (selected.length >= maxSites) {
      break;
    }

    const missingSports = targetSports.filter((sport) =>
      !selected.some((entry) => entry.site.sport === sport));
    const candidate = candidates.find((entry) =>
      isPreferredLocation(entry.venue.name, locationName)
      && missingSports.includes(entry.site.sport)
      && !selected.some((existing) => existing.site.id === entry.site.id))
      ?? candidates.find((entry) =>
        isPreferredLocation(entry.venue.name, locationName)
        && !selected.some((existing) => existing.site.id === entry.site.id));

    if (candidate) {
      selected.push(candidate);
    }
  }

  for (const sport of targetSports) {
    const candidate = candidates.find((entry) =>
      entry.site.sport === sport && !selected.some((existing) => existing.site.id === entry.site.id));
    if (candidate) {
      selected.push(candidate);
    }
  }

  for (const candidate of candidates) {
    if (selected.length >= maxSites) {
      break;
    }

    if (!selected.some((existing) => existing.site.id === candidate.site.id)) {
      selected.push(candidate);
    }
  }

  if (selected.length === 0) {
    throw new Error(`No ${targetSports.join("/")} site IDs were discovered from public Rec.us data.`);
  }

  return selected.slice(0, maxSites);
}

function preferredLocationRank(name, preferredLocationNames) {
  const index = preferredLocationNames.findIndex((preferredName) => isPreferredLocation(name, preferredName));
  return index === -1 ? preferredLocationNames.length : index;
}

function isPreferredLocation(name, preferredName) {
  const normalizedName = name.toLowerCase();
  const normalizedPreferredName = preferredName.toLowerCase();
  return normalizedName === normalizedPreferredName || normalizedName.includes(normalizedPreferredName);
}

function sportRank(sport) {
  const index = TARGET_SPORTS.indexOf(sport);
  return index === -1 ? TARGET_SPORTS.length : index;
}

function compareCandidateSites(a, b) {
  return b.availableSlots.length - a.availableSlots.length
    || sportRank(a.sport) - sportRank(b.sport)
    || a.name.localeCompare(b.name);
}

function createBoundedPublicFetch({ allowedSiteIds, maxSiteRequests, orgSlug, timeoutMs }) {
  const cache = new Map();
  const networkUrls = [];
  const transportsUsed = new Set();
  const counts = {
    locationsAvailability: 0,
    siteAvailability: 0,
    sports: 0,
  };

  async function fetchWithBounds(url) {
    const normalizedUrl = String(url);
    if (cache.has(normalizedUrl)) {
      return toResponse(cache.get(normalizedUrl));
    }

    enforceAllowedUrl(normalizedUrl);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const result = await fetchPublicText(normalizedUrl, {
        signal: controller.signal,
        timeoutMs,
      });
      transportsUsed.add(result.transport);
      cache.set(normalizedUrl, {
        ok: result.status >= 200 && result.status < 300,
        status: result.status,
        text: result.text,
      });

      return toResponse(cache.get(normalizedUrl));
    } finally {
      clearTimeout(timeout);
    }
  }

  function enforceAllowedUrl(url) {
    const parsed = new URL(url);

    if (parsed.origin !== RECUS_API_BASE_URL) {
      throw new Error(`Blocked non-Rec.us API URL: ${url}`);
    }

    if (parsed.pathname === "/v1/sports") {
      counts.sports += 1;
      if (counts.sports > 1) {
        throw new Error("Blocked extra Rec.us sports request.");
      }
      networkUrls.push(url);
      return;
    }

    if (parsed.pathname === "/v1/locations/availability") {
      if (parsed.searchParams.get("organizationSlug") !== orgSlug
        || parsed.searchParams.get("publishedSites") !== "true") {
        throw new Error(`Blocked unexpected Rec.us locations availability URL: ${url}`);
      }
      counts.locationsAvailability += 1;
      if (counts.locationsAvailability > 1) {
        throw new Error("Blocked extra Rec.us locations availability request.");
      }
      networkUrls.push(url);
      return;
    }

    const siteMatch = /^\/v1\/sites\/([^/]+)\/availability$/.exec(parsed.pathname);
    if (siteMatch) {
      const siteId = decodeURIComponent(siteMatch[1]);
      if (!allowedSiteIds.has(siteId)) {
        throw new Error(`Blocked Rec.us site availability request for undiscovered site ID: ${siteId}`);
      }
      counts.siteAvailability += 1;
      if (counts.siteAvailability > maxSiteRequests) {
        throw new Error(`Blocked Rec.us site availability request beyond max-sites=${maxSiteRequests}.`);
      }
      networkUrls.push(url);
      return;
    }

    throw new Error(`Blocked unexpected Rec.us API URL: ${url}`);
  }

  return {
    fetch: fetchWithBounds,
    getSummary() {
      return {
        networkRequestCount: networkUrls.length,
        sportsRequests: counts.sports,
        locationsAvailabilityRequests: counts.locationsAvailability,
        siteAvailabilityRequests: counts.siteAvailability,
        endpointsHit: [...networkUrls],
        transportsUsed: [...transportsUsed],
      };
    },
  };
}

async function fetchPublicText(url, { signal, timeoutMs }) {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
      redirect: "follow",
      signal,
    });

    return {
      status: response.status,
      text: await response.text(),
      transport: "node-fetch",
    };
  } catch (error) {
    if (process.platform !== "win32" || !isNodeCertificateFailure(error)) {
      throw error;
    }

    return fetchPublicTextWithCurl(url, timeoutMs);
  }
}

function fetchPublicTextWithCurl(url, timeoutMs) {
  const statusMarker = "\n__RECUS_HTTP_STATUS__:";
  const args = [
    "--ssl-no-revoke",
    "-L",
    "-sS",
    "--max-time",
    String(Math.ceil(timeoutMs / 1000)),
    "-H",
    "Accept: application/json",
    "-w",
    `${statusMarker}%{http_code}`,
    url,
  ];

  return new Promise((resolve, reject) => {
    execFile("curl.exe", args, {
      maxBuffer: 10 * 1024 * 1024,
      timeout: timeoutMs + 1000,
      windowsHide: true,
    }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`curl.exe fallback failed: ${stderr || error.message}`));
        return;
      }

      const markerIndex = stdout.lastIndexOf(statusMarker);
      if (markerIndex === -1) {
        reject(new Error("curl.exe fallback did not report an HTTP status."));
        return;
      }

      const text = stdout.slice(0, markerIndex);
      const status = Number(stdout.slice(markerIndex + statusMarker.length).trim());
      if (!Number.isInteger(status)) {
        reject(new Error("curl.exe fallback returned an invalid HTTP status."));
        return;
      }

      resolve({
        status,
        text,
        transport: "curl.exe --ssl-no-revoke",
      });
    });
  });
}

function isNodeCertificateFailure(error) {
  const cause = error && typeof error === "object" ? error.cause : undefined;
  const code = cause && typeof cause === "object" ? cause.code : undefined;
  return code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE" || code === "CERT_HAS_EXPIRED"
    || code === "SELF_SIGNED_CERT_IN_CHAIN";
}

function toResponse(result) {
  return {
    ok: result.ok,
    status: result.status,
    async text() {
      return result.text;
    },
  };
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
