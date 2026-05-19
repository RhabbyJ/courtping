import {
  flattenSnapshotSlots,
  formatDateTime,
  formatTime,
  getAdminData,
  getCourtLabel,
} from "../_lib/mock-data";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

export default function AdminNotificationsPage() {
  const data = getAdminData();
  const slotsById = new Map(
    flattenSnapshotSlots(data.snapshots).map((slot) => [slot.id, slot]),
  );

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Notification events</h2>
        <p className={styles.sectionMeta}>{data.notifications.length} dry-run events</p>
      </div>
      {data.notifications.length ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Created</th>
                <th>Alert</th>
                <th>Matched slot</th>
                <th>Channel</th>
                <th>Recipient</th>
                <th>Status</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {data.notifications.map((event) => {
                const slot = slotsById.get(event.slotId);

                return (
                  <tr key={event.id}>
                    <td>{formatDateTime(event.createdAt)}</td>
                    <td className={styles.mono}>{event.alertPreferenceId}</td>
                    <td>
                      {slot ? (
                        <>
                          {getCourtLabel(slot.courtId)}
                          <br />
                          <span className={styles.muted}>
                            {formatDateTime(slot.startAt)} {formatTime(slot.startAt)}{" "}
                            - {formatTime(slot.endAt)}
                          </span>
                        </>
                      ) : (
                        event.slotId
                      )}
                    </td>
                    <td>{event.channel}</td>
                    <td>{event.recipient}</td>
                    <td>
                      <span className={`${styles.status} ${styles.statusQueued}`}>
                        {event.status}
                      </span>
                    </td>
                    <td>{event.message}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.emptyState}>No notification events yet.</div>
      )}
    </section>
  );
}
