# Plan de migración a shadcn

## Objetivo

Dejar la app con una UI consistente basada en primitives de [src/components/ui](src/components/ui), con composición por features, hooks de dominio y un entrypoint mínimo.

---

## Revisión actual

### Estado general

- [x] La app activa ya vive en [src/features](src/features)
- [x] El entrypoint real ya apunta a [src/features/app/AppShell.tsx](src/features/app/AppShell.tsx)
- [x] No hay errores de editor en [src](src)
- [x] La capa API está separada en [src/lib/api](src/lib/api)
- [x] Existen tipos compartidos en [src/types](src/types)
- [x] `useObservations()` ya existe en [src/features/observations/hooks/useObservations.ts](src/features/observations/hooks/useObservations.ts)
- [x] Login y modal de columnas ya usan `react-hook-form` + `zod`

### Hallazgos pendientes

- [x] [src/App.tsx](src/App.tsx) ya quedó reducido a un reexport mínimo
- [x] El código legacy sin uso en [src/components/app](src/components/app) ya fue eliminado
- [x] Los restos visuales principales en [src/features/app/AppShell.tsx](src/features/app/AppShell.tsx) ya fueron sustituidos
- [x] Los restos visuales secundarios en [src/features/bulk-import/components/BulkImportDialog.tsx](src/features/bulk-import/components/BulkImportDialog.tsx) ya fueron sustituidos
- [ ] Queda una pasada de pulido de tipos y validación final para cerrar la migración

---

## Qué ya está resuelto

### UI y estructura

- [x] Selector de proyecto migrado en [src/features/projects/components/AppHeader.tsx](src/features/projects/components/AppHeader.tsx)
- [x] Tabla principal migrada en [src/features/observations/components/ObservationsTable.tsx](src/features/observations/components/ObservationsTable.tsx)
- [x] Importación masiva migrada en [src/features/bulk-import/components/BulkImportDialog.tsx](src/features/bulk-import/components/BulkImportDialog.tsx)
- [x] Modal de columnas migrado en [src/features/project-fields/components/ProjectObservationFieldModal.tsx](src/features/project-fields/components/ProjectObservationFieldModal.tsx)
- [x] Login migrado en [src/features/auth/components/LoginForm.tsx](src/features/auth/components/LoginForm.tsx)
- [x] Feedback visual unificado con `Alert`, `Toast`, `Progress`, `Skeleton`, `Checkbox`

### Arquitectura

- [x] `useAuth()` en [src/features/auth/hooks/useAuth.ts](src/features/auth/hooks/useAuth.ts)
- [x] `useProjects()` en [src/features/projects/hooks/useProjects.ts](src/features/projects/hooks/useProjects.ts)
- [x] `useObservations()` en [src/features/observations/hooks/useObservations.ts](src/features/observations/hooks/useObservations.ts)
- [x] `useBulkImport()` en [src/features/bulk-import/hooks/useBulkImport.ts](src/features/bulk-import/hooks/useBulkImport.ts)
- [x] `useProjectObservationFields()` en [src/features/project-fields/hooks/useProjectObservationFields.ts](src/features/project-fields/hooks/useProjectObservationFields.ts)
- [x] `useImagePreview()` en [src/features/observations/hooks/useImagePreview.ts](src/features/observations/hooks/useImagePreview.ts)

### Tipos y API

- [x] Tipos compartidos creados en [src/types/project.ts](src/types/project.ts)
- [x] Tipos compartidos creados en [src/types/observation.ts](src/types/observation.ts)
- [x] Tipos compartidos creados en [src/types/projectObservationField.ts](src/types/projectObservationField.ts)
- [x] Tipos compartidos creados en [src/types/bulkImport.ts](src/types/bulkImport.ts)
- [x] Tipos compartidos creados en [src/types/api.ts](src/types/api.ts)
- [x] Acceso a red centralizado en [src/lib/api](src/lib/api)

---

## Elementos pendientes reales

### Pendiente funcional

1. Tipado más estricto en [src/types/observation.ts](src/types/observation.ts)
2. Tipado más estricto en [src/types/project.ts](src/types/project.ts)
3. Revisar contratos de [src/lib/api/observations.ts](src/lib/api/observations.ts)
4. Revisar contratos de [src/lib/api/projectObservationFields.ts](src/lib/api/projectObservationFields.ts)

### Pendiente de validación

5. Ejecutar build
6. Ejecutar lint

### Nota

- El file picker oculto en [src/features/app/AppShell.tsx](src/features/app/AppShell.tsx) se considera aceptable porque ya usa el wrapper [src/components/ui/input.tsx](src/components/ui/input.tsx)

---

## Plan actualizado

## Fase 1 — Limpieza de entrypoint y legacy

### Objetivo

Eliminar ruido estructural y dejar claro qué código es el activo.

### Tareas

- [x] Reducir [src/App.tsx](src/App.tsx) a un archivo mínimo
- [x] Eliminar la carpeta legacy [src/components/app](src/components/app)
- [x] Verificar que no queda ninguna importación rota tras la limpieza

### Resultado esperado

Un árbol de código más claro y sin duplicados confusos.

---

## Fase 2 — Cerrar la migración visual restante

### Objetivo

Quitar los pocos elementos nativos que siguen en los flujos activos.

### Tareas

- [x] Sustituir el bloque de JSON raw en [src/features/app/AppShell.tsx](src/features/app/AppShell.tsx) por `Dialog`
- [x] Encapsular el enlace de imagen en una interacción basada en `Button`
- [x] Sustituir el bloque de unmatched en [src/features/bulk-import/components/BulkImportDialog.tsx](src/features/bulk-import/components/BulkImportDialog.tsx)
- [x] Revisar el file picker y dejarlo como caso aceptable con wrapper existente

### Resultado esperado

UI activa completamente homogénea.

---

## Fase 3 — Pulido de tipos

### Objetivo

Reducir `unknown` y mejorar contratos internos.

### Tareas

- [x] Revisar [src/types/observation.ts](src/types/observation.ts) para endurecer `ObservationRow`
- [x] Revisar [src/types/project.ts](src/types/project.ts) para tipar mejor `id` y `name`
- [x] Revisar payloads de [src/lib/api/observations.ts](src/lib/api/observations.ts)
- [x] Revisar payloads de [src/lib/api/projectObservationFields.ts](src/lib/api/projectObservationFields.ts)

### Resultado esperado

Menos normalización defensiva y mejor soporte de TypeScript.

---

## Fase 4 — Validación final

### Objetivo

Cerrar la migración con una verificación técnica simple.

### Tareas

- [x] Ejecutar build
- [x] Ejecutar lint
- [x] Revisar de nuevo elementos nativos en `src/features`
- [x] Confirmar que no queda legacy no usado

### Resultado esperado

Migración cerrada con estado verificable.

---

## Orden recomendado de ejecución

1. Migración cerrada

---

## Criterio de “terminado”

Se puede dar la migración por cerrada cuando:

- [x] [src/App.tsx](src/App.tsx) no tenga legacy comentado
- [x] No exista [src/components/app](src/components/app)
- [x] No queden bloques nativos evitables en los flujos activos
- [x] Build y lint pasen
- [x] El árbol activo quede solo en `features`, `components/ui`, `lib/api` y `types`

---

## Siguiente acción recomendada

La migración queda cerrada.

Nota final:

- El build pasa correctamente.
- El lint pasa con warnings no bloqueantes en [src/components/MapboxMap.tsx](src/components/MapboxMap.tsx) y [src/features/project-fields/components/ProjectObservationFieldModal.tsx](src/features/project-fields/components/ProjectObservationFieldModal.tsx).
