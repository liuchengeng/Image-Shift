# Release SOP

This document defines how to publish Image-Shift builds without committing Windows binaries into the Git repository.

## Release Rules

- Source code, config, and docs go into GitHub repository commits
- Windows build artifacts do not go into Git history
- `.exe`, `.zip`, `win-unpacked/`, and other build output go into GitHub Releases
- Create one tagged release for one tested build

## Current Build Commands

Validate before packaging:

```bash
npm run typecheck
npm run test
npm run lint
npm run build
```

Package the Windows installer:

```bash
npm run desktop:build:win
```

This uses `electron-builder` and writes output to:

```text
release/
```

## Recommended Release Flow

### 1. Prepare the code

Work on a feature or fix branch first.

Example:

```bash
git switch main
git pull
git switch -c feat/release-0.1.1
```

Complete the change, validate it, then merge it into `main`.

### 2. Build from the final code

From the final release commit on `main`:

```bash
git switch main
git pull
npm install
npm run typecheck
npm run test
npm run lint
npm run build
npm run desktop:build:win
```

Expected artifact:

```text
release/Image-Shift Setup 0.1.0.exe
```

Install once and launch the installed app for the startup smoke test. If a portable fallback is also needed, build it separately with `npm run desktop:build:portable`.

### 3. Tag the release commit

Use a version tag that matches `package.json`.

Example:

```bash
git tag v0.1.0
git push origin v0.1.0
```

### 4. Create the GitHub Release

On GitHub:

1. Open the repository Releases page
2. Create a new release from tag `v0.1.0`
3. Title it `Image-Shift v0.1.0`
4. Upload the packaged `.exe`
5. Publish the release

Recommended release notes format:

```text
Image-Shift v0.1.0

Changes
- ...
- ...

Validation
- npm run typecheck
- npm run test
- npm run lint
- npm run build
- npm run desktop:build:win
```

## What Not To Commit

Keep these out of Git:

- `release/`
- `release-*`
- `win-unpacked/`
- `tmp-repro/`
- `*.tsbuildinfo`
- build logs and installer output

## Version Bump Checklist

Before each public release:

1. Update `package.json` version
2. Build from clean, final code
3. Smoke-test the packaged `.exe`
4. Tag the exact release commit
5. Upload the `.exe` to GitHub Releases

## Notes

- GitHub repository history should stay source-only
- GitHub Releases is the download channel for end users
- If you later need delta updates or installers, keep using Releases rather than committing binaries
