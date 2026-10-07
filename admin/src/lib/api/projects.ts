import { buildApiError, buildApiUrl, buildAuthHeaders, readResponseBody } from './http'

export async function fetchProjects(sessionKey: string): Promise<unknown> {
  const res = await fetch(buildApiUrl('/api/project/my_admin_projects/'), {
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
      fallbackMessage: 'No se pudieron cargar proyectos',
    })
  }

  return body
}

export async function fetchProjectInvitations(sessionKey: string, projectId: string): Promise<unknown> {
  const res = await fetch(buildApiUrl(`/api/project/${encodeURIComponent(projectId)}/invitations/`), {
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
      fallbackMessage: 'No se pudieron cargar las invitaciones',
    })
  }

  return body
}

export async function fetchPendingProjectInvitations(sessionKey: string): Promise<unknown> {
  const res = await fetch(buildApiUrl('/api/project/invitations/pending/'), {
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
      fallbackMessage: 'No se pudieron cargar las invitaciones pendientes',
    })
  }

  return body
}

export async function rejectProjectInvitation({
  sessionKey,
  invitationId,
}: {
  sessionKey: string
  invitationId: string
}): Promise<unknown> {
  const res = await fetch(buildApiUrl(`/api/project/invitations/${encodeURIComponent(invitationId)}/reject/`), {
    method: 'POST',
    headers: buildAuthHeaders(sessionKey),
    credentials: 'include',
  })

  const { contentType, body } = await readResponseBody(res)

  if (!res.ok) {
    throw buildApiError({
      res,
      body,
      contentType,
      fallbackMessage: 'No se pudo rechazar la invitación',
    })
  }

  return body
}

export async function acceptProjectInvitation({
  sessionKey,
  invitationId,
}: {
  sessionKey: string
  invitationId: string
}): Promise<unknown> {
  const res = await fetch(buildApiUrl(`/api/project/invitations/${encodeURIComponent(invitationId)}/accept/`), {
    method: 'POST',
    headers: buildAuthHeaders(sessionKey),
    credentials: 'include',
  })

  const { contentType, body } = await readResponseBody(res)

  if (!res.ok) {
    throw buildApiError({
      res,
      body,
      contentType,
      fallbackMessage: 'No se pudo aceptar la invitación',
    })
  }

  return body
}

export async function createProjectInvitation({
  sessionKey,
  projectId,
  email,
}: {
  sessionKey: string
  projectId: string
  email: string
}): Promise<unknown> {
  const res = await fetch(buildApiUrl(`/api/project/${encodeURIComponent(projectId)}/invite/`), {
    method: 'POST',
    headers: buildAuthHeaders(sessionKey, {
      'content-type': 'application/json',
    }),
    credentials: 'include',
    body: JSON.stringify({ email }),
  })

  const { contentType, body } = await readResponseBody(res)

  if (!res.ok) {
    throw buildApiError({
      res,
      body,
      contentType,
      fallbackMessage: 'No se pudo enviar la invitación',
    })
  }

  return body
}

export async function removeProjectAdministrator({
  sessionKey,
  projectId,
  userId,
}: {
  sessionKey: string
  projectId: string
  userId: string
}): Promise<unknown> {
  const res = await fetch(
    buildApiUrl(`/api/project/${encodeURIComponent(projectId)}/administrators/${encodeURIComponent(userId)}/`),
    {
      method: 'DELETE',
      headers: buildAuthHeaders(sessionKey),
      credentials: 'include',
    }
  )

  const { contentType, body } = await readResponseBody(res)

  if (!res.ok) {
    throw buildApiError({
      res,
      body,
      contentType,
      fallbackMessage: 'No se pudo quitar el administrador',
    })
  }

  return body
}
