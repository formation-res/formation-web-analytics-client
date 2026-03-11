# Contributing

## Guard Rails

- Run `npm test` before pushing.
- Run `npm run build` before publishing or changing the public API.
- Keep the API small and unsurprising: `page`, `event`, `identify`, `setContext`.
- Prefer browser-focused tests over implementation-detail tests.
- If the runtime behavior changes, update [README.md](/Users/jillesvangurp/git/formation/formation-analytics-client/README.md).

## Definition Of Done

- Is the client API still minimal and close to the intended Google Analytics style?
- Has duplication been removed instead of repeated?
- Are examples and README updated if usage changed?
- Are tests present for new browser behavior?
- Do `npm test` and `npm run build` both pass?
