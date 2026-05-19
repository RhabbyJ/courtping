# CourtPing Agent Instructions

CourtPing is a Next.js/TypeScript MVP for tennis/pickleball court availability alerts.

Users create alert preferences. CourtPing checks availability and sends SMS/email when matching slots open. Users book on the official facility website.

No auto-booking. No credential use. No CAPTCHA bypass. No login scraping.

---

## Current Priority

CourtPing is conditional on data feasibility.

Do **not** expand UI/product features until Rec.us feasibility is resolved.

Current focus:

1. Prove whether Rec.us exposes public, unauthenticated availability.
2. If yes, build a fixture-tested Rec.us adapter.
3. If partial, narrow to one reliable city/facility cluster.
4. If no, pause or pivot.

Avoid work on:

- UI polish
- real Stripe
- real SMS
- social features
- generic admin expansion
- additional platforms before Rec.us

---

## Orchestrator Role

The main Codex chat acts as CTO/orchestrator.

It should:

- Restate the goal before coding.
- Keep scope small.
- Spawn subagents only for bounded tasks.
- Review subagent output before accepting it.
- Prevent scope creep.
- Report files changed, tests run, risks, and next step.

The orchestrator must not blindly trust subagent claims. Inspect code, tests, and docs.

---

## Subagent Rules

Use subagents only for narrow tasks.

Good subagent scopes:

- Research one platform/source.
- Implement one adapter.
- Add fixture tests.
- Review a diff.
- Run QA/build checks.

Bad scopes:

- Build the whole app.
- Improve everything.
- Polish the UI.
- Add multiple platforms.
- Scrape all facilities.

Subagent prompt format:

```txt
Read AGENTS.md first.

Role: [research/backend/qa/reviewer]
Goal: [specific task]
Allowed files: [paths]
Do not touch: [paths]

Rules:
- no auto-booking
- no login scraping
- no CAPTCHA bypass
- no hardcoded secrets
- no live network calls in tests
- keep changes small

Return:
- summary
- files changed
- tests/checks run
- risks
- recommendation
```
