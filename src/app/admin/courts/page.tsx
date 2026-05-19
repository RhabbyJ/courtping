import { getAdminData, getVenueName } from "../_lib/mock-data";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

export default function AdminCourtsPage() {
  const data = getAdminData();

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Courts</h2>
        <p className={styles.sectionMeta}>{data.courts.length} seeded courts</p>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Court</th>
              <th>Venue</th>
              <th>Sport</th>
              <th>Surface</th>
              <th>Setting</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.courts.map((court) => (
              <tr key={court.id}>
                <td>{court.name}</td>
                <td>{getVenueName(court.venueId)}</td>
                <td>{court.sport}</td>
                <td>{court.surface}</td>
                <td>{court.indoor ? "Indoor" : "Outdoor"}</td>
                <td>
                  <span
                    className={`${styles.status} ${
                      court.active ? styles.statusActive : styles.statusPaused
                    }`}
                  >
                    {court.active ? "active" : "inactive"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
