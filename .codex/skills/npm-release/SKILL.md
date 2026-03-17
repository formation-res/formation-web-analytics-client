---
name: npm-release
description: Prepare and execute an npm package release with GitHub Actions tag publishing, trusted publishing, tagging, GitHub releases, and post-release verification. Use when asked to cut, publish, tag, or verify a package release.
---

# NPM Release

Use this skill when the user wants to ship a package release from this repository.

## Release Workflow

1. Inspect the repo state first.
   - Confirm `git status` is clean or understand any existing changes.
   - Read `package.json`, `package-lock.json`, and `.github/workflows/publish.yml`.
   - Confirm package metadata matches the actual GitHub repository and npm package name.
2. Propose the release before changing anything.
   - Find the latest release tag, inspect the diff since that tag, and recommend a semantic version bump that matches the scope.
   - Default to patch for fixes and non-user-facing release/tooling work, minor for backward-compatible features, and major for intentional breaking changes.
   - Ask the user to confirm or override the proposed version before bumping `package.json`, tagging, or publishing.
3. Bump the version intentionally.
   - Update `package.json` and `package-lock.json` together.
   - Use `npm version <version> --no-git-tag-version` unless the user explicitly wants a different flow.
4. Verify before pushing.
   - Run `npm run verify`.
   - Do not tag or publish if verification fails.
5. Push the release commit and wait for CI.
   - Use a clear commit message such as `Release <version>`.
   - Push `main` before pushing the tag so the workflow definition and release commit are present on GitHub.
   - Confirm the latest CI run for `main` completed successfully before creating the release tag.
6. Create and push the semver tag.
   - Use an annotated tag like `git tag -a <version> -m "Release <version>"`.
   - Push the explicit ref: `git push origin refs/tags/<version>`.
7. Follow the GitHub Actions publish run.
   - Confirm the `publish` workflow started for the tag.
   - Watch the run to completion and inspect logs if it fails.
8. Confirm publication.
   - Check the published version with `npm view <package-name> version`.
   - Create or update the GitHub release if the user asks for one.

## Guard Rails

- Prefer the repo's trusted publishing workflow over manual `npm publish` from a local machine.
- Keep package metadata aligned with the actual GitHub org/repo to avoid confusing npm and users.
- Base release recommendations on the diff since the latest release tag, not just the current version number.
- Always pause for user confirmation or override after proposing the next semver version.
- Treat tag pushes as the publish trigger; do not push a release tag until verification passes.
- Do not push a release tag until the latest CI run for `main` is green.
- If a tag already exists locally or remotely, stop and reconcile before creating another release.
- If the publish workflow fails, inspect the failing job before retrying or changing tags.

## GitHub Release

If the user wants a GitHub release:

- Create it from the matching tag with `gh release create <tag>`.
- Keep notes short unless the user asks for full changelog text.
- For an initial release, use a brief note like `Initial release.`

## Useful Commands

```bash
git status --short --branch
git describe --tags --abbrev=0
git log --oneline $(git describe --tags --abbrev=0)..HEAD
sed -n '1,120p' package.json
sed -n '1,120p' package-lock.json
sed -n '1,200p' .github/workflows/publish.yml
npm version <version> --no-git-tag-version
npm run verify
git add package.json package-lock.json
git commit -m "Release <version>"
git push origin main
gh run list --workflow ci --branch main --limit 5
gh run watch <ci-run-id> --exit-status
git tag -a <version> -m "Release <version>"
git push origin refs/tags/<version>
gh run list --limit 10
gh run watch <run-id> --exit-status
npm view @tryformation/formation-web-analytics-client version
gh release create <version> --title "<version>" --notes "Initial release."
```
