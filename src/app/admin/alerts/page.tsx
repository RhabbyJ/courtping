import {
  formatDateTime,
  formatDays,
  getAdminData,
  getAlertOwner,
  getCourtLabel,
  getVenueName,
} from "../_lib/mock-data";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

export default function AdminAlertsPage() {
  const data = getAdminData();

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Alerts</h2>
        <p className={styles.sectionMeta}>
          {data.alerts.filter((alert) => alert.active).length} active
        </p>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>User</th>
              <th>Venue</th>
              <th>Court</th>
              <th>Days</th>
              <th>Window</th>
              <th>Channels</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {data.alerts.map((alert) => (
              <tr key={alert.id}>
                <td>
                  <strong>{getAlertOwner(alert)}</strong>
                  <br />
                  <span className={styles.muted}>{alert.userId}</span>
                </td>
                <td>{getVenueName(alert.venueId)}</td>
                <td>{getCourtLabel(alert.courtId)}</td>
                <td>{formatDays(alert.daysOfWeek)}</td>
                <td>
                  {alert.startTime} - {alert.endTime}
                </td>
                <td>
                  {alert.channels.map((channel) => (
                    <span
                      className={`${styles.status} ${
                        channel === "sms" ? styles.statusSms : styles.statusEmail
                      }`}
                      key={channel}
                    >
                      {channel}
                    </span>
                  ))}
                </td>
                <td>
                  <span
                    className={`${styles.status} ${
                      alert.active ? styles.statusActive : styles.statusPaused
                    }`}
                  >
                    {alert.active ? "active" : "paused"}
                  </span>
                </td>
                <td>{formatDateTime(alert.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
