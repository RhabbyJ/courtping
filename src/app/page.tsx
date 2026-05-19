import Link from "next/link";
import { listCourts, listVenues } from "@/lib/data/store";
import { AvailabilityBoard } from "@/components/AvailabilityBoard";
import { VenueCards } from "@/components/VenueCards";
import { seededVenues } from "@/components/seeded-data";

export default function HomePage() {
  const venues = listVenues();
  const courts = listCourts();
  const openSlots = seededVenues.reduce(
    (count, venue) => count + venue.mockOpenSlots.filter((slot) => slot.status === "open").length,
    0,
  );

  return (
    <main className="app-shell">
      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">LA tennis and pickleball alerts</p>
          <h1>CourtPing</h1>
          <p className="hero-text">
            Choose when you want to play, let CourtPing watch for matching openings, then get a text so you can book
            on the official site.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/facilities">
              Browse facilities
            </Link>
            <Link className="button button-primary" href="/create-alert">
              Create alert
            </Link>
            <Link className="button button-secondary" href="/my-alerts">
              View my alerts
            </Link>
          </div>
        </div>

        <AvailabilityBoard />
      </section>

      <section className="stats-strip" aria-label="MVP status">
        <div>
          <span>Facilities</span>
          <strong>{venues.length}</strong>
        </div>
        <div>
          <span>Courts</span>
          <strong>{courts.length}</strong>
        </div>
        <div>
          <span>Example openings</span>
          <strong>{openSlots}</strong>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <p className="eyebrow">Facilities</p>
          <h2>Places CourtPing can help you track</h2>
        </div>
        <VenueCards />
      </section>

      <section className="workflow-section">
        <div>
          <span className="step-number">1</span>
          <h3>Choose when you want to play</h3>
          <p>Pick a facility, sport, days, and time window that fit your schedule.</p>
        </div>
        <div>
          <span className="step-number">2</span>
          <h3>CourtPing watches openings</h3>
          <p>Availability is compared with your active alert preferences.</p>
        </div>
        <div>
          <span className="step-number">3</span>
          <h3>Get a text, then book</h3>
          <p>When a match appears, CourtPing alerts you and sends you to the official booking site.</p>
        </div>
      </section>
    </main>
  );
}
