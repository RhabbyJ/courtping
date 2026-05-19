"use server";

import { redirect } from "next/navigation";
import { createMonitoringRequest, getFacilityById } from "@/lib/data/store";
import { validateMonitoringRequestInput } from "@/lib/monitoring";
import type { Sport } from "@/types/domain";

export async function createMonitoringRequestAction(formData: FormData) {
  const facilitySlug = String(formData.get("facilitySlug") ?? "").trim();
  const raw = {
    facilityId: String(formData.get("facilityId") ?? "").trim(),
    sport: String(formData.get("sport") ?? "") as Sport,
    preferredTime: String(formData.get("preferredTime") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
  };
  const validation = validateMonitoringRequestInput(raw);
  const redirectSlug = facilitySlug || getFacilityById(raw.facilityId)?.slug || "";

  if (!validation.ok) {
    redirect(
      `/facilities/${redirectSlug}?request=monitoring&error=${encodeURIComponent(
        validation.errors.join(" "),
      )}#monitoring-request`,
    );
  }

  createMonitoringRequest(validation.value);
  redirect(`/facilities/${redirectSlug}?requested=1#monitoring-request`);
}
