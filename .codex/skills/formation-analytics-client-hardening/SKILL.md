---
name: formation-analytics-client-hardening
description: Harden the FORMATION browser analytics client with TDD, backend-compatible payloads, browser-safe instrumentation, and focused verification. Use when changing transport, tracking behavior, validation, or tests in formation-analytics-client.
---

# Formation Analytics Client Hardening

Use this skill for behavior changes in this package.

## Workflow

1. Read `AGENTS.md`, `CONTRIBUTING.md`, and the relevant files under `src/`.
2. Write or extend failing tests first.
3. Implement the smallest compatible change.
4. Refactor only after tests cover the behavior.
5. Run `npm test`, then `npm run build` before finishing.

## Constraints

- Keep the public API additive-only unless the user explicitly approves a break.
- Keep the event wire contract compatible with `../formation-web-analytics`.
- Do not add new top-level event fields unless the collector accepts them.
- Treat this as customer-website code: avoid duplicate listeners, duplicate page views, and noisy runtime failures.
- Prefer best-effort delivery with structured failure hooks over throwing from public tracking calls.

## Focus Areas

- Transport correctness: `sendBeacon` fallback, rejected fetches, non-2xx responses
- Payload completeness: browser context on events, deterministic payload merge order
- Guard rails: config validation, event type validation, non-empty identify ids
- SPA safety: idempotent history patching and navigation-triggered page views

## Verification

- `npm test`
- `npm run build`
