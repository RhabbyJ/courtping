import { getCourtById, seededVenues } from "./seeded-data";
import { formatTimeRange } from "./time-format";

export function AvailabilityBoard() {
  const openSlots = seededVenues.flatMap((venue) =>
    venue.mockOpenSlots
      .filter((slot) => slot.status === "open")
      .map((slot) => ({ ...slot, venue })),
  );

  return (
    <section className="availability-board" aria-label="Availability snapshot">
      <div className="board-header">
        <div>
          <p className="eyebrow">Availability watch</p>
          <h2>Example openings CourtPing can match</h2>
        </div>
        <span className="status-pill status-live">Alerts ready</span>
      </div>

      <div className="court-visual" aria-hidden="true">
        <span className="court-line court-line-top" />
        <span className="court-line court-line-middle" />
        <span className="court-line court-line-bottom" />
        <span className="court-line court-line-left" />
        <span className="court-line court-line-right" />
      </div>

      <div className="slot-list">
        {openSlots.slice(0, 4).map((slot) => (
          <div className="slot-row" key={slot.id}>
            <div>
              <strong>{slot.venue.name}</strong>
              <span>{getCourtById(slot.venue, slot.courtId)?.name ?? "Court"}</span>
            </div>
            <span>
              {slot.dateLabel}, {formatTimeRange(slot.startTime, slot.endTime)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
