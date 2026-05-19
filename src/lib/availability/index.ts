export const DEFAULT_AVAILABILITY_TIME_ZONE = "America/Los_Angeles";
export const MOCK_AVAILABILITY_SOURCE = "mock-seeded-la";
export const MOCK_AVAILABILITY_CHECKED_AT = "2026-05-18T16:00:00.000Z";

export type CourtSport = "tennis" | "pickleball";
export type AvailabilityStatus = "open" | "reserved" | "closed" | "unknown";
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const allDaysOfWeek: DayOfWeek[] = [0, 1, 2, 3, 4, 5, 6];

export interface AvailabilityCourt {
  id: string;
  venueId: string;
  name: string;
  sport: CourtSport;
  surface?: string;
  indoor?: boolean;
}

export interface AvailabilityVenue {
  id: string;
  name: string;
  city: string;
  state: string;
  timeZone: string;
  bookingUrl?: string;
  courts: AvailabilityCourt[];
}

export interface NormalizedAvailabilitySlot {
  id: string;
  source: string;
  venueId: string;
  venueName: string;
  courtId: string;
  courtName: string;
  sport: CourtSport;
  startsAt: string;
  endsAt: string;
  timeZone: string;
  status: AvailabilityStatus;
  checkedAt: string;
  bookingUrl?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface AvailabilityQuery {
  sports?: CourtSport[];
  venueIds?: string[];
  courtIds?: string[];
  startsAt?: string;
  endsAt?: string;
}

export interface AvailabilitySnapshot {
  source: string;
  checkedAt: string;
  venues: AvailabilityVenue[];
  slots: NormalizedAvailabilitySlot[];
}

export interface AvailabilityAdapter {
  readonly source: string;
  fetchAvailability(query?: AvailabilityQuery): Promise<AvailabilitySnapshot>;
}

export interface TimeWindow {
  start: string;
  end: string;
}

export interface AvailabilityAlertPreference {
  id: string;
  userId: string;
  active?: boolean;
  sport?: CourtSport;
  venueIds?: string[];
  courtIds?: string[];
  daysOfWeek?: DayOfWeek[];
  timeWindows?: TimeWindow[];
  minDurationMinutes?: number;
  timeZone?: string;
}

export interface AvailabilityMatch {
  id: string;
  alertPreferenceId: string;
  userId: string;
  slotId: string;
  slot: NormalizedAvailabilitySlot;
  overlapMinutes: number;
  matchedWindow?: TimeWindow;
}

export const seededLaAvailabilityVenues: AvailabilityVenue[] = [
  {
    id: "griffith-park-riverside",
    name: "Griffith Park Riverside Courts",
    city: "Los Angeles",
    state: "CA",
    timeZone: DEFAULT_AVAILABILITY_TIME_ZONE,
    bookingUrl: "mock://courtping/venues/griffith-park-riverside",
    courts: [
      {
        id: "griffith-tennis-1",
        venueId: "griffith-park-riverside",
        name: "Court 1",
        sport: "tennis",
        surface: "hard",
        indoor: false,
      },
      {
        id: "griffith-tennis-2",
        venueId: "griffith-park-riverside",
        name: "Court 2",
        sport: "tennis",
        surface: "hard",
        indoor: false,
      },
    ],
  },
  {
    id: "cheviot-hills-recreation-center",
    name: "Cheviot Hills Recreation Center",
    city: "Los Angeles",
    state: "CA",
    timeZone: DEFAULT_AVAILABILITY_TIME_ZONE,
    bookingUrl: "mock://courtping/venues/cheviot-hills-recreation-center",
    courts: [
      {
        id: "cheviot-tennis-3",
        venueId: "cheviot-hills-recreation-center",
        name: "Court 3",
        sport: "tennis",
        surface: "hard",
        indoor: false,
      },
      {
        id: "cheviot-pickleball-a",
        venueId: "cheviot-hills-recreation-center",
        name: "Pickleball A",
        sport: "pickleball",
        surface: "hard",
        indoor: false,
      },
    ],
  },
  {
    id: "westwood-recreation-center",
    name: "Westwood Recreation Center",
    city: "Los Angeles",
    state: "CA",
    timeZone: DEFAULT_AVAILABILITY_TIME_ZONE,
    bookingUrl: "mock://courtping/venues/westwood-recreation-center",
    courts: [
      {
        id: "westwood-pickleball-1",
        venueId: "westwood-recreation-center",
        name: "Pickleball 1",
        sport: "pickleball",
        surface: "hard",
        indoor: false,
      },
    ],
  },
];

export const seededLaAvailabilitySlots: NormalizedAvailabilitySlot[] = [
  createSeededSlot({
    id: "griffith-tennis-1-2026-05-19-0900",
    courtId: "griffith-tennis-1",
    startsAt: "2026-05-19T16:00:00.000Z",
    endsAt: "2026-05-19T17:00:00.000Z",
    status: "open",
  }),
  createSeededSlot({
    id: "griffith-tennis-2-2026-05-19-1700",
    courtId: "griffith-tennis-2",
    startsAt: "2026-05-20T00:00:00.000Z",
    endsAt: "2026-05-20T01:00:00.000Z",
    status: "reserved",
  }),
  createSeededSlot({
    id: "cheviot-pickleball-a-2026-05-19-1800",
    courtId: "cheviot-pickleball-a",
    startsAt: "2026-05-20T01:00:00.000Z",
    endsAt: "2026-05-20T02:30:00.000Z",
    status: "open",
  }),
  createSeededSlot({
    id: "cheviot-tennis-3-2026-05-20-0700",
    courtId: "cheviot-tennis-3",
    startsAt: "2026-05-20T14:00:00.000Z",
    endsAt: "2026-05-20T15:00:00.000Z",
    status: "open",
  }),
  createSeededSlot({
    id: "westwood-pickleball-1-2026-05-21-2000",
    courtId: "westwood-pickleball-1",
    startsAt: "2026-05-22T03:00:00.000Z",
    endsAt: "2026-05-22T04:00:00.000Z",
    status: "open",
  }),
];

export interface MockAvailabilityAdapterOptions {
  venues?: AvailabilityVenue[];
  slots?: NormalizedAvailabilitySlot[];
  checkedAt?: string;
}

export class MockAvailabilityAdapter implements AvailabilityAdapter {
  readonly source = MOCK_AVAILABILITY_SOURCE;

  private readonly venues: AvailabilityVenue[];
  private readonly slots: NormalizedAvailabilitySlot[];
  private readonly checkedAt: string;

  constructor(options: MockAvailabilityAdapterOptions = {}) {
    this.venues = options.venues ?? seededLaAvailabilityVenues;
    this.slots = options.slots ?? seededLaAvailabilitySlots;
    this.checkedAt = options.checkedAt ?? MOCK_AVAILABILITY_CHECKED_AT;
  }

  async fetchAvailability(query: AvailabilityQuery = {}): Promise<AvailabilitySnapshot> {
    const slots = this.slots.filter((slot) => slotMatchesQuery(slot, query));
    const venueIds = new Set(slots.map((slot) => slot.venueId));
    const venues = this.venues
      .filter((venue) => shouldIncludeVenue(venue, query, venueIds))
      .map((venue) => cloneVenue(venue, query));

    return {
      source: this.source,
      checkedAt: this.checkedAt,
      venues,
      slots: slots.map(cloneSlot),
    };
  }
}

export function findMatchingAvailabilitySlots(
  alertPreference: AvailabilityAlertPreference,
  slots: NormalizedAvailabilitySlot[],
): AvailabilityMatch[] {
  if (alertPreference.active === false) {
    return [];
  }

  return slots
    .map((slot) => createAvailabilityMatch(alertPreference, slot))
    .filter((match): match is AvailabilityMatch => match !== null)
    .sort((a, b) => {
      const timeComparison = a.slot.startsAt.localeCompare(b.slot.startsAt);
      return timeComparison === 0 ? a.slotId.localeCompare(b.slotId) : timeComparison;
    });
}

export function matchAvailabilitySlotsToAlertPreferences(
  slots: NormalizedAvailabilitySlot[],
  alertPreferences: AvailabilityAlertPreference[],
): AvailabilityMatch[] {
  return alertPreferences
    .flatMap((alertPreference) => findMatchingAvailabilitySlots(alertPreference, slots))
    .sort((a, b) => {
      const alertComparison = a.alertPreferenceId.localeCompare(b.alertPreferenceId);
      if (alertComparison !== 0) {
        return alertComparison;
      }

      return a.slot.startsAt.localeCompare(b.slot.startsAt);
    });
}

function createAvailabilityMatch(
  alertPreference: AvailabilityAlertPreference,
  slot: NormalizedAvailabilitySlot,
): AvailabilityMatch | null {
  if (!slotCanMatchPreference(alertPreference, slot)) {
    return null;
  }

  const timeZone = alertPreference.timeZone ?? slot.timeZone ?? DEFAULT_AVAILABILITY_TIME_ZONE;
  const overlap = getBestWindowOverlap(alertPreference, slot, timeZone);
  const minDurationMinutes = alertPreference.minDurationMinutes ?? 0;

  if (overlap.minutes <= 0 || overlap.minutes < minDurationMinutes) {
    return null;
  }

  return {
    id: `${alertPreference.id}:${slot.id}`,
    alertPreferenceId: alertPreference.id,
    userId: alertPreference.userId,
    slotId: slot.id,
    slot: cloneSlot(slot),
    overlapMinutes: overlap.minutes,
    matchedWindow: overlap.window,
  };
}

function slotCanMatchPreference(
  alertPreference: AvailabilityAlertPreference,
  slot: NormalizedAvailabilitySlot,
): boolean {
  if (slot.status !== "open") {
    return false;
  }

  if (alertPreference.sport && alertPreference.sport !== slot.sport) {
    return false;
  }

  if (alertPreference.venueIds?.length && !alertPreference.venueIds.includes(slot.venueId)) {
    return false;
  }

  if (alertPreference.courtIds?.length && !alertPreference.courtIds.includes(slot.courtId)) {
    return false;
  }

  return true;
}

interface LocalDateTimeParts {
  year: number;
  month: number;
  day: number;
  dayOfWeek: DayOfWeek;
  minuteOfDay: number;
}

interface SlotSegment {
  dayOfWeek: DayOfWeek;
  startMinute: number;
  endMinute: number;
}

interface WindowSegment {
  id: string;
  dayOfWeek: DayOfWeek;
  startMinute: number;
  endMinute: number;
  window?: TimeWindow;
}

interface WindowOverlap {
  minutes: number;
  window?: TimeWindow;
}

function getBestWindowOverlap(
  alertPreference: AvailabilityAlertPreference,
  slot: NormalizedAvailabilitySlot,
  timeZone: string,
): WindowOverlap {
  const slotSegments = getSlotSegments(slot, timeZone);
  const windowSegments = getWindowSegments(alertPreference);
  const overlapsByWindow = new Map<string, WindowOverlap>();

  for (const slotSegment of slotSegments) {
    for (const windowSegment of windowSegments) {
      if (slotSegment.dayOfWeek !== windowSegment.dayOfWeek) {
        continue;
      }

      const minutes = getMinuteOverlap(slotSegment, windowSegment);
      if (minutes <= 0) {
        continue;
      }

      const existing = overlapsByWindow.get(windowSegment.id);
      overlapsByWindow.set(windowSegment.id, {
        minutes: (existing?.minutes ?? 0) + minutes,
        window: windowSegment.window,
      });
    }
  }

  return Array.from(overlapsByWindow.values()).reduce<WindowOverlap>(
    (best, overlap) => (overlap.minutes > best.minutes ? overlap : best),
    { minutes: 0 },
  );
}

function getSlotSegments(slot: NormalizedAvailabilitySlot, timeZone: string): SlotSegment[] {
  const startsAt = parseDate(slot.startsAt, "slot startsAt");
  const endsAt = parseDate(slot.endsAt, "slot endsAt");

  if (endsAt.getTime() <= startsAt.getTime()) {
    return [];
  }

  const startParts = getLocalDateTimeParts(startsAt, timeZone);
  const endParts = getLocalDateTimeParts(endsAt, timeZone);

  if (isSameLocalDate(startParts, endParts)) {
    if (endParts.minuteOfDay <= startParts.minuteOfDay) {
      return [];
    }

    return [
      {
        dayOfWeek: startParts.dayOfWeek,
        startMinute: startParts.minuteOfDay,
        endMinute: endParts.minuteOfDay,
      },
    ];
  }

  const segments: SlotSegment[] = [
    {
      dayOfWeek: startParts.dayOfWeek,
      startMinute: startParts.minuteOfDay,
      endMinute: 24 * 60,
    },
  ];

  if (endParts.minuteOfDay > 0) {
    segments.push({
      dayOfWeek: endParts.dayOfWeek,
      startMinute: 0,
      endMinute: endParts.minuteOfDay,
    });
  }

  return segments;
}

function getWindowSegments(alertPreference: AvailabilityAlertPreference): WindowSegment[] {
  const daysOfWeek = normalizeDaysOfWeek(alertPreference.daysOfWeek);
  const segments: WindowSegment[] = [];

  if (!alertPreference.timeWindows?.length) {
    return daysOfWeek.map((dayOfWeek) => ({
      id: `${dayOfWeek}:all-day`,
      dayOfWeek,
      startMinute: 0,
      endMinute: 24 * 60,
    }));
  }

  for (const dayOfWeek of daysOfWeek) {
    alertPreference.timeWindows.forEach((window, index) => {
      const startMinute = parseLocalTime(window.start);
      const endMinute = parseLocalTime(window.end);
      const id = `${dayOfWeek}:${index}:${window.start}-${window.end}`;

      if (startMinute < endMinute) {
        segments.push({
          id,
          dayOfWeek,
          startMinute,
          endMinute,
          window: alertPreference.timeWindows?.length ? window : undefined,
        });
        return;
      }

      if (startMinute > endMinute) {
        segments.push({
          id,
          dayOfWeek,
          startMinute,
          endMinute: 24 * 60,
          window,
        });

        if (endMinute > 0) {
          segments.push({
            id,
            dayOfWeek: nextDay(dayOfWeek),
            startMinute: 0,
            endMinute,
            window,
          });
        }
      }
    });
  }

  return segments;
}

function getMinuteOverlap(
  slotSegment: SlotSegment,
  windowSegment: WindowSegment,
): number {
  const startMinute = Math.max(slotSegment.startMinute, windowSegment.startMinute);
  const endMinute = Math.min(slotSegment.endMinute, windowSegment.endMinute);
  return Math.max(0, endMinute - startMinute);
}

function parseLocalTime(value: string): number {
  const match = /^([0-2][0-9]):([0-5][0-9])$/.exec(value);
  if (!match) {
    throw new Error(`Invalid local time "${value}". Expected HH:mm.`);
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (hour > 23) {
    throw new Error(`Invalid local time "${value}". Hour must be between 00 and 23.`);
  }

  return hour * 60 + minute;
}

function normalizeDaysOfWeek(daysOfWeek?: DayOfWeek[]): DayOfWeek[] {
  const days = daysOfWeek?.length ? daysOfWeek : allDaysOfWeek;
  const uniqueDays = new Set<DayOfWeek>();

  for (const day of days) {
    if (!Number.isInteger(day) || day < 0 || day > 6) {
      throw new Error(`Invalid day of week "${day}". Expected 0 through 6.`);
    }

    uniqueDays.add(day);
  }

  return Array.from(uniqueDays);
}

function nextDay(dayOfWeek: DayOfWeek): DayOfWeek {
  return ((dayOfWeek + 1) % 7) as DayOfWeek;
}

const weekdayByShortName: Record<string, DayOfWeek> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function getLocalDateTimeParts(date: Date, timeZone: string): LocalDateTimeParts {
  let formatter = formatterCache.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      weekday: "short",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
    formatterCache.set(timeZone, formatter);
  }

  const parts = formatter.formatToParts(date).reduce<Record<string, string>>((acc, part) => {
    if (part.type !== "literal") {
      acc[part.type] = part.value;
    }

    return acc;
  }, {});
  const weekday = parts.weekday?.slice(0, 3) ?? "";
  const dayOfWeek = weekdayByShortName[weekday];

  if (dayOfWeek === undefined) {
    throw new Error(`Unable to parse weekday "${parts.weekday}" for time zone "${timeZone}".`);
  }

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    dayOfWeek,
    minuteOfDay: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

function isSameLocalDate(a: LocalDateTimeParts, b: LocalDateTimeParts): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

function parseDate(value: string, label: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ${label}: "${value}".`);
  }

  return date;
}

function slotMatchesQuery(slot: NormalizedAvailabilitySlot, query: AvailabilityQuery): boolean {
  if (query.sports?.length && !query.sports.includes(slot.sport)) {
    return false;
  }

  if (query.venueIds?.length && !query.venueIds.includes(slot.venueId)) {
    return false;
  }

  if (query.courtIds?.length && !query.courtIds.includes(slot.courtId)) {
    return false;
  }

  if (query.startsAt || query.endsAt) {
    const slotStartsAt = parseDate(slot.startsAt, "slot startsAt").getTime();
    const slotEndsAt = parseDate(slot.endsAt, "slot endsAt").getTime();
    const queryStartsAt = query.startsAt
      ? parseDate(query.startsAt, "query startsAt").getTime()
      : Number.NEGATIVE_INFINITY;
    const queryEndsAt = query.endsAt
      ? parseDate(query.endsAt, "query endsAt").getTime()
      : Number.POSITIVE_INFINITY;

    if (slotEndsAt <= queryStartsAt || slotStartsAt >= queryEndsAt) {
      return false;
    }
  }

  return true;
}

function shouldIncludeVenue(
  venue: AvailabilityVenue,
  query: AvailabilityQuery,
  venueIdsWithSlots: Set<string>,
): boolean {
  if (query.venueIds?.length) {
    return query.venueIds.includes(venue.id);
  }

  return venueIdsWithSlots.has(venue.id);
}

function cloneVenue(venue: AvailabilityVenue, query: AvailabilityQuery): AvailabilityVenue {
  const courts = venue.courts
    .filter((court) => !query.sports?.length || query.sports.includes(court.sport))
    .filter((court) => !query.courtIds?.length || query.courtIds.includes(court.id))
    .map((court) => ({ ...court }));

  return {
    ...venue,
    courts,
  };
}

function cloneSlot(slot: NormalizedAvailabilitySlot): NormalizedAvailabilitySlot {
  return {
    ...slot,
    metadata: slot.metadata ? { ...slot.metadata } : undefined,
  };
}

function createSeededSlot(input: {
  id: string;
  courtId: string;
  startsAt: string;
  endsAt: string;
  status: AvailabilityStatus;
}): NormalizedAvailabilitySlot {
  const venue = seededLaAvailabilityVenues.find((candidate) =>
    candidate.courts.some((court) => court.id === input.courtId),
  );
  const court = venue?.courts.find((candidate) => candidate.id === input.courtId);

  if (!venue || !court) {
    throw new Error(`Seeded court "${input.courtId}" was not found.`);
  }

  return {
    id: input.id,
    source: MOCK_AVAILABILITY_SOURCE,
    venueId: venue.id,
    venueName: venue.name,
    courtId: court.id,
    courtName: court.name,
    sport: court.sport,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    timeZone: venue.timeZone,
    status: input.status,
    checkedAt: MOCK_AVAILABILITY_CHECKED_AT,
    bookingUrl: venue.bookingUrl,
  };
}
