import { NextResponse } from "next/server";

import { runAdminMockAvailabilityCheck } from "../../../admin/_lib/mock-data";

export const dynamic = "force-dynamic";

export async function POST() {
  const result = await runAdminMockAvailabilityCheck();

  return NextResponse.json({
    ok: true,
    ...result,
  });
}

export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      error: "Use POST to run the mock availability check.",
    },
    {
      status: 405,
      headers: {
        Allow: "POST",
      },
    },
  );
}
