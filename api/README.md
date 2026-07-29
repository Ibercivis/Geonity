# citsci-api
Citizen Science Application API

## OpenAPI (Swagger)

- UI: `/api/docs/`
- Schema: `/api/schema/`

## Campos administrativos dinámicos en Observations

Permite añadir “columnas” administrables (por proyecto) para las observaciones (p. ej. **Validado** Sí/No, **Estado**), sin cambiar el payload original de `Observation` ni los endpoints existentes de observaciones.

### Conceptos

- **ProjectObservationField**: define una columna administrativa para un proyecto (ej. `validated`, `status`).
- **ObservationFieldValue**: guarda el valor de esa columna para una observación concreta.

### Autenticación

- Para operaciones de escritura (crear/editar/borrar definiciones) y para leer/editar valores (`/admin-fields/`), usa token en cabecera:
	- `Authorization: Token <key>`
- El `GET` de definiciones (`/api/projects/{project_id}/observation-fields/`) es público (no requiere autenticación, de momento).

### Endpoints

#### 1) Definir columnas (por proyecto)

- `GET /api/projects/{project_id}/observation-fields/`
	- Lista la configuración de columnas del proyecto.

- `POST /api/projects/{project_id}/observation-fields/`
	- Crea una columna (solo creator/administradores del proyecto).
	- Ejemplos:
		- Boolean:
			- `{ "key": "validated", "label": "Validado", "field_type": "bool", "required": false, "order": 10 }`
		- Choice:
			- `{ "key": "status", "label": "Estado", "field_type": "choice", "choices": ["Enviado","Recibido","En proceso"], "order": 20 }`

- `PATCH /api/projects/{project_id}/observation-fields/{id}/`
	- Edita definición (solo creator/administradores).

- `DELETE /api/projects/{project_id}/observation-fields/{id}/`
	- Borra definición (solo creator/administradores).

#### 2) Leer/editar valores (por observación)

- `GET /api/observations/{observation_id}/admin-fields/`
	- Devuelve todas las columnas del proyecto y el valor actual (si existe) para esa observación.

- `PATCH /api/observations/{observation_id}/admin-fields/`
	- Actualiza valores (solo creator/administradores del proyecto).
	- Body:
		- `{ "values": { "validated": true, "status": "Recibido" } }`
	- Respuesta:
		- `{ "updated": ["validated", "status"] }`

#### 3) Leer valores en bloque (por proyecto)

- `GET /api/projects/{project_id}/observation-admin-values/`
	- Devuelve las definiciones de columnas del proyecto (`fields`) y, para cada observación del proyecto, un mapa `values` por `key`.
	- Requiere auth y ser creator/administrador del proyecto.
