export function getApiBaseUrl(): string {
  return import.meta.env.DEV ? '' : ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '')
}

export function buildApiUrl(endpointPath: string): string {
  const base = getApiBaseUrl()
  return import.meta.env.DEV ? endpointPath : base ? new URL(endpointPath, base).toString() : endpointPath
}

export function buildAuthHeaders(
  sessionKey: string,
  extraHeaders: Record<string, string> = {}
): Record<string, string> {
  return {
    accept: 'application/json',
    authorization: `Token ${sessionKey}`,
    'x-auth-key': sessionKey,
    ...extraHeaders,
  }
}

export function extractServerError(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null

  const record = body as Record<string, unknown>
  if (typeof record.error === 'string' && record.error.trim()) return record.error

  const nonFieldErrors = record.non_field_errors
  if (Array.isArray(nonFieldErrors) && typeof nonFieldErrors[0] === 'string') {
    return String(nonFieldErrors[0])
  }

  for (const value of Object.values(record)) {
    if (Array.isArray(value) && typeof value[0] === 'string') {
      return String(value[0])
    }
  }

  if (typeof record.detail === 'string') return record.detail
  if (typeof record.message === 'string') return record.message
  return null
}

export function isProbablyHtml(contentType: string, body: unknown): boolean {
  if (contentType.includes('text/html')) return true
  if (typeof body === 'string' && body.trim().startsWith('<!DOCTYPE html')) return true
  if (typeof body === 'string' && body.trim().startsWith('<html')) return true
  return false
}

export async function readResponseBody(res: Response): Promise<{ contentType: string; body: unknown }> {
  const contentType = res.headers.get('content-type') ?? ''
  const body = contentType.includes('application/json') ? await res.json().catch(() => null) : await res.text().catch(() => '')
  return { contentType, body }
}

export function buildApiError({
  res,
  body,
  contentType,
  fallbackMessage,
}: {
  res: Response
  body: unknown
  contentType: string
  fallbackMessage: string
}): Error {
  if (res.status === 401 && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('geonity:unauthorized'))
  }

  const message =
    extractServerError(body) ||
    (isProbablyHtml(contentType, body)
      ? `${fallbackMessage} (${res.status})`
      : typeof body === 'string' && body.trim()
        ? body
        : `${fallbackMessage} (${res.status})`)

  return new Error(message)
}
