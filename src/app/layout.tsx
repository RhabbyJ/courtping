import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "CourtPing",
  description: "Court availability alerts for LA tennis and pickleball players."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <Link className="brand" href="/">
            CourtPing
          </Link>
          <nav aria-label="Main navigation">
            <Link href="/facilities">Facilities</Link>
            <Link href="/create-alert">Create alert</Link>
            <Link href="/my-alerts">My alerts</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/admin">Admin</Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
