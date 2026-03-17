# Contributing

## Guard Rails

- Run `npm test` before pushing.
- Run `npm run build` before publishing or changing the public API.
- Use TDD for behavior changes: failing test first, then implementation, then refactor.
- Keep the API small and unsurprising: `page`, `event`, `identify`, `setContext`.
- Keep the wire contract compatible with the sibling collector in `../formation-web-analytics`.
- Do not add top-level event fields unless the collector accepts them.
- Treat non-2xx responses as failures and keep browser instrumentation idempotent.
- Prefer browser-focused tests over implementation-detail tests.
- If the runtime behavior changes, update [README.md](/Users/jillesvangurp/git/formation/formation-analytics-client/README.md).
- Keep [AGENTS.md](/Users/jillesvangurp/git/formation/formation-analytics-client/AGENTS.md) and any repo-local skills aligned with actual practice.

## Definition Of Done

- Is the client API still minimal and close to the intended Google Analytics style?
- Has duplication been removed instead of repeated?
- Are examples and README updated if usage changed?
- Are tests present for new browser behavior?
- Do `npm test` and `npm run build` both pass?
