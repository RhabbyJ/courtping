import type { CreateAlertInput, NotificationChannel, Sport } from "@/types/domain";
import { listCourts, listVenues } from "./store";

const sports: Sport[] = ["tennis", "pickleball"];
const channels: NotificationChannel[] = ["sms", "email"];
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const phonePattern = /^\+[1-9][0-9]{6,14}$/;

export type ValidationResult =
  | { ok: true; value: CreateAlertInput }
  | { ok: false; errors: string[] };

export function validateCreateAlertInput(raw: unknown): ValidationResult {
  const input = raw as Partial<CreateAlertInput>;
  const errors: string[] = [];
  const venues = listVenues();
  const courts = listCourts();

  if (!input.venueId || !venues.some((venue) => venue.id === input.venueId)) {
    errors.push("Choose a valid venue.");
  }

  const court = input.courtId ? courts.find((candidate) => candidate.id === input.courtId) : undefined;
  if (!court) {
    errors.push("Choose a valid court.");
  }

  if (!input.sport || !sports.includes(input.sport)) {
    errors.push("Choose tennis or pickleball.");
  }

  if (court && input.venueId && court.venueId !== input.venueId) {
    errors.push("Court must belong to the selected venue.");
  }

  if (court && input.sport && court.sport !== input.sport) {
    errors.push("Court must match the selected sport.");
  }

  if (!Array.isArray(input.daysOfWeek) || input.daysOfWeek.length === 0) {
    errors.push("Choose at least one day.");
  } else if (input.daysOfWeek.some((day) => !Number.isInteger(day) || day < 0 || day > 6)) {
    errors.push("Days must be numbers from 0 to 6.");
  }

  if (!input.startTime || !timePattern.test(input.startTime)) {
    errors.push("Choose a valid start time.");
  }

  if (!input.endTime || !timePattern.test(input.endTime)) {
    errors.push("Choose a valid end time.");
  }

  if (input.startTime && input.endTime && input.startTime >= input.endTime) {
    errors.push("End time must be after start time.");
  }

  if (!Array.isArray(input.channels) || input.channels.length === 0) {
    errors.push("Choose at least one notification channel.");
  } else if (input.channels.some((channel) => !channels.includes(channel))) {
    errors.push("Choose a valid notification channel.");
  }

  if (input.channels?.includes("sms") && !input.phone) {
    errors.push("Add a phone number for SMS dry-run notifications.");
  }

  if (input.phone && !phonePattern.test(input.phone)) {
    errors.push("Use an E.164 phone number such as +15550101010.");
  }

  if (input.channels?.includes("email") && !input.email) {
    errors.push("Add an email address for email notifications.");
  }

  if (input.email && !input.email.includes("@")) {
    errors.push("Add a valid email address.");
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      venueId: input.venueId!,
      courtId: input.courtId!,
      sport: input.sport!,
      daysOfWeek: [...new Set(input.daysOfWeek!)].sort(),
      startTime: input.startTime!,
      endTime: input.endTime!,
      channels: [...new Set(input.channels!)],
      phone: input.phone,
      email: input.email
    }
  };
}
