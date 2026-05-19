import Link from "next/link";
import { getLiveStatusLabel, getSourcePlatformLabel } from "@/lib/facilities";
import { listFacilities } from "@/lib/data/store";
import styles from "../admin.module.css";

type AdminFacilitiesPageProps = {
  searchParams?: Promise<{ saved?: string; imported?: string }>;
};

export const dynamic = "force-dynamic";

export default async function AdminFacilitiesPage({ searchParams }: AdminFacilitiesPageProps) {
  const params = searchParams ? await searchParams : {};
  const facilities = listFacilities();

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Facilities</h2>
          <p className={styles.sectionMeta}>{facilities.length} directory entries</p>
        </div>
        <div className="facility-actions">
          <Link className="button button-secondary" href="/admin/facilities/import">
            Import CSV
          </Link>
          <Link className="button button-primary" href="/admin/facilities/new">
            New facility
          </Link>
        </div>
      </div>
      {params.saved ? <div className="notice notice-success">Facility saved.</div> : null}
      {params.imported ? <div className="notice notice-success">Imported {params.imported} facilities.</div> : null}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Facility</th>
              <th>Location</th>
              <th>Sports</th>
              <th>Courts</th>
              <th>Live status</th>
              <th>Platform</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {facilities.map((facility) => (
              <tr key={facility.id}>
                <td>
                  <strong>{facility.name}</strong>
                  <br />
                  <span className={styles.mono}>{facility.slug}</span>
                </td>
                <td>
                  {facility.neighborhood}, {facility.city}
                </td>
                <td>{facility.sports.join(", ")}</td>
                <td>{facility.numberOfCourts}</td>
                <td>{getLiveStatusLabel(facility.liveStatus)}</td>
                <td>{getSourcePlatformLabel(facility.sourcePlatform)}</td>
                <td>
                  <Link href={`/admin/facilities/${facility.id}/edit`}>Edit</Link>
                  {" / "}
                  <Link href={`/facilities/${facility.slug}`}>View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

