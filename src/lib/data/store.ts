import type {
  AlertPreference,
  AppUser,
  AvailabilitySnapshot,
  Court,
  CreateAlertInput,
  CreateMonitoringRequestInput,
  NotificationEvent,
  Facility,
  MonitoringRequest,
  Subscription,
  Venue
} from "@/types/domain";
import { DEMO_USER_ID, seedCourts, seedSubscription, seedUser, seedVenues } from "./seed";

type StoreState = {
  users: AppUser[];
  venues: Venue[];
  courts: Court[];
  alerts: AlertPreference[];
  snapshots: AvailabilitySnapshot[];
  notificationEvents: NotificationEvent[];
  monitoringRequests: MonitoringRequest[];
  subscriptions: Subscription[];
};

declare global {
  // eslint-disable-next-line no-var
  var __courtPingStore: StoreState | undefined;
}

const nowIso = () => new Date().toISOString();
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

function createInitialStore(): StoreState {
  return {
    users: [{ ...seedUser }],
    venues: seedVenues.map((venue) => ({ ...venue })),
    courts: seedCourts.map((court) => ({ ...court })),
    alerts: [],
    snapshots: [],
    notificationEvents: [],
    monitoringRequests: [],
    subscriptions: [{ ...seedSubscription }]
  };
}

export function getStore(): StoreState {
  if (!globalThis.__courtPingStore) {
    globalThis.__courtPingStore = createInitialStore();
  }

  return globalThis.__courtPingStore;
}

export function resetStoreForTests() {
  globalThis.__courtPingStore = createInitialStore();
}

export function getDemoUser(): AppUser {
  return getStore().users.find((user) => user.id === DEMO_USER_ID) ?? seedUser;
}

export function updateDemoContact(input: Pick<CreateAlertInput, "email" | "phone">) {
  const store = getStore();
  const user = store.users.find((candidate) => candidate.id === DEMO_USER_ID);
  if (!user) return;

  if (input.email) user.email = input.email;
  if (input.phone) user.phone = input.phone;
}

export function listVenues(): Venue[] {
  return getStore().venues;
}

export function listFacilities(): Facility[] {
  return getStore().venues;
}

export function getFacilityBySlug(slug: string): Facility | undefined {
  return getStore().venues.find((facility) => facility.slug === slug);
}

export function getFacilityById(id: string): Facility | undefined {
  return getStore().venues.find((facility) => facility.id === id);
}

export function upsertFacility(input: Facility): Facility {
  const store = getStore();
  const existingIndex = store.venues.findIndex((facility) => facility.id === input.id);
  const next = { ...input };

  if (existingIndex >= 0) {
    store.venues[existingIndex] = next;
    return next;
  }

  store.venues.unshift(next);
  return next;
}

export function importFacilities(facilities: Facility[]): Facility[] {
  return facilities.map((facility) => upsertFacility(facility));
}

export function listCourts(): Court[] {
  return getStore().courts;
}

export function listCourtsByVenue(venueId: string): Court[] {
  return getStore().courts.filter((court) => court.venueId === venueId && court.active);
}

export function listAlerts(): AlertPreference[] {
  return getStore().alerts;
}

export function listAlertsForUser(userId = DEMO_USER_ID): AlertPreference[] {
  return getStore().alerts.filter((alert) => alert.userId === userId);
}

export function getSubscriptionForUser(userId = DEMO_USER_ID): Subscription {
  return getStore().subscriptions.find((subscription) => subscription.userId === userId) ?? seedSubscription;
}

export function createAlert(input: CreateAlertInput, userId = DEMO_USER_ID): AlertPreference {
  const alert: AlertPreference = {
    id: newId("alert"),
    userId,
    venueId: input.venueId,
    courtId: input.courtId,
    sport: input.sport,
    daysOfWeek: input.daysOfWeek,
    startTime: input.startTime,
    endTime: input.endTime,
    channels: input.channels,
    active: true,
    createdAt: nowIso()
  };

  getStore().alerts.unshift(alert);
  updateDemoContact(input);

  return alert;
}

export function addAvailabilitySnapshot(snapshot: Omit<AvailabilitySnapshot, "id">): AvailabilitySnapshot {
  const created: AvailabilitySnapshot = {
    id: newId("snapshot"),
    ...snapshot
  };

  getStore().snapshots.unshift(created);
  return created;
}

export function listAvailabilitySnapshots(): AvailabilitySnapshot[] {
  return getStore().snapshots;
}

export function addNotificationEvent(event: Omit<NotificationEvent, "id" | "createdAt">): NotificationEvent {
  const created: NotificationEvent = {
    id: newId("notification"),
    createdAt: nowIso(),
    ...event
  };

  getStore().notificationEvents.unshift(created);
  return created;
}

export function listNotificationEvents(): NotificationEvent[] {
  return getStore().notificationEvents;
}

export function findNotificationEvent(alertPreferenceId: string, slotId: string, channel: string) {
  return getStore().notificationEvents.find(
    (event) => event.alertPreferenceId === alertPreferenceId && event.slotId === slotId && event.channel === channel
  );
}

export function createMonitoringRequest(input: CreateMonitoringRequestInput): MonitoringRequest {
  const request: MonitoringRequest = {
    id: newId("monitoring"),
    facilityId: input.facilityId,
    sport: input.sport,
    preferredTime: input.preferredTime,
    email: input.email || null,
    phone: input.phone || null,
    createdAt: nowIso()
  };

  getStore().monitoringRequests.unshift(request);
  return request;
}

export function listMonitoringRequests(): MonitoringRequest[] {
  return getStore().monitoringRequests;
}
