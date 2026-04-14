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
# 1. Generate the debug changelog (once per build)
./generate_changelog.sh
# → opens editor with grouped commits
# → saves to assets/changelog/debug/debug_<version>+<build>.md
# → creates git tag: debug-<version>+<build>

# 2. Build and upload
./deploy.sh debug android   # APK → server
./deploy.sh debug ios       # Runner.app → server
```

Bumps the **build number** only (e.g. `1.0.0+6` → `1.0.0+7`).

---

## Production build

Use this for App Store / Play Store releases.

```bash
# 1. Generate the production changelog
./generate_changelog.sh --prod
# → aggregates all debug entries for current version
# → opens editor to write clean, user-facing release notes in English
# → saves to assets/changelog/changelog.md (prepended)
# → creates git tag: v<version>

# 2. Build and upload
./deploy.sh prod android    # AAB → server
./deploy.sh prod ios        # IPA → server
./deploy.sh prod all        # AAB + IPA → server
```

Bumps the **patch version** and resets build to 1 (e.g. `1.0.0+7` → `1.0.1+1`).

---

## Safety rules

- `deploy.sh` **will abort** if the changelog for the current version is missing.
- If the build fails, `pubspec.yaml` is **automatically reverted**.
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
