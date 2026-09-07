# Contribución anónima por QR — Plan React

Objetivo: un proyecto con el flag **contribución anónima** activo muestra en su configuración un QR.
Escanearlo abre una página móvil en esta misma web donde cualquier persona envía observaciones a ese
proyecto **sin cuenta**. Las observaciones se asocian a un `anonymous_id` (UUID generado en el
navegador y guardado en `localStorage`).

Contraparte backend: `api/ANONYMOUS_CONTRIBUTION_PLAN.md`. Los endpoints que se asumen aquí son:
- `GET  /api/anonymous/<token>/` → meta del proyecto + preguntas resueltas por `Accept-Language`
- `POST /api/anonymous/<token>/observations/` → multipart, cabecera `X-Anonymous-Id`
- `POST /api/project/<pk>/regenerate-anonymous-token/` (autenticado, admin)
- Campos nuevos en `Project`: `anonymous_contribution` (bool), `anonymous_token` (uuid, read-only)

---

## Decisión: misma web, no un sitio nuevo

Se hace en `react/`. Razones:
- El formulario dinámico completo ya existe en `src/pages/AddObservationPage.tsx` (tipos STR, NUM,
  DATE, BOOL, CHOICE, MCHOICE, IMG, FILE, QR/BARCODE, selector de ubicación con mapa, recorte de
  imagen, lector de códigos con `@zxing/browser`). Un sitio aparte lo duplicaría.
- Ya existe el patrón de ruta pública fuera de `RequireAuth`: `/map/:id` → `PublicMapPage`, con
  `fetch` directo a la API (`src/pages/PublicMapPage.tsx:195,245,259`).
- Mismo origen que hoy (geonity.ibercivis.es → api.ibercivis.es), el cruce ya está resuelto en nginx.
  Un dominio nuevo obliga a tocar CORS, `ALLOWED_HOSTS` y despliegue.
- Conversión natural: el anónimo está en el mismo sitio donde puede registrarse y luego reclamar sus
  observaciones.
- i18n (6 idiomas), tema, componentes shadcn y pipeline de deploy ya existen.

Todo lo demás sigue igual: mismo login, mismas rutas protegidas. Solo se añade **una ruta pública
nueva**. Las rutas actuales no se abren.

Cuándo replantearlo: si algún día se quiere PWA instalable con captura offline (service worker + cola
de envíos). Aun así, empezar aquí y separar cuando duela.

## Estado actual (investigado 2026-09-07)

- Router: `src/router.tsx`, `createBrowserRouter`, react-router-dom v7. `RequireAuth` lee `token` del
  store zustand (`src/store/auth.ts`) y redirige a `/login`.
- Cliente HTTP: singleton axios en `src/lib/axios.ts`. Interceptor de request añade
  `Authorization: Token <key>` desde `localStorage.auth_token` y `Accept-Language`. Interceptor de
  response: **cualquier 401 hace logout y redirige a `/login`**, el resto de errores lanza toast.
  ⚠️ El flujo anónimo NO puede usar esta instancia tal cual.
- `AddObservationPage.tsx` (744 líneas) contiene, sin extraer:
  - `ObservationField` (l.667), `normalizeChoices` (354), `SingleChoiceField` (411),
    `MultiChoiceField` (471), `ImageField` (552), `BarcodeScanner` (586), `CoordinateInputs` (278),
    `AnswerTypeBadge` (389).
  - Layout móvil propio vía `useIsMobile()` (`src/hooks/use-is-mobile.ts`, `max-width: 767px`):
    Tabs `[Form | Map]` con `forceMount`, auto-switch a Form al elegir ubicación, footer sticky de
    envío (l.227-250).
  - Envío: `projectsApi.createObservation` → `POST /observations/` con `FormData` (`field_form`,
    `geoposition` GeoJSON Point como string, `timestamp`, `data` JSON `[{key,value}]`,
    `image_<qid>` files) y cabecera `X-Api-Key` (`src/api/projects.ts:125`).
- Tipos: `ObservationQuestion`, `FieldForm`, `AnswerType` en `src/types/index.ts`. Labels
  localizados con `resolveLocalized` (`src/lib/utils.ts`).
- Configuración de proyecto: `src/pages/ProjectFormPage.tsx`. `FormState` ~l.111, `emptyForm()`
  ~l.134, hidratación ~l.301, import JSON ~l.226, switches ~l.834-960, submit ~l.364-412 con **dos
  caminos** (multipart si hay cover, JSON si no). Bloque de "mapa público" con copia de URL, endpoint
  e iframe en l.865-900: es el precedente exacto para el bloque del QR.
- Responsive: `RESPONSIVE_PLAN.md` con 10 fases completadas, mobile-first, breakpoint `md`. Pendiente
  el QA manual en dispositivo real.
- No hay librería de **generación** de QR. `@zxing/browser` solo lee.
- El admin (`admin/`) es solo lectura de flags de proyecto: no hay que tocarlo salvo mostrar
  "Anónimo" en listados de observaciones.

---

## Fase 1 — Extraer el formulario a componentes compartidos
- [x] Crear `src/components/observation-form/` y mover desde `AddObservationPage.tsx`:
      `ObservationField`, `SingleChoiceField`, `MultiChoiceField`, `ImageField`, `BarcodeScanner`,
      `CoordinateInputs`, `AnswerTypeBadge`, `normalizeChoices`.
- [x] Extraer el contenedor con estado (respuestas, ubicación, validación de mandatory, construcción
      del `FormData`) a `ObservationForm` con props: `questions`, `onSubmit(formData)`,
      `isSubmitting`, `postMessage?`. La página autenticada y la anónima lo usan igual.
- [x] Extraer el layout móvil Tabs `[Form | Map]` a `ObservationFormLayout` (o dejarlo dentro de
      `ObservationForm`, decidir al refactorizar).
- [x] `AddObservationPage.tsx` pasa a ser: carga de proyecto + field form, y `<ObservationForm>`.
      Sin cambio de comportamiento. Este paso se puede mergear solo.

## Fase 2 — Cliente HTTP anónimo
- [x] `src/lib/anonymous-http.ts`: `fetch` o instancia axios **separada** sin interceptor de 401, sin
      leer `auth_token`. Añade `Accept-Language` (reusar la lógica de `src/lib/axios.ts`) y
      `X-Anonymous-Id`.
- [x] `src/lib/anonymous-id.ts`: `getAnonymousId()` → lee `localStorage.geonity_anonymous_id`; si no
      existe, `crypto.randomUUID()` y lo guarda. Try/catch: si el storage falla (incógnito estricto),
      generar uno por sesión en memoria y avisar en UI de que no se recordará.
- [x] `src/api/anonymous.ts`: `getProject(token)`, `createObservation(token, formData, source?)`.
- [x] Manejo de errores propio: 404 → pantalla "Este proyecto no acepta contribuciones anónimas";
      429 → "Demasiados envíos, espera un momento"; 400 → mostrar errores de validación del server.

## Fase 3 — Ruta y página pública
- [x] Ruta `/contribute/:token` en `src/router.tsx`, **fuera de `RequireAuth` y fuera de
      `AppLayout`** (como `/map/:id`). Cargar con `React.lazy` para que su chunk no arrastre Tiptap,
      dnd-kit ni el panel de proyectos.
- [x] `src/pages/ContributePage.tsx` con shell mínima móvil (sin navbar, sin footer). Estados:
  - **Landing**: cover, nombre, descripción corta, organización, número de preguntas, botón
    "Participar". Aviso corto de privacidad ("Guardamos un identificador anónimo en este navegador").
    Enlace discreto "¿Tienes cuenta? Inicia sesión" → `/login?next=/projects/<id>/observations/new`.
  - **Formulario**: `<ObservationForm>` de la Fase 1 con el layout móvil.
  - **Confirmación**: `post_observation_message` del proyecto si `show_post_message`, botón
    "Enviar otra", botón "Ver mis contribuciones" (si se implementa el endpoint `mine`).
- [x] Leer `?src=` de la URL y pasarlo al POST como `source`. Persistirlo en `sessionStorage` para
      que sobreviva a la navegación interna landing → formulario.
- [x] Selector de idioma visible (reusar el de `PublicMapPage`).
- [x] `<title>` y meta OG con nombre del proyecto para que el enlace se vea bien al compartirlo.

## Fase 4 — Configuración del proyecto y QR
- [x] Dependencia: `qrcode.react` (SVG, sin canvas, ~10 KB). Alternativa: `qr-code-styling` si se
      quiere logo en el centro. Empezar con `qrcode.react`.
- [x] `FormState`: añadir `anonymousContribution: boolean`. Actualizar `emptyForm()`, hidratación,
      import JSON, y **los dos caminos de submit** (`fd.append('anonymous_contribution', ...)` y el
      objeto JSON).
- [x] Switch "Contribución anónima" junto a "Mapa público" (~l.834-960). Deshabilitado con tooltip si
      `isPrivate` está activo (el backend también lo rechaza).
- [x] Bloque bajo el switch, visible solo si está activo y el proyecto ya existe (necesita
      `anonymous_token` del server):
  - QR renderizado con la URL `${window.location.origin}/contribute/${anonymous_token}`.
  - Campo de URL con botón copiar (reusar el patrón del mapa público).
  - Botón "Descargar PNG" (rasterizar el SVG a canvas a 1024px) y "Descargar SVG" para imprimir.
  - Campo opcional "Etiqueta del cartel" que añade `?src=<slug>` a la URL y al QR. Permite imprimir
    varios QRs por proyecto.
  - Botón "Regenerar enlace" con confirmación ("Los QR impresos dejarán de funcionar") →
    `POST /project/<pk>/regenerate-anonymous-token/`, refresca el QR.
- [x] Tipos: `Project` en `src/types/index.ts` con `anonymous_contribution` y `anonymous_token`.

## Fase 5 — Observaciones anónimas en el resto de la web
- [x] `ObservationPanel` y listados: si `creator` es null e `is_anonymous`, mostrar "Anónimo · a3f9"
      (primeros 4-8 chars del `anonymous_id` si el server los expone) con icono. Sin enlace a perfil.
- [ ] `ProjectDetailPage`: contador o filtro "anónimas / registradas" si el server lo devuelve.
      Opcional.
- [x] Ocultar acciones de editar/borrar sobre observaciones anónimas salvo para admin del proyecto.

## Fase 6 — Reclamar observaciones (iteración posterior)
- [ ] Tras login o registro, si `localStorage.geonity_anonymous_id` existe y hay observaciones
      asociadas, mostrar un aviso "Tienes N contribuciones anónimas desde este navegador, ¿quieres
      asociarlas a tu cuenta?" → `POST /observations/claim/`. Borrar el id local al reclamar.

## Fase 7 — i18n
- [x] Nuevas claves en los 6 locales (`public/locales/*/`): landing, aviso privacidad, errores 404/429,
      textos del bloque QR, confirmación de regenerar token.

## Fase 8 — QA en dispositivo real (obligatorio antes de imprimir carteles)
- [ ] iOS Safari y Android Chrome: escanear QR con la cámara nativa, abrir la URL.
- [ ] Permiso de geolocalización y fallback manual con `CoordinateInputs`.
- [ ] Captura de foto con cámara (input `capture="environment"`) y desde galería.
- [ ] Lector de código de barras (`BarcodeScanner`) en preguntas tipo QR.
- [ ] Envío con red lenta: estado de carga, doble tap en enviar no duplica.
- [ ] Persistencia de `anonymous_id` tras cerrar el navegador. Nota: Safari lo purga tras 7 días sin
      visitar el sitio; asumido.
- [ ] Incógnito: el flujo funciona aunque el id no persista.
- [ ] Lighthouse móvil de `/contribute/:token`: comprobar que el chunk no incluye Tiptap ni dnd-kit.

---

## Notas sobre el `anonymous_id`
- No es un identificador de dispositivo real; en web no existe. Es un id de almacenamiento del
  navegador. Sirve para agrupar, limitar abusos y dar continuidad. No sirve como identidad fuerte.
- Se pierde al borrar datos, en incógnito, o en otro navegador del mismo móvil. Aceptable para uso
  puntual en campo.
- RGPD: pseudónimo persistente = dato personal de riesgo mínimo. Mencionar en política de privacidad
  y aviso corto en la landing. Sin banner de consentimiento.

## Implementado (2026-09-07)

Fases 1-5 y 7 hechas. `npm run build` (tsc + vite) OK; lint sin errores nuevos respecto a HEAD.

Ficheros nuevos:
- `src/components/observation-form/{fields.tsx, normalize-choices.ts, build-form-data.ts, ObservationForm.tsx}`
- `src/components/project/AnonymousQrBlock.tsx` (QR, copiar, PNG/SVG, etiqueta `?src=`, regenerar token)
- `src/components/shared/LanguagePicker.tsx`
- `src/pages/ContributePage.tsx` + `src/pages/ContributePageLazy.tsx` (wrapper `React.lazy` + `Suspense`)
- `src/api/anonymous.ts` (fetch propio, `AnonymousApiError`), `src/lib/anonymous-id.ts`

Ficheros tocados: `router.tsx`, `pages/AddObservationPage.tsx` (ahora ~100 líneas), `pages/ProjectFormPage.tsx`,
`api/projects.ts` (`regenerateAnonymousToken`), `components/map/ObservationPanel.tsx` (badge "Anónimo"),
`types/index.ts`, `lib/i18n.ts`, `package.json` (`qrcode.react@^4`).

Contrato real verificado contra producción el 2026-09-07 (proyecto 169). El front lo consume vía
`normalizeAnonymousProject()` en `src/api/anonymous.ts`, que acepta tanto esta forma anidada como una plana:
- `GET /api/anonymous/<token>/?raw=true` → `{ project: { id, name, description, cover, organizations:
  [{id, name, logo}], post_observation_message, show_post_message, allowed_platforms }, field_form: { id,
  project, questions: [...] } }`. `name`, `description`, `question_text` y `post_observation_message` llegan
  **ya resueltos** por `Accept-Language`; `?raw=true` solo afecta a `choices[].label` (dict, normalmente con
  clave `default`). Por eso la query lleva `lang` en la key y refetchea al cambiar idioma.
- `POST /api/anonymous/<token>/observations/`: multipart con `data`, `timestamp`, `geoposition` en **WKT**
  `POINT (lon lat)` (el cliente anónimo convierte el GeoJSON del builder), `image_<qid>`, `audio_<qid>`,
  `source` opcional (o `?src=`), ≤64 chars. Cabecera `X-Anonymous-Id` obligatoria (400 `{error}` si falta).
  Máx. 3 imágenes y 10 MB por fichero. 201 con la observación (`creator: null`, `is_anonymous: true`;
  `anonymous_id` no se expone a propósito).
- `GET /api/anonymous/<token>/observations/mine/` (filtra por `X-Anonymous-Id`). Aún sin usar en el front.
- `POST /api/project/<pk>/regenerate-anonymous-token/` → `{ anonymous_token }`. 401 sin sesión, 403 si no
  es creador/admin.
- `Project` expone `anonymous_contribution` y `anonymous_token` en ambos serializers.
  ⚠️ A fecha de hoy `anonymous_token` es **visible para cualquiera** en `GET /api/project/`; pendiente
  restringirlo a creador/admin en la API antes de imprimir carteles.
- Errores: 404 `{detail}` si flag apagado, `ended`, privado o token inexistente; 404 HTML si el token no
  es UUID (el cliente lo trata igual); **`draft` devuelve 200** (cambiado para poder probar antes de publicar).
- Throttling: `anon_form` 60/min por IP (GET y `/mine/`), `anon_submit` 20/h por IP y `anon_submit_id`
  10/h por `X-Anonymous-Id` (POST). 429 con `{detail}`.

Ajustes de UX tras la primera prueba en producción (2026-09-07):
- `ObservationForm` acepta `mobileLayout="stacked"` (mapa arriba a 38dvh, formulario debajo) y `autoLocate`
  (geolocalización al montar, silenciosa si se deniega). La página anónima usa ambos; la autenticada sigue
  con pestañas. Son props, se pueden activar también en `AddObservationPage` si se quiere.
- `ImageField` ahora tiene dos botones, "Hacer foto" (`capture="environment"`, abre la cámara trasera) y
  "Galería", con previsualización y quitar. Guarda un `File` vía `Controller`; el builder acepta `File`
  o `FileList`. Afecta también al formulario autenticado.

Nota de bundle: el chunk `ObservationForm` pesa ~980 KB min (≈290 KB gzip) porque arrastra `@zxing`
(lector de códigos) y los primitives de UI. `ContributePage` en sí son ~10 KB. Posible mejora futura:
cargar `BarcodeScanner` con `React.lazy` solo cuando el formulario tenga preguntas tipo QR.

## Estimación
2-3 días: Fase 1 (refactor, ~medio día), Fases 2-4 (~1.5 días), Fases 5, 7 y 8 (~medio día).
Fase 6 aparte.
