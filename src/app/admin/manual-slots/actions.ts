"use server";

import { redirect } from "next/navigation";
import { publishManualAvailabilitySlot } from "@/lib/availability/manual-publish";
import type { Sport } from "@/types/domain";

export async function publishManualSlotAction(formData: FormData) {
  let redirectTo = "/admin/manual-slots";

  try {
    const result = await publishManualAvailabilitySlot({
      venueId: String(formData.get("venueId") ?? ""),
      courtId: String(formData.get("courtId") ?? ""),
      sport: String(formData.get("sport") ?? "") as Sport,
      startAt: toLocalIso(String(formData.get("date") ?? ""), String(formData.get("startTime") ?? "")),
      endAt: toLocalIso(String(formData.get("date") ?? ""), String(formData.get("endTime") ?? "")),
    });
    const params = new URLSearchParams({
      published: "1",
      matches: String(result.matchCount),
      notifications: String(result.notificationCount),
      duplicates: String(result.duplicateCount),
    });

    redirectTo = `/admin/manual-slots?${params.toString()}`;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Manual slot publish failed.";
    redirectTo = `/admin/manual-slots?error=${encodeURIComponent(message)}`;
  }

  redirect(redirectTo);
}

function toLocalIso(dateValue: string, timeValue: string) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const [hour, minute] = timeValue.split(":").map(Number);
  const date = new Date(year, month - 1, day, hour, minute, 0, 0);

  return date.toISOString();
}
