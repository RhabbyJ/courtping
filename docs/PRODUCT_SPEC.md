# CourtPing Product Spec

## Summary

CourtPing helps tennis and pickleball players stop repeatedly checking booking sites for open courts. Users save alert preferences for venues, courts, days, and time windows. The system checks seeded/mock availability data and creates SMS/email notification events when matching slots open.

CourtPing does not book courts. Every alert points users back to the facility or public booking website to complete the reservation themselves.

## Target Users

- Recreational tennis and pickleball players who repeatedly check local court availability.
- Parents, captains, and organizers who need predictable court times for small groups.
- Admin/operators validating venue data, mock availability snapshots, alerts, and notification events.

## Core User Flows

### 1. Sign Up and Set Contact Preferences

1. User creates an account with Supabase Auth.
2. User adds or confirms email and optional phone number.
3. User opts into SMS and/or email alerts.
4. App stores contact preferences without hardcoded secrets or provider credentials.

### 2. Browse Seeded Venues and Courts

1. User views seeded venues.
2. User filters by sport, location, or court type when available.
3. User sees court names and a facility booking link.
4. User can start an alert from a venue or court.

### 3. Create an Alert

1. User selects sport, venue, one or more courts, days of week, and time window.
2. User chooses notification channel: SMS dry-run, email event, or both.
3. User reviews the alert summary.
4. System saves an active alert preference.

Minimum alert fields:

- User ID
- Sport: tennis or pickleball
- Venue ID
- Court IDs or "any court at venue"
- Days of week
- Start time and end time
- Notification channels
- Active/inactive status

### 4. Mock Availability Check

1. System reads seeded/mock availability snapshots.
2. Checker finds open slots.
3. Matcher compares slots against active alerts.
4. For each match, system creates a notification event.
5. Duplicate events for the same alert and slot are suppressed.

### 5. Notify User

1. SMS uses Twilio dry-run mode by default.
2. Email may be represented as a notification event until a real provider is selected.
3. Notification content includes venue, court, date, time, and booking link.
4. User books on the external facility/public booking site.

### 6. Admin Review

1. Admin views seeded venues and courts.
2. Admin views active alerts.
3. Admin views availability snapshots.
4. Admin views notification events and dry-run SMS payloads.
5. Admin uses this to validate matching behavior and user demand.

## Functional Requirements

- Next.js and TypeScript app runs locally.
- Supabase Postgres stores users, venues, courts, alert preferences, availability snapshots, and notification events.
- Supabase Auth gates user-specific alert management.
- Seeded venues/courts exist for local MVP testing.
- Mock availability checker detects open slots from seeded data.
- Matching alerts create durable notification events.
- Twilio integration must support dry-run mode and must not send real SMS by default.
- Stripe is a placeholder only until pricing is validated.
- Admin can inspect venues, alerts, snapshots, and notification events.

## Non-Goals

- No auto-booking.
- No social feed, player matching, messaging, or group coordination.
- No scraping real booking websites unless explicitly approved later.
- No bypassing facility rules, rate limits, queues, or account requirements.
- No paid billing capture in the MVP.
- No guarantee that an alerted slot is still available when the user opens the booking link.
- No broad venue marketplace or national inventory.

## Pricing Hypothesis

Initial hypothesis: players will pay for fewer manual checks and faster awareness of open courts.

Candidate plans for validation only:

- Free: 1 active alert, email notification events, slower checks.
- Plus: $5 to $8/month, up to 5 active alerts, SMS alerts, faster checks.
- Organizer: $12 to $20/month, more alerts across multiple venues.

Stripe should remain a placeholder until enough users demonstrate willingness to pay. The MVP can show plan names or "coming soon" pricing, but it should not charge users.

## Validation Plan

Validate demand before building real integrations.

Signals to collect:

- Number of target users who create at least one alert.
- Percentage of signed-up users who provide a phone number for SMS.
- Number of users who return to edit or create additional alerts.
- Clicks from notification events to facility booking links.
- User interviews confirming repeated manual checking is painful.
- Willingness to pay for SMS, faster checks, or multiple alerts.

Suggested first validation pass:

- Interview 15 to 25 local tennis/pickleball players.
- Recruit 25 to 50 MVP users from one or two target venues.
- Run seeded/mock availability tests with transparent labeling.
- Ask users whether they would pay for the proposed Plus tier after seeing alerts.

## Kill Criteria

Kill or pivot the MVP if, after a focused validation pass:

- Fewer than 30% of recruited users create an alert.
- Fewer than 20% of alert creators opt into SMS or provide a phone number.
- Fewer than 10% of interviewed target users say they would pay at least $5/month.
- Users do not describe manual court checking as a repeated pain.
- Real venue data access would require prohibited scraping, rule bypassing, or auto-booking behavior.
- Notification timing cannot be made useful without unsupported real-time booking integrations.

## Product Risks

- Availability data may be too stale or incomplete to create trust.
- Users may expect CourtPing to reserve courts automatically.
- Facility booking rules and terms may limit future integrations.
- SMS costs may exceed willingness to pay.
- Alert fatigue may reduce trust if duplicate or low-quality events are created.

## TODOs

- Define exact seeded venues for the first local test market.
- Decide whether email needs a provider before validation or can remain event-only.
- Define admin authorization rules before exposing admin views beyond local use.
- Confirm RLS policies for user-owned alert data before any hosted deployment.
