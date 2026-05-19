import { NextRequest, NextResponse } from "next/server";
import { buildBillingNoticePath, createCheckoutPlaceholder } from "@/lib/billing/stripe";

export async function POST(request: NextRequest) {
  const result = await createCheckoutPlaceholder();

  if (prefersHtml(request)) {
    return NextResponse.redirect(new URL(buildBillingNoticePath(result.message), request.url), 303);
  }

  return NextResponse.json(result, { status: 202 });
}

function prefersHtml(request: NextRequest) {
  const accept = request.headers.get("accept") ?? "";
  return accept.includes("text/html") && !accept.includes("application/json");
}
