# Geonity web app

The Geonity web front end: browse and explore citizen science projects, add observations, manage your projects and organizations, and see statistics.

**Stack:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query, React Router, Mapbox GL. Translated into several languages (`src/locales`).

## Getting started

```bash
npm ci
cp .env.example .env.development     # then edit the values
npm run dev
```

| Variable | What it is |
|---|---|
| `VITE_API_URL` | Base URL of the API (see [`Ibercivis/citsci-api`](https://github.com/Ibercivis/citsci-api)) |
| `VITE_MEDIA_URL` | Base URL of the uploaded media |
| `VITE_MAPBOX_TOKEN` | Mapbox public access token |
| `VITE_OBSERVATIONS_API_KEY` | Client key the API requires to create observations |

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Type-checks (`tsc -b`) and builds into `dist/` |
| `npm run lint` | Runs ESLint |
| `npm run preview` | Serves the production build locally |

## Project layout

```
src/
├── api/          API clients (one file per area)
├── components/   UI components, grouped by feature (home, manage, organizations, stats, …)
├── hooks/        Shared React hooks
├── lib/          Utilities (axios instance, i18n, countries, …)
├── locales/      Translation files
├── pages/        One component per route (see router.tsx)
├── store/        Client state (auth)
└── types/        Shared TypeScript types
```

Several screens call a dedicated API endpoint first and fall back to older endpoints if the server does not have it yet (see `src/api/home.ts`).

## Deployment

```bash
./deploy.sh --dry-run   # build and show what would change on the server
./deploy.sh             # build and deploy
```

The script refuses to deploy with uncommitted changes, writes `version.json` (served at `/version.json`) and creates the git tag `deploy/react/YYYY-MM-DD-HHMM`.
