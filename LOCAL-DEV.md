# Running the Geonity clients locally

The web app and the admin panel against an API on your own machine, with a small sample of data
and **nothing copied from production**.

The API, the data and the reasoning about why no production extract is needed are in
[`Ibercivis/citsci-api`](https://github.com/Ibercivis/citsci-api), branch `federation`,
in its `LOCAL-DEV.md`. Start there:

```sh
docker compose up -d --build
docker compose exec citsci-api python manage.py seed_local
```

That gives you <http://localhost:8000> with four projects, six invented accounts and sixty
observations built from public CC0 records. Every account's password is `devpass12345`.

## Everything goes through the dev server's proxy

The API sends **no CORS headers**. A browser on `http://localhost:5173` calling
`http://localhost:8000` directly is blocked before the request is made, so both apps are
configured to call their own origin and let Vite forward it. In production the reverse proxy
does the same job for `geonity.ibercivis.es` and `geonity-backend.ibercivis.es`.

Both dev servers point at **the production API** when nothing is configured. That is the default
in this repository and it is easy to hit by accident: start either app without the file below and
you are reading and writing against the live site. Write the file first.

## The web app

`react/.env.development` (git-ignored):

```sh
VITE_DEV_PROXY_TARGET=http://localhost:8000
VITE_API_URL=/api-proxy/api
VITE_MEDIA_URL=http://localhost:8000
VITE_MAPBOX_TOKEN=
VITE_OBSERVATIONS_API_KEY=dev-web
```

```sh
cd react && npm install && npm run dev
```

`VITE_OBSERVATIONS_API_KEY` must match `CLIENT_API_KEY_WEB` in the API's `compose.yaml`, which is
`dev-web`. `VITE_DEV_PROXY_TARGET` is new: `vite.config.ts` used to name one host and nothing else,
so there was no way to reach a local API. Left unset it is the host it always was.

## The admin panel

`admin/.env` (git-ignored):

```sh
VITE_API_BASE_URL=
VITE_API_PROXY_TARGET=http://localhost:8000
VITE_API_COLUMNS_PROXY_TARGET=http://localhost:8000
VITE_API_ADMIN_FIELDS_PROXY_TARGET=http://localhost:8000
VITE_MAPBOX_TOKEN=
VITE_GOOGLE_CLIENT_ID=
```

```sh
cd admin && npm install && npm run dev
```

Sign in as `rosa@geonity.invalid`, which is the staff account that owns the sample projects: the
panel's listings are staff-only, so a volunteer account sees nothing.

## Maps

Both apps draw their maps with Mapbox GL, which needs an access token. Without one every other
screen works and the map area stays blank — the admin panel says so in words, the web app logs it
to the console. Any token from a free Mapbox account, in `VITE_MAPBOX_TOKEN`, is enough.

## The mobile client

**Not exercised, and not changed.** Two things would be in the way, both of them debug-only:

- `flutter/lib/config/app_config.dart` hard-codes `baseUrl` to `https://geonity.ibercivis.es`.
  There is a `PRODUCTION` `--dart-define` in that file, but `baseUrl` does not read it, so the
  switch is dead: pointing the app at a local API means editing the file, or giving `baseUrl` an
  environment hole the way `vite.config.ts` now has one.
- Android blocks cleartext HTTP by default from API 28, and
  `android/app/src/debug/AndroidManifest.xml` does not override it, so even then
  `http://10.0.2.2:8000` would be refused. That override belongs in the debug manifest, which does
  not merge into a release build.

Neither change is made here, because there is no Flutter SDK on the machine this was written on and
an unverified change to a shipping mobile app is worth less than a note saying what it would be.

## Known issues

- **`npm ci` fails in `react/`** on a fresh clone: `package-lock.json` is out of step with
  `package.json` (`@emnapi/core` and `@emnapi/runtime` are missing from the lock file). `npm install`
  works. Pre-existing, and not fixed here — regenerating the lock file is a change that belongs to
  whoever maintains the dependency set.
- The web app's `vite.config.ts` warns that `__dirname` is unsupported by Vite's future native
  config loader. Pre-existing and harmless.
