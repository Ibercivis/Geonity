# Contribución anónima por QR — Plan API (Django)

Objetivo: un proyecto puede activar el flag **contribución anónima**. Se genera un QR con una URL
pública; quien lo escanea puede enviar observaciones a ese proyecto **sin cuenta**. Las observaciones
quedan asociadas a un identificador anónimo del navegador (`anonymous_id`, UUID generado en cliente).

Contraparte front: `react/ANONYMOUS_CONTRIBUTION_PLAN.md`.

---

## Estado actual (investigado 2026-09-07)

Lo que ya encaja:
- `Observation.creator` ya es `null=True` (`markers/models.py:17`). `__str__` muestra "deleted user" y
  `markers/tasks.py:49` guarda `if observation.creator`. Una observación sin creador no rompe nada.
- La participación **no requiere membresía** en proyectos públicos: `ObservationListCreate.create` solo
  comprueba `ProjectMembership` si `project.is_private` (`markers/api/views.py:99`).
- Precedente de endpoint público por flag: `public_map` → `PublicMapView` (`markers/api/views.py:963`)
  y `PublicObservationDetailView` (`:1115`). Construyen a mano meta del proyecto + preguntas para
  consumidores sin sesión. Es la plantilla a copiar.
- Precedente de token firmado: `django.core.signing` en `users/api/views.py:104-140`.

Lo que bloquea hoy:
- `ObservationListCreate.get_permissions` devuelve `[IsAuthenticated(), HasClientApiKey()]` en POST
  (`markers/api/views.py:70-73`). Línea 158 fija `'creator': request.user.id`.
- Todo `field_forms` es `IsAuthenticated` (`field_forms/api/views.py:11,23,33,45,62`). Un anónimo no
  puede leer la definición del formulario.
- **No hay throttling** en toda la API (ningún `DEFAULT_THROTTLE_*` ni `throttle_classes`).
- `Project` se identifica solo por PK entero. No hay slug ni UUID. La URL del QR sería adivinable.
- `HasClientApiKey` (`markers/api/permissions.py`) compara con `CLIENT_API_KEY_WEB/MOBILE`, pero la
  clave web viaja en el bundle público (`VITE_OBSERVATIONS_API_KEY`). No es un secreto real.
- No hay `django-cors-headers`; el cruce geonity.ibercivis.es → api.ibercivis.es se resuelve en nginx.
  Mientras la página anónima viva en el react actual, no hay que tocar CORS.
- No hay ninguna librería QR en `requirements.txt`. No hace falta: el QR se genera en cliente.

---

## Fase 1 — Modelo y migraciones
- [ ] `Project.anonymous_contribution = BooleanField(default=False)` junto a `public_map`
      (`project/models.py:51`).
- [ ] `Project.anonymous_token = UUIDField(default=uuid.uuid4, unique=True, editable=False)`.
      Va en la URL del QR en vez del PK. Regenerarlo invalida los QRs impresos.
- [ ] `Observation.anonymous_id = UUIDField(null=True, blank=True, db_index=True)`.
- [ ] Opcional: `Observation.anonymous_source = CharField(max_length=64, null=True, blank=True)`
      para el parámetro `?src=` del QR (varios carteles por proyecto).
- [ ] Migraciones: `project/0041_*` y `markers/0013_*`. La migración de `anonymous_token` necesita
      un `RunPython` para poblar UUIDs en filas existentes antes de añadir `unique=True`.

## Fase 2 — Serializers de proyecto
- [ ] Añadir `anonymous_contribution` y `anonymous_token` (read-only) a
      `ProjectSerializerCreateUpdate.Meta.fields` (`project/api/serializers.py:103`) y a
      `ProjectListSerializer.Meta.fields` (`:404`).
- [ ] Validación: rechazar `anonymous_contribution=True` si `is_private=True`. Primera iteración:
      no mezclamos anónimo con privado.
- [ ] Endpoint `POST /api/project/<pk>/regenerate-anonymous-token/` con `IsCreatorOrAdminOrReadOnly`
      (reusar la clase de `project/api/views.py:46`). Devuelve `{ "anonymous_token": "<uuid>" }`.
- [ ] **`anonymous_token` solo visible para creator/admin.** `GET /api/project/` es legible sin sesión
      (`IsAuthenticatedOrReadOnly`); si el token va en el listado público deja de ser "no adivinable".
      Usar un `SerializerMethodField` que devuelva `None` salvo `is_creator or is_admin`.
      `anonymous_contribution` sí puede ser público.

## Fase 3 — Endpoints públicos
Prefijo `/api/anonymous/<uuid:token>/`. Ambos `permission_classes = [AllowAny]`,
`authentication_classes = []`. Devuelven **404** (no 403) si el proyecto no existe, no tiene el flag
activo, está `ended` o es `draft`. Así no se filtra la existencia del proyecto.

- [ ] `GET /api/anonymous/<token>/?raw=true` → `{ id, name, description, cover, organizations:
      [{id, principalName, logo}], field_form (id), questions: [...], post_observation_message,
      show_post_message }`. Con `?raw=true` devolver los dicts multilingües tal cual (como hace
      `GET /field_forms/<id>/?raw=true`): el front los resuelve en cliente y así el selector de idioma
      no refetchea. Sin `raw`, resolver por `Accept-Language`. Copiar estructura de `PublicMapView`.
- [ ] `POST /api/anonymous/<token>/observations/` → `parser_classes = (MultiPartParser, FormParser)`.
      Mismo body que `POST /observations/` (`field_form` implícito por el token, `geoposition`,
      `timestamp`, `data`, ficheros `image_<qid>` / `audio_<qid>`).
  - Cabecera obligatoria `X-Anonymous-Id: <uuid>`. Si falta o no es UUID válido → 400.
  - `creator=None`, `anonymous_id` de la cabecera, `platform='web'`,
    `anonymous_source` del campo multipart `source` (el front ya lo manda saneado, ≤64 chars; volver a
    truncar y limpiar en servidor). Respuesta mínima `{ id }`.
  - Respetar `allowed_platforms`: si el proyecto es solo `mobile`, rechazar (la contribución
    anónima cuenta como `web`).
- [ ] Refactorizar el cuerpo de `ObservationListCreate.create` (`markers/api/views.py:75-198`) a una
      función `create_observation(project, field_form, request_data, files, *, creator, anonymous_id,
      platform, source)` compartida por la vista autenticada y la anónima. **No** relajar la vista
      autenticada: `POST /observations/` sigue exigiendo login + API key.
- [ ] Opcional: `GET /api/anonymous/<token>/observations/mine/` filtrando por `X-Anonymous-Id`, para
      que el navegador vea lo que ha enviado. Solo lectura; sin edición ni borrado anónimo.

## Fase 4 — Throttling (mismo PR que la Fase 3, no negociable)
- [ ] Añadir a `REST_FRAMEWORK` en `settings.py`: `DEFAULT_THROTTLE_CLASSES` vacío (para no afectar al
      resto) y `DEFAULT_THROTTLE_RATES` con scopes `anon_form` y `anon_submit`.
- [ ] Throttle por IP (`AnonRateThrottle` con scope) en ambos endpoints. Orientativo:
      `anon_form: 60/min`, `anon_submit: 20/hour` por IP.
- [ ] Throttle adicional por `anonymous_id` en el POST (subclase de `SimpleRateThrottle` que usa la
      cabecera como `ident`). Orientativo: `10/hour`.
- [ ] Límite de tamaño de ficheros en el POST anónimo (p. ej. 10 MB por imagen, 3 imágenes).
- [ ] Throttle funciona sobre la caché Redis ya configurada; comprobar que el `cache` por defecto
      es el que usa DRF.
- [ ] Futuro si hay abuso: Cloudflare Turnstile en el POST. No de salida.

## Fase 5 — Efectos colaterales de `creator=None`
- [ ] `ObservationRetrieveUpdateDestroy.update/delete` comparan `observation.creator != request.user`
      (`markers/api/views.py:218,227`). Con `None` devuelven 403 para todos salvo admin. Es lo deseado;
      confirmar que el admin del proyecto sí puede borrar anónimas.
- [ ] `ObservationWithPublicAdminSerializer.get_is_mine` (`serializers.py:247-251`) es por usuario.
      Devolver `False` para anónimas. Añadir `is_anonymous: bool` y `anonymous_id` (solo los 8 primeros
      chars, o null) a los serializers de observación. El front (`ObservationPanel`) ya los pinta.
- [ ] `MyProjectsView` (`project/api/views.py:212-229`) infiere participación por `Observation.creator`.
      Las anónimas no aparecen ahí. Correcto.
- [ ] Descarga de observaciones (`project/<id>/download_observations/`): columna `creator` vacía y
      columna nueva `anonymous_id` (truncado a 8 chars) + `anonymous_source`.
- [ ] Email `email_on_observation` (`markers/tasks.py`): el texto debe decir "Contribución anónima"
      en vez del nombre de usuario.
- [ ] Señales de caché (`markers/signals.py:13-24`): ya se disparan por `post_save` de Observation,
      no dependen del creador. Verificar.
- [x] App Flutter: **no requiere cambios**. `flutter/lib/models/observation.dart` declara `userId`
      como `int?` y lee `json['creator']` tolerando null; `Project.fromJson` ignora claves nuevas.
      Verificado 2026-09-07. Opcional a futuro: mostrar "Anónimo" en vez de hueco en el autor.

## Fase 6 — Reclamar observaciones (iteración posterior, no en el primer PR)
- [ ] `POST /api/observations/claim/` autenticado, body `{anonymous_id}`: asigna `creator=request.user`
      a las observaciones con ese `anonymous_id` y `creator IS NULL`. Idempotente.
- [ ] Rate limit fuerte y registrar en log; un `anonymous_id` ajeno solo se puede adivinar si es
      público, y no lo es.

## Fase 7 — Tests
- [ ] 404 si flag apagado / proyecto `ended` / `draft` / token inexistente.
- [ ] POST sin `X-Anonymous-Id` → 400. Con UUID inválido → 400.
- [ ] POST correcto crea observación con `creator=None`, `anonymous_id` y `platform='web'`.
- [ ] `allowed_platforms='mobile'` → rechazado.
- [ ] Validación de `data` (mandatory, CHOICE, MCHOICE) idéntica a la vista autenticada (comparte
      código, pero un test de regresión).
- [ ] Throttling: N+1 peticiones → 429.
- [ ] `is_private=True` + `anonymous_contribution=True` → 400 en PATCH del proyecto.
- [ ] Regenerar token: el token viejo pasa a 404.

---

## Decisiones tomadas
- **QR generado en cliente**, la API solo expone `anonymous_token`. Sin librería QR en Django.
- **Vistas nuevas**, no relajar `POST /observations/`. Superficie pública acotada a dos endpoints.
- **404 en vez de 403** cuando el flag está apagado.
- **Anónimo + privado no se permite** en la primera versión. Si algún día hace falta, el token del QR
  actúa como la contraseña del proyecto.
- **Sin edición ni borrado anónimo**. Solo alta y, opcionalmente, lectura de lo propio.
- **No guardar IP** junto a la observación. El throttle usa la IP solo en caché con TTL corto.

## Privacidad
`anonymous_id` es un pseudónimo persistente: técnicamente dato personal (RGPD), riesgo mínimo si no
se guarda nada más junto a él. Hay que mencionarlo en la política de privacidad y en un aviso corto
en la landing del QR. No requiere banner de consentimiento (estrictamente necesario para el servicio).

## Estado (2026-09-07)
Front implementado (ver `react/ANONYMOUS_CONTRIBUTION_PLAN.md`, sección "Implementado").

API **implementada y verificada en producción** (proyecto 169), pero **ese código no está en este repo**:
`git status` en `api/` está limpio. Hay que traer los cambios del servidor a `api/` antes de que vuelva a
divergir (mismo problema que el commit de rescate b704607).

Diferencias respecto a lo planificado, ya asumidas por el front:
- Respuesta del GET anidada (`project` + `field_form.questions`), organizaciones con `name`.
- `?raw=true` solo devuelve dict en `choices[].label`; el resto se resuelve por `Accept-Language`.
- `geoposition` en WKT.
- `draft` → 200 (antes 404) para poder probar el QR antes de publicar. Decidir si se mantiene.
- Existe además `GET /api/anonymous/<token>/observations/mine/`.
- `anonymous_id` no se expone en las observaciones (solo `is_anonymous`).

Pendiente en la API:
- [ ] **`anonymous_token` visible solo para creador/admin** (`SerializerMethodField`, null para el resto).
      Hoy sale en `GET /api/project/` sin autenticar y anula la premisa del token no adivinable.
- [ ] Traer el código del servidor al repo (`api/`) con sus migraciones y tests.
- [ ] Decidir `draft` → 200 vs 404.

## Estimación
~1 día: modelo + migraciones + dos vistas + throttling + tests. La Fase 6 aparte.
