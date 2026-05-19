import { RunAvailabilityCheckButton } from "../_components/RunAvailabilityCheckButton";
import {
  flattenSnapshotSlots,
  formatDateTime,
  formatTime,
  getAdminData,
  getCourtLabel,
} from "../_lib/mock-data";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

export default function AdminSnapshotsPage() {
  const data = getAdminData();
  const slots = flattenSnapshotSlots(data.snapshots);

  return (
    <>
      <RunAvailabilityCheckButton />

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Availability snapshots</h2>
          <p className={styles.sectionMeta}>
            {data.snapshots.length} checks, {slots.length} slots retained
          </p>
        </div>
        {slots.length ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Checked</th>
                  <th>Court</th>
                  <th>Slot date</th>
                  <th>Window</th>
                  <th>Status</th>
                  <th>Source</th>
                  <th>Snapshot</th>
                </tr>
              </thead>
              <tbody>
                {slots.map((slot) => (
                  <tr key={`${slot.snapshotId}-${slot.id}`}>
                    <td>{formatDateTime(slot.checkedAt)}</td>
                    <td>{getCourtLabel(slot.courtId)}</td>
                    <td>{formatDateTime(slot.startAt)}</td>
                    <td>
                      {formatTime(slot.startAt)} - {formatTime(slot.endAt)}
                    </td>
                    <td>
                      <span
                        className={`${styles.status} ${
                          slot.status === "open"
                            ? styles.statusOpen
                            : styles.statusBooked
                        }`}
                      >
                        {slot.status}
                      </span>
                    </td>
                    <td>{slot.source}</td>
                    <td className={styles.mono}>{slot.snapshotId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.emptyState}>No availability snapshots yet.</div>
        )}
      </section>
    </>
  );
}
