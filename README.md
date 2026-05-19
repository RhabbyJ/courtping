# CourtPing

CourtPing is an MVP for tennis and pickleball court availability alerts. It now includes Facility Directory v1: a searchable LA-area facility directory plus a local mock alert engine for facilities that are explicitly marked as live-alert ready.

CourtPing does not auto-book courts and does not scrape real booking websites.

## Run Locally

```powershell
cmd /c npm.cmd install
cmd /c npm.cmd run dev
```

Open `http://localhost:3000`.

The app runs without Supabase, Twilio, or Stripe credentials. Local data is seeded in memory and resets when the dev server restarts.

## Directory vs Live Availability

The `/facilities` directory lists facilities, court metadata, booking links, source-platform hints, and monitoring status. A directory listing does not mean CourtPing has real-time coverage.

Live availability alerts are only active for facilities with `liveStatus = live_alerts`. Other facilities can still accept alert preferences and monitoring requests so demand can be measured.

Manual beta is an operations workflow, not real-time coverage: an admin can publish a known available slot from `/admin/manual-slots`, which immediately runs matching and creates dry-run notification events with the facility booking URL.

## Live Status Meanings

- `live_alerts`: local mock automated alerts are active for the facility.
- `manual_beta`: users can request monitoring; admins may manually publish verified openings while automation is not active yet.
- `booking_link_only`: CourtPing lists the facility and booking link only.
- `coming_soon`: facility is in the directory backlog.

## Facility Data

Seed/import files:

- `data/facilities.sample.csv`
- `scripts/import-facilities.mjs`
- `supabase/migrations/202605180001_create_courtping_schema.sql`
- `supabase/seed.sql`

Validate the sample CSV:

```powershell
cmd /c npm.cmd run import:facilities
```

The sample contains realistic LA-area facility names and placeholder `sourceUrl` values marked `TODO` where exact official sources have not been verified.

## Demo Flow

1. Visit `/facilities`.
2. Search and filter by sport, live status, or city/neighborhood.
3. Open a facility detail page and use the booking link, create-alert CTA, or request-monitoring CTA.
4. Visit `/create-alert` and create an alert for a seeded court.
5. Visit `/my-alerts` and confirm the alert appears.
6. Visit `/admin/manual-slots` and publish a known open slot, or visit `/admin` and run the mock availability check.
7. Visit `/admin/notifications` and confirm dry-run notification events for matching alerts.
8. Visit any facility detail page and submit the request-live-alerts form, then confirm it in `/admin/monitoring-requests`.

## Key Pages

- `/facilities` public facility directory
- `/facilities/[slug]` facility detail
- `/create-alert` create alert
- `/my-alerts` current demo user alerts
- `/pricing` Free/Pro placeholder pricing
- `/admin/facilities` admin facility management
- `/admin/facilities/import` CSV import into local mock store
- `/admin/manual-slots` manual slot publishing for pilot operations
- `/admin/monitoring-requests` captured live-alert requests
- `/admin` operations dashboard
- `/admin/venues`, `/admin/courts`, `/admin/alerts`, `/admin/snapshots`, `/admin/notifications`

## Path To Real Adapters

Future real adapters should be added behind the existing availability adapter boundary. Before enabling any live adapter:

- Verify facility permission and platform terms.
- Add admin auth and rate limits.
- Keep Twilio dry-run until delivery safeguards are reviewed.
- Store dedupe keys in Supabase with a unique constraint.
- Mark coverage as `live_alerts` only after the adapter is verified.

No real scraping or booking automation is implemented in this MVP.

## Rec.us Feasibility POC

CourtPing includes a Rec.us feasibility proof in `docs/RECUS_FEASIBILITY.md` and an isolated prototype adapter in `src/lib/availability/recus-adapter.ts`.

Outcome: Rec.us data feasibility is a GO. The isolated adapter can parse fixture-captured public Rec.us responses, discover public Tennis/Pickleball court site IDs from organization availability, map public sport IDs, and normalize site-level date-map availability.

The Rec.us tests use saved HTML/JSON fixtures only and do not hit live sites. Rec.us adapter support has passed controlled local manual live checks for Belmont, SF Rec & Park, and Rocklin, but it is not wired into current live app alerts, cron, production polling, Supabase writes, or notifications.

Rec.us now has disabled beta source infrastructure in `src/lib/availability/recus-source-config.ts` and `src/lib/availability/source-runner.ts`. The configs are `enabled: false`, `betaOnly: true`, and `manualLiveCheckOnly: true` by default. The internal runner can return fixture-backed normalized snapshots for future beta work, but it does not trigger alert matching, notification events, SMS/email, Supabase writes, or polling loops.

The beta polling design is documented in `docs/RECUS_BETA_POLLING_DESIGN.md`. It covers the proposed manual/dry-run polling budget, backoff, snapshot retention, dry-run matching flow, generic booking-link strategy, and production blockers. Static reservation-rule config placeholders exist for Belmont, SF Rec & Park, and Rocklin, but rule fields marked TODO are not production guidance.

Supported local manual-check orgs:

- `city-of-belmont`
- `san-francisco-rec-park`
- `rocklin`

Run bounded manual live checks locally:

```powershell
$env:RECUS_LIVE_CHECK='1'; cmd /c npm.cmd run recus:live-check -- --org city-of-belmont --max-sites 3
$env:RECUS_LIVE_CHECK='1'; cmd /c npm.cmd run recus:live-check -- --org san-francisco-rec-park --max-sites 3
$env:RECUS_LIVE_CHECK='1'; cmd /c npm.cmd run recus:live-check -- --org rocklin --max-sites 3
```

The command refuses to run without `RECUS_LIVE_CHECK=1`, rejects non-allowlisted org slugs, discovers public site IDs from `v1/locations/availability`, checks at most four discovered site availability endpoints, prints normalized slots, and does not poll, log in, use credentials, use cookies, bypass CAPTCHA, or write response dumps. Production polling still requires permission/terms and rate-limit review.

Optional filters:

```powershell
$env:RECUS_LIVE_CHECK='1'; cmd /c npm.cmd run recus:live-check -- --org rocklin --sport pickleball --max-sites 2
```

## Environment

Copy `.env.example` to `.env.local` when you want local overrides.

Important defaults:

- `TWILIO_DRY_RUN=true` keeps SMS in dry-run mode.
- Supabase env vars are optional for this MVP.
- Stripe env vars are optional; Pro checkout is a placeholder.

## Checks

```powershell
cmd /c npm.cmd run test
cmd /c npm.cmd run typecheck
cmd /c npm.cmd run build
```

## Scope

Included:

- Facility Directory v1
- Ten LA-area sample facilities
- Facility search/filter/detail pages
- Admin create/edit/import facility management
- Admin manual slot publishing with immediate matching
- Monitoring request capture and admin review
- Seeded court inventory
- Alert creation/listing for all facility live statuses
- Mock availability only for `live_alerts` facilities
- Dry-run notification events with deduplication
- Free plan limit of one active alert
- Pro placeholder at $9/month

Not included:

- Auto-booking
- Social feed
- Real website scraping
- Real-time coverage for all facilities
- Live SMS by default
- Live Stripe checkout
