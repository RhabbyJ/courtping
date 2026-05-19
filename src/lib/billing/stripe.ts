import { PRO_MONTHLY_PRICE_USD } from "./gating";

export const STRIPE_SECRET_KEY_ENV = "STRIPE_SECRET_KEY";
export const STRIPE_PRO_PRICE_ID_ENV = "NEXT_PUBLIC_STRIPE_PRO_PRICE_ID";

export type StripeConfigStatus = {
  configured: boolean;
  missingEnv: string[];
};

export type CheckoutPlaceholderResult = {
  enabled: false;
  configured: boolean;
  planTier: "pro";
  monthlyPriceUsd: number;
  message: string;
  missingEnv: string[];
};

export function isStripeConfigured() {
  return getStripeConfigStatus().configured;
}

export function getStripeConfigStatus(): StripeConfigStatus {
  const missingEnv = ([
    [STRIPE_SECRET_KEY_ENV, process.env[STRIPE_SECRET_KEY_ENV]],
    [STRIPE_PRO_PRICE_ID_ENV, process.env[STRIPE_PRO_PRICE_ID_ENV]]
  ] satisfies Array<[string, string | undefined]>)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  return {
    configured: missingEnv.length === 0,
    missingEnv,
  };
}

export async function createCheckoutPlaceholder(): Promise<CheckoutPlaceholderResult> {
  const config = getStripeConfigStatus();

  if (!config.configured) {
    return {
      enabled: false,
      configured: false,
      planTier: "pro",
      monthlyPriceUsd: PRO_MONTHLY_PRICE_USD,
      message: "Stripe is not configured. Local MVP continues with the free demo plan.",
      missingEnv: config.missingEnv,
    };
  }

  return {
    enabled: false,
    configured: true,
    planTier: "pro",
    monthlyPriceUsd: PRO_MONTHLY_PRICE_USD,
    message: "Stripe keys are present, but checkout is intentionally placeholder-only for the MVP.",
    missingEnv: [],
  };
}

export function buildBillingNoticePath(message: string) {
  return `/pricing?notice=${encodeURIComponent(message)}`;
}
