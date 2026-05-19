import { NextRequest, NextResponse } from "next/server";
import { canCreateAlert } from "@/lib/billing/gating";
import { createAlert, getSubscriptionForUser, listAlertsForUser } from "@/lib/data/store";
import { validateCreateAlertInput } from "@/lib/data/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    data: listAlertsForUser(),
    mode: "mock"
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const validation = validateCreateAlertInput(body);

  if (!validation.ok) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  const gate = canCreateAlert({
    planTier: getSubscriptionForUser().planTier,
    activeAlertCount: listAlertsForUser().filter((alert) => alert.active).length
  });

  if (!gate.allowed) {
    return NextResponse.json({ errors: [gate.reason], upgradeRequired: true }, { status: 402 });
  }

  return NextResponse.json({ data: createAlert(validation.value), mode: "mock" }, { status: 201 });
}

