export type NotificationChannel = "sms" | "email";

export type NotificationDeliveryStatus =
  | "pending"
  | "dry_run"
  | "sent"
  | "failed"
  | "skipped";

export interface AlertNotificationContext {
  alertId: string;
  userId: string;
  alertName?: string | null;
  sport?: string | null;
}

export interface AvailableCourtSlot {
  slotId?: string | null;
  venueId?: string | null;
  venueName: string;
  courtId?: string | null;
  courtName: string;
  sport?: string | null;
  startAt: string | Date;
  endAt: string | Date;
  timeZone?: string | null;
  bookingUrl?: string | null;
}

export interface NotificationRecipient {
  userId?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
}

export interface SmsDeliveryRequest {
  to: string;
  body: string;
}

export interface EmailDeliveryRequest {
  to: string;
  subject: string;
  body: string;
}

export interface NotificationDeliveryResult {
  status: Extract<NotificationDeliveryStatus, "dry_run" | "sent" | "failed">;
  provider: string;
  dryRun: boolean;
  providerMessageId?: string;
  errorMessage?: string;
}

export interface SmsSender {
  sendSms(request: SmsDeliveryRequest): Promise<NotificationDeliveryResult>;
}

export interface EmailSender {
  sendEmail(request: EmailDeliveryRequest): Promise<NotificationDeliveryResult>;
}

export interface NotificationMessage {
  channel: NotificationChannel;
  to: string;
  subject?: string;
  body: string;
}

export interface NotificationEventDraft {
  alertId: string;
  userId: string;
  slotId: string;
  channel: NotificationChannel;
  dedupeKey: string;
  status: NotificationDeliveryStatus;
  recipient: string;
  subject?: string;
  body: string;
  provider?: string;
  providerMessageId?: string;
  dryRun: boolean;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  sentAt?: string;
}

export interface NotificationEventRecord extends NotificationEventDraft {
  id?: string;
}

export interface NotificationEventRepository {
  findByDedupeKey(dedupeKey: string): Promise<NotificationEventRecord | null>;
  create(event: NotificationEventDraft): Promise<NotificationEventRecord>;
  updateByDedupeKey(
    dedupeKey: string,
    patch: Partial<NotificationEventDraft>,
  ): Promise<NotificationEventRecord>;
}

export interface NotifySlotAvailableInput {
  alert: AlertNotificationContext;
  slot: AvailableCourtSlot;
  recipient: NotificationRecipient;
  channels?: NotificationChannel[];
}

export interface NotifyChannelResult {
  channel: NotificationChannel;
  dedupeKey: string;
  status: NotificationDeliveryStatus;
  event?: NotificationEventRecord;
  skippedReason?: "duplicate";
  errorMessage?: string;
}

export interface NotifySlotAvailableResult {
  results: NotifyChannelResult[];
}
