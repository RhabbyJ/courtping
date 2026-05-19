import { describe, expect, it } from "vitest";

import {
  NotificationRepositoryError,
  NotificationService,
  buildNotificationDedupeKey,
  createEmailPlaceholderSender,
  createTwilioSmsSender,
  formatEmailNotification,
  type EmailSender,
  type NotificationDeliveryResult,
  type NotificationEventDraft,
  type NotificationEventRecord,
  type NotificationEventRepository,
  type SmsSender,
} from "../src/lib/notifications";

class InMemoryNotificationRepository implements NotificationEventRepository {
  readonly events = new Map<string, NotificationEventRecord>();
  private nextId = 1;

  async findByDedupeKey(dedupeKey: string): Promise<NotificationEventRecord | null> {
    return this.events.get(dedupeKey) || null;
  }

  async create(event: NotificationEventDraft): Promise<NotificationEventRecord> {
    if (this.events.has(event.dedupeKey)) {
      throw new NotificationRepositoryError("duplicate key value violates unique constraint", "23505");
    }

    const record = { ...event, id: String(this.nextId++) };
    this.events.set(event.dedupeKey, record);
    return record;
  }

  async updateByDedupeKey(
    dedupeKey: string,
    patch: Partial<NotificationEventDraft>,
  ): Promise<NotificationEventRecord> {
    const existing = this.events.get(dedupeKey);

    if (!existing) {
      throw new Error("missing event");
    }

    const updated = { ...existing, ...patch };
    this.events.set(dedupeKey, updated);
    return updated;
  }
}

class FakeSmsSender implements SmsSender {
  calls: string[] = [];

  async sendSms(request: { to: string; body: string }): Promise<NotificationDeliveryResult> {
    this.calls.push(`${request.to}:${request.body}`);

    return {
      status: "dry_run",
      provider: "twilio",
      dryRun: true,
      providerMessageId: "dry-run-sms",
    };
  }
}

class FakeEmailSender implements EmailSender {
  calls: string[] = [];

  async sendEmail(request: {
    to: string;
    subject: string;
    body: string;
  }): Promise<NotificationDeliveryResult> {
    this.calls.push(`${request.to}:${request.subject}:${request.body}`);

    return {
      status: "dry_run",
      provider: "email-placeholder",
      dryRun: true,
      providerMessageId: "dry-run-email",
    };
  }
}

const alert = {
  alertId: "alert-1",
  userId: "user-1",
  alertName: "Weekday evenings",
  sport: "tennis",
};

const slot = {
  slotId: "slot-1",
  venueName: "Riverside Courts",
  courtName: "Court 2",
  sport: "tennis",
  startAt: "2026-05-19T01:00:00.000Z",
  endAt: "2026-05-19T02:30:00.000Z",
  timeZone: "America/Los_Angeles",
  bookingUrl: "https://booking.example/courts/slot-1",
};

describe("notifications", () => {
  it("keeps Twilio in dry-run mode by default", async () => {
    let fetchCalled = false;
    const sender = createTwilioSmsSender({
      fetch: async () => {
        fetchCalled = true;
        throw new Error("should not send live SMS");
      },
    });

    const result = await sender.sendSms({
      to: "+15555550123",
      body: "CourtPing dry run",
    });

    expect(result.status).toBe("dry_run");
    expect(result.provider).toBe("twilio");
    expect(fetchCalled).toBe(false);
  });

  it("deduplicates notifications for the same alert, slot, and channel", async () => {
    const repository = new InMemoryNotificationRepository();
    const smsSender = new FakeSmsSender();
    const service = new NotificationService({
      repository,
      smsSender,
      now: () => new Date("2026-05-18T12:00:00.000Z"),
    });

    const first = await service.notifySlotAvailable({
      alert,
      slot,
      recipient: { phoneNumber: "+15555550123" },
      channels: ["sms"],
    });
    const second = await service.notifySlotAvailable({
      alert,
      slot,
      recipient: { phoneNumber: "+15555550123" },
      channels: ["sms"],
    });

    expect(first.results[0].status).toBe("dry_run");
    expect(second.results[0].status).toBe("skipped");
    expect(second.results[0].skippedReason).toBe("duplicate");
    expect(smsSender.calls).toHaveLength(1);
    expect(repository.events.size).toBe(1);
  });

  it("deduplicates channels independently", async () => {
    const repository = new InMemoryNotificationRepository();
    const smsSender = new FakeSmsSender();
    const emailSender = new FakeEmailSender();
    const service = new NotificationService({
      repository,
      smsSender,
      emailSender,
      now: () => new Date("2026-05-18T12:00:00.000Z"),
    });

    const result = await service.notifySlotAvailable({
      alert,
      slot,
      recipient: {
        phoneNumber: "+15555550123",
        email: "player@example.com",
      },
      channels: ["sms", "email"],
    });

    expect(result.results.map((item) => item.status)).toEqual(["dry_run", "dry_run"]);
    expect(smsSender.calls).toHaveLength(1);
    expect(emailSender.calls).toHaveLength(1);
    expect(repository.events.size).toBe(2);
  });

  it("records a failed event instead of sending when a selected channel has no recipient", async () => {
    const repository = new InMemoryNotificationRepository();
    const smsSender = new FakeSmsSender();
    const service = new NotificationService({
      repository,
      smsSender,
      now: () => new Date("2026-05-18T12:00:00.000Z"),
    });

    const result = await service.notifySlotAvailable({
      alert,
      slot,
      recipient: {},
      channels: ["sms"],
    });

    expect(result.results[0].status).toBe("failed");
    expect(result.results[0].event?.errorMessage).toContain("phoneNumber is missing");
    expect(smsSender.calls).toHaveLength(0);
    expect(repository.events.size).toBe(1);
  });

  it("formats email with the facility booking handoff and no auto-booking claim", () => {
    const message = formatEmailNotification({ alert, slot });

    expect(message.subject).toContain("Riverside Courts");
    expect(message.body).toContain("Facility booking page");
    expect(message.body).toContain("CourtPing does not book courts automatically.");
  });

  it("builds stable dedupe keys for the same alert slot channel", () => {
    const first = buildNotificationDedupeKey({ alertId: alert.alertId, slot, channel: "sms" });
    const second = buildNotificationDedupeKey({ alertId: alert.alertId, slot, channel: "sms" });
    const email = buildNotificationDedupeKey({ alertId: alert.alertId, slot, channel: "email" });

    expect(first).toBe(second);
    expect(first).not.toBe(email);
  });

  it("keeps the email placeholder dry-run by default", async () => {
    const sender = createEmailPlaceholderSender();

    const result = await sender.sendEmail({
      to: "player@example.com",
      subject: "CourtPing",
      body: "A slot is open.",
    });

    expect(result.status).toBe("dry_run");
    expect(result.provider).toBe("email-placeholder");
  });
});
