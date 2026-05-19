import type {
  EmailDeliveryRequest,
  EmailSender,
  NotificationDeliveryResult,
} from "./types";

export interface EmailPlaceholderConfig {
  dryRun?: boolean;
}

export class EmailPlaceholderSender implements EmailSender {
  private readonly dryRun: boolean;

  constructor(config: EmailPlaceholderConfig = {}) {
    this.dryRun = config.dryRun ?? true;
  }

  async sendEmail(request: EmailDeliveryRequest): Promise<NotificationDeliveryResult> {
    if (!request.to.trim()) {
      return failed("Email recipient is required.", this.dryRun);
    }

    if (!request.subject.trim() || !request.body.trim()) {
      return failed("Email subject and body are required.", this.dryRun);
    }

    if (!this.dryRun) {
      return failed("No live email provider is configured for the MVP placeholder.", false);
    }

    return {
      status: "dry_run",
      provider: "email-placeholder",
      dryRun: true,
      providerMessageId: `dry-run:${stableFingerprint(request.to, request.subject, request.body)}`,
    };
  }
}

export function createEmailPlaceholderSender(config: EmailPlaceholderConfig = {}): EmailSender {
  return new EmailPlaceholderSender(config);
}

function failed(errorMessage: string, dryRun: boolean): NotificationDeliveryResult {
  return {
    status: "failed",
    provider: "email-placeholder",
    dryRun,
    errorMessage,
  };
}

function stableFingerprint(...parts: string[]): string {
  let hash = 2166136261;

  for (const part of parts.join("|")) {
    hash ^= part.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16);
}
