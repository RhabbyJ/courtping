import Link from "next/link";
import { getPlanLabel } from "@/lib/billing/gating";
import {
  getSubscriptionForUser,
  listAlertsForUser,
  listAvailabilitySnapshots,
  listCourts,
  listNotificationEvents,
  listVenues,
} from "@/lib/data/store";
import { formatTimeRange } from "@/components/time-format";

const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type MyAlertsPageProps = {
  searchParams?: Promise<{ created?: string }>;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default async function MyAlertsPage({ searchParams }: MyAlertsPageProps) {
  const params = searchParams ? await searchParams : {};
  const alerts = listAlertsForUser();
  const venues = listVenues();
  const courts = listCourts();
  const snapshots = listAvailabilitySnapshots();
  const notificationEvents = listNotificationEvents();
  const subscription = getSubscriptionForUser();
  const activeAlerts = alerts.filter((alert) => alert.active);
  const latestSnapshot = snapshots[0];

  return (
    <main className="app-shell">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Alert center</p>
          <h1>My alerts</h1>
          <p>
            Current plan: {getPlanLabel(subscription.planTier)}. Review active preferences,
            recent openings, and notification history.
          </p>
        </div>
        <Link className="button button-primary" href="/create-alert">
          Create alert
        </Link>
      </section>

      {params?.created ? (
        <div className="notice notice-success">
          Alert created. CourtPing will compare openings with this schedule when coverage is available.
        </div>
      ) : null}

      <section className="metrics-grid" aria-label="Alert summary">
        <div className="metric-tile">
          <span>Active alerts</span>
          <strong>{activeAlerts.length}</strong>
        </div>
        <div className="metric-tile">
          <span>Latest open slots</span>
          <strong>{latestSnapshot?.openSlotCount ?? 0}</strong>
        </div>
        <div className="metric-tile">
          <span>Notification events</span>
          <strong>{notificationEvents.length}</strong>
        </div>
      </section>

      <section className="section compact-section">
        <div className="section-header split">
          <div>
            <p className="eyebrow">Preferences</p>
            <h2>Saved alerts</h2>
          </div>
          <Link className="button button-secondary" href="/admin">
            Open admin
          </Link>
        </div>

        {alerts.length === 0 ? (
          <div className="empty-state">
            <h3>No alerts yet</h3>
            <p>Create an alert with the days and times you want to play.</p>
            <Link className="button button-primary" href="/create-alert">
              Create alert
            </Link>
          </div>
        ) : (
          <div className="alert-list">
            {alerts.map((alert) => {
              const venue = venues.find((candidate) => candidate.id === alert.venueId);
              const court = courts.find((candidate) => candidate.id === alert.courtId);

              return (
                <article className="alert-card" key={alert.id}>
                  <div className="alert-card-main">
                    <div>
                      <span
                        className={`status-pill ${
                          alert.active ? "status-active" : "status-paused"
                        }`}
                      >
                        {alert.active ? "active" : "paused"}
                      </span>
                      <h3>{venue?.name ?? "Unknown venue"}</h3>
                      <p>
                        {court?.name ?? "Unknown court"} - {alert.sport}
                      </p>
                    </div>
                  </div>

                  <dl className="alert-details">
                    <div>
                      <dt>Days</dt>
                      <dd>{alert.daysOfWeek.map((day) => dayLabels[day]).join(", ")}</dd>
                    </div>
                    <div>
                      <dt>Window</dt>
                      <dd>{formatTimeRange(alert.startTime, alert.endTime)}</dd>
                    </div>
                    <div>
                      <dt>Channels</dt>
                      <dd>{alert.channels.join(", ")}</dd>
                    </div>
                    <div>
                      <dt>Created</dt>
                      <dd>{formatDateTime(alert.createdAt)}</dd>
                    </div>
                  </dl>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="section compact-section">
        <div className="section-header">
          <p className="eyebrow">Notification history</p>
          <h2>Recent alerts</h2>
        </div>

        {notificationEvents.length === 0 ? (
          <div className="empty-state">
            <h3>No notifications yet</h3>
            <p>Notifications appear here when an opening matches one of your active alerts.</p>
          </div>
        ) : (
          <div className="event-list">
            {notificationEvents.map((event) => (
              <article className="event-card" key={event.id}>
                <div>
                  <span className="status-pill status-live">{event.status}</span>
                  <h3>{event.channel.toUpperCase()}</h3>
                  <p>{event.message}</p>
                </div>
                <div className="event-meta">
                  <span>{formatDateTime(event.createdAt)}</span>
                  <strong>Delivery recorded</strong>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
