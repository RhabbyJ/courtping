"use server";

import { redirect } from "next/navigation";

import { runAdminMockAvailabilityCheck } from "./_lib/mock-data";

export async function runMockAvailabilityCheckAction() {
  const result = await runAdminMockAvailabilityCheck();
  const params = new URLSearchParams({
    checked: "1",
    matches: String(result.matchCount),
    notifications: String(result.notificationsCreated),
    duplicates: String(result.duplicatesSkipped)
  });

  redirect(`/admin?${params.toString()}`);
}
