# api/ — el backend vive en otro repositorio

El backend de Geonity (Django REST Framework, PostGIS) se desarrolla y se despliega desde
**[`Ibercivis/citsci-api`](https://github.com/Ibercivis/citsci-api)**.

Esta carpeta contenía una copia antigua del backend (septiembre de 2026) que quedó desfasada y **no se usaba**; se ha retirado para evitar editarla por error.
Su historial sigue disponible en git (`git log -- api/`), y el código vivo está en `citsci-api`.

Para trabajar en el backend:

```bash
git clone git@github.com:Ibercivis/citsci-api.git
```

La web (`react/`), el panel de administración (`admin/`) y la app móvil (`flutter/`) hablan con ese API.
