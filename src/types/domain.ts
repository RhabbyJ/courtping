export type Sport = "tennis" | "pickleball";

export type PlanTier = "free" | "pro";

export type IndoorOutdoor = "indoor" | "outdoor" | "both";

export type PublicPrivate = "public" | "private" | "public_private";

export type LiveStatus = "live_alerts" | "manual_beta" | "booking_link_only" | "coming_soon";

export type SourcePlatform =
  | "manual"
  | "courtreserve"
  | "playbypoint"
  | "webtrac"
  | "activenet"
  | "civicrec"
  | "unknown";

export type BillingStatus = "active" | "trialing" | "past_due" | "canceled" | "incomplete";

export type NotificationChannel = "sms" | "email";

export type SlotStatus = "open" | "booked";

export type NotificationStatus = "pending" | "dry_run" | "sent" | "skipped" | "failed";

export type AppUser = {
  id: string;
  authUserId?: string | null;
  email: string;
  phone?: string | null;
  planTier: PlanTier;
  createdAt: string;
};

export type Venue = {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
  sports: Sport[];
  numberOfCourts: number;
  indoorOutdoor: IndoorOutdoor;
  lights: boolean;
  publicPrivate: PublicPrivate;
  bookingUrl: string;
  sourceUrl: string;
  liveStatus: LiveStatus;
  sourcePlatform: SourcePlatform;
  notes: string;
  createdAt: string;
};

export type Facility = Venue;

export type Court = {
  id: string;
  venueId: string;
  name: string;
  sport: Sport;
  surface: string;
  indoor: boolean;
  active: boolean;
};

export type AlertPreference = {
  id: string;
  userId: string;
  venueId: string;
  courtId: string;
  sport: Sport;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  channels: NotificationChannel[];
  active: boolean;
  createdAt: string;
};

export type AvailabilitySlot = {
  id: string;
  venueId: string;
  courtId: string;
  sport: Sport;
  startAt: string;
  endAt: string;
  status: SlotStatus;
  source: "mock" | "manual";
};

export type AvailabilitySnapshot = {
  id: string;
  checkedAt: string;
  source: "mock" | "manual";
  openSlotCount: number;
  slots: AvailabilitySlot[];
};

export type NotificationEvent = {
  id: string;
  alertPreferenceId: string;
  userId: string;
  channel: NotificationChannel;
  recipient: string;
  slotId: string;
  status: NotificationStatus;
  message: string;
  providerResponse?: string | null;
  createdAt: string;
};

export type Subscription = {
  id: string;
  userId: string;
  planTier: PlanTier;
  status: BillingStatus;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  currentPeriodEnd?: string | null;
};

export type MonitoringRequest = {
  id: string;
  facilityId: string;
  sport: Sport;
  preferredTime: string;
  email?: string | null;
  phone?: string | null;
  createdAt: string;
};

export type CreateAlertInput = {
  venueId: string;
  courtId: string;
  sport: Sport;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  channels: NotificationChannel[];
  phone?: string;
  email?: string;
};

export type CreateMonitoringRequestInput = {
  facilityId: string;
  sport: Sport;
  preferredTime: string;
  email?: string;
  phone?: string;
};
