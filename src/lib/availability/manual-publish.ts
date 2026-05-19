import { addAvailabilitySnapshot, listAlerts, listCourts, listVenues } from "@/lib/data/store";
import { notifyForMatch } from "@/lib/notifications/service";
import type { AvailabilitySlot, Sport } from "@/types/domain";
import { matchAvailabilityToAlerts } from "./matching";

export type PublishManualSlotInput = {
  venueId: string;
  courtId: string;
  sport: Sport;
  startAt: string;
  endAt: string;
};

export type PublishManualSlotResult = {
  slot: AvailabilitySlot;
  snapshotId: string;
  matchCount: number;
  notificationCount: number;
  duplicateCount: number;
};

export async function publishManualAvailabilitySlot(
  input: PublishManualSlotInput,
): Promise<PublishManualSlotResult> {
  const slot = buildManualSlot(input);
  const snapshot = addAvailabilitySnapshot({
    checkedAt: new Date().toISOString(),
    source: "manual",
    openSlotCount: 1,
    slots: [slot],
  });
  const matches = matchAvailabilityToAlerts(
    [slot],
    listAlerts().filter((alert) => alert.active),
  );
  const deliveries = [];

  for (const match of matches) {
    deliveries.push(...(await notifyForMatch(match.alert, match.slot)));
  }

  return {
    slot,
    snapshotId: snapshot.id,
    matchCount: matches.length,
    notificationCount: deliveries.filter((delivery) => delivery.created).length,
    duplicateCount: deliveries.filter((delivery) => !delivery.created).length,
  };
}

export function buildManualSlot(input: PublishManualSlotInput): AvailabilitySlot {
  const venue = listVenues().find((candidate) => candidate.id === input.venueId);
  const court = listCourts().find((candidate) => candidate.id === input.courtId);
  const startAt = new Date(input.startAt);
  const endAt = new Date(input.endAt);

  if (!venue) {
    throw new Error("Choose a valid facility.");
  }

  if (!court || court.venueId !== venue.id) {
    throw new Error("Choose a valid court for this facility.");
  }

  if (court.sport !== input.sport || !venue.sports.includes(input.sport)) {
    throw new Error("Choose a sport offered by this court.");
  }

  if (!Number.isFinite(startAt.getTime()) || !Number.isFinite(endAt.getTime()) || startAt >= endAt) {
    throw new Error("Choose a valid slot window.");
  }

  return {
    id: [
      "manual",
      input.venueId,
      input.courtId,
      startAt.toISOString(),
      endAt.toISOString(),
    ].join(":"),
    venueId: input.venueId,
    courtId: input.courtId,
    sport: input.sport,
    startAt: startAt.toISOString(),
    endAt: endAt.toISOString(),
    status: "open",
    source: "manual",
  };
}
