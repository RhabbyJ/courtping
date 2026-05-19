import { readFileSync } from "node:fs";
import { importFacilitiesCsvAction } from "../actions";
import styles from "../../admin.module.css";

type ImportFacilitiesPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

export default async function ImportFacilitiesPage({ searchParams }: ImportFacilitiesPageProps) {
  const params = searchParams ? await searchParams : {};
  const sampleCsv = readFileSync("data/facilities.sample.csv", "utf8");

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Import facilities from CSV</h2>
        <p className={styles.sectionMeta}>Imports into the local in-memory mock store.</p>
      </div>
      {params.error ? <div className="notice notice-danger">{params.error}</div> : null}
      <form className="form panel" action={importFacilitiesCsvAction}>
        <label className="field" htmlFor="csv">
          <span>CSV</span>
          <textarea id="csv" name="csv" rows={14} defaultValue={sampleCsv} />
        </label>
        <button className="button button-primary" type="submit">
          Import CSV
        </button>
      </form>
    </section>
  );
}

