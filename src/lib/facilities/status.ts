import type { LiveStatus, SourcePlatform } from "@/types/domain";

export const liveStatusLabels: Record<LiveStatus, string> = {
  live_alerts: "Live alerts",
  manual_beta: "Manual beta",
  booking_link_only: "Booking link only",
  coming_soon: "Coming soon"
};

export const liveStatusDescriptions: Record<LiveStatus, string> = {
  live_alerts: "CourtPing can watch this facility for matching openings and send you an alert.",
  manual_beta: "Tell us when you want to play and requests will help prioritize this facility.",
  booking_link_only: "Use the official booking site now, or request CourtPing monitoring for this facility.",
  coming_soon: "This facility is on the coverage list. Requests help decide what to add next."
};

export const sourcePlatformLabels: Record<SourcePlatform, string> = {
  manual: "Manual",
  courtreserve: "CourtReserve",
  playbypoint: "PlayByPoint",
  webtrac: "WebTrac",
  activenet: "ActiveNet",
  civicrec: "CivicRec",
  unknown: "Unknown"
};

export function getLiveStatusLabel(status: LiveStatus) {
  return liveStatusLabels[status];
}

export function getLiveStatusDescription(status: LiveStatus) {
  return liveStatusDescriptions[status];
}

export function getSourcePlatformLabel(platform: SourcePlatform) {
  return sourcePlatformLabels[platform];
}

export function isLiveAlertReady(status: LiveStatus) {
  return status === "live_alerts";
}

export function needsMonitoringRequest(status: LiveStatus) {
  return status === "manual_beta" || status === "booking_link_only" || status === "coming_soon";
}

export function getMonitoringMessage(status: LiveStatus) {
  if (isLiveAlertReady(status)) {
    return "Create an alert for your preferred days and times. When a matching opening appears, CourtPing sends you a text so you can book on the official site.";
  }

  return "CourtPing is not watching this facility yet. Request monitoring and we'll use interest here to prioritize coverage.";
}
