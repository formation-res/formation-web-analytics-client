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
2. Bump the version intentionally.
   - Update `package.json` and `package-lock.json` together.
   - Use `npm version <version> --no-git-tag-version` unless the user explicitly wants a different flow.
3. Verify before pushing.
   - Run `npm run verify`.
   - Do not tag or publish if verification fails.
4. Commit and push the release commit.
   - Use a clear commit message such as `Release 0.1.2`.
   - Push `main` before pushing the tag so the workflow definition and release commit are present on GitHub.
5. Create and push the semver tag.
   - Use an annotated tag like `git tag -a 0.1.2 -m "Release 0.1.2"`.
   - Push the explicit ref: `git push origin refs/tags/0.1.2`.
6. Follow the GitHub Actions publish run.
   - Confirm the `publish` workflow started for the tag.
   - Watch the run to completion and inspect logs if it fails.
7. Confirm publication.
   - Check the published version with `npm view <package-name> version`.
   - Create or update the GitHub release if the user asks for one.

## Guard Rails

- Prefer the repo's trusted publishing workflow over manual `npm publish` from a local machine.
- Keep package metadata aligned with the actual GitHub org/repo to avoid confusing npm and users.
- Treat tag pushes as the publish trigger; do not push a release tag until verification passes.
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
sed -n '1,120p' package.json
sed -n '1,120p' package-lock.json
sed -n '1,200p' .github/workflows/publish.yml
npm version 0.1.2 --no-git-tag-version
npm run verify
git add package.json package-lock.json
git commit -m "Release 0.1.2"
git push origin main
git tag -a 0.1.2 -m "Release 0.1.2"
git push origin refs/tags/0.1.2
gh run list --limit 10
gh run watch <run-id> --exit-status
npm view @tryformation/formation-web-analytics-client version
gh release create 0.1.2 --title "0.1.2" --notes "Initial release."
```
