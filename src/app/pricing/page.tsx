import Link from "next/link";

import {
  canCreateAlert,
  formatActiveAlertLimit,
  getActiveAlertLimit,
  getPlanLabel,
  PRO_MONTHLY_PRICE_USD,
} from "@/lib/billing/gating";
import { getStripeConfigStatus } from "@/lib/billing/stripe";
import { getSubscriptionForUser, listAlertsForUser } from "@/lib/data/store";

type PricingPageProps = {
  searchParams?: Promise<{ notice?: string | string[] }>;
};

export default async function PricingPage({ searchParams }: PricingPageProps) {
  const params = searchParams ? await searchParams : {};
  const subscription = getSubscriptionForUser();
  const activeAlerts = listAlertsForUser().filter((alert) => alert.active).length;
  const gate = canCreateAlert({ planTier: subscription.planTier, activeAlertCount: activeAlerts });
  const freeLimit = getActiveAlertLimit("free");
  const stripeStatus = getStripeConfigStatus();
  const notice = firstSearchParam(params.notice);

  return (
    <main className="app-shell">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Pricing</p>
          <h1>Plans for court alerts</h1>
          <p>
            {`Free includes ${formatActiveAlertLimit(freeLimit)}. Pro is planned at $${PRO_MONTHLY_PRICE_USD}/month for players who want more active alerts.`}
          </p>
        </div>
        <Link className="button button-secondary" href="/create-alert">
          Create alert
        </Link>
      </section>

      {notice ? <div className="notice notice-success">{notice}</div> : null}

      <section className="section grid two">
        <article className="card">
          <h2>Free</h2>
          <p className="stat">$0</p>
          <p className="muted">
            {formatActiveAlertLimit(freeLimit)}, text/email alert preferences, and LA facility coverage requests.
          </p>
          <p>
            <span className="pill">Current active alerts: {activeAlerts}</span>
            <span className="pill">Current plan: {getPlanLabel(subscription.planTier)}</span>
          </p>
          {!gate.allowed ? <p className="muted">{gate.reason}</p> : null}
        </article>
        <article className="card">
          <h2>Pro</h2>
          <p className="stat">${PRO_MONTHLY_PRICE_USD}/mo</p>
          <p className="muted">Unlimited active alerts, priority facility requests, and expanded notification options.</p>
          <form action="/api/billing/checkout" method="post">
            <button className="button button-primary full-width" type="submit">
              Join Pro waitlist
            </button>
          </form>
          <p className="muted">
            Checkout status: {stripeStatus.configured ? "payment setup ready for testing" : "payment setup not connected"}
          </p>
        </article>
      </section>
    </main>
  );
}

function firstSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}
