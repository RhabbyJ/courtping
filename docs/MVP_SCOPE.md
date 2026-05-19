# CourtPing MVP Scope

## Objective

Build the smallest local MVP that proves users can create court availability alerts and that mock open slots produce notification events. The MVP should support product validation without real scraping, real SMS sends by default, or paid billing.

## Acceptance Criteria

- App runs locally.
- Seeded venues and courts exist.
- User can create an alert preference.
- Mock availability checker can detect an open slot.
- Matching alerts create notification events.
- SMS works in Twilio dry-run mode.
- Admin can view venues, alerts, availability snapshots, and notification events.

## In Scope

- Next.js and TypeScript application shell.
- Supabase Auth for user accounts.
- Supabase Postgres tables for venues, courts, alert preferences, availability snapshots, and notification events.
- Seed script or migration-backed seed data for local venues/courts.
- Alert creation flow with venue, court, days, time window, sport, and notification channel.
- Mock availability checker using seeded/local data only.
- Matching logic that creates notification events and avoids duplicate events for the same alert/slot.
- Twilio adapter with dry-run mode required by default.
- Email represented as notification events unless a simple provider is explicitly added later.
- Admin read views for core operational data.
- Stripe pricing placeholder with no charge flow.

## Out of Scope

- Auto-booking or reservation submission.
- Real booking website scraping.
- Social feed, chat, groups, player matching, or public profiles.
- Production-grade billing, subscriptions, invoices, or payment collection.
- Multi-market venue onboarding workflow.
- Facility owner portal.
- Native mobile app.
- Complex notification scheduling, throttling, or preference centers beyond MVP needs.

## Primary User Stories

- As a player, I can sign up and create an alert for a venue, court, days, and time window.
- As a player, I can see that my alert is active and edit or disable it.
- As a player, I receive an SMS dry-run or email notification event when a matching mock slot opens.
- As a player, I can open the facility booking link from the alert content.
- As an admin, I can inspect seeded venues, alerts, snapshots, and notification events.

## MVP Flows

### User Alert Flow

1. User signs in.
2. User selects a seeded venue.
3. User selects one or more courts, or any court at the venue.
4. User selects days of week.
5. User enters a start and end time.
6. User chooses SMS dry-run and/or email event.
7. User saves the alert.
8. User can view, edit, disable, or delete the alert.

### Availability Check Flow

1. Admin or scheduled local command triggers the mock checker.
2. Checker reads mock availability snapshots.
3. Matcher compares open slots to active alerts.
4. System creates notification events for new matches.
5. System records enough details to debug why an event was created.

### Notification Flow

1. Notification event is created with channel, status, message body, alert ID, and slot details.
2. SMS channel calls Twilio only through dry-run mode unless explicitly configured otherwise.
3. Email channel records an event and message preview.
4. User-facing message links to the facility/public booking page.

### Admin Flow

1. Admin opens an internal/admin view.
2. Admin reviews seeded venues and courts.
3. Admin reviews user alerts.
4. Admin reviews availability snapshots.
5. Admin reviews notification events, statuses, and dry-run payloads.

## Data Boundaries

- User-owned alert data must be scoped by authenticated user.
- Admin views must not be exposed without an admin authorization check.
- Service-role Supabase keys must never be exposed to browser code.
- Twilio credentials must come from environment variables.
- Dry-run mode must be the default for SMS.
- Seed/mock data must be clearly distinguishable from real venue availability.

## Manual Test Checklist

- Run the app locally and confirm the main user flow loads.
- Seed local venues and courts.
- Create a test user.
- Create an alert for a seeded venue and time window.
- Insert or load a mock open slot matching the alert.
- Run the mock checker.
- Confirm one notification event is created.
- Run the checker again and confirm duplicates are not created for the same alert/slot.
- Confirm SMS output stays in dry-run mode.
- Confirm admin views show venues, alerts, snapshots, and notification events.

## Delivery Milestones

1. Local app, Supabase schema, and seed data.
2. Authenticated alert creation and alert list.
3. Mock snapshots, checker, matcher, and notification events.
4. Twilio dry-run adapter and email event placeholder.
5. Admin read views and validation instrumentation.
6. Stripe pricing placeholder copy.

## Risks

- Alert matching can look successful in mock data but fail to translate to real availability.
- Users may churn if alerts arrive after slots are already gone.
- Admin views can become a security risk if promoted from local to hosted use without proper authorization.
- SMS costs and compliance requirements may change the pricing model.

## TODOs

- Pick the first seeded venue set.
- Define the exact duplicate suppression key for notification events.
- Decide whether the checker runs from an API route, script, or scheduled job for MVP demos.
- Add hosted deployment requirements after local MVP acceptance is met.
