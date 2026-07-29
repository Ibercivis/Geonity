import { buildApiError, buildApiUrl, buildAuthHeaders, readResponseBody } from './http'
import type {
  FieldFormSummary,
  FieldFormsResponse,
  ObservationAdminFieldsResponse,
  ObservationAdminValuesResponse,
  ObservationCollection,
  ObservationEmailLogsResponse,
  ObservationRow,
  SendObservationEmailPayload,
} from '@/types/observation'

export async function fetchFieldForms(sessionKey: string): Promise<FieldFormsResponse> {
  const res = await fetch(buildApiUrl('/api/field_forms/'), {
    method: 'GET',
    headers: buildAuthHeaders(sessionKey),
    credentials: 'include',
  })

  const { contentType, body } = await readResponseBody(res)

  if (!res.ok) {
    throw buildApiError({
      res,
      body,
      contentType,
      fallbackMessage: 'No se pudieron cargar field_forms',
    })
  }

  return body as FieldFormsResponse
}

export async function fetchFieldFormDetail(sessionKey: string, fieldFormId: string): Promise<FieldFormSummary> {
  const res = await fetch(buildApiUrl(`/api/field_form/${encodeURIComponent(fieldFormId)}/`), {
    method: 'GET',
    headers: buildAuthHeaders(sessionKey),
    credentials: 'include',
  })

  const { contentType, body } = await readResponseBody(res)

  if (!res.ok) {
    throw buildApiError({
      res,
      body,
      contentType,
      fallbackMessage: 'No se pudo cargar el detalle del formulario',
    })
  }

  return body as FieldFormSummary
}

export async function fetchFieldFormObservations(sessionKey: string, fieldFormId: string): Promise<ObservationCollection> {
  const res = await fetch(buildApiUrl(`/api/field_form/${encodeURIComponent(fieldFormId)}/observations/`), {
    method: 'GET',
    headers: buildAuthHeaders(sessionKey),
    credentials: 'include',
  })

  const { contentType, body } = await readResponseBody(res)

  if (!res.ok) {
    throw buildApiError({
      res,
      body,
      contentType,
      fallbackMessage: 'No se pudieron cargar observaciones',
    })
  }

  return body as ObservationCollection
}

export async function fetchProjectObservationAdminValues(
  sessionKey: string,
  projectId: string
): Promise<ObservationAdminValuesResponse | null> {
  const res = await fetch(buildApiUrl(`/api/projects/${encodeURIComponent(projectId)}/observation-admin-values/`), {
    method: 'GET',
    headers: buildAuthHeaders(sessionKey),
    credentials: 'include',
  })

  if (!res.ok) return null

  const { body } = await readResponseBody(res)
  return body as ObservationAdminValuesResponse
}

export async function fetchObservationAdminFields(
  sessionKey: string,
  observationId: string
): Promise<ObservationAdminFieldsResponse | null> {
  const res = await fetch(buildApiUrl(`/api/observations/${encodeURIComponent(observationId)}/admin-fields/`), {
    method: 'GET',
    headers: buildAuthHeaders(sessionKey),
    credentials: 'include',
  })

  if (!res.ok) return null

  const { body } = await readResponseBody(res)
  return body as ObservationAdminFieldsResponse
}

export async function fetchObservationEmailLogs(
  sessionKey: string,
  observationId: string
): Promise<ObservationEmailLogsResponse> {
  const res = await fetch(buildApiUrl(`/api/observations/${encodeURIComponent(observationId)}/email-logs/`), {
    method: 'GET',
    headers: buildAuthHeaders(sessionKey),
    credentials: 'include',
  })

  const { contentType, body } = await readResponseBody(res)

  if (!res.ok) {
    throw buildApiError({
      res,
      body,
      contentType,
      fallbackMessage: 'No se pudo cargar el historial de correos',
    })
  }

  return body as ObservationEmailLogsResponse
}

export async function sendObservationEmail({
  sessionKey,
  observationId,
  payload,
}: {
  sessionKey: string
  observationId: string
  payload: SendObservationEmailPayload
}): Promise<unknown> {
  const res = await fetch(buildApiUrl(`/api/observations/${encodeURIComponent(observationId)}/send-email/`), {
    method: 'POST',
    headers: buildAuthHeaders(sessionKey, {
      'content-type': 'application/json',
    }),
    credentials: 'include',
    body: JSON.stringify(payload),
  })

  const { contentType, body } = await readResponseBody(res)

  if (!res.ok) {
    throw buildApiError({
      res,
      body,
      contentType,
      fallbackMessage: 'No se pudo enviar el correo',
    })
  }

  return body
}

export async function saveObservationAdminFields({
  sessionKey,
  observationId,
  values,
}: {
  sessionKey: string
  observationId: string
  values: Record<string, unknown>
}): Promise<ObservationAdminFieldsResponse | ObservationRow> {
  const res = await fetch(buildApiUrl(`/api/observations/${encodeURIComponent(observationId)}/admin-fields/`), {
    method: 'PATCH',
    headers: buildAuthHeaders(sessionKey, {
      'content-type': 'application/json',
    }),
    credentials: 'include',
    body: JSON.stringify({ values }),
  })

  const { contentType, body } = await readResponseBody(res)

  if (!res.ok) {
    throw buildApiError({
      res,
      body,
      contentType,
      fallbackMessage: 'Error guardando',
    })
  }

  return body as ObservationAdminFieldsResponse | ObservationRow
}
