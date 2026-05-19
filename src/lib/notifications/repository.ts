import type {
  NotificationEventDraft,
  NotificationEventRecord,
  NotificationEventRepository,
} from "./types";

type SupabaseErrorLike = {
  message?: string;
  code?: string;
  details?: string;
};

type SupabaseResponse<T> = {
  data: T | null;
  error: SupabaseErrorLike | null;
};

type SupabaseSingleResult = Promise<SupabaseResponse<Record<string, unknown>>>;

type SupabaseTableQuery = {
  select(columns?: string): {
    eq(column: string, value: string): {
      maybeSingle(): SupabaseSingleResult;
    };
  };
  insert(values: Record<string, unknown>): {
    select(columns?: string): {
      single(): SupabaseSingleResult;
    };
  };
  update(values: Record<string, unknown>): {
    eq(column: string, value: string): {
      select(columns?: string): {
        single(): SupabaseSingleResult;
      };
    };
  };
};

export interface SupabaseNotificationsClient {
  from(table: string): SupabaseTableQuery;
}

export class NotificationRepositoryError extends Error {
  readonly code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "NotificationRepositoryError";
    this.code = code;
  }
}

export class SupabaseNotificationEventRepository implements NotificationEventRepository {
  constructor(
    private readonly client: SupabaseNotificationsClient,
    private readonly tableName = "notification_events",
  ) {}

  async findByDedupeKey(dedupeKey: string): Promise<NotificationEventRecord | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select("*")
      .eq("dedupe_key", dedupeKey)
      .maybeSingle();

    if (error) {
      throw toRepositoryError(error);
    }

    return data ? fromRow(data) : null;
  }

  async create(event: NotificationEventDraft): Promise<NotificationEventRecord> {
    const { data, error } = await this.client
      .from(this.tableName)
      .insert(toRow(event))
      .select("*")
      .single();

    if (error) {
      throw toRepositoryError(error);
    }

    if (!data) {
      throw new NotificationRepositoryError("Supabase insert returned no notification event.");
    }

    return fromRow(data);
  }

  async updateByDedupeKey(
    dedupeKey: string,
    patch: Partial<NotificationEventDraft>,
  ): Promise<NotificationEventRecord> {
    const { data, error } = await this.client
      .from(this.tableName)
      .update(toRowPatch(patch))
      .eq("dedupe_key", dedupeKey)
      .select("*")
      .single();

    if (error) {
      throw toRepositoryError(error);
    }

    if (!data) {
      throw new NotificationRepositoryError("Supabase update returned no notification event.");
    }

    return fromRow(data);
  }
}

export function isDuplicateNotificationError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const code = error instanceof NotificationRepositoryError ? error.code : undefined;
  const message = error.message.toLowerCase();

  return code === "23505" || message.includes("duplicate key") || message.includes("dedupe");
}

function toRepositoryError(error: SupabaseErrorLike): NotificationRepositoryError {
  return new NotificationRepositoryError(
    error.message || "Supabase notification repository error.",
    error.code,
  );
}

function toRow(event: NotificationEventDraft): Record<string, unknown> {
  return {
    alert_id: event.alertId,
    user_id: event.userId,
    slot_id: event.slotId,
    channel: event.channel,
    dedupe_key: event.dedupeKey,
    status: event.status,
    recipient: event.recipient,
    subject: event.subject,
    body: event.body,
    provider: event.provider,
    provider_message_id: event.providerMessageId,
    dry_run: event.dryRun,
    error_message: event.errorMessage,
    metadata: event.metadata,
    created_at: event.createdAt,
    sent_at: event.sentAt,
  };
}

function toRowPatch(patch: Partial<NotificationEventDraft>): Record<string, unknown> {
  const row: Record<string, unknown> = {};

  if ("alertId" in patch) row.alert_id = patch.alertId;
  if ("userId" in patch) row.user_id = patch.userId;
  if ("slotId" in patch) row.slot_id = patch.slotId;
  if ("channel" in patch) row.channel = patch.channel;
  if ("dedupeKey" in patch) row.dedupe_key = patch.dedupeKey;
  if ("status" in patch) row.status = patch.status;
  if ("recipient" in patch) row.recipient = patch.recipient;
  if ("subject" in patch) row.subject = patch.subject;
  if ("body" in patch) row.body = patch.body;
  if ("provider" in patch) row.provider = patch.provider;
  if ("providerMessageId" in patch) row.provider_message_id = patch.providerMessageId;
  if ("dryRun" in patch) row.dry_run = patch.dryRun;
  if ("errorMessage" in patch) row.error_message = patch.errorMessage;
  if ("metadata" in patch) row.metadata = patch.metadata;
  if ("createdAt" in patch) row.created_at = patch.createdAt;
  if ("sentAt" in patch) row.sent_at = patch.sentAt;

  return row;
}

function fromRow(row: Record<string, unknown>): NotificationEventRecord {
  return {
    id: optionalString(row.id),
    alertId: requiredString(row.alert_id, "alert_id"),
    userId: requiredString(row.user_id, "user_id"),
    slotId: requiredString(row.slot_id, "slot_id"),
    channel: requiredString(row.channel, "channel") === "email" ? "email" : "sms",
    dedupeKey: requiredString(row.dedupe_key, "dedupe_key"),
    status: toStatus(requiredString(row.status, "status")),
    recipient: requiredString(row.recipient, "recipient"),
    subject: optionalString(row.subject),
    body: requiredString(row.body, "body"),
    provider: optionalString(row.provider),
    providerMessageId: optionalString(row.provider_message_id),
    dryRun: Boolean(row.dry_run),
    errorMessage: optionalString(row.error_message),
    metadata: isRecord(row.metadata) ? row.metadata : undefined,
    createdAt: requiredString(row.created_at, "created_at"),
    sentAt: optionalString(row.sent_at),
  };
}

function requiredString(value: unknown, fieldName: string): string {
  if (typeof value === "string") {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value === null || value === undefined) {
    throw new NotificationRepositoryError(`Missing notification event field: ${fieldName}`);
  }

  return String(value);
}

function optionalString(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return value === null || value === undefined ? undefined : String(value);
}

function toStatus(value: string): NotificationEventRecord["status"] {
  if (
    value === "pending" ||
    value === "dry_run" ||
    value === "sent" ||
    value === "failed" ||
    value === "skipped"
  ) {
    return value;
  }

  return "failed";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
