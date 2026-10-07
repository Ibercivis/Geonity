# api/ — the backend lives in another repository

The Geonity backend (Django REST Framework, PostGIS) is developed and deployed from
**[`Ibercivis/citsci-api`](https://github.com/Ibercivis/citsci-api)**.

This folder used to hold an outdated copy of the backend (September 2026) that was not used; it was removed so nobody edits it by mistake.
Its history is still available in git (`git log -- api/`), and the live code is in `citsci-api`.

To work on the backend:

```bash
git clone git@github.com:Ibercivis/citsci-api.git
```

The web app (`react/`), the admin panel (`admin/`) and the mobile app (`flutter/`) talk to that API.
