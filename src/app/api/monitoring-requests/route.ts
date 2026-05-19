import { NextRequest, NextResponse } from "next/server";
import { createMonitoringRequest, listMonitoringRequests } from "@/lib/data/store";
import { validateMonitoringRequestInput } from "@/lib/monitoring";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    data: listMonitoringRequests(),
    mode: "mock",
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const validation = validateMonitoringRequestInput(body);

  if (!validation.ok) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  return NextResponse.json(
    { data: createMonitoringRequest(validation.value), mode: "mock" },
    { status: 201 },
  );
}
