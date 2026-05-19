# Rec.us Feasibility Proof Of Concept

Date: 2026-05-18

Purpose: determine whether CourtPing can fetch and normalize public tennis/pickleball availability from Rec.us without login, credentials, CAPTCHA bypass, protected scraping, brute-force ID discovery, or auto-booking.

## Verdict

Verdict: GO for Rec.us data feasibility. Adapter support passed controlled manual live checks for Belmont, SF Rec & Park, and Rocklin on 2026-05-18, but Rec.us is not integrated into live app alerts.

Rec.us site IDs are discoverable from public unauthenticated sources. The public organization pages load public JavaScript that calls:

```text
https://api.rec.us/v1/locations/availability
https://api.rec.us/v1/sites/{siteId}/availability
https://api.rec.us/v1/sports
```

Calling `v1/locations/availability?publishedSites=true&organizationSlug={slug}` with slugs exposed by public Rec.us pages returns location IDs, court/site IDs, sport IDs, and `availableSlots`. Calling `v1/sites/{siteId}/availability` with site IDs obtained from that public response returns unauthenticated availability date/time maps.

The original blocker was implementation, not discoverability. The adapter now has fixture-tested support for the live public response shapes: `location.courts[].availableSlots` from organization availability and `data[date][time].availableDurationsMinutes` from site availability. Before app integration, review terms, permission, and rate limits.

## Research Constraints

All checks on 2026-05-18 used public unauthenticated GET requests only.

- No login.
- No credentials.
- No session cookies.
- No CAPTCHA bypass.
- No brute-force site IDs.
- No hidden privileged tokens.
- No live network calls in tests.
- `curl.exe --ssl-no-revoke` was used only to work around a local Windows certificate revocation-check failure while fetching otherwise public HTTPS resources.

## Public Source Chain

1. Public HTML pages expose organization slugs and, for location pages, location IDs in `__NEXT_DATA__`.
2. Public static JS bundles expose endpoint patterns:
   - `/_next/static/chunks/2613-a32fba382738ae3f.js`: `v1/locations/availability`
   - `/_next/static/chunks/9146-0714b8f3407c5cae.js`: `v1/sites/${id}/availability`
   - `/_next/static/chunks/pages/locations/%5BlocationId%5D-f2b1d60069eb778d.js`: `v1/locations/${locationId}/schedule`
3. Public network JSON from `api.rec.us` exposes the actual IDs and availability:
   - `v1/locations/availability?publishedSites=true&organizationSlug={slug}` exposes `location.id`, `location.courts[].id`, `location.courts[].sports[].sportId`, and `location.courts[].availableSlots`.
   - `v1/sports` maps sport IDs to names, including Pickleball and Tennis.
   - `v1/sites/{siteId}/availability` accepts public `location.courts[].id` values and returns availability maps.

## Fixture Provenance Audit

| Fixture | Source URL | Capture date | Source type | How `locationId` was found | How `siteId` was found | `siteId` visible without login? | Credentials/session/CAPTCHA/brute force/tokens |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `tests/fixtures/recus/hallmark-location.html` | `https://www.rec.us/hallmarkcourts` | Original capture not recorded; file timestamp is 2026-05-18; live recapture on 2026-05-18 confirmed the same location ID. | Public HTML, reduced to the relevant `__NEXT_DATA__` payload. | `__NEXT_DATA__.query.locationId = 756355b6-f361-483e-af56-6321ce50d782`. | Not present in this fixture. | Not in this fixture. Live public JSON now exposes real Hallmark site IDs. | None. |
| `tests/fixtures/recus/hallmark-tennis-availability.json` | None. Local representative fixture for the presumed `https://api.rec.us/v1/sites/{siteId}/availability` shape. | Original capture not recorded; file timestamp is 2026-05-18. | Synthetic fixture JSON, not proven live network JSON. | Copied from Hallmark location ID. | Synthetic placeholder `site-hallmark-tennis-1`. | No. This placeholder is not a public Rec.us site ID. | None. |
| `tests/fixtures/recus/hallmark-pickleball-availability.json` | None. Local representative fixture for an alternate availability shape. | Original capture not recorded; file timestamp is 2026-05-18. | Synthetic fixture JSON, not proven live network JSON. | Not present directly; adapter context supplies Hallmark location ID in tests. | Synthetic placeholder `site-hallmark-pickleball-a`. | No. This placeholder is not a public Rec.us site ID. | None. |
| `tests/fixtures/recus/city-of-belmont-locations-availability.json` | `https://api.rec.us/v1/locations/availability?publishedSites=true&organizationSlug=city-of-belmont` | 2026-05-18 | Public unauthenticated API JSON, full response retained and formatted. | Response includes Hallmark `756355b6-f361-483e-af56-6321ce50d782` and Alexander `99e7cd59-15cd-43aa-b0cc-9ed11f826840`. | Response includes eight public Belmont site IDs. | Yes. Site IDs are present in `location.courts[].id`. | None. |
| `tests/fixtures/recus/recus-sports.json` | `https://api.rec.us/v1/sports` | 2026-05-18 | Public unauthenticated API JSON, full response retained and formatted. | Not applicable. | Not applicable. | Not applicable. Maps public sport IDs, including Pickleball and Tennis. | None. |
| `tests/fixtures/recus/hallmark-tennis-court-1-site-availability.json` | `https://api.rec.us/v1/sites/a8ab7944-c0b6-432f-bbed-89425a54e099/availability` | 2026-05-18 | Public unauthenticated API JSON, full response retained and formatted. | Site ID came from the public Belmont locations availability response. | Hallmark Tennis Court 1 `a8ab7944-c0b6-432f-bbed-89425a54e099`. | Yes. | None. |
| `tests/fixtures/recus/hallmark-pickleball-court-2-site-availability.json` | `https://api.rec.us/v1/sites/4c161448-1f7b-402b-8eda-895cf8704678/availability` | 2026-05-18 | Public unauthenticated API JSON, full response retained and formatted. | Site ID came from the public Belmont locations availability response. | Hallmark Pickleball Court 2 `4c161448-1f7b-402b-8eda-895cf8704678`. | Yes. | None. |
| `tests/fixtures/recus/sf-rec-park-alice-marble-org-sanitized.json` | `https://api.rec.us/v1/locations/availability?publishedSites=true&organizationSlug=san-francisco-rec-park` | 2026-05-18 | Sanitized subset of public unauthenticated API JSON; parser-relevant fields retained. | Response includes Alice Marble `81cd2b08-8ea6-40ee-8c89-aeba92506576`. | Response includes Alice Marble Court 3 `c520577d-2c22-4e4e-8a92-c7709b0df07b`. | Yes. | None. |
| `tests/fixtures/recus/sf-rec-park-alice-marble-court-3-site-sanitized.json` | `https://api.rec.us/v1/sites/c520577d-2c22-4e4e-8a92-c7709b0df07b/availability` | 2026-05-18 | Sanitized subset of public unauthenticated API JSON; parser-relevant date-map fields retained. | Site ID came from the public SF Rec & Park locations availability response. | Alice Marble Court 3 `c520577d-2c22-4e4e-8a92-c7709b0df07b`. | Yes. | None. |
| `tests/fixtures/recus/rocklin-johnson-springview-org-sanitized.json` | `https://api.rec.us/v1/locations/availability?publishedSites=true&organizationSlug=rocklin` | 2026-05-18 | Sanitized subset of public unauthenticated API JSON; parser-relevant fields retained. | Response includes Johnson Springview Park: Courts `bad275ad-738b-4e8d-9707-debd562b058f`. | Response includes Court 3 - Tennis `d0517c95-e3d7-4d2d-978a-1dce12d2daeb`. | Yes. | None. |
| `tests/fixtures/recus/rocklin-johnson-springview-court-3-site-sanitized.json` | `https://api.rec.us/v1/sites/d0517c95-e3d7-4d2d-978a-1dce12d2daeb/availability` | 2026-05-18 | Sanitized subset of public unauthenticated API JSON; parser-relevant date-map fields retained. | Site ID came from the public Rocklin locations availability response. | Johnson Springview Court 3 - Tennis `d0517c95-e3d7-4d2d-978a-1dce12d2daeb`. | Yes. | None. |

Fixture conclusion: the HTML fixture is valid public provenance for Hallmark `locationId`; the new public API fixtures are the Belmont proof fixtures for live Rec.us response shapes. The two older Hallmark availability JSON fixtures remain synthetic parser examples only and are no longer the live-support proof path.

## Live Public Checks

| City/facility | Public page URL | Public API URL checked | Location IDs public? | Site IDs public? | Availability API public? | Parser works? | Live support status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SF Rec & Park courts, sampled Alice Marble, Balboa, Buena Vista | `https://www.rec.us/sfrecpark` | `https://api.rec.us/v1/locations/availability?publishedSites=true&organizationSlug=san-francisco-rec-park` | Yes. Example: Alice Marble `81cd2b08-8ea6-40ee-8c89-aeba92506576`. | Yes. Example: Alice Marble Court 3 `c520577d-2c22-4e4e-8a92-c7709b0df07b`. | Yes. `v1/sites/c520577d-2c22-4e4e-8a92-c7709b0df07b/availability` returned public date/time availability during the controlled live check. | Yes. Fixture tests cover sanitized SF org discovery and site date maps. | manual live check passed |
| Belmont, Alexander Courts and Hallmark Courts | `https://www.rec.us/belmont`; `https://www.rec.us/hallmarkcourts` | `https://api.rec.us/v1/locations/availability?publishedSites=true&organizationSlug=city-of-belmont` | Yes. Hallmark `756355b6-f361-483e-af56-6321ce50d782`; Alexander `99e7cd59-15cd-43aa-b0cc-9ed11f826840`. | Yes. Hallmark Tennis Court 1 `a8ab7944-c0b6-432f-bbed-89425a54e099`; Hallmark Pickleball Court 2 `4c161448-1f7b-402b-8eda-895cf8704678`; Alexander Tennis Court 1 `9f1a2b51-e97c-4ebb-aa57-98741590844e`. | Yes. `v1/sites/a8ab7944-c0b6-432f-bbed-89425a54e099/availability`, `v1/sites/4c161448-1f7b-402b-8eda-895cf8704678/availability`, and `v1/sites/9f1a2b51-e97c-4ebb-aa57-98741590844e/availability` returned public date/time availability. | Yes. Fixture tests cover site discovery, sport mapping, `location.courts[].availableSlots`, and site date maps. | supported for manual live check |
| Rocklin, Johnson Springview Park and Twin Oaks Park | `https://www.rec.us/rocklin` | `https://api.rec.us/v1/locations/availability?publishedSites=true&organizationSlug=rocklin` | Yes. Johnson Springview Park: Courts `bad275ad-738b-4e8d-9707-debd562b058f`; Twin Oaks Park `ed3a514c-b5c8-4128-a199-93a1afbd6b3f`. | Yes. Example: Johnson Springview Court 3 - Tennis `d0517c95-e3d7-4d2d-978a-1dce12d2daeb`. | Yes. `v1/sites/d0517c95-e3d7-4d2d-978a-1dce12d2daeb/availability` returned public date/time availability during the controlled live check. | Yes. Fixture tests cover sanitized Rocklin org discovery and site date maps. | manual live check passed |
| Emeryville, ECCL Rec Saturdays Gym pickleball | `https://www.rec.us/emeryville` | `https://api.rec.us/v1/locations/availability?publishedSites=true&organizationSlug=emeryville` | Yes. ECCL Rec Saturdays Gym `1d49cfdb-0c59-4d0f-b954-bacbbeb28f1b`. | Yes. Example: Court 1 `accccb28-db1e-4bcf-9517-d0afc278fb74`. | Yes. `v1/sites/accccb28-db1e-4bcf-9517-d0afc278fb74/availability` returned public date/time availability. | Yes for the Belmont fixture-proven shapes; Emeryville remains weak and optional. | weak/optional |
| Alameda | `https://www.rec.us/alameda` | `https://api.rec.us/v1/locations/availability?publishedSites=true&organizationSlug=alameda` | No public Alameda Rec.us org/facility page found. `/alameda` returned 404 and the API returned `[]`. | No. | No Alameda availability source found. | No. | unsupported |

Status note: `supported` means public data feasibility is proven. It does not mean CourtPing live alerts are app-enabled.

## Controlled Manual Live Check - Belmont

Run date: 2026-05-18

Command:

```powershell
$env:RECUS_LIVE_CHECK='1'; cmd /c npm.cmd run recus:live-check -- --org city-of-belmont --max-sites 3
```

Result: passed. The script used the same adapter/parser path covered by fixture tests, refused to run without `RECUS_LIVE_CHECK=1`, and made one bounded pass with no polling loop.

Requests made:

- `https://api.rec.us/v1/sports`
- `https://api.rec.us/v1/locations/availability?publishedSites=true&organizationSlug=city-of-belmont`
- `https://api.rec.us/v1/sites/fcbda536-882f-44a2-9b27-18cd78b34fbe/availability`
- `https://api.rec.us/v1/sites/b9b7f92a-0357-4b81-ab4a-d9f4208f7b01/availability`
- `https://api.rec.us/v1/sites/a8ab7944-c0b6-432f-bbed-89425a54e099/availability`

Request count: 5 total public API requests: 1 sports request, 1 organization availability request, and 3 site availability requests. On this Windows workstation, Node's TLS chain validation failed for `api.rec.us`, so the local-only script used `curl.exe --ssl-no-revoke` as a transport fallback for otherwise public HTTPS requests. No cookies, credentials, session tokens, hidden tokens, CAPTCHA bypass, login, brute force, or response dumps were used.

Locations discovered:

- Alexander Courts: `99e7cd59-15cd-43aa-b0cc-9ed11f826840`, 4 target courts discovered.
- Hallmark Courts: `756355b6-f361-483e-af56-6321ce50d782`, 4 target courts discovered.

Site IDs checked:

- Alexander Pickleball Court 1: `fcbda536-882f-44a2-9b27-18cd78b34fbe`
- Hallmark Tennis Court 2: `b9b7f92a-0357-4b81-ab4a-d9f4208f7b01`
- Hallmark Tennis Court 1: `a8ab7944-c0b6-432f-bbed-89425a54e099`

Normalized output: 43 CourtPing slots. Sample normalized slot:

```json
{
  "venueId": "756355b6-f361-483e-af56-6321ce50d782",
  "venueName": "Hallmark Courts",
  "courtId": "a8ab7944-c0b6-432f-bbed-89425a54e099",
  "courtName": "Tennis Court 1",
  "sport": "tennis",
  "startsAt": "2026-05-19T15:00:00.000Z",
  "endsAt": "2026-05-19T16:00:00.000Z",
  "status": "open",
  "bookingUrl": "https://www.rec.us/locations/756355b6-f361-483e-af56-6321ce50d782"
}
```

Status: Belmont live-check support is proven for local manual operations only. This is not production polling and does not enable CourtPing live alerts.

## Controlled Manual Live Checks - SF and Rocklin

Run date: 2026-05-18

Commands:

```powershell
$env:RECUS_LIVE_CHECK='1'; cmd /c npm.cmd run recus:live-check -- --org san-francisco-rec-park --max-sites 3
$env:RECUS_LIVE_CHECK='1'; cmd /c npm.cmd run recus:live-check -- --org rocklin --max-sites 3
```

Results: passed. Both checks used the same bounded local-only command and the same adapter/parser path used by fixture tests. The script still refuses to run without `RECUS_LIVE_CHECK=1`, rejects org slugs outside `city-of-belmont`, `san-francisco-rec-park`, and `rocklin`, and performs no polling loop.

SF Rec & Park request summary:

- 5 total public API requests: 1 sports request, 1 organization availability request, 3 site availability requests.
- Endpoints hit:
  - `https://api.rec.us/v1/sports`
  - `https://api.rec.us/v1/locations/availability?publishedSites=true&organizationSlug=san-francisco-rec-park`
  - `https://api.rec.us/v1/sites/c520577d-2c22-4e4e-8a92-c7709b0df07b/availability`
  - `https://api.rec.us/v1/sites/fa04a28d-ef95-4784-b49f-55799d8c00c5/availability`
  - `https://api.rec.us/v1/sites/d1e2e418-c02c-43b1-b897-7905ecfb797a/availability`
- Locations discovered: 28.
- Target courts discovered: 114.
- Sites checked: Alice Marble Court 3 `c520577d-2c22-4e4e-8a92-c7709b0df07b`, Balboa Court 2 `fa04a28d-ef95-4784-b49f-55799d8c00c5`, Buena Vista Court B `d1e2e418-c02c-43b1-b897-7905ecfb797a`.
- Normalized output: 107 CourtPing slots.
- Sample normalized slot: Alice Marble Court 3, tennis, `2026-05-19T14:30:00.000Z` to `2026-05-19T16:00:00.000Z`, status `open`.

Rocklin request summary:

- 5 total public API requests: 1 sports request, 1 organization availability request, 3 site availability requests.
- Endpoints hit:
  - `https://api.rec.us/v1/sports`
  - `https://api.rec.us/v1/locations/availability?publishedSites=true&organizationSlug=rocklin`
  - `https://api.rec.us/v1/sites/d0517c95-e3d7-4d2d-978a-1dce12d2daeb/availability`
  - `https://api.rec.us/v1/sites/e2c83a28-d7c0-4da7-b104-7babe84512d4/availability`
  - `https://api.rec.us/v1/sites/c6d8abb0-8f51-4bad-b99d-ba9ca5182fe2/availability`
- Locations discovered: 2.
- Target courts discovered: 12.
- Sites checked: Johnson Springview Court 3 - Tennis `d0517c95-e3d7-4d2d-978a-1dce12d2daeb`, Twin Oaks Court 2 - Pickleball `c6d8abb0-8f51-4bad-b99d-ba9ca5182fe2`, Johnson Springview Court 1 - Tennis `e2c83a28-d7c0-4da7-b104-7babe84512d4`.
- Normalized output: 711 CourtPing slots.
- Sample normalized slot: Johnson Springview Court 3 - Tennis, tennis, `2026-05-19T00:30:00.000Z` to `2026-05-19T02:30:00.000Z`, status `open`.

No cookies, credentials, session tokens, hidden tokens, CAPTCHA bypass, login, brute force, or unsanitized response dumps were used for SF or Rocklin.

## Public Data Observed On 2026-05-18

| Organization slug | Public locations returned | Public resources returned | Target tennis/pickleball resources observed | Availability observed |
| --- | ---: | ---: | ---: | --- |
| `san-francisco-rec-park` | 28 | 114 | Yes. Sampled tennis and pickleball courts at Alice Marble, Balboa, and Buena Vista. | `location.courts[].availableSlots`; site endpoint returned date/time maps. |
| `city-of-belmont` | 2 | 8 | Yes. Alexander Courts and Hallmark Courts include tennis and pickleball. | 208 location-level available slots in the captured fixture; site endpoint returned date/time maps. |
| `rocklin` | 6 | 21 | Yes. Johnson Springview Park and Twin Oaks Park include tennis and pickleball. | 2,061 target-sport location-level available slots observed; site endpoint returned date/time maps. |
| `emeryville` | 10 | 22 | Yes, but narrow: ECCL Rec Saturdays Gym returned four pickleball court resources and nine slots. | Site endpoint returned a small pickleball availability map. |
| `alameda` | 0 | 0 | No. | None. |

Sport mapping came from public `https://api.rec.us/v1/sports`:

- Pickleball: `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa`
- Tennis: `bd745b6e-1dd6-43e2-a69f-06f094808a96`

## Adapter Status

Current implementation:

- `src/lib/availability/recus-adapter.ts`
- `src/lib/availability/recus-source-config.ts`
- `src/lib/availability/source-runner.ts`
- `tests/recus-adapter.test.ts`
- `tests/recus-source.test.ts`
- fixtures under `tests/fixtures/recus/`

The adapter currently:

- fetches a Rec.us location page and extracts `__NEXT_DATA__` metadata;
- fetches public `v1/sports` mappings;
- fetches public `v1/locations/availability` for configured organization slugs;
- discovers public Rec.us site IDs from `location.courts[].id`;
- filters to Tennis/Pickleball using public sport IDs;
- fetches configured `v1/sites/{siteId}/availability` JSON;
- parses `location.courts[].availableSlots`;
- parses live site date maps shaped as `data[date][time].availableDurationsMinutes`;
- keeps support for the older synthetic fixture parser examples;
- normalizes fixture slots to `NormalizedAvailabilitySlot`;
- does not log in;
- does not book;
- does not bypass CAPTCHA;
- is not wired into production.

The beta-gated source infrastructure currently:

- defines Rec.us source configs with `sourceId: "rec-us"`;
- keeps every Rec.us config `enabled: false`, `betaOnly: true`, and `manualLiveCheckOnly: true`;
- allowlists only `city-of-belmont`, `san-francisco-rec-park`, and `rocklin`;
- includes beta candidates for Belmont Hallmark Courts, Belmont Alexander Courts, SF Rec & Park Alice Marble, Rocklin Johnson Springview Park, and Rocklin Twin Oaks Park;
- includes static reservation-rule metadata placeholders for Belmont, SF Rec & Park, and Rocklin, with unknown policy fields left as TODOs;
- caps configured site checks with `maxSitesPerCheck`;
- returns an internal source snapshot with `sourceId`, `organizationSlug`, `checkedAt`, `status`, `slotCount`, `normalizedSlots`, `errors`, `warnings`, `requestCount`, and `manualLiveCheckOnly`;
- can be exercised with fixture-backed tests or explicit manual live-check mode;
- does not call alert matching unless a test explicitly performs dry-run matching;
- does not create notification events.

The adapter does not yet:

- run live inside the app, cron, alert runner, or notification pipeline;
- enforce production polling rate limits;
- store dedupe keys for Rec.us production snapshots;
- include a production-safe Rec.us polling service wrapper.

Tests remain fixture-only. Belmont uses full captured public fixtures; SF Rec & Park and Rocklin use small sanitized public fixtures. Unknown URLs in the fixture fetch throw immediately, so tests do not silently make live calls. The Rec.us source runner tests verify disabled-by-default behavior, manual-only blocking, fixture-backed snapshot output, and dry-run matching without notification delivery.

## Exact Monitoring Feasibility Reason

Rec.us can be monitored because the public unauthenticated organization flow exposes enough data to identify and poll court resources:

1. Public page URL gives an organization slug.
2. Public JS documents `v1/locations/availability`.
3. Public `v1/locations/availability` response returns each location, each court/site ID, sport IDs, and available slot start times.
4. Public `v1/sports` maps sport IDs to Tennis/Pickleball.
5. Public `v1/sites/{siteId}/availability` returns a date/time availability map for site IDs obtained from step 3.

No guessing is needed: site IDs come directly from public API JSON returned for the public organization page.

## Production Readiness Blockers

- Terms/permission review needed before production polling.
- Rate-limit policy unknown.
- Endpoint shape may change.
- No direct reservation URL in site-level availability response.
- Need beta-safe polling interval and backoff design.
- Need partner/outreach path if we want to reduce legal risk.

## Disabled Source Configs

Rec.us now has disabled beta source configs for future internal use:

| Organization | Facilities represented | Enabled? | Beta only? | Manual live check only? | Max sites/check |
| --- | --- | --- | --- | --- | ---: |
| `city-of-belmont` | Hallmark Courts, Alexander Courts | No | Yes | Yes | 3 |
| `san-francisco-rec-park` | Alice Marble | No | Yes | Yes | 3 |
| `rocklin` | Johnson Springview Park: Courts, Twin Oaks Park | No | Yes | Yes | 3 |

These configs are infrastructure only. They are not connected to cron, production polling, app alert matching, Supabase writes, SMS/email, notification events, or user-facing launch surfaces.

## Risks

- Terms and permission still need review before production polling.
- Public endpoints may be rate-limited or changed without notice.
- The live response uses local date/time strings and organization time zones; normalization must be tested carefully.
- `v1/locations/availability` can return non-court resources such as picnic tables and pools; filtering must use `type` and public sport IDs.
- Legacy Hallmark availability fixtures are synthetic and should not be used as proof of live support; use the captured Belmont API fixtures for proof and live-shape parser work.
- Site-level availability maps do not include direct reservation URLs in the checked response.
- Emeryville is a weak target-sport cluster because the observed pickleball availability is narrow and gym-specific.

## Recommendation

Recommendation: keep Rec.us out of the app UI, cron, alert runner, and live notification pipeline for now. Multi-city technical validation passed for Belmont, SF Rec & Park, and Rocklin, and disabled beta-gated source infrastructure is in place. Production polling remains blocked until terms/permission and rate-limit review are complete.

Immediate next step:

1. Review terms, permission, and rate limits.
2. Review the beta polling design in `docs/RECUS_BETA_POLLING_DESIGN.md`, including backoff, observability, failure isolation, and explicit enablement controls.
3. Only then consider app integration behind a narrow beta flag with legal/terms approval.

CourtPing should not pause. Alameda should remain unsupported unless a valid public Rec.us page or organization slug is found.
