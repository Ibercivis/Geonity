import { buildApiError, buildApiUrl, buildAuthHeaders, readResponseBody } from './http'
import type { PaginatedResponse } from '@/types/api'
import type { ProjectObservationField } from '@/types/projectObservationField'

export type ProjectObservationFieldsResponse = ProjectObservationField[] | PaginatedResponse<ProjectObservationField>
export type ProjectObservationFieldMutationResponse = ProjectObservationField | Record<string, unknown>

export async function fetchProjectObservationFieldsCollection({
  projectId,
  sessionKey,
}: {
  projectId: string
  sessionKey: string
}): Promise<{ collectionPath: string; data: ProjectObservationFieldsResponse }> {
  const candidates = [
    `/api/projects/${encodeURIComponent(projectId)}/observation-fields/`,
    `/api/project/${encodeURIComponent(projectId)}/observation-fields/`,
    `/api/projects/${encodeURIComponent(projectId)}/observation_fields/`,
    `/api/project/${encodeURIComponent(projectId)}/observation_fields/`,
  ]

  let lastError: string | null = null

  for (const endpointPath of candidates) {
    const res = await fetch(buildApiUrl(endpointPath), {
      method: 'GET',
      headers: buildAuthHeaders(sessionKey),
      credentials: 'include',
    })

    if (res.status === 404) continue

    const { contentType, body } = await readResponseBody(res)
    if (!res.ok) {
      lastError = buildApiError({
        res,
        body,
        contentType,
        fallbackMessage: 'Error cargando columnas',
      }).message
      return { collectionPath: endpointPath, data: [] }
    }

    return { collectionPath: endpointPath, data: body as ProjectObservationFieldsResponse }
  }

  throw new Error(lastError || `El endpoint de columnas no existe en este servidor (404). Rutas probadas: ${candidates.join(' | ')}`)
}

export async function fetchProjectObservationFieldsList({
  collectionPath,
  sessionKey,
}: {
  collectionPath: string
  sessionKey: string
}): Promise<ProjectObservationFieldsResponse | null> {
  const res = await fetch(buildApiUrl(collectionPath), {
    method: 'GET',
    headers: buildAuthHeaders(sessionKey),
    credentials: 'include',
  })

  if (!res.ok) return null

  const { body } = await readResponseBody(res)
  return body as ProjectObservationFieldsResponse
}

export async function saveProjectObservationFieldRequest({
  endpointPath,
  method,
  sessionKey,
  body,
}: {
  endpointPath: string
  method: 'POST' | 'PATCH'
  sessionKey: string
  body: Record<string, unknown>
}): Promise<ProjectObservationFieldMutationResponse> {
  const res = await fetch(buildApiUrl(endpointPath), {
    method,
    headers: buildAuthHeaders(sessionKey, {
      'content-type': 'application/json',
    }),
    credentials: 'include',
    body: JSON.stringify(body),
  })

  const payload = await readResponseBody(res)

  if (!res.ok) {
    throw buildApiError({
      res,
      body: payload.body,
      contentType: payload.contentType,
      fallbackMessage: 'Error guardando',
    })
  }

  return payload.body as ProjectObservationFieldMutationResponse
}

export async function deleteProjectObservationFieldRequest({
  endpointPath,
  sessionKey,
}: {
  endpointPath: string
  sessionKey: string
}): Promise<void> {
  const res = await fetch(buildApiUrl(endpointPath), {
    method: 'DELETE',
    headers: buildAuthHeaders(sessionKey),
    credentials: 'include',
  })

  const { contentType, body } = await readResponseBody(res)

  if (!res.ok) {
    throw buildApiError({
      res,
      body,
      contentType,
      fallbackMessage: 'No se pudo eliminar',
    })
  }
}
