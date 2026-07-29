const DEFAULT_GOOGLE_REDIRECT_URI_DEV = 'https://geonity-admin.ibercivis.es:10003/auth/google/callback'
const DEFAULT_GOOGLE_REDIRECT_URI = 'https://geonity-admin.ibercivis.es/auth/google/callback'
const GOOGLE_OAUTH_STATE_KEY = 'geonity.googleOAuthState'

function randomStateSegment(): string {
  if (typeof window !== 'undefined' && window.crypto?.randomUUID) return window.crypto.randomUUID()
  return Math.random().toString(36).slice(2)
}

export function getGoogleClientId(): string {
  return ((import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ?? '').trim()
}

export function getGoogleRedirectUri(): string {
  const configured = import.meta.env.DEV
    ? (import.meta.env.VITE_GOOGLE_REDIRECT_URI_DEV as string | undefined)
    : (import.meta.env.VITE_GOOGLE_REDIRECT_URI as string | undefined)

  return (configured?.trim() || (import.meta.env.DEV ? DEFAULT_GOOGLE_REDIRECT_URI_DEV : DEFAULT_GOOGLE_REDIRECT_URI))
}

export function getGoogleCallbackPath(): string {
  try {
    return new URL(getGoogleRedirectUri()).pathname
  } catch {
    return '/auth/google/callback'
  }
}

export function beginGoogleLoginRedirect(): void {
  const clientId = getGoogleClientId()
  const redirectUri = getGoogleRedirectUri()
  if (!clientId || typeof window === 'undefined') return

  const state = randomStateSegment()
  window.sessionStorage.setItem(GOOGLE_OAUTH_STATE_KEY, state)

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', 'openid email profile')
  authUrl.searchParams.set('access_type', 'online')
  authUrl.searchParams.set('include_granted_scopes', 'true')
  authUrl.searchParams.set('prompt', 'select_account')
  authUrl.searchParams.set('state', state)

  window.location.assign(authUrl.toString())
}

export function consumeExpectedGoogleState(): string {
  if (typeof window === 'undefined') return ''
  const expectedState = window.sessionStorage.getItem(GOOGLE_OAUTH_STATE_KEY) ?? ''
  window.sessionStorage.removeItem(GOOGLE_OAUTH_STATE_KEY)
  return expectedState
}