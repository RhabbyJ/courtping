import type {
  AvailabilityQuery,
  NormalizedAvailabilitySlot,
} from "./index";
import { RecUsAdapter, type RecUsFetch } from "./recus-adapter";
import {
  RECUS_SOURCE_ID,
  toRecUsOrganizationConfig,
  validateRecUsSourceConfig,
  type RecUsAvailabilitySourceConfig,
  type RecUsSourceId,
} from "./recus-source-config";

export type AvailabilitySourceRunMode = "manual" | "scheduled";
export type AvailabilitySourceRunStatus = "success" | "error";

export interface AvailabilitySourceSnapshot {
  sourceId: RecUsSourceId;
  organizationSlug: string;
  checkedAt: string;
  status: AvailabilitySourceRunStatus;
  slotCount: number;
  normalizedSlots: NormalizedAvailabilitySlot[];
  errors: string[];
  warnings: string[];
  requestCount?: number;
  manualLiveCheckOnly: boolean;
}

export interface RunAvailabilitySourceOptions {
  mode?: AvailabilitySourceRunMode;
  allowDisabled?: boolean;
  checkedAt?: string;
  fetch?: RecUsFetch;
  query?: AvailabilityQuery;
}

export async function runAvailabilitySourceCheck(
  config: RecUsAvailabilitySourceConfig,
  options: RunAvailabilitySourceOptions = {},
): Promise<AvailabilitySourceSnapshot> {
  if (config.sourceId !== RECUS_SOURCE_ID) {
    return createErrorSnapshot(config, options, [`Unsupported availability source "${config.sourceId}".`], [], 0);
  }

  return runRecUsSourceCheck(config, options);
}

export async function runRecUsSourceCheck(
  config: RecUsAvailabilitySourceConfig,
  options: RunAvailabilitySourceOptions = {},
): Promise<AvailabilitySourceSnapshot> {
  const checkedAt = options.checkedAt ?? new Date().toISOString();
  const mode = options.mode ?? "scheduled";
  const validation = validateRecUsSourceConfig(config);

  if (validation.errors.length > 0) {
    return createErrorSnapshot(config, { ...options, checkedAt }, validation.errors, validation.warnings, 0);
  }

  if (!config.enabled && !options.allowDisabled) {
    return createErrorSnapshot(
      config,
      { ...options, checkedAt },
      ["Rec.us source config is disabled by default."],
      validation.warnings,
      0,
    );
  }

  if (config.manualLiveCheckOnly && mode !== "manual") {
    return createErrorSnapshot(
      config,
      { ...options, checkedAt },
      ["Rec.us source config is manualLiveCheckOnly and cannot run in scheduled mode."],
      validation.warnings,
      0,
    );
  }

  const countedFetch = createCountingFetch(options.fetch);
  const adapter = new RecUsAdapter({
    checkedAt,
    fetch: countedFetch.fetch,
    organizations: [toRecUsOrganizationConfig(config)],
  });

  try {
    const snapshot = await adapter.fetchAvailability({
      ...options.query,
      sports: options.query?.sports ?? config.allowedSports,
    });

    return {
      sourceId: RECUS_SOURCE_ID,
      organizationSlug: config.organizationSlug,
      checkedAt: snapshot.checkedAt,
      status: "success",
      slotCount: snapshot.slots.length,
      normalizedSlots: snapshot.slots,
      errors: [],
      warnings: validation.warnings,
      requestCount: countedFetch.getRequestCount(),
      manualLiveCheckOnly: config.manualLiveCheckOnly,
    };
  } catch (error) {
    return createErrorSnapshot(
      config,
      { ...options, checkedAt },
      [error instanceof Error ? error.message : String(error)],
      validation.warnings,
      countedFetch.getRequestCount(),
    );
  }
}

function createErrorSnapshot(
  config: RecUsAvailabilitySourceConfig,
  options: RunAvailabilitySourceOptions,
  errors: string[],
  warnings: string[],
  requestCount: number,
): AvailabilitySourceSnapshot {
  return {
    sourceId: RECUS_SOURCE_ID,
    organizationSlug: config.organizationSlug,
    checkedAt: options.checkedAt ?? new Date().toISOString(),
    status: "error",
    slotCount: 0,
    normalizedSlots: [],
    errors,
    warnings,
    requestCount,
    manualLiveCheckOnly: config.manualLiveCheckOnly,
  };
}

function createCountingFetch(fetch?: RecUsFetch): {
  fetch: RecUsFetch;
  getRequestCount(): number;
} {
  let requestCount = 0;
  const delegate: RecUsFetch = fetch ?? ((url, init) => globalThis.fetch(url, init));

  return {
    async fetch(url, init) {
      requestCount += 1;
      return delegate(url, init);
    },
    getRequestCount() {
      return requestCount;
    },
  };
}
