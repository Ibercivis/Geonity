# Geonity admin panel

Admin panel for Geonity project owners and administrators: review observations, edit the administrative columns of each project, send emails to participants, and manage administrators and invitations.

**Stack:** React, TypeScript, Vite, Tailwind CSS v4, shadcn/ui. It uses the same API as the web app (see [`Ibercivis/citsci-api`](https://github.com/Ibercivis/citsci-api)).

## Getting started

```bash
npm ci
cp .env.example .env     # then edit the values
npm run dev
```

| Variable | What it is |
|---|---|
| `VITE_API_BASE_URL` | Base URL of the API (optional: in dev the Vite proxy is used when it is not set) |
| `VITE_API_PROXY_TARGET` | Target of the Vite proxy for `/api` in development |
| `VITE_API_COLUMNS_PROXY_TARGET` | Optional: proxy target for a specific endpoint that lives on another host |
| `VITE_MAPBOX_TOKEN` | Mapbox public access token |
| `VITE_GOOGLE_CLIENT_ID`, `VITE_GOOGLE_REDIRECT_URI`, `VITE_GOOGLE_REDIRECT_URI_DEV` | Google sign-in |

`VITE_*` values are **built into the JavaScript bundle**, so the build output depends on your `.env`. Keep the production `.env` (it is not versioned).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Type-checks and builds into `dist/` |
| `npm run lint` | Runs ESLint |
| `npm run preview` | Serves the production build locally |
| `npm run deploy` | Builds and deploys (see below) |

## Deployment

```bash
bash scripts/deploy.sh --dry-run   # build and show what would change on the server
npm run deploy                     # build and deploy
```

The script refuses to deploy with uncommitted changes, writes `version.json` (served at `/version.json`) and creates the git tag `admin/deploy-YYYY-MM-DD-HHMM`.
The target host is shared with other projects: the script only writes to its own folder and a small deploy log.
