import { seedCourts, seedVenues as domainSeedVenues } from "../lib/data/seed";
import type { Court, Sport, Venue as DomainVenue } from "../types/domain";

export type { Sport };

export type OpenSlot = {
  id: string;
  venueId: string;
  courtId: string;
  day: string;
  dateLabel: string;
  startTime: string;
  endTime: string;
  status: "open" | "held";
};

export type Venue = {
  id: DomainVenue["id"];
  name: DomainVenue["name"];
  neighborhood: DomainVenue["neighborhood"];
  city: DomainVenue["city"];
  address: DomainVenue["address"];
  bookingUrl: DomainVenue["bookingUrl"];
  sports: DomainVenue["sports"];
  courts: Court[];
  nextCheckLabel: string;
  mockOpenSlots: OpenSlot[];
};

export const sportLabels: Record<Sport, string> = {
  tennis: "Tennis",
  pickleball: "Pickleball",
};

const mockOpenSlots: OpenSlot[] = [
  {
    id: "slot-griffith-tennis-1",
    venueId: "venue-griffith-riverside",
    courtId: "court-griffith-tennis-1",
    day: "Monday",
    dateLabel: "Mon, May 18",
    startTime: "17:00",
    endTime: "18:00",
    status: "open",
  },
  {
    id: "slot-griffith-pickle-1",
    venueId: "venue-griffith-riverside",
    courtId: "court-griffith-pickle-1",
    day: "Tuesday",
    dateLabel: "Tue, May 19",
    startTime: "18:00",
    endTime: "19:00",
    status: "open",
  },
  {
    id: "slot-samo-tennis-1",
    venueId: "venue-santa-monica-ocean",
    courtId: "court-samo-tennis-1",
    day: "Wednesday",
    dateLabel: "Wed, May 20",
    startTime: "17:00",
    endTime: "18:00",
    status: "open",
  },
  {
    id: "slot-culver-pickle-1",
    venueId: "venue-culver-pickle",
    courtId: "court-culver-pickle-1",
    day: "Thursday",
    dateLabel: "Thu, May 21",
    startTime: "18:00",
    endTime: "19:00",
    status: "open",
  },
  {
    id: "slot-culver-pickle-2",
    venueId: "venue-culver-pickle",
    courtId: "court-culver-pickle-2",
    day: "Saturday",
    dateLabel: "Sat, May 23",
    startTime: "09:00",
    endTime: "10:00",
    status: "held",
  },
];

export const seededVenues: Venue[] = domainSeedVenues.map((venue, index) => ({
  ...venue,
  courts: seedCourts.filter((court) => court.venueId === venue.id && court.active),
  nextCheckLabel: `Next watch at ${6 + Math.floor(index / 4)}:${String((index % 4) * 15).padStart(2, "0")} PM`,
  mockOpenSlots: mockOpenSlots.filter((slot) => slot.venueId === venue.id),
}));

export function getCourtById(venue: Venue, courtId: string) {
  return venue.courts.find((court) => court.id === courtId);
}
