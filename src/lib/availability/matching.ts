import type { AlertPreference, AvailabilitySlot } from "@/types/domain";

export type SlotMatch = {
  alert: AlertPreference;
  slot: AvailabilitySlot;
};

export function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function slotFitsAlert(slot: AvailabilitySlot, alert: AlertPreference): boolean {
  if (!alert.active || slot.status !== "open") return false;
  if (slot.sport !== alert.sport) return false;
  if (slot.venueId !== alert.venueId) return false;
  if (slot.courtId !== alert.courtId) return false;

  const startsAt = new Date(slot.startAt);
  const endsAt = new Date(slot.endAt);
  const dayOfWeek = startsAt.getDay();

  if (!alert.daysOfWeek.includes(dayOfWeek)) return false;

  const slotStart = startsAt.getHours() * 60 + startsAt.getMinutes();
  const slotEnd = endsAt.getHours() * 60 + endsAt.getMinutes();

  return slotStart >= timeToMinutes(alert.startTime) && slotEnd <= timeToMinutes(alert.endTime);
}

export function matchAvailabilityToAlerts(slots: AvailabilitySlot[], alerts: AlertPreference[]): SlotMatch[] {
  const matches: SlotMatch[] = [];

  for (const alert of alerts) {
    for (const slot of slots) {
      if (slotFitsAlert(slot, alert)) {
        matches.push({ alert, slot });
      }
    }
  }

  return matches;
}

