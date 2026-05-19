import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getLiveStatusDescription,
  getLiveStatusLabel,
  getMonitoringMessage,
  isLiveAlertReady,
} from "@/lib/facilities";
import { getFacilityBySlug, listCourtsByVenue } from "@/lib/data/store";
import type { IndoorOutdoor, PublicPrivate, Sport } from "@/types/domain";
import { createMonitoringRequestAction } from "./actions";

type FacilityDetailPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ error?: string; requested?: string; request?: string }>;
};

const sportLabels: Record<Sport, string> = {
  tennis: "Tennis",
  pickleball: "Pickleball",
};

const settingLabels: Record<IndoorOutdoor, string> = {
  indoor: "Indoor",
  outdoor: "Outdoor",
  both: "Indoor and outdoor",
};

const accessLabels: Record<PublicPrivate, string> = {
  public: "Public",
  private: "Private",
  public_private: "Public/private",
};

function formatSports(sports: Sport[]) {
  return sports.map((sport) => sportLabels[sport]).join(", ");
}

export default async function FacilityDetailPage({ params, searchParams }: FacilityDetailPageProps) {
  const { slug } = await params;
  const query = searchParams ? await searchParams : {};
  const facility = getFacilityBySlug(slug);

  if (!facility) {
    notFound();
  }

  const courts = listCourtsByVenue(facility.id);
  const alertReady = isLiveAlertReady(facility.liveStatus);
  const courtCount = courts.length || facility.numberOfCourts;
  const sportsLabel = formatSports(facility.sports);
  const settingLabel = settingLabels[facility.indoorOutdoor];
  const accessLabel = accessLabels[facility.publicPrivate];

  return (
    <main className="app-shell">
      <section className="page-heading facility-hero">
        <div>
          <p className="eyebrow">
            {facility.neighborhood}, {facility.city}
          </p>
          <h1>{facility.name}</h1>
          <p>{facility.address}</p>
          <div className="facility-summary-tags" aria-label="Facility summary">
            <span className="tag">{accessLabel}</span>
            <span className="tag">{sportsLabel}</span>
            <span className="tag">{settingLabel}</span>
            <span className="tag">{facility.lights ? "Lights available" : "No lights listed"}</span>
          </div>
        </div>
        <div className="facility-hero-actions">
          <span className={`status-pill status-${facility.liveStatus.replaceAll("_", "-")}`}>
            {getLiveStatusLabel(facility.liveStatus)}
          </span>
          {alertReady ? (
            <Link className="button button-primary" href={`/create-alert?facility=${facility.slug}`}>
              Create alert
            </Link>
          ) : (
            <Link className="button button-primary" href="#monitoring-request">
              Request monitoring
            </Link>
          )}
          <a className="button button-secondary" href={facility.bookingUrl} rel="noreferrer" target="_blank">
            Official booking site
          </a>
        </div>
      </section>

      {query.requested ? (
        <div className="notice notice-success">
          Monitoring request saved. We'll use interest in this facility to prioritize coverage.
        </div>
      ) : null}
      {query.error ? <div className="notice notice-danger">{query.error}</div> : null}

      <section className="workflow-section facility-workflow" aria-label="How CourtPing works">
        <div>
          <span className="step-number">1</span>
          <h3>Choose when you want to play</h3>
          <p>Set the days, time window, and sport that fit your schedule.</p>
        </div>
        <div>
          <span className="step-number">2</span>
          <h3>CourtPing watches openings</h3>
          <p>When monitoring is available, CourtPing checks openings against your alert.</p>
        </div>
        <div>
          <span className="step-number">3</span>
          <h3>Get a text, then book</h3>
          <p>When a match appears, you get a text and book on the official site.</p>
        </div>
      </section>

      <section className="facility-detail-grid">
        <article className="panel">
          <div className="panel-heading">
            <p className="eyebrow">Coverage</p>
            <h2>Coverage for this facility</h2>
          </div>
          <p>{getLiveStatusDescription(facility.liveStatus)}</p>
          <p className="notice">{getMonitoringMessage(facility.liveStatus)}</p>
          <dl className="facility-meta">
            <div>
              <dt>Sports</dt>
              <dd>{sportsLabel}</dd>
            </div>
            <div>
              <dt>Courts</dt>
              <dd>{courtCount}</dd>
            </div>
            <div>
              <dt>Setting</dt>
              <dd>{settingLabel}</dd>
            </div>
            <div>
              <dt>Access</dt>
              <dd>{accessLabel}</dd>
            </div>
          </dl>
          <div className="facility-actions">
            {alertReady ? (
              <Link className="button button-primary" href={`/create-alert?facility=${facility.slug}`}>
                Create alert
              </Link>
            ) : (
              <Link className="button button-primary" href="#monitoring-request">
                Request monitoring
              </Link>
            )}
            <a className="button button-secondary" href={facility.bookingUrl} rel="noreferrer" target="_blank">
              Official booking site
            </a>
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <p className="eyebrow">Courts</p>
            <h2>
              {courtCount} {courtCount === 1 ? "court" : "courts"} listed
            </h2>
          </div>
          {courts.length > 0 ? (
            <div className="mini-list">
              {courts.map((court) => (
                <div key={court.id}>
                  <strong>{court.name}</strong>
                  <span>
                    {court.sport}, {court.surface}, {court.indoor ? "indoor" : "outdoor"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">Court details are not available yet. Use the official site for booking details.</p>
          )}
          <p className="muted">Confirm fees, rules, and final availability on the official booking site.</p>
        </article>

        {alertReady ? (
          <article className="panel" id="create-alert">
            <div className="panel-heading">
              <p className="eyebrow">Create alert</p>
              <h2>Tell CourtPing when you want to play</h2>
            </div>
            <p className="muted">
              Choose the days and time window that work for you. When a matching opening appears, CourtPing sends a
              text so you can book on the official site.
            </p>
            <Link className="button button-primary full-width" href={`/create-alert?facility=${facility.slug}`}>
              Create alert for this facility
            </Link>
          </article>
        ) : (
          <article className="panel" id="monitoring-request">
            <div className="panel-heading">
              <p className="eyebrow">Request monitoring</p>
              <h2>Help add this facility</h2>
            </div>
            <p className="muted">
              Share the sport and times you care about. Requests tell us which facilities to prioritize next.
            </p>
            <form className="form" action={createMonitoringRequestAction}>
              <input name="facilityId" type="hidden" defaultValue={facility.id} />
              <input name="facilitySlug" type="hidden" defaultValue={facility.slug} />
              <div className="grid two">
                <label className="field" htmlFor="monitoringSport">
                  <span>Sport</span>
                  <select id="monitoringSport" name="sport" defaultValue={facility.sports[0]} required>
                    {facility.sports.map((sport) => (
                      <option key={sport} value={sport}>
                        {sportLabels[sport]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field" htmlFor="preferredTime">
                  <span>When do you want to play?</span>
                  <input id="preferredTime" name="preferredTime" placeholder="Weekdays after 6pm" required />
                </label>
              </div>
              <div className="grid two">
                <label className="field" htmlFor="email">
                  <span>Email</span>
                  <input id="email" name="email" type="email" placeholder="you@example.com" />
                </label>
                <label className="field" htmlFor="phone">
                  <span>Phone</span>
                  <input id="phone" name="phone" type="tel" placeholder="+15550101010" />
                </label>
              </div>
              <button className="button button-primary full-width" type="submit">
                Request monitoring
              </button>
            </form>
          </article>
        )}
      </section>
    </main>
  );
}
