import type { AvailableCourtSlot, NotificationChannel } from "./types";

export interface NotificationDedupeInput {
  alertId: string;
  slot: AvailableCourtSlot;
  channel: NotificationChannel;
}

export function buildNotificationDedupeKey(input: NotificationDedupeInput): string {
  const slotKey =
    input.slot.slotId?.trim() ||
    [
      input.slot.venueId || input.slot.venueName,
      input.slot.courtId || input.slot.courtName,
      normalizeDateForKey(input.slot.startAt),
      normalizeDateForKey(input.slot.endAt),
    ]
      .map(normalizeKeyPart)
      .join(":");

  return [
    "alert",
    normalizeKeyPart(input.alertId),
    "slot",
    normalizeKeyPart(slotKey),
    "channel",
    input.channel,
  ].join("|");
}

export function getSlotIdentifier(slot: AvailableCourtSlot): string {
  return (
    slot.slotId?.trim() ||
    [
      slot.venueId || slot.venueName,
      slot.courtId || slot.courtName,
      normalizeDateForKey(slot.startAt),
      normalizeDateForKey(slot.endAt),
    ]
      .map(normalizeKeyPart)
      .join(":")
  );
}

function normalizeDateForKey(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toISOString();
}

function normalizeKeyPart(value: string | Date): string {
  return encodeURIComponent(String(value).trim().toLowerCase());
}
