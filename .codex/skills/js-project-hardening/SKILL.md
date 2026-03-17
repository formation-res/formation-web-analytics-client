---
name: js-project-hardening
description: Harden a JavaScript project with TDD, focused validation, runtime-safe behavior, and clear verification. Use when changing behavior, validation, instrumentation, transport, or tests.
---

# JS Project Hardening

Use this skill for behavior changes in JavaScript projects.

## Workflow

1. Read the repo instructions and the relevant source files.
2. Write or extend failing tests first.
3. Implement the smallest compatible change.
4. Refactor only after tests cover the behavior.
5. Check whether dependencies involved in the change are current and whether any known security issues need remediation.
6. Run the package test and build checks before finishing.

## Constraints

- Keep the public API additive-only unless the user explicitly approves a break.
- Keep runtime behavior compatible with dependent services, APIs, and consumers.
- Do not add new externally visible fields or behaviors unless the receiving code accepts them.
- Treat this as shipped application code: avoid noisy runtime failures, accidental duplicate work, and hidden global side effects.
- Prefer best-effort delivery with structured failure hooks over throwing from public tracking calls.
- Keep dependency upgrades intentional: prefer current stable releases, verify compatibility, and do not leave known audit issues behind without documenting them.

## Focus Areas

- Validation and guard rails: reject invalid inputs and configs early.
- Runtime safety: handle failed network, storage, DOM, or environment interactions predictably.
- Compatibility: preserve wire contracts, public APIs, and integration expectations unless a break is intentional.
- Test coverage: prefer focused behavior tests over implementation-detail assertions.
- Dependency hygiene: keep direct dependencies reasonably current and review transitive security exposure when release readiness matters.
- Release readiness: keep docs, package metadata, and verification scripts aligned with actual behavior.

## Verification

- Run the package's automated tests
- Run the package build
- Run dependency update checks when relevant
- Run a security audit and address findings or document why they are acceptable
