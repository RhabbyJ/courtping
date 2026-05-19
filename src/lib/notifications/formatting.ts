import type {
  AlertNotificationContext,
  AvailableCourtSlot,
  NotificationMessage,
} from "./types";

export const DEFAULT_NOTIFICATION_TIME_ZONE = "America/Los_Angeles";

export interface FormatNotificationInput {
  alert: AlertNotificationContext;
  slot: AvailableCourtSlot;
  timeZone?: string;
}

export function formatSmsNotification(input: FormatNotificationInput): NotificationMessage {
  const windowText = formatSlotWindow(input.slot, input.timeZone);
  const sport = input.slot.sport || input.alert.sport;
  const sportText = sport ? `${sport} ` : "";
  const bookingText = input.slot.bookingUrl
    ? ` Facility booking: ${input.slot.bookingUrl}`
    : " Book through the facility website.";

  return {
    channel: "sms",
    to: "",
    body: `CourtPing: ${sportText}${input.slot.courtName} at ${input.slot.venueName} is open ${windowText}.${bookingText}`,
  };
}

export function formatEmailNotification(input: FormatNotificationInput): NotificationMessage {
  const windowText = formatSlotWindow(input.slot, input.timeZone);
  const alertName = input.alert.alertName || "your alert";
  const sport = input.slot.sport || input.alert.sport || "court";
  const bookingText = input.slot.bookingUrl
    ? `Facility booking page: ${input.slot.bookingUrl}`
    : "Book through the facility website.";

  return {
    channel: "email",
    to: "",
    subject: `CourtPing: ${input.slot.venueName} slot open`,
    body: [
      `A ${sport} slot matching ${alertName} is open.`,
      "",
      `Venue: ${input.slot.venueName}`,
      `Court: ${input.slot.courtName}`,
      `Time: ${windowText}`,
      bookingText,
      "",
      "CourtPing does not book courts automatically.",
    ].join("\n"),
  };
}

export function formatSlotWindow(
  slot: AvailableCourtSlot,
  fallbackTimeZone = DEFAULT_NOTIFICATION_TIME_ZONE,
): string {
  const timeZone = slot.timeZone || fallbackTimeZone;
  const start = coerceDate(slot.startAt, "slot.startAt");
  const end = coerceDate(slot.endAt, "slot.endAt");
  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone,
  });
  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  });

  return `${dateFormatter.format(start)}, ${timeFormatter.format(start)}-${timeFormatter.format(end)}`;
}

function coerceDate(value: string | Date, fieldName: string): Date {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ${fieldName}: ${String(value)}`);
  }

  return date;
}
