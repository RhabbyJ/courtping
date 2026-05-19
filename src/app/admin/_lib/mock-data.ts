import { runMockAvailabilityCheck as runSharedMockAvailabilityCheck } from "@/lib/availability/runner";
import {
  getDemoUser,
  listAlerts,
  listAvailabilitySnapshots,
  listCourts,
  listMonitoringRequests,
  listNotificationEvents,
  listVenues,
} from "@/lib/data/store";
import type {
  AlertPreference,
  AvailabilitySlot,
  AvailabilitySnapshot,
  NotificationEvent,
  Venue,
  Court,
  MonitoringRequest,
} from "@/types/domain";

export type AdminData = {
  venues: Venue[];
  courts: Court[];
  alerts: AlertPreference[];
  snapshots: AvailabilitySnapshot[];
  notifications: NotificationEvent[];
  monitoringRequests: MonitoringRequest[];
  lastCheckedAt: string | null;
};

export type AdminSnapshotSlot = AvailabilitySlot & {
  snapshotId: string;
  checkedAt: string;
};

export type MockCheckResult = {
  checkedAt: string;
  snapshotsCreated: number;
  slotsChecked: number;
  openSlots: number;
  matchCount: number;
  notificationsCreated: number;
  duplicatesSkipped: number;
};

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export async function runAdminMockAvailabilityCheck(): Promise<MockCheckResult> {
  const result = await runSharedMockAvailabilityCheck();

  return {
    checkedAt: result.snapshot.checkedAt,
    snapshotsCreated: 1,
    slotsChecked: result.snapshot.slots.length,
    openSlots: result.snapshot.openSlotCount,
    matchCount: result.matchCount,
    notificationsCreated: result.notificationCount,
    duplicatesSkipped: result.duplicateCount,
  };
}

export function getAdminData(): AdminData {
  const snapshots = listAvailabilitySnapshots();

  return {
    venues: listVenues(),
    courts: listCourts(),
    alerts: listAlerts(),
    snapshots,
    notifications: listNotificationEvents(),
    monitoringRequests: listMonitoringRequests(),
    lastCheckedAt: snapshots[0]?.checkedAt ?? null,
  };
}

export function flattenSnapshotSlots(
  snapshots: AvailabilitySnapshot[],
): AdminSnapshotSlot[] {
  return snapshots.flatMap((snapshot) =>
    snapshot.slots.map((slot) => ({
      ...slot,
      snapshotId: snapshot.id,
      checkedAt: snapshot.checkedAt,
    })),
  );
}

export function getCourtLabel(courtId: string) {
  const courts = listCourts();
  const venues = listVenues();
  const court = courts.find((candidate) => candidate.id === courtId);
  const venue = court
    ? venues.find((candidate) => candidate.id === court.venueId)
    : undefined;

  if (!court) {
    return courtId;
  }

  return venue ? `${venue.name} / ${court.name}` : court.name;
}

export function getVenueName(venueId: string) {
  return listVenues().find((candidate) => candidate.id === venueId)?.name ?? venueId;
}

export function getAlertOwner(_alert: AlertPreference) {
  return getDemoUser().email;
}

export function formatDays(daysOfWeek: number[]) {
  return daysOfWeek.map((day) => dayNames[day] ?? String(day)).join(", ");
}

export function formatDateTime(value: string | null) {
  if (!value) {
    return "Never";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
