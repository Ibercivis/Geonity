# Deployment Guide

## Prerequisites

- Flutter SDK installed and in PATH
- SSH access to `ubuntu@api.ibercivis.es`
- Git configured with signing (if required)

---

## Commit convention

All commits must follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <short description>
```

| Type | Changelog section |
|---|---|
| `feat:` | New features |
| `fix:` | Bug fixes |
| `perf:` | Performance |
| `refactor:` | Refactoring |
| `chore:` | Maintenance |

Example: `git commit -m "feat: add dark mode in settings"`

---

## Debug build

Use this for QA / internal testing.

```bash
# 1. Generate changelog → bumps build number automatically
./generate_changelog.sh
# → bumps 1.0.0+7 to 1.0.0+8
# → opens editor with grouped commits
# → saves to assets/changelog/debug/debug_1.0.0+8.md
# → creates git tag: debug-1.0.0+8

# 2. Build and upload (no version bump here)
./deploy.sh debug android   # APK → server
./deploy.sh debug ios       # Runner.app → server
```

---

## Production build

Use this for App Store / Play Store releases.

```bash
# 1. Generate changelog → bumps patch version automatically
./generate_changelog.sh --prod
# → bumps 1.0.0+8 to 1.0.1+1
# → aggregates all debug entries for 1.0.0
# → opens editor to write clean, user-facing release notes in English
# → saves to assets/changelog/changelog.md (prepended)
# → creates git tag: v1.0.1
# → archives debug changelogs to debug/archived/

# 2. Build and upload (no version bump here)
./deploy.sh prod android           # APK arm64 → scp to server (direct distribution)
./deploy.sh prod android --store   # AAB → ready for Play Store (manual upload)
./deploy.sh prod ios               # IPA → scp to server
./deploy.sh prod all               # APK arm64 + IPA → scp to server
```

---

## Safety rules

- `generate_changelog.sh` owns the version bump — `deploy.sh` never touches `pubspec.yaml`.
- `deploy.sh` **will abort** if the changelog for the current version is missing.
- After a prod release, debug changelog files are **archived** to `assets/changelog/debug/archived/`.

---

## File structure

```
assets/changelog/
  changelog.md          ← production changelog (shown in-app, English only)
  debug/                ← ignored by git
    debug_1.0.0+6.md
    archived/
```
