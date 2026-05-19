import { publishManualSlotAction } from "./actions";
import {
  flattenSnapshotSlots,
  formatDateTime,
  formatTime,
  getAdminData,
  getCourtLabel,
} from "../_lib/mock-data";
import styles from "../admin.module.css";

type AdminManualSlotsPageProps = {
  searchParams?: Promise<{
    duplicates?: string;
    error?: string;
    matches?: string;
    notifications?: string;
    published?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function AdminManualSlotsPage({ searchParams }: AdminManualSlotsPageProps) {
  const params = searchParams ? await searchParams : {};
  const data = getAdminData();
  const defaultDate = getDefaultDate();
  const manualSlots = flattenSnapshotSlots(data.snapshots)
    .filter((slot) => slot.source === "manual")
    .slice(0, 10);

  return (
    <>
      {params.published ? (
        <div className="notice notice-success">
          Manual slot published. Matches: {params.matches ?? 0}. Notifications:{" "}
          {params.notifications ?? 0}. Duplicates skipped: {params.duplicates ?? 0}.
        </div>
      ) : null}
      {params.error ? <div className="notice notice-danger">{params.error}</div> : null}

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Manual slot publishing</h2>
            <p className={styles.sectionMeta}>
              Publish one known open slot and run matching immediately.
            </p>
          </div>
        </div>
        <form className={`${styles.formBody} form`} action={publishManualSlotAction}>
          <div className="grid two">
            <label className="field" htmlFor="venueId">
              <span>Facility</span>
              <select id="venueId" name="venueId" defaultValue={data.venues[0]?.id} required>
                {data.venues.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field" htmlFor="courtId">
              <span>Court</span>
              <select id="courtId" name="courtId" defaultValue={data.courts[0]?.id} required>
                {data.venues.map((venue) => (
                  <optgroup key={venue.id} label={venue.name}>
                    {data.courts
                      .filter((court) => court.venueId === venue.id)
                      .map((court) => (
                        <option key={court.id} value={court.id}>
                          {court.name} - {court.sport}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            </label>
          </div>

          <div className="grid two">
            <label className="field" htmlFor="sport">
              <span>Sport</span>
              <select id="sport" name="sport" defaultValue={data.courts[0]?.sport ?? "tennis"} required>
                <option value="tennis">tennis</option>
                <option value="pickleball">pickleball</option>
              </select>
            </label>
            <label className="field" htmlFor="date">
              <span>Date</span>
              <input id="date" name="date" type="date" defaultValue={defaultDate} required />
            </label>
          </div>

          <div className="grid two">
            <label className="field" htmlFor="startTime">
              <span>Start</span>
              <input id="startTime" name="startTime" type="time" defaultValue="17:00" required />
            </label>
            <label className="field" htmlFor="endTime">
              <span>End</span>
              <input id="endTime" name="endTime" type="time" defaultValue="18:00" required />
            </label>
          </div>

          <button className="button button-primary" type="submit">
            Publish slot and run matching
          </button>
        </form>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Recent manual slots</h2>
          <p className={styles.sectionMeta}>{manualSlots.length} manual slots retained</p>
        </div>
        {manualSlots.length ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Published</th>
                  <th>Court</th>
                  <th>Slot date</th>
                  <th>Window</th>
                  <th>Snapshot</th>
                </tr>
              </thead>
              <tbody>
                {manualSlots.map((slot) => (
                  <tr key={`${slot.snapshotId}-${slot.id}`}>
                    <td>{formatDateTime(slot.checkedAt)}</td>
                    <td>{getCourtLabel(slot.courtId)}</td>
                    <td>{formatDateTime(slot.startAt)}</td>
                    <td>
                      {formatTime(slot.startAt)} - {formatTime(slot.endAt)}
                    </td>
                    <td className={styles.mono}>{slot.snapshotId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.emptyState}>No manual slots published yet.</div>
        )}
      </section>
    </>
  );
}

function getDefaultDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}
