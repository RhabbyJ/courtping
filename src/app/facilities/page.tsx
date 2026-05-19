import Link from "next/link";
import type { IndoorOutdoor, LiveStatus, PublicPrivate, Sport } from "@/types/domain";
import {
  filterFacilities,
  getFacilityLocations,
  getLiveStatusDescription,
  getLiveStatusLabel,
  isLiveAlertReady,
} from "@/lib/facilities";
import { listFacilities } from "@/lib/data/store";

type FacilitiesPageProps = {
  searchParams?: Promise<{
    q?: string;
    sport?: Sport | "all";
    liveStatus?: LiveStatus | "all";
    location?: string;
  }>;
};

const liveStatuses: Array<LiveStatus | "all"> = ["all", "live_alerts", "manual_beta", "booking_link_only", "coming_soon"];
const sports: Array<Sport | "all"> = ["all", "tennis", "pickleball"];

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

function formatSports(values: Sport[]) {
  return values.map((sport) => sportLabels[sport]).join(", ");
}

export default async function FacilitiesPage({ searchParams }: FacilitiesPageProps) {
  const params = searchParams ? await searchParams : {};
  const facilities = listFacilities();
  const locations = getFacilityLocations(facilities);
  const filteredFacilities = filterFacilities(facilities, {
    query: params.q,
    sport: params.sport,
    liveStatus: params.liveStatus,
    location: params.location
  });

  return (
    <main className="app-shell">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Facility directory</p>
          <h1>Find LA tennis and pickleball courts</h1>
          <p>
            Browse facilities CourtPing can help you track. Create an alert where alerts are available, or request
            monitoring for places you want added next.
          </p>
        </div>
        <Link className="button button-secondary" href="/create-alert">
          Create alert
        </Link>
      </section>

      <form className="facility-filter-bar" action="/facilities">
        <label className="field" htmlFor="q">
          <span>Search</span>
          <input id="q" name="q" placeholder="Facility, city, neighborhood" defaultValue={params.q ?? ""} />
        </label>
        <label className="field" htmlFor="sport">
          <span>Sport</span>
          <select id="sport" name="sport" defaultValue={params.sport ?? "all"}>
            {sports.map((sport) => (
              <option key={sport} value={sport}>
                {sport === "all" ? "All sports" : sport}
              </option>
            ))}
          </select>
        </label>
        <label className="field" htmlFor="liveStatus">
          <span>Status</span>
          <select id="liveStatus" name="liveStatus" defaultValue={params.liveStatus ?? "all"}>
            {liveStatuses.map((status) => (
              <option key={status} value={status}>
                {status === "all" ? "All statuses" : getLiveStatusLabel(status)}
              </option>
            ))}
          </select>
        </label>
        <label className="field" htmlFor="location">
          <span>City / neighborhood</span>
          <select id="location" name="location" defaultValue={params.location ?? ""}>
            <option value="">All locations</option>
            {locations.map((location) => (
              <option key={location} value={location.toLowerCase()}>
                {location}
              </option>
            ))}
          </select>
        </label>
        <button className="button button-primary" type="submit">
          Filter
        </button>
      </form>

      <section className="section compact-section">
        <div className="section-header split">
          <div>
            <p className="eyebrow">Directory results</p>
            <h2>{filteredFacilities.length} facilities</h2>
          </div>
          <Link className="button button-secondary" href="/facilities">
            Reset filters
          </Link>
        </div>

        <div className="facility-grid">
          {filteredFacilities.map((facility) => {
            const alertReady = isLiveAlertReady(facility.liveStatus);

            return (
              <article className="facility-card" key={facility.id}>
                <div className="facility-card-header">
                  <div>
                    <span className={`status-pill status-${facility.liveStatus.replaceAll("_", "-")}`}>
                      {getLiveStatusLabel(facility.liveStatus)}
                    </span>
                    <h3>{facility.name}</h3>
                    <p>
                      {facility.neighborhood}, {facility.city}
                    </p>
                  </div>
                </div>
                <p className="muted">{getLiveStatusDescription(facility.liveStatus)}</p>
                <dl className="facility-meta">
                  <div>
                    <dt>Sports</dt>
                    <dd>{formatSports(facility.sports)}</dd>
                  </div>
                  <div>
                    <dt>Courts</dt>
                    <dd>{facility.numberOfCourts}</dd>
                  </div>
                  <div>
                    <dt>Setting</dt>
                    <dd>{settingLabels[facility.indoorOutdoor]}</dd>
                  </div>
                  <div>
                    <dt>Access</dt>
                    <dd>{accessLabels[facility.publicPrivate]}</dd>
                  </div>
                </dl>
                <div className="facility-actions">
                  {alertReady ? (
                    <Link className="button button-primary" href={`/create-alert?facility=${facility.slug}`}>
                      Create alert
                    </Link>
                  ) : (
                    <Link
                      className="button button-primary"
                      href={`/facilities/${facility.slug}?request=monitoring#monitoring-request`}
                    >
                      Request monitoring
                    </Link>
                  )}
                  <Link className="button button-secondary" href={`/facilities/${facility.slug}`}>
                    View details
                  </Link>
                  <a className="button button-secondary" href={facility.bookingUrl} rel="noreferrer" target="_blank">
                    Official booking site
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
