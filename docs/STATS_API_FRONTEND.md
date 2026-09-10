# API de estadísticas — guía para el front

Tres endpoints, ya desplegados en producción (2026-09-10). Devuelven JSON listo para pintar: los
conteos, las series temporales y los rankings vienen calculados del servidor, el front no tiene que
agregar nada.

Base: `https://geonity.ibercivis.es/api/`

---

## Autenticación

Toda la API usa **`TokenAuthentication`**, no sesión:

```
Authorization: Token <clave>
```

| Endpoint | Quién puede |
|---|---|
| `GET /api/stats/platform/` | Solo usuarios con **`is_staff`** |
| `GET /api/stats/me/` | Cualquier usuario autenticado |
| `GET /api/project/<pk>/stats/` | **Creador y administradores** de ese proyecto |

Hoy tienen `is_staff`: `fran`, `jbarba`, `dlisbona`, `Germán`, `fran67`, `fran33`. Ojo con `dlisbona`
y `Germán`: **tienen también una cuenta personal de gmail en la plataforma que NO es staff**. Si
entran con esa, el panel les dará 403.

Errores:

| Código | Cuándo |
|---|---|
| `401` | Sin cabecera `Authorization` o token inválido |
| `403` | Autenticado pero sin permiso (usuario normal en `/platform/`, ajeno a un proyecto) |
| `404` | El proyecto no existe |
| `400` | Parámetros mal (`{"detail": "..."}`) |
| `429` | Más de 30 peticiones por minuto y usuario |

---

## Parámetros comunes

Los tres endpoints aceptan lo mismo:

| Parámetro | Valores | Por defecto |
|---|---|---|
| `from` | `YYYY-MM-DD` | 12 meses antes de `to` |
| `to` | `YYYY-MM-DD` (**exclusivo**) | ahora |
| `granularity` | `month` \| `week` | `month` |
| `refresh` | `1` \| `true` | — |

La respuesta se cachea **10 minutos**. El campo `cached` dice si viene de caché; `?refresh=1` la
salta. Para un panel normal no hace falta: si el usuario pulsa "actualizar", ahí sí.

La clave de caché lleva la versión de la forma del payload, así que cuando el backend añada o quite
campos **no os llegarán respuestas de la forma antigua** durante los 10 minutos siguientes al
despliegue. Si alguna vez veis un payload al que le falta un campo que este documento promete,
probad con `?refresh=1` y avisad.

`Accept-Language` decide el idioma de los nombres de proyecto (`es`, `en`, …).

---

## `GET /api/stats/platform/`

Métricas globales. **Es el único nivel que compara proyectos entre sí** (el bloque `top`); esa
información no aparece en los otros dos endpoints, a propósito.

```jsonc
{
  "generated_at": "2026-09-10T14:07:19.623002Z",
  "period": { "from": "2025-09-15", "to": "2026-09-10", "granularity": "month" },

  "projects": {
    "total": 38,
    "published": 6,            // ni borrador ni terminado
    "draft": 31,
    "ended": 1,
    "private": 4,
    "anonymous_enabled": 2,    // con contribución anónima por QR activada
    "public_map": 12,
    "with_observations": 31,
    "active_30d": 12,          // ojo: incluye BORRADORES, ver más abajo
    "active_30d_published": 5, // el subconjunto que además está publicado
    "abandoned": 1             // publicado y >90 días sin observaciones
  },

  "observations": {
    "total": 1492,
    "last_30d": 378,
    "anonymous": 3,
    "by_platform": { "mobile": 928, "web": 134, "unknown": 430 },
    "with_images": 925,
    "with_audio": 5
  },

  "users": { "total": 784, "active": 784, "new_30d": 136, "with_observations": 373 },
  "organizations": { "total": 12 },
  "engagement": { "memberships": 42, "invitations_pending": 29, "likes": 148 },

  "series": {
    "projects_created": [ { "period": "2025-09-01", "count": 0 }, … ],
    "projects_created_cumulative": [ … ],
    "projects_published": [ … ],
    "projects_published_cumulative": [ … ],
    "observations": [ … ],
    "observations_cumulative": [ … ],
    "users": [ … ],
    "users_cumulative": [ … ]
  },

  "series_by_platform": [
    { "period": "2026-08-01", "mobile": 332, "web": 46, "unknown": 0 }
  ],

  // Variación frente al periodo anterior de la misma duración, ya calculada
  "comparison": {
    "observations":      { "value": 378, "previous": 344, "delta_pct": 10, "direction": "up" },
    "users":             { … },
    "projects_created":  { … },
    "projects_published": { "value": 1, "previous": 0, "delta_pct": null, "direction": "up" }
  },

  "top": {
    "projects_by_observations": [
      { "id": 172, "name": "Life-Nitrazens", "observations": 621, "published": true }
    ],
    "creators_by_observations": [
      { "id": 138, "username": "Germán", "observations": 775, "projects": 2 }
    ]
  },

  "last_digest_sent_at": null,   // null si aún no ha salido ningún resumen mensual
  "cached": false
}
```

## `GET /api/stats/me/`

Lo mismo pero **solo sobre los proyectos que el usuario crea o administra**, más un desglose por
proyecto. **No trae `top`.**

```jsonc
{
  "generated_at": "…",
  "period": { … },
  "projects": { … },        // mismas claves que arriba
  "observations": { … },
  "contributors": { "registered": 31, "anonymous": 2, "total": 33, "new": 23, "recurring": 12 },
  "series": {
    "observations": [ … ],
    "observations_cumulative": [ … ],
    "contributors": [ … ],     // ver más abajo
    "by_platform": [ … ]
  },
  "comparison": { "observations": { "value": 378, "previous": 344, "delta_pct": 10, "direction": "up" } },
  "per_project": [
    {
      "id": 172,
      "name": "Life-Nitrazens",
      "published": true,
      "draft": false,
      "ended": false,
      "created_at": "2026-03-01T09:00:00Z",
      "published_at": "2026-03-05T12:00:00Z",   // null si nunca se publicó
      "observations": 621,
      "last_observation": "2026-09-09T18:22:00Z",
      "active_30d": true
    }
  ],
  "cached": false
}
```

Un usuario sin proyectos recibe **200** con `projects.total = 0` y `per_project: []`. No es un error.

## `GET /api/project/<pk>/stats/`

Un solo proyecto. **No trae `top`.**

```jsonc
{
  "generated_at": "…",
  "period": { … },
  "project": {
    "id": 172, "name": "Life-Nitrazens", "published": true, "draft": false, "ended": false,
    "created_at": "…", "published_at": "…"
  },
  "observations": { … },
  "contributors": { "registered": 31, "anonymous": 2, "total": 33, "new": 23, "recurring": 12 },
  "span": { "first_observation": "…", "last_observation": "…" },  // null si no hay ninguna
  "series": {
    "observations": [ … ],
    "observations_cumulative": [ … ],
    "contributors": [ … ],
    "by_platform": [ … ]
  },
  "comparison": { "observations": { "value": 195, "previous": 234, "delta_pct": -17, "direction": "down" } },
  "cached": false
}
```

---

## Cosas que hay que entender antes de pintar nada

**`active_30d` incluye borradores, y es intencionado.** En producción hay 12 proyectos activos pero
solo 5 publicados: **7 borradores están recogiendo datos** por QR. Si el panel enseña solo los
publicados, la plataforma parecerá mucho más muerta de lo que está. Usa `active_30d` para "actividad
real" y `active_30d_published` si necesitas el subconjunto.

**`projects_published` son PRIMERAS publicaciones.** Un proyecto puede volver a borrador y
publicarse otra vez; la fecha de publicación no se reescribe. La serie mide crecimiento, no
transiciones. Si algún día hace falta el histórico completo de idas y venidas, está en la tabla
`ProjectStatusLog`, pero hoy no se expone por API.

**`by_platform.unknown` son 430 observaciones (29%)** anteriores a que existiera el campo `platform`.
No las escondáis en un "otros" minúsculo: son casi un tercio. O se etiquetan como "sin registrar", o
se acota el gráfico a fechas posteriores.

**Las series ya vienen con los huecos rellenos a 0** y ordenadas. `period` es la fecha de inicio del
cubo (`YYYY-MM-DD`); con `granularity=week`, el lunes. Un rango vacío devuelve `[]`, no un error.

**Los acumulados arrancan de lo que había antes de `from`.** Por eso el primer punto de
`observations_cumulative` no es igual al primero de `observations`: si no, parecería que la
plataforma nació el primer día del rango pedido.

**Nunca sale ningún `anonymous_id` ni ningún email.** Los contribuidores anónimos aparecen solo como
cardinalidad, y los creadores por `username`. Es una regla del backend, no la rodeéis pidiendo esos
datos por otro sitio.

**`total` vs `active` en usuarios**: hoy coinciden (784/784) porque no hay nadie desactivado. No
asumáis que siempre será así.

---

## El correo y la API dicen lo mismo

Los correos automáticos **no llaman a la API**: son el mismo servidor y sería absurdo que se hiciera
una petición HTTP a sí mismo. Lo que comparten es la capa de cálculo (`stats/metrics.py`), así que
un número que salga distinto en el panel y en el correo es un bug, no una diferencia de diseño.

Lo que sí es distinto, a propósito:

| | API | Correo |
|---|---|---|
| Ventana | la que pidáis con `from`/`to` | desde el último envío correcto |
| Gráficos | series en crudo | barras con altura en píxeles, que es cosa del email |
| Rankings | `top` solo en plataforma | los 5 primeros |

El bloque `contributors` incluye `new` y `recurring`, los mismos que el correo enseña como
"23 nuevas · 12 repiten", para que el panel pueda decir exactamente lo mismo.

---

## Evolución: qué series hay y cuál usar

Todas aceptan `from`, `to` y `granularity`, vienen ordenadas, **con los huecos rellenos a 0** y con
el acumulado arrancando de lo que hubiera antes de `from`. Un rango vacío devuelve `[]`, no un error.

| Serie | Dónde | Qué mide |
|---|---|---|
| `observations` / `_cumulative` | los tres | volumen de observaciones |
| `users` / `_cumulative` | plataforma | altas de usuarios |
| `projects_created` / `_cumulative` | plataforma | proyectos creados |
| `projects_published` / `_cumulative` | plataforma | **primeras** publicaciones |
| `series_by_platform` | plataforma | móvil / web / sin registrar |
| `contributors` | `/me/` y proyecto | **personas distintas, nuevas vs. recurrentes** |
| `by_platform` | `/me/` y proyecto | móvil / web / sin registrar |

### `contributors` es la que de verdad cuenta la historia

La serie de observaciones no distingue un proyecto con 200 observaciones de 40 personas de otro con
200 de una sola. Esta sí:

```jsonc
{ "period": "2026-07-01", "total": 69, "registered": 69, "anonymous": 0, "new": 64, "recurring": 5 }
```

- `new`: personas cuya **primera observación de ese proyecto** cae en ese periodo.
- `recurring`: las que ya habían participado antes.
- `anonymous`: contribuciones por QR, contadas por navegador. **Solo sale la cardinalidad, nunca el
  identificador.**

Ejemplo real de Life-Nitrazens: jun 22 (22 nuevas) · jul 69 (64 nuevas, 5 repiten) · ago 38 (26
nuevas, 12 repiten) · sep 6 (2 nuevas, 4 repiten). Capta gente cada mes pero **retiene poco** — eso
no se ve en la serie de volumen, donde julio y agosto se parecen.

### `comparison`: la variación ya calculada

```jsonc
"observations": { "value": 378, "previous": 344, "delta_pct": 10, "direction": "up" }
```

`delta_pct` es **`null` cuando el periodo anterior fue 0**: no se inventa un porcentaje sobre cero.
En ese caso mostrad "sin datos del periodo anterior" y no un "+100%". `direction` es `up`, `down` o
`flat`.

---

## Campos nuevos en el proyecto

Se han añadido dos campos a `GET/PATCH /api/project/<pk>/` que el panel necesita.

### `email_monthly_stats` (booleano, escribible)

Interruptor del **informe mensual del proyecto**, que se manda al creador y a los administradores
el día 1 a las 09:00. Viene **activado por defecto**, al revés que `email_on_observation`: el
informe solo sale si el proyecto tuvo actividad, así que estar activo no genera ruido.

```http
PATCH /api/project/172/     {"email_monthly_stats": false}
```

Conviene una casilla en los ajustes del proyecto, junto a la de `email_on_observation`. Está en el
serializer de detalle y en el de "mis proyectos", **no en el listado público** — ahí no pinta nada.

Un proyecto con el flag apagado no recibe ni el informe ni el aviso de inactividad.

### `published_at` (fecha, **solo lectura**)

Fecha de la **primera** publicación del proyecto. Sirve para mostrar "publicado el X" sin tener que
pedir las estadísticas.

Dos cosas que hay que entender:

- Es **inmutable**. Un proyecto puede volver a borrador y publicarse otra vez; esta fecha sigue
  apuntando a la primera. Si se sobrescribiera, la serie `projects_published` dejaría de medir
  crecimiento.
- Es **de solo lectura por API**: mandarla en un `PATCH` no hace nada, se ignora en silencio. La
  fija el backend cuando `draft` pasa de `true` a `false`.
- Es `null` en los proyectos que nunca se han publicado.

El histórico completo de idas y venidas (publicado, despublicado, republicado, finalizado,
reabierto) está en la tabla `ProjectStatusLog`, pero **no se expone por API**. Si el panel lo
necesita, se añade.

**Aviso sobre los datos anteriores al 2026-09-10**: el `published_at` de los proyectos que ya
estaban publicados es una **estimación** — se rellenó con `created_at`, porque no había forma de
saber cuándo se publicaron de verdad. Para esos, la fecha dice "cuándo se creó", no "cuándo se
publicó".

---

## Idioma del usuario

Los correos automáticos (avisos de proyecto, resumen mensual, informe por proyecto) se mandan **en
el idioma de cada destinatario**, no en uno fijo. Ese idioma sale de `Profile.language`.

**Leerlo y cambiarlo** con el endpoint de perfil que ya existía:

```http
GET   /api/users/profile/
PATCH /api/users/profile/     {"language": "en"}
```

Devuelve 200 con el perfil actualizado. Valores admitidos: `es`, `en`, `fr`, `pt`, `it`, `de`, y
cadena vacía `""` para "sin preferencia". Cualquier otro valor da 400.

Detalles que conviene conocer:

- **El campo se siembra solo en el registro** a partir de la cabecera `Accept-Language` del alta.
  Si el navegador manda `en-GB,en;q=0.9`, el perfil nace con `en`. Por eso conviene que el registro
  mande esa cabecera.
- **Vacío no es un error**: significa "sin preferencia" y el correo cae al idioma por defecto de la
  plataforma (`es`). Los 783 usuarios anteriores a 2026-09-10 lo tienen vacío salvo los que se han
  rellenado a mano.
- **Un selector de idioma en los ajustes de la cuenta es lo suyo.** Hoy el único modo de cambiarlo
  es este PATCH; sin interfaz, el usuario depende de lo que dijera su navegador el día que se
  registró.
- El idioma de la interfaz web lo seguís gestionando vosotros; este campo es lo que el backend usa
  para los correos. Si los mantenéis en sincronía, mejor: cambiar el idioma de la web debería hacer
  este PATCH.

**Estado real de las traducciones** (2026-09-10): el catálogo inglés está completo para los correos
(149 cadenas). Los de **francés, portugués, italiano y alemán están a medias** (36-40 cadenas de
149), así que marcar a alguien como `fr` hoy le daría un correo mezclado. **No existe catálogo
neerlandés** pese a haber 11 destinatarios de Leiden en los proyectos BuurtKennis; a ellos se les ha
puesto `en`.

---

## Sugerencia de panel

Con lo que hay, un panel de staff que se lea de un vistazo sería:

1. **Cuatro cifras arriba**: observaciones totales, proyectos publicados, usuarios, activos en 30
   días. Con la variación respecto al periodo anterior si os apetece calcularla en cliente (el
   backend ya la calcula para el correo; si la queréis por API, se añade).
2. **Un gráfico de líneas** con `observations` y `observations_cumulative`, selector de rango.
3. **Barras** de `users` y `projects_created`.
4. **Un donut** de `by_platform`, con `unknown` etiquetado con honestidad.
5. **Dos tablas**: `top.projects_by_observations` y `top.creators_by_observations`.
6. **Un aviso** cuando `projects.abandoned > 0`: son proyectos publicados que llevan más de 90 días
   parados y alguien debería mirarlos.

Para el panel del creador (`/stats/me/`), lo mismo sin `top` y con la tabla `per_project` como
elemento principal, marcando los que tienen `active_30d: false`.

---

## Lo que aún no hay, por si lo pedís

- Nombres de los proyectos abandonados por API (hoy solo en el email mensual).
- El histórico de `ProjectStatusLog` (publicado / despublicado / republicado / finalizado).
- Estadísticas por pregunta del formulario, o sea la distribución de respuestas. Es lo más pedido y
  lo más caro: `Observation.data` es un JSONField con pares `{key, value}`. Está anotado como fase
  futura en `STATS_PLAN.md`.
- Export a CSV/XLSX del panel.

Preguntad antes de calcular algo en cliente: casi todo lo que falta es más barato de añadir al
serializer que de agregar en el navegador.
