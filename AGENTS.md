## Overview

- Browser analytics client for FORMATION landing pages and customer websites
- Public API is intentionally small and should remain low-surprise: `page`, `event`, `identify`, `setContext`
- This package must stay wire-compatible with the sibling collector in `../formation-web-analytics`

## Engineering Guardrails

- Use TDD for behavior changes: write or extend tests first, then implement the smallest change that makes them pass, then refactor
- Preserve backward compatibility unless the user explicitly approves an API break
- Keep the event wire shape aligned with the collector schema; do not add arbitrary top-level JSON fields
- Favor small separations of responsibility: config validation, event assembly, browser context capture, SPA instrumentation, and transport should stay independently testable
- Code runs on customer sites, so avoid noisy runtime behavior, broad globals, and instrumentation that can duplicate listeners or page views

## Validation and Browser Safety

- Validate config and caller inputs before attempting network transport
- Treat failed HTTP responses as failures, not success
- Keep delivery best-effort for visitors; expose failures through hooks and debug logging rather than throwing from the public tracking methods
- Attach browser/page context in a backend-compatible way
- Make SPA history patching idempotent

## Testing and Verification

- Prefer focused Vitest coverage over implementation-detail assertions
- Add or update tests for transport failures, validation guardrails, payload completeness, and SPA navigation behavior when touching those areas
- Run `npm test` during iteration
- Keep dependencies current and check for security issues when touching release or tooling work
- Run `npm test` and `npm run build` before finishing code changes

## Documentation

- Update `README.md` when runtime behavior, configuration, or examples change
- Keep `CONTRIBUTING.md` and this file aligned with actual repo practice

## Release Discipline

- Before cutting a release, compare the diff against the latest release tag and propose a semantic version bump that matches the scope of the changes
- Always give the user a chance to confirm or override the proposed release version before changing `package.json`, creating a tag, or publishing
- Treat patch releases as fixes and low-risk internal changes, minor releases as backward-compatible feature additions, and major releases as intentional breaking changes
- Ensure `main` is pushed and `npm run verify` passes before tagging a release

## Skills

- Use `.codex/skills/js-project-hardening/SKILL.md` when hardening behavior, validation, test coverage, dependency hygiene, or release checks in this package
- Use `.codex/skills/npm-release/SKILL.md` when cutting a package release, bumping versions, pushing tags, following the publish workflow, or creating the matching GitHub release
