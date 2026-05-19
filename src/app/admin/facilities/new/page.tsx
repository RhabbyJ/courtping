import { FacilityForm } from "../FacilityForm";
import styles from "../../admin.module.css";

export default function NewFacilityPage() {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>New facility</h2>
        <p className={styles.sectionMeta}>Create a local directory entry.</p>
      </div>
      <FacilityForm />
    </section>
  );
}

