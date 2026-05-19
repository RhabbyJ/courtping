import { getCourtById, seededVenues, sportLabels } from "./seeded-data";
import { formatTimeRange } from "./time-format";

export function VenueCards() {
  return (
    <div className="venue-grid">
      {seededVenues.map((venue) => (
        <article className="venue-card" key={venue.id}>
          <div className="venue-card-header">
            <div>
              <h3>{venue.name}</h3>
              <p>
                {venue.neighborhood}, {venue.city}
              </p>
            </div>
            <span className="status-pill">
              {venue.mockOpenSlots.filter((slot) => slot.status === "open").length} open
            </span>
          </div>

          <div className="tag-row">
            {venue.sports.map((sport) => (
              <span className="tag" key={sport}>
                {sportLabels[sport]}
              </span>
            ))}
          </div>

          <dl className="venue-meta">
            <div>
              <dt>Courts</dt>
              <dd>{venue.courts.length}</dd>
            </div>
            <div>
              <dt>Next watch</dt>
              <dd>{venue.nextCheckLabel}</dd>
            </div>
          </dl>

          <div className="compact-slot-list">
            {venue.mockOpenSlots
              .filter((slot) => slot.status === "open")
              .slice(0, 2)
              .map((slot) => (
                <div key={slot.id}>
                  <span>{getCourtById(venue, slot.courtId)?.name ?? "Court"}</span>
                  <strong>
                    {slot.dateLabel}, {formatTimeRange(slot.startTime, slot.endTime)}
                  </strong>
                </div>
              ))}
          </div>
        </article>
      ))}
    </div>
  );
}
