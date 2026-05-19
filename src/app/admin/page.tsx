import { RunAvailabilityCheckButton } from "./_components/RunAvailabilityCheckButton";
import {
  flattenSnapshotSlots,
  formatDateTime,
  formatTime,
  getAdminData,
  getCourtLabel,
} from "./_lib/mock-data";
import styles from "./admin.module.css";

export const dynamic = "force-dynamic";

export default function AdminOverviewPage() {
  const data = getAdminData();
  const activeAlerts = data.alerts.filter((alert) => alert.active);
  const latestNotifications = data.notifications.slice(0, 5);
  const latestSlots = flattenSnapshotSlots(data.snapshots).slice(0, 5);

  return (
    <>
      <div className={styles.summaryGrid}>
        <SummaryCard label="Facilities" value={data.venues.length} />
        <SummaryCard label="Courts" value={data.courts.length} />
        <SummaryCard label="Active alerts" value={activeAlerts.length} />
        <SummaryCard label="Snapshots" value={data.snapshots.length} />
        <SummaryCard label="Events" value={data.notifications.length} />
        <SummaryCard label="Monitoring requests" value={data.monitoringRequests.length} />
      </div>

      <RunAvailabilityCheckButton />

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Latest availability slots</h2>
          <p className={styles.sectionMeta}>
            Last checked {formatDateTime(data.lastCheckedAt)}
          </p>
        </div>
        {latestSlots.length ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Court</th>
                  <th>Date</th>
                  <th>Window</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {latestSlots.map((slot) => (
                  <tr key={`${slot.snapshotId}-${slot.id}`}>
                    <td>{getCourtLabel(slot.courtId)}</td>
                    <td>{formatDateTime(slot.startAt)}</td>
                    <td>
                      {formatTime(slot.startAt)} - {formatTime(slot.endAt)}
                    </td>
                    <td>
                      <StatusPill value={slot.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.emptyState}>No availability snapshots yet.</div>
        )}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Latest notification events</h2>
          <p className={styles.sectionMeta}>Dry-run delivery only</p>
        </div>
        {latestNotifications.length ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Created</th>
                  <th>Alert</th>
                  <th>Channel</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {latestNotifications.map((event) => (
                  <tr key={event.id}>
                    <td>{formatDateTime(event.createdAt)}</td>
                    <td className={styles.mono}>{event.alertPreferenceId}</td>
                    <td>{event.channel.toUpperCase()}</td>
                    <td>
                      <StatusPill value={event.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.emptyState}>No notification events yet.</div>
        )}
      </section>
    </>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <article className={styles.summaryCard}>
      <p className={styles.summaryLabel}>{label}</p>
      <p className={styles.summaryValue}>{value}</p>
    </article>
  );
}

function StatusPill({ value }: { value: string }) {
  const statusClass =
    value === "open"
      ? styles.statusOpen
      : value === "booked"
        ? styles.statusBooked
        : value === "dry_run"
          ? styles.statusQueued
          : value === "skipped"
            ? styles.statusPaused
            : "";

  return <span className={`${styles.status} ${statusClass}`}>{value}</span>;
}
