import type { PlanTier } from "@/types/domain";

export const FREE_ACTIVE_ALERT_LIMIT = 1;
export const PRO_MONTHLY_PRICE_USD = 9;

export type AlertGateInput = {
  planTier: PlanTier;
  activeAlertCount: number;
};

export type AlertGateResult =
  | {
      allowed: true;
      activeAlertLimit: number | null;
      remainingActiveAlerts: number | null;
    }
  | {
      allowed: false;
      reason: string;
      upgradeRequired: true;
      activeAlertLimit: number;
      remainingActiveAlerts: 0;
    };

export function getActiveAlertLimit(planTier: PlanTier): number | null {
  return planTier === "pro" ? null : FREE_ACTIVE_ALERT_LIMIT;
}

export function canCreateAlert(input: AlertGateInput): AlertGateResult {
  const activeAlertLimit = getActiveAlertLimit(input.planTier);
  const activeAlertCount = normalizeActiveAlertCount(input.activeAlertCount);

  if (activeAlertLimit === null) {
    return {
      allowed: true,
      activeAlertLimit,
      remainingActiveAlerts: null,
    };
  }

  if (activeAlertCount < activeAlertLimit) {
    return {
      allowed: true,
      activeAlertLimit,
      remainingActiveAlerts: activeAlertLimit - activeAlertCount,
    };
  }

  return {
    allowed: false,
    reason: `Free plans include ${formatActiveAlertLimit(activeAlertLimit)}. Upgrade to Pro to add more.`,
    upgradeRequired: true,
    activeAlertLimit,
    remainingActiveAlerts: 0,
  };
}

export function getPlanLabel(planTier: PlanTier) {
  return planTier === "pro" ? "Pro" : "Free";
}

export function formatActiveAlertLimit(limit: number | null) {
  if (limit === null) {
    return "unlimited active alerts";
  }

  return `${limit} active alert${limit === 1 ? "" : "s"}`;
}

function normalizeActiveAlertCount(activeAlertCount: number) {
  if (!Number.isFinite(activeAlertCount) || activeAlertCount < 0) {
    return 0;
  }

  return Math.floor(activeAlertCount);
}
