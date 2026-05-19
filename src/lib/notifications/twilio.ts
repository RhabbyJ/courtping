import type {
  NotificationDeliveryResult,
  SmsDeliveryRequest,
  SmsSender,
} from "./types";

type FetchLike = (
  input: string,
  init: {
    method: "POST";
    headers: Record<string, string>;
    body: URLSearchParams;
  },
) => Promise<{
  ok: boolean;
  status: number;
  json?: () => Promise<unknown>;
  text?: () => Promise<string>;
}>;

export interface TwilioSmsConfig {
  accountSid?: string;
  authToken?: string;
  fromNumber?: string;
  dryRun?: boolean;
  fetch?: FetchLike;
}

export class TwilioSmsSender implements SmsSender {
  private readonly accountSid?: string;
  private readonly authToken?: string;
  private readonly fromNumber?: string;
  private readonly dryRun: boolean;
  private readonly fetch?: FetchLike;

  constructor(config: TwilioSmsConfig = {}) {
    const env = getProcessEnv();

    this.accountSid = config.accountSid || env.TWILIO_ACCOUNT_SID;
    this.authToken = config.authToken || env.TWILIO_AUTH_TOKEN;
    this.fromNumber = config.fromNumber || env.TWILIO_FROM_NUMBER;
    this.dryRun = config.dryRun ?? env.TWILIO_DRY_RUN !== "false";
    this.fetch = config.fetch || (globalThis.fetch as FetchLike | undefined);
  }

  async sendSms(request: SmsDeliveryRequest): Promise<NotificationDeliveryResult> {
    if (!request.to.trim()) {
      return failed("SMS recipient phone number is required.", this.dryRun);
    }

    if (!request.body.trim()) {
      return failed("SMS body is required.", this.dryRun);
    }

    if (this.dryRun) {
      return {
        status: "dry_run",
        provider: "twilio",
        dryRun: true,
        providerMessageId: `dry-run:${stableFingerprint(request.to, request.body)}`,
      };
    }

    if (!this.accountSid || !this.authToken || !this.fromNumber) {
      return failed(
        "Twilio live SMS requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER.",
        false,
      );
    }

    if (!this.fetch) {
      return failed("A fetch implementation is required to send live Twilio SMS.", false);
    }

    const response = await this.fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(
        this.accountSid,
      )}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${encodeBasicAuth(`${this.accountSid}:${this.authToken}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          Body: request.body,
          From: this.fromNumber,
          To: request.to,
        }),
      },
    );

    const payload = await parseTwilioPayload(response);

    if (!response.ok) {
      return failed(
        `Twilio SMS failed with HTTP ${response.status}${payload.message ? `: ${payload.message}` : ""}`,
        false,
      );
    }

    return {
      status: "sent",
      provider: "twilio",
      dryRun: false,
      providerMessageId: payload.sid,
    };
  }
}

export function createTwilioSmsSender(config: TwilioSmsConfig = {}): SmsSender {
  return new TwilioSmsSender(config);
}

function failed(errorMessage: string, dryRun: boolean): NotificationDeliveryResult {
  return {
    status: "failed",
    provider: "twilio",
    dryRun,
    errorMessage,
  };
}

function getProcessEnv(): Record<string, string | undefined> {
  return (
    (globalThis as typeof globalThis & {
      process?: { env?: Record<string, string | undefined> };
    }).process?.env || {}
  );
}

function encodeBasicAuth(value: string): string {
  const buffer = (globalThis as typeof globalThis & {
    Buffer?: { from(input: string): { toString(encoding: "base64"): string } };
  }).Buffer;

  if (buffer) {
    return buffer.from(value).toString("base64");
  }

  return globalThis.btoa(value);
}

async function parseTwilioPayload(response: {
  json?: () => Promise<unknown>;
  text?: () => Promise<string>;
}): Promise<{ sid?: string; message?: string }> {
  if (response.json) {
    try {
      const json = await response.json();

      if (json && typeof json === "object") {
        const payload = json as Record<string, unknown>;

        return {
          sid: typeof payload.sid === "string" ? payload.sid : undefined,
          message: typeof payload.message === "string" ? payload.message : undefined,
        };
      }
    } catch {
      return {};
    }
  }

  if (response.text) {
    const text = await response.text();
    return text ? { message: text } : {};
  }

  return {};
}

function stableFingerprint(...parts: string[]): string {
  let hash = 2166136261;

  for (const part of parts.join("|")) {
    hash ^= part.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16);
}
