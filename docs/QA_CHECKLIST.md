# CourtPing QA Checklist

## Automated Checks

- `cmd /c npm.cmd run test`
- `cmd /c npm.cmd run typecheck`
- `cmd /c npm.cmd run build`

## Demo Flow

1. Start the app with `cmd /c npm.cmd run dev`.
2. Open `http://localhost:3000`.
3. Create a tennis alert from `/create-alert` with the default seeded Griffith Riverside court.
4. Confirm the alert appears on `/my-alerts`.
5. Open `/admin` and run the mock availability check.
6. Confirm the admin result reports at least one match and one dry-run notification.
7. Open `/admin/snapshots` and confirm a mock snapshot is visible.
8. Open `/admin/notifications` and confirm the SMS event has `dry_run` status.
9. Run the mock check again and confirm duplicate notifications are skipped.
10. Try creating a second active alert on the Free plan and confirm the app redirects to pricing.

## Security And Abuse Review

- No auto-booking UI or code path exists.
- No real booking websites are scraped.
- Twilio is dry-run by default and tests do not send SMS.
- Stripe checkout is placeholder-only when keys are absent.
- No secrets are committed; use `.env.example` as the public contract.
- Notification dedupe keys prevent repeated events for the same alert, slot, and channel.
- Public local admin pages are acceptable for MVP demo only. Add auth before deployment.
- Do not set `TWILIO_DRY_RUN=false` outside a guarded environment with admin auth and rate limiting.

## Known MVP Gaps

- Local mock storage is in-memory and resets when the dev server restarts.
- Supabase migration and seed files are generated but not applied to a remote project.
- Email delivery is a placeholder event, not a provider integration.
- Admin authorization is not enforced in the local MVP.
- In-memory dedupe is not atomic under concurrent trigger requests; use the Supabase unique constraint before production.
- Server-local time is used by the mock checker; keep demo environments on the expected local timezone.
