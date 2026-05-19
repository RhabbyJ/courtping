import type { AlertPreference, AvailabilitySlot, Court, Venue } from "../../types/domain";

export function formatAvailabilityMessage(params: {
  alert: AlertPreference;
  slot: AvailabilitySlot;
  court?: Court;
  venue?: Venue;
}) {
  const start = new Date(params.slot.startAt);
  const end = new Date(params.slot.endAt);
  const venueName = params.venue?.name ?? "your selected venue";
  const courtName = params.court?.name ?? "your selected court";
  const dateLabel = start.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
  const startLabel = start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const endLabel = end.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const bookingText = params.venue?.bookingUrl
    ? `Book on the facility website: ${params.venue.bookingUrl}`
    : "Book on the facility website.";

  return `CourtPing: ${params.alert.sport} slot open at ${venueName}, ${courtName} on ${dateLabel} ${startLabel}-${endLabel}. ${bookingText}`;
}
