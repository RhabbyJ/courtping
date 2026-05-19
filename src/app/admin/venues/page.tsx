import { getAdminData } from "../_lib/mock-data";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

export default function AdminVenuesPage() {
  const data = getAdminData();

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Venues</h2>
        <p className={styles.sectionMeta}>{data.venues.length} seeded venues</p>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Location</th>
              <th>Address</th>
              <th>Sports</th>
              <th>Courts</th>
              <th>Booking site</th>
            </tr>
          </thead>
          <tbody>
            {data.venues.map((venue) => {
              const courtCount = data.courts.filter(
                (court) => court.venueId === venue.id,
              ).length;

              return (
                <tr key={venue.id}>
                  <td>{venue.name}</td>
                  <td>
                    {venue.neighborhood}, {venue.city}
                  </td>
                  <td>{venue.address}</td>
                  <td>{venue.sports.join(", ")}</td>
                  <td>{courtCount}</td>
                  <td>
                    <a href={venue.bookingUrl} rel="noreferrer" target="_blank">
                      Facility website
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
