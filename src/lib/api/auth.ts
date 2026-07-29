import { buildApiUrl, buildAuthHeaders, extractServerError, readResponseBody } from './http'

export const CURRENT_TERMS_VERSION = '2025-04'
export const CURRENT_PRIVACY_VERSION = '2025-04'

export type ConsentUser = {
  terms_accepted_at: string | null
  terms_version: string | null
  privacy_accepted_at: string | null
  privacy_version: string | null
}

function extractAuthKey(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null

  const record = body as Record<string, unknown>
  if (typeof record.key === 'string') return record.key
  if (typeof record.token === 'string') return record.token
  if (typeof record.access === 'string') return record.access
  return null
}

function extractUserLabel(body: unknown, fallbackEmail: string): string {
  if (!body || typeof body !== 'object') return fallbackEmail

  const record = body as Record<string, unknown>
  const candidates = [
    record.name,
    record.full_name,
    record.fullName,
    record.username,
    record.principalName,
    record.email,
  ]

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim()
  }

  const user = record.user
  if (user && typeof user === 'object' && !Array.isArray(user)) {
    const nested = user as Record<string, unknown>
    for (const candidate of [nested.name, nested.full_name, nested.fullName, nested.username, nested.principalName, nested.email]) {
      if (typeof candidate === 'string' && candidate.trim()) return candidate.trim()
    }
  }

  return fallbackEmail
}

function extractUserEmail(body: unknown, fallbackEmail = ''): string {
  if (!body || typeof body !== 'object') return fallbackEmail

  const record = body as Record<string, unknown>
  const candidates = [record.email, record.user_email, record.userEmail]

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim()
  }

  const user = record.user
  if (user && typeof user === 'object' && !Array.isArray(user)) {
    const nested = user as Record<string, unknown>
    for (const candidate of [nested.email, nested.user_email, nested.userEmail]) {
      if (typeof candidate === 'string' && candidate.trim()) return candidate.trim()
    }
  }

  return fallbackEmail
}

export async function loginWithCredentials({
  email,
  password,
}: {
  email: string
  password: string
}): Promise<{ authKey: string | null; data: unknown; userLabel: string; userEmail: string }> {
  const res = await fetch(buildApiUrl('/api/users/authentication/login/'), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      email,
      username: email,
      password,
    }),
  })

  const { body } = await readResponseBody(res)

  if (!res.ok) {
    throw new Error(extractServerError(body) || `Login falló (${res.status})`)
  }

  return {
    authKey: extractAuthKey(body),
    data: body,
    userLabel: extractUserLabel(body, email),
    userEmail: extractUserEmail(body, email),
  }
}

export async function loginWithGoogleCode({
  code,
  redirectUri,
}: {
  code: string
  redirectUri: string
}): Promise<{ authKey: string | null; data: unknown; userLabel: string; userEmail: string }> {
  const res = await fetch(buildApiUrl('/api/users/auth/google/'), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      code,
      redirect_uri: redirectUri,
    }),
  })

  const { body } = await readResponseBody(res)

  if (!res.ok) {
    throw new Error(extractServerError(body) || `Login con Google falló (${res.status})`)
  }

  const userEmail = extractUserEmail(body)

  return {
    authKey: extractAuthKey(body),
    data: body,
    userLabel: extractUserLabel(body, userEmail || 'Cuenta de Google'),
    userEmail,
  }
}

export async function fetchCurrentUser(authKey: string): Promise<ConsentUser> {
  const res = await fetch(buildApiUrl('/api/users/authentication/user/'), {
    headers: buildAuthHeaders(authKey),
    credentials: 'include',
  })

  const { body } = await readResponseBody(res)

  if (!res.ok) {
    throw new Error(extractServerError(body) || `Error al obtener usuario (${res.status})`)
  }

  const record = (body ?? {}) as Record<string, unknown>
  return {
    terms_accepted_at: typeof record.terms_accepted_at === 'string' ? record.terms_accepted_at : null,
    terms_version: typeof record.terms_version === 'string' ? record.terms_version : null,
    privacy_accepted_at: typeof record.privacy_accepted_at === 'string' ? record.privacy_accepted_at : null,
    privacy_version: typeof record.privacy_version === 'string' ? record.privacy_version : null,
  }
}

export async function postConsent(authKey: string): Promise<void> {
  const res = await fetch(buildApiUrl('/api/users/consent/'), {
    method: 'POST',
    headers: {
      ...buildAuthHeaders(authKey),
      'content-type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      terms_version: CURRENT_TERMS_VERSION,
      privacy_version: CURRENT_PRIVACY_VERSION,
    }),
  })

  const { body } = await readResponseBody(res)

  if (!res.ok) {
    throw new Error(extractServerError(body) || `Error al registrar consentimiento (${res.status})`)
  }
}

export async function logoutWithAuthKey(authKey: string): Promise<void> {
  const res = await fetch(buildApiUrl('/api/users/authentication/logout/'), {
    method: 'POST',
    headers: buildAuthHeaders(authKey),
    credentials: 'include',
  })

  const { body } = await readResponseBody(res)

  if (!res.ok) {
    throw new Error(extractServerError(body) || `Logout falló (${res.status})`)
  }
}
