import { listFacilities } from "@/lib/data/store";
import type { CreateMonitoringRequestInput, Sport } from "@/types/domain";

const sports: Sport[] = ["tennis", "pickleball"];
const phonePattern = /^\+[1-9][0-9]{6,14}$/;

export type MonitoringRequestValidationResult =
  | { ok: true; value: CreateMonitoringRequestInput }
  | { ok: false; errors: string[] };

export function validateMonitoringRequestInput(raw: unknown): MonitoringRequestValidationResult {
  const input = raw as Partial<CreateMonitoringRequestInput>;
  const errors: string[] = [];
  const facility = input.facilityId
    ? listFacilities().find((candidate) => candidate.id === input.facilityId)
    : undefined;
  const sport = input.sport;
  const preferredTime = String(input.preferredTime ?? "").trim();
  const email = String(input.email ?? "").trim();
  const phone = String(input.phone ?? "").trim();

  if (!facility) {
    errors.push("Choose a valid facility.");
  }

  if (!sport || !sports.includes(sport)) {
    errors.push("Choose tennis or pickleball.");
  }

  if (facility && sport && !facility.sports.includes(sport)) {
    errors.push("Choose a sport offered by this facility.");
  }

  if (!preferredTime) {
    errors.push("Add a preferred time.");
  } else if (preferredTime.length > 160) {
    errors.push("Preferred time must be 160 characters or fewer.");
  }

  if (!email && !phone) {
    errors.push("Add an email or phone number.");
  }

  if (email && !email.includes("@")) {
    errors.push("Add a valid email address.");
  }

  if (phone && !phonePattern.test(phone)) {
    errors.push("Use an E.164 phone number such as +15550101010.");
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      facilityId: facility!.id,
      sport: sport!,
      preferredTime,
      email,
      phone
    }
  };
}
