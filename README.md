# Geonity

Plataforma de ciencia ciudadana de [Ibercivis](https://ibercivis.es): proyectos con formularios de observación, mapas, organizaciones y estadísticas.
Sitio: <https://geonity.ibercivis.es>

## Qué hay en este repositorio

| Carpeta | Qué es | Tecnología |
|---|---|---|
| [`react/`](react/) | La web de Geonity | React, Vite, TypeScript, Tailwind, shadcn/ui |
| [`admin/`](admin/) | Panel de administración de proyectos y observaciones | React, Vite, TypeScript |
| [`flutter/`](flutter/) | App móvil (Android e iOS) | Flutter |
| [`api/`](api/) | Solo un `README` que apunta al backend: **el backend vive en otro repositorio** | — |
| [`docs/`](docs/) | Notas técnicas públicas | Markdown |

### El backend está en otro repositorio
La API (Django / Django REST Framework / PostGIS) se desarrolla y se despliega desde
**[`Ibercivis/citsci-api`](https://github.com/Ibercivis/citsci-api)**. La carpeta `api/` de aquí solo contiene un `README` que lo recuerda
(hasta el 2026-10-07 guardaba una copia antigua que no se usaba; su historial sigue en git).

## Cómo trabajar

Cada aplicación se instala y se ejecuta de forma independiente:

```bash
# Web
cd react && npm ci && npm run dev          # copia .env.example a .env.development y ajústalo

# Panel de administración
cd admin && npm ci && npm run dev          # copia .env.example a .env y ajústalo

# App móvil
cd flutter && flutter pub get && flutter run   # necesita lib/config/secrets.dart (ver secrets.example.dart)
```

Los ficheros con claves o configuración local (`.env*`, `lib/config/secrets.dart`, `android/key.properties`…) **no se versionan**: usa los `*.example` como plantilla.

## Versiones y despliegue

- **Una sola rama principal (`main`)**; los cambios entran por *pull request* desde ramas de trabajo.
- Los despliegues se hacen con scripts que **se niegan a desplegar con cambios sin commitear**, dejan un `version.json` en el sitio y una etiqueta de git:
  - Web: `react/deploy.sh` → etiqueta `deploy/react/AAAA-MM-DD-HHMM`
  - Admin: `admin/scripts/deploy.sh` → etiqueta `admin/deploy-AAAA-MM-DD-HHMM`
  - App móvil: etiqueta `flutter/vX.Y.Z+N` por cada versión publicada
- Ambos scripts de despliegue admiten `--dry-run` (construyen y enseñan qué cambiaría, sin tocar el servidor).
- Para ver qué hay desplegado en la web: `https://geonity.ibercivis.es/version.json` (disponible a partir del primer despliegue hecho con el script nuevo).

## Licencia
Ver [`LICENSE`](LICENSE).
