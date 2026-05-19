import { formatDateTime, getAdminData, getVenueName } from "../_lib/mock-data";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

export default function AdminMonitoringRequestsPage() {
  const data = getAdminData();

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Monitoring requests</h2>
        <p className={styles.sectionMeta}>{data.monitoringRequests.length} captured requests</p>
      </div>
      {data.monitoringRequests.length ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Created</th>
                <th>Facility</th>
                <th>Sport</th>
                <th>Preferred time</th>
                <th>Email</th>
                <th>Phone</th>
              </tr>
            </thead>
            <tbody>
              {data.monitoringRequests.map((request) => (
                <tr key={request.id}>
                  <td>{formatDateTime(request.createdAt)}</td>
                  <td>{getVenueName(request.facilityId)}</td>
                  <td>{request.sport}</td>
                  <td>{request.preferredTime}</td>
                  <td>{request.email || "-"}</td>
                  <td>{request.phone || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.emptyState}>No monitoring requests yet.</div>
      )}
    </section>
  );
}
