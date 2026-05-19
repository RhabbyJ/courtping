# Rec.us Beta Polling Design

Date: 2026-05-18

Status: design only. This is not a launch plan, production polling loop, cron job, alert delivery path, or customer notification path.

## Beta Goal

Validate that CourtPing can run bounded, observable, manual or dry-run Rec.us source checks for already-proven public Rec.us organizations, normalize availability snapshots, and dry-run match those snapshots against alert preferences without sending SMS/email or creating notification events.

The beta should answer:

- Do public Rec.us endpoints remain stable across repeated checks?
- Can we keep request volume small enough for a terms/rate-limit review?
- Can normalized slots safely feed dry-run matching without notification side effects?
- Are generic Rec.us booking links sufficient for users to finish booking on Rec.us?

## Supported And Unsupported Orgs

Supported beta candidates:

- `city-of-belmont`
- `san-francisco-rec-park`
- `rocklin`

Unsupported:

- `alameda`: no public Rec.us organization availability source was found.

No other Rec.us org slug should be accepted by beta tooling without a separate feasibility review.

## Source Config Model

Rec.us source configs live in `src/lib/availability/recus-source-config.ts`.

Required guardrails:

- `sourceId: "rec-us"`
- `enabled: false`
- `betaOnly: true`
- `manualLiveCheckOnly: true`
- `organizationSlug` must be allowlisted
- `allowedSports` limited to `tennis` and `pickleball`
- `maxSitesPerCheck` caps site availability requests
- `minCheckIntervalMinutes` documents the minimum future polling interval
- `facilityAllowlist` limits known beta facilities and court IDs
- `bookingBaseUrl` and facility `bookingUrl` are generic Rec.us booking entry points
- `notes` and `riskStatus` must preserve the terms/rate-limit blocker

The configs are internal infrastructure only. They are not wired into cron, the alert runner, Supabase writes, notification events, SMS/email, or user-facing UI.

## Proposed Polling Interval

For a dry-run beta after terms/rate-limit review:

- Start at no faster than one check every 30 minutes per organization.
- Add jitter of 0 to 5 minutes per organization to avoid aligned requests.
- Run at most one organization check at a time.
- Keep `manualLiveCheckOnly: true` until the CEO explicitly approves a non-manual dry-run mode.

If production approval later allows scheduled checks, the first scheduled beta should still write snapshots only and must not send notifications.

## Request Budget Per Org

Proposed maximum per organization check:

- 1 request to `https://api.rec.us/v1/sports`
- 1 request to `https://api.rec.us/v1/locations/availability?publishedSites=true&organizationSlug={slug}`
- Up to `maxSitesPerCheck` requests to `https://api.rec.us/v1/sites/{siteId}/availability`

Current config default: `maxSitesPerCheck = 3`, for a maximum of 5 public API requests per organization check.

For the three supported orgs, a full dry-run pass would be capped at 15 public API requests. The sports response can be cached within a single run if implemented later, but caching must not hide endpoint failures in validation runs.

## Backoff Strategy

Do not retry aggressively. A failed org check should produce an error snapshot and stop.

Proposed backoff for future dry-run scheduled mode:

- First failure: wait at least 60 minutes before the next check for that org.
- Repeated failures: double the interval up to 240 minutes.
- HTTP 429, 403, CAPTCHA/bot challenge, or unexpected auth requirement: pause that org and require manual review.
- Schema parse failure: pause that org after one failed check if normalized slots cannot be trusted.
- Network timeout: allow one bounded retry only if it stays inside the request budget.

No backoff path should create notifications.

## Failure Isolation

Each organization check should be isolated:

- A Belmont failure must not block SF Rec & Park or Rocklin snapshots.
- A site-level failure should be recorded as a warning if org discovery succeeded and other sites parsed.
- A total org failure should return `status: "error"`, `slotCount: 0`, and the error details.
- Unknown org slugs must fail before making a request.
- Alameda remains unsupported and should not be checked.

## Observability And Logging

Log structured summaries only:

- `sourceId`
- `organizationSlug`
- `checkedAt`
- `status`
- `requestCount`
- discovered location count
- discovered target court count
- checked site IDs
- normalized slot count
- error and warning messages
- duration if available

Do not log cookies, credentials, session data, hidden tokens, CAPTCHA artifacts, or full live response dumps. Public response fixtures should be sanitized and intentionally committed only when needed for parser tests.

## Snapshot Retention

Current state: snapshots are returned in code/tests only. No Supabase persistence is required for this design.

Future dry-run beta proposal:

- Keep recent internal snapshots for 7 to 14 days.
- Store normalized slot metadata, counts, status, request count, and errors.
- Do not store full live Rec.us response bodies by default.
- Add a TTL or cleanup job only after storage is approved.

Supabase persistence remains a TODO until the beta storage design is approved.

## Dry-Run Alert Matching Flow

The dry-run flow should be:

1. Load a disabled Rec.us beta source config only in an approved manual/dry-run context.
2. Run the adapter through the source runner.
3. Produce an `AvailabilitySourceSnapshot`.
4. Pass `snapshot.normalizedSlots` to the existing matcher in test or dry-run code only.
5. Record candidate match counts and sample slot IDs for review.
6. Do not create notification events.
7. Do not send SMS/email.
8. Do not mark user-facing coverage as live.

This flow proves matching compatibility without implying production readiness.

## Generic Booking-Link Strategy

The Rec.us site-level availability response does not expose a direct reservation URL. CourtPing should use the generic public location booking URL:

```text
https://www.rec.us/locations/{locationId}
```

Organization-level URLs such as `https://www.rec.us/belmont`, `https://www.rec.us/sfrecpark`, and `https://www.rec.us/rocklin` remain useful fallback entry points.

CourtPing must not auto-book, submit forms, log in, hold reservations, or bypass Rec.us controls.

## Per-City Reservation Rule Config

Static reservation-rule metadata lives beside the source config and is not wired into notifications.

Fields:

- `organizationSlug`
- `organizationName`
- `releaseWindowDays`
- `releaseTimeLocal`
- `maxReservationsPerDay`
- `maxReservationsPerWeek`
- `feeNotes`
- `bookingUrl`
- `ruleSourceUrl`
- `notes`

Current status:

| Organization | Booking URL | Release window | Release time | Reservation limits | Rule source |
| --- | --- | --- | --- | --- | --- |
| `city-of-belmont` | `https://www.rec.us/belmont` | TODO | TODO | TODO | TODO |
| `san-francisco-rec-park` | `https://www.rec.us/sfrecpark` | TODO | TODO | TODO | TODO |
| `rocklin` | `https://www.rec.us/rocklin` | TODO | TODO | TODO | TODO |

Unknown fields are explicit and validated as warnings. They must be confirmed before production polling or customer-facing reservation guidance.

## Production Blockers

- Terms and permission review are required before production polling.
- Rec.us rate-limit policy is unknown.
- Endpoint shapes may change without notice.
- No direct reservation URL is available in the site-level availability response.
- Need beta-safe polling interval, jitter, and backoff implementation.
- Need observability and alerting for parser failures and request failures.
- Need snapshot retention policy and storage approval.
- Need explicit enablement controls beyond disabled static config.
- Need partner/outreach path if CourtPing wants lower legal and operational risk.

## Go/No-Go Checklist

GO for dry-run beta only when all are true:

- Terms/permission review allows the proposed request pattern.
- Rate-limit guidance or a conservative approved budget is documented.
- Supported org list remains limited to Belmont, SF Rec & Park, and Rocklin.
- Rec.us configs remain disabled by default until explicit beta approval.
- `manualLiveCheckOnly` is not relaxed without explicit approval.
- Tests remain fixture-only.
- Unknown orgs and Alameda are rejected before requests.
- Source runner returns snapshots without notification side effects.
- Dry-run matching records candidates only.
- No SMS/email, notification events, cron, production polling, login, credentials, cookies, CAPTCHA bypass, hidden tokens, brute-force discovery, or auto-booking are introduced.

NO-GO if any production blocker remains unaccepted or if Rec.us requires login, privileged tokens, guessing IDs, CAPTCHA bypass, or partner-only access for the data path.
