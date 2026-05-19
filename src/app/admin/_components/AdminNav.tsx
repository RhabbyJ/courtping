import Link from "next/link";

import styles from "../admin.module.css";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/facilities", label: "Facilities" },
  { href: "/admin/venues", label: "Venues" },
  { href: "/admin/courts", label: "Courts" },
  { href: "/admin/alerts", label: "Alerts" },
  { href: "/admin/manual-slots", label: "Manual slots" },
  { href: "/admin/snapshots", label: "Snapshots" },
  { href: "/admin/notifications", label: "Notifications" },
  { href: "/admin/monitoring-requests", label: "Requests" },
];

export function AdminNav() {
  return (
    <nav className={styles.nav} aria-label="Admin navigation">
      {links.map((link) => (
        <Link className={styles.navLink} href={link.href} key={link.href}>
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
