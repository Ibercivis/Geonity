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

The two apps default to different places when nothing is configured, and only one of them is
dangerous. **The admin panel defaults to the live site** — `https://geonity.ibercivis.es`, which
serves the production API under `/api/` — so starting it without the file below means reading and
writing against production. Write that file first. The web app defaults to the local API, so it
either works or refuses to connect; it does not reach production by accident.

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

### Signing in with an Ibercivis account

The Ibercivis citizen science sites share one sign-in service, reached over OpenID Connect; why,
and the service itself, live in
[`Ibercivis/citsci-federation`](https://github.com/Ibercivis/citsci-federation), whose stack runs
this app next to it. Two more lines in `react/.env.development` turn it on:

```sh
VITE_IBERCIVIS_ACCOUNT_ISSUER=<the service's issuer URL>
VITE_IBERCIVIS_ACCOUNT_CLIENT_ID=<the API's client id there>
```

With both set, the login page changes:

- **"Sign in with your Ibercivis account"** appears, with a paragraph saying what it means: a
  separate Geonity account, without the projects and observations of an existing one. Anyone who
  already has an account keeps signing in with its email and password, and an address already in
  use here is refused.
- The browser goes to the service with a PKCE challenge and comes back to
  `/auth/ibercivis/callback`. That page posts the code to the API, which redeems it with its own
  secret — the API's `LOCAL-DEV.md` has the four variables it needs. The browser never holds a
  token from the service.
- The profile page shows the identifier of the Ibercivis account, under "Ibercivis account".

Without them, the button is not shown and nothing else changes.

**The web app no longer creates accounts.** The "register" link is gone and `/register` leads to
`/login`, with or without the two variables. The API's `POST /api/users/registration/` stays open,
because the mobile app still creates its accounts there.

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

**Not exercised, and not changed.** It still registers accounts through the API. Two things would
be in the way, both of them debug-only:

- `flutter/lib/config/app_config.dart` hard-codes `baseUrl` to `https://geonity.ibercivis.es`.
  There is a `PRODUCTION` `--dart-define` in that file, but `baseUrl` does not read it, so the
  switch is dead: pointing the app at a local API means editing the file, or giving `baseUrl` an
  environment hole the way `vite.config.ts` now has one.
- Android blocks cleartext HTTP by default from API 28, and
  `android/app/src/debug/AndroidManifest.xml` does not override it, so even then
  `http://10.0.2.2:8000` would be refused. That override belongs in the debug manifest, which does
  not merge into a release build.

Signing in with an Ibercivis account from the mobile app would follow the web app: start the flow
with PKCE, receive the code at the app's own scheme, and send the code and verifier to
`POST /api/users/auth/ibercivis/`. The API redeems with the single `IBERCIVIS_ACCOUNT_REDIRECT_URI`,
so it would have to accept the mobile redirect URI too, from a short allowed list.

None of this is done here, because there is no Flutter SDK on the machine this was written on and
an unverified change to a shipping mobile app is worth less than a note saying what it would be.

## Known issues

- **`npm ci` fails in `react/`** on a fresh clone: `package-lock.json` is out of step with
  `package.json` (`@emnapi/core` and `@emnapi/runtime` are missing from the lock file). `npm install`
  works. Pre-existing, and not fixed here — regenerating the lock file is a change that belongs to
  whoever maintains the dependency set.
- The web app's `vite.config.ts` warns that `__dirname` is unsupported by Vite's future native
  config loader. Pre-existing and harmless.
