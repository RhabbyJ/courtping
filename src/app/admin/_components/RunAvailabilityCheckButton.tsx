"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import styles from "../admin.module.css";

type Result = {
  checkedAt: string;
  snapshotsCreated: number;
  slotsChecked: number;
  notificationsCreated: number;
  openSlots: number;
  duplicatesSkipped: number;
};

export function RunAvailabilityCheckButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runCheck() {
    setError(null);
    setResult(null);
    setIsRunning(true);

    try {
      const response = await fetch("/api/admin/run-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const body = await response.json();

      if (!response.ok) {
        setError(body.error ?? "The mock check did not complete.");
        return;
      }

      setResult(body);
      startTransition(() => router.refresh());
    } catch {
      setError("The mock check did not complete.");
    } finally {
      setIsRunning(false);
    }
  }

  const disabled = isRunning || isPending;

  return (
    <div className={styles.actionPanel}>
      <button
        className={styles.primaryButton}
        disabled={disabled}
        onClick={runCheck}
        type="button"
      >
        {disabled ? "Running..." : "Run mock check"}
      </button>
      {result ? (
        <p className={styles.actionResult}>
          {result.snapshotsCreated} snapshot, {result.slotsChecked} slots,{" "}
          {result.openSlots} open, {result.notificationsCreated} new
          notifications, {result.duplicatesSkipped} duplicates skipped
        </p>
      ) : null}
      {error ? <p className={styles.errorText}>{error}</p> : null}
    </div>
  );
}
