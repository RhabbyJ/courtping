import type { ReactNode } from "react";

import { AdminNav } from "./_components/AdminNav";
import styles from "./admin.module.css";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <section className={styles.shell}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>CourtPing admin</p>
            <h1 className={styles.title}>Operations dashboard</h1>
            <p className={styles.subtitle}>
              Monitor seeded venues, court inventory, active alerts, mock
              availability snapshots, manual slot publishing, monitoring
              requests, and dry-run notification events.
            </p>
          </div>
        </header>
        <AdminNav />
        {children}
      </div>
    </section>
  );
}
