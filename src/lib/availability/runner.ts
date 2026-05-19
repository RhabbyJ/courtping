import { addAvailabilitySnapshot, listAlerts } from "@/lib/data/store";
import { notifyForMatch } from "@/lib/notifications/service";
import { matchAvailabilityToAlerts } from "./matching";
import { MockAvailabilityAdapter } from "./mock-adapter";

export async function runMockAvailabilityCheck() {
  const adapter = new MockAvailabilityAdapter();
  const slots = await adapter.listAvailability();
  const openSlots = slots.filter((slot) => slot.status === "open");
  const snapshot = addAvailabilitySnapshot({
    checkedAt: new Date().toISOString(),
    source: "mock",
    openSlotCount: openSlots.length,
    slots
  });
  const matches = matchAvailabilityToAlerts(openSlots, listAlerts().filter((alert) => alert.active));
  const deliveries = [];

  for (const match of matches) {
    deliveries.push(...(await notifyForMatch(match.alert, match.slot)));
  }

  return {
    snapshot,
    matchCount: matches.length,
    notificationCount: deliveries.filter((delivery) => delivery.created).length,
    duplicateCount: deliveries.filter((delivery) => !delivery.created).length
  };
}

