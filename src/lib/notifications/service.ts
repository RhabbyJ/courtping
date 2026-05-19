import { buildNotificationDedupeKey, getSlotIdentifier } from "./dedupe";
import { createEmailPlaceholderSender } from "./email";
import { formatAvailabilityMessage } from "./format";
import { formatEmailNotification, formatSmsNotification } from "./formatting";
import { isDuplicateNotificationError } from "./repository";
import { createTwilioSmsSender } from "./twilio";
import type {
  AlertPreference,
  AvailabilitySlot,
  NotificationChannel as DomainNotificationChannel,
  NotificationEvent as DomainNotificationEvent,
} from "../../types/domain";
import type {
  EmailSender,
  NotificationChannel,
  NotificationDeliveryResult,
  NotificationEventDraft,
  NotificationEventRecord,
  NotificationEventRepository,
  NotifyChannelResult,
  NotifySlotAvailableInput,
  NotifySlotAvailableResult,
  SmsSender,
} from "./types";

export interface NotifyForMatchResult {
  channel: DomainNotificationChannel;
  created: boolean;
  event: DomainNotificationEvent;
}

export interface NotificationServiceOptions {
  repository: NotificationEventRepository;
  smsSender?: SmsSender;
  emailSender?: EmailSender;
  defaultChannels?: NotificationChannel[];
  defaultTimeZone?: string;
  now?: () => Date;
}

export class NotificationService {
  private readonly repository: NotificationEventRepository;
  private readonly smsSender: SmsSender;
  private readonly emailSender: EmailSender;
  private readonly defaultChannels: NotificationChannel[];
  private readonly defaultTimeZone?: string;
  private readonly now: () => Date;

  constructor(options: NotificationServiceOptions) {
    this.repository = options.repository;
    this.smsSender = options.smsSender || createTwilioSmsSender();
    this.emailSender = options.emailSender || createEmailPlaceholderSender();
    this.defaultChannels = options.defaultChannels || ["sms"];
    this.defaultTimeZone = options.defaultTimeZone;
    this.now = options.now || (() => new Date());
  }

  async notifySlotAvailable(
    input: NotifySlotAvailableInput,
  ): Promise<NotifySlotAvailableResult> {
    const channels = uniqueChannels(input.channels || this.defaultChannels);
    const results: NotifyChannelResult[] = [];

    for (const channel of channels) {
      results.push(await this.notifyChannel(input, channel));
    }

    return { results };
  }

  private async notifyChannel(
    input: NotifySlotAvailableInput,
    channel: NotificationChannel,
  ): Promise<NotifyChannelResult> {
    const dedupeKey = buildNotificationDedupeKey({
      alertId: input.alert.alertId,
      slot: input.slot,
      channel,
    });
    const message =
      channel === "sms"
        ? formatSmsNotification({
            alert: input.alert,
            slot: input.slot,
            timeZone: this.defaultTimeZone,
          })
        : formatEmailNotification({
            alert: input.alert,
            slot: input.slot,
            timeZone: this.defaultTimeZone,
          });
    const recipient =
      channel === "sms" ? input.recipient.phoneNumber?.trim() : input.recipient.email?.trim();
    const eventDraft = this.buildEventDraft(input, channel, dedupeKey, recipient || "", {
      subject: message.subject,
      body: message.body,
    });
    const reservation = await this.reserveEvent(eventDraft);

    if (!reservation.created) {
      return {
        channel,
        dedupeKey,
        status: "skipped",
        skippedReason: "duplicate",
        event: reservation.event,
      };
    }

    if (!recipient) {
      const event = await this.completeEvent(dedupeKey, {
        status: "failed",
        dryRun: true,
        errorMessage:
          channel === "sms"
            ? "SMS channel selected but recipient phoneNumber is missing."
            : "Email channel selected but recipient email is missing.",
      });

      return {
        channel,
        dedupeKey,
        status: "failed",
        event,
        errorMessage: event.errorMessage,
      };
    }

    const delivery = await this.deliver(channel, {
      to: recipient,
      subject: message.subject || "",
      body: message.body,
    });
    const event = await this.completeEvent(dedupeKey, {
      status: delivery.status,
      provider: delivery.provider,
      providerMessageId: delivery.providerMessageId,
      dryRun: delivery.dryRun,
      errorMessage: delivery.errorMessage,
      sentAt:
        delivery.status === "sent" || delivery.status === "dry_run"
          ? this.now().toISOString()
          : undefined,
    });

    return {
      channel,
      dedupeKey,
      status: event.status,
      event,
      errorMessage: event.errorMessage,
    };
  }

  private buildEventDraft(
    input: NotifySlotAvailableInput,
    channel: NotificationChannel,
    dedupeKey: string,
    recipient: string,
    message: { subject?: string; body: string },
  ): NotificationEventDraft {
    return {
      alertId: input.alert.alertId,
      userId: input.alert.userId || input.recipient.userId || "",
      slotId: getSlotIdentifier(input.slot),
      channel,
      dedupeKey,
      status: "pending",
      recipient,
      subject: message.subject,
      body: message.body,
      provider: channel === "sms" ? "twilio" : "email-placeholder",
      dryRun: true,
      metadata: {
        venueName: input.slot.venueName,
        courtName: input.slot.courtName,
        startAt:
          input.slot.startAt instanceof Date
            ? input.slot.startAt.toISOString()
            : input.slot.startAt,
        endAt: input.slot.endAt instanceof Date ? input.slot.endAt.toISOString() : input.slot.endAt,
      },
      createdAt: this.now().toISOString(),
    };
  }

  private async reserveEvent(
    event: NotificationEventDraft,
  ): Promise<{ created: true; event: NotificationEventRecord } | { created: false; event: NotificationEventRecord }> {
    const existing = await this.repository.findByDedupeKey(event.dedupeKey);

    if (existing) {
      return { created: false, event: existing };
    }

    try {
      return { created: true, event: await this.repository.create(event) };
    } catch (error) {
      if (isDuplicateNotificationError(error)) {
        const duplicate = await this.repository.findByDedupeKey(event.dedupeKey);

        if (duplicate) {
          return { created: false, event: duplicate };
        }
      }

      throw error;
    }
  }

  private async completeEvent(
    dedupeKey: string,
    patch: Partial<NotificationEventDraft>,
  ): Promise<NotificationEventRecord> {
    return this.repository.updateByDedupeKey(dedupeKey, patch);
  }

  private async deliver(
    channel: NotificationChannel,
    message: { to: string; subject: string; body: string },
  ): Promise<NotificationDeliveryResult> {
    try {
      if (channel === "sms") {
        return await this.smsSender.sendSms({ to: message.to, body: message.body });
      }

      return await this.emailSender.sendEmail({
        to: message.to,
        subject: message.subject,
        body: message.body,
      });
    } catch (error) {
      return {
        status: "failed",
        provider: channel === "sms" ? "twilio" : "email-placeholder",
        dryRun: channel === "sms",
        errorMessage: error instanceof Error ? error.message : "Notification delivery failed.",
      };
    }
  }
}

export async function notifyForMatch(
  alert: AlertPreference,
  slot: AvailabilitySlot,
  options: {
    smsSender?: SmsSender;
    emailSender?: EmailSender;
  } = {},
): Promise<NotifyForMatchResult[]> {
  const {
    addNotificationEvent,
    findNotificationEvent,
    getDemoUser,
    listCourts,
    listVenues,
  } = await import("../data/store");
  const user = getDemoUser();
  const courts = listCourts();
  const venues = listVenues();
  const court = courts.find((candidate) => candidate.id === slot.courtId);
  const venue = venues.find((candidate) => candidate.id === slot.venueId);
  const message = formatAvailabilityMessage({ alert, slot, court, venue });
  const smsSender = options.smsSender || createTwilioSmsSender();
  const emailSender = options.emailSender || createEmailPlaceholderSender();
  const results: NotifyForMatchResult[] = [];

  for (const channel of uniqueDomainChannels(alert.channels)) {
    const existing = findNotificationEvent(alert.id, slot.id, channel);

    if (existing) {
      results.push({ channel, created: false, event: existing });
      continue;
    }

    const recipient = channel === "sms" ? user.phone || "" : user.email || "";
    const delivery = recipient
      ? await deliverDomainNotification({
          channel,
          recipient,
          message,
          smsSender,
          emailSender,
          venueName: venue?.name,
        })
      : {
          status: "failed" as const,
          provider: channel === "sms" ? "twilio" : "email-placeholder",
          dryRun: true,
          errorMessage:
            channel === "sms"
              ? "SMS channel selected but user phone is missing."
              : "Email channel selected but user email is missing.",
        };
    const event = addNotificationEvent({
      alertPreferenceId: alert.id,
      userId: alert.userId,
      channel,
      recipient,
      slotId: slot.id,
      status: delivery.status,
      message,
      providerResponse: JSON.stringify({
        provider: delivery.provider,
        dryRun: delivery.dryRun,
        providerMessageId: delivery.providerMessageId,
        errorMessage: delivery.errorMessage,
      }),
    });

    results.push({ channel, created: true, event });
  }

  return results;
}

function uniqueChannels(channels: NotificationChannel[]): NotificationChannel[] {
  return Array.from(new Set(channels));
}

function uniqueDomainChannels(
  channels: DomainNotificationChannel[],
): DomainNotificationChannel[] {
  return Array.from(new Set(channels));
}

async function deliverDomainNotification(input: {
  channel: DomainNotificationChannel;
  recipient: string;
  message: string;
  smsSender: SmsSender;
  emailSender: EmailSender;
  venueName?: string;
}): Promise<NotificationDeliveryResult> {
  if (input.channel === "sms") {
    return input.smsSender.sendSms({
      to: input.recipient,
      body: input.message,
    });
  }

  return input.emailSender.sendEmail({
    to: input.recipient,
    subject: `CourtPing: ${input.venueName || "court"} slot open`,
    body: `${input.message}\n\nCourtPing does not book courts automatically.`,
  });
}
