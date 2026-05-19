import { notFound } from "next/navigation";
import { getFacilityById } from "@/lib/data/store";
import { FacilityForm } from "../../FacilityForm";
import styles from "../../../admin.module.css";

type EditFacilityPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditFacilityPage({ params }: EditFacilityPageProps) {
  const { id } = await params;
  const facility = getFacilityById(id);

  if (!facility) {
    notFound();
  }

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Edit facility</h2>
        <p className={styles.sectionMeta}>{facility.name}</p>
      </div>
      <FacilityForm facility={facility} />
    </section>
  );
}

