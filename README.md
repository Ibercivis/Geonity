# Geonity

Citizen science platform by [Ibercivis](https://ibercivis.es): projects with observation forms, maps, organizations and statistics.
Site: <https://geonity.ibercivis.es>

## What is in this repository

| Folder | What it is | Stack |
|---|---|---|
| [`react/`](react/) | The Geonity web app | React, Vite, TypeScript, Tailwind, shadcn/ui |
| [`admin/`](admin/) | Admin panel for projects and observations | React, Vite, TypeScript |
| [`flutter/`](flutter/) | Mobile app (Android and iOS) | Flutter |
| [`api/`](api/) | Just a `README` pointing to the backend: **the backend lives in another repository** | — |
| [`docs/`](docs/) | Public technical notes | Markdown |

### The backend lives in another repository
The API (Django REST Framework, PostGIS) is developed and deployed from
**[`Ibercivis/citsci-api`](https://github.com/Ibercivis/citsci-api)**. The `api/` folder here only contains a `README` that says so
(until 2026-10-07 it held an outdated copy that was not used; its history is still in git).

## Working on it

Each application is installed and run on its own:

```bash
# Web app
cd react && npm ci && npm run dev          # copy .env.example to .env.development and adjust it

# Admin panel
cd admin && npm ci && npm run dev          # copy .env.example to .env and adjust it

# Mobile app
cd flutter && flutter pub get && flutter run   # needs lib/config/secrets.dart (see secrets.example.dart)
```

Files with keys or local configuration (`.env*`, `lib/config/secrets.dart`, `android/key.properties`, …) are **not versioned**: use the `*.example` files as a template.

## Versions and deployment

- **A single main branch (`main`)**; changes come in through pull requests from working branches.
- **Language**: documentation, scripts and commit messages are written in English.
- Deployments use scripts that **refuse to deploy with uncommitted changes**, and leave a `version.json` on the site and a git tag:
  - Web app: `react/deploy.sh` → tag `deploy/react/YYYY-MM-DD-HHMM`
  - Admin panel: `admin/scripts/deploy.sh` → tag `admin/deploy-YYYY-MM-DD-HHMM`
  - Mobile app: tag `flutter/vX.Y.Z+N` for each released version
- Both web deploy scripts support `--dry-run` (build and show what would change, without touching the server).
- To see what is deployed on the web app: `https://geonity.ibercivis.es/version.json`.

## License
See [`LICENSE`](LICENSE) (MIT).
