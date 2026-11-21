/**
 * Signing in with an Ibercivis account: the sign-in service the Ibercivis citizen
 * science sites share, reached over OpenID Connect.
 *
 * This module does the browser's half. It sends the person to the service with a
 * PKCE challenge and a `state`, and on the way back checks that the answer is the
 * one it asked for, and yields the authorization code and the PKCE verifier. The
 * API redeems the code with its own secret (`authApi.loginWithIbercivis`); the
 * browser never holds a token from the service.
 *
 * The protocol work is `oauth4webapi`'s. What is here is which values go where.
 */
import * as oauth from 'oauth4webapi'
import { config } from '@/config/env'

const issuer = config.ibercivisAccountIssuer
const clientId = config.ibercivisAccountClientId

/** Off unless both are set: no button, and the callback page has nothing to finish. */
export const ibercivisAccountEnabled = Boolean(issuer && clientId)

export const IBERCIVIS_ACCOUNT_CALLBACK_PATH = '/auth/ibercivis/callback'

/** The service grants this client these scopes and refuses a request for any other. */
const SCOPE = 'openid email'

const PENDING_KEY = 'ibercivis-account.pending'

interface Pending {
  codeVerifier: string
  state: string
}

/** What the callback page hands to the API. */
export interface IbercivisAccountCode {
  code: string
  code_verifier: string
}

function redirectUri() {
  return `${window.location.origin}${IBERCIVIS_ACCOUNT_CALLBACK_PATH}`
}

async function discover(): Promise<oauth.AuthorizationServer> {
  if (!issuer) throw new Error('The Ibercivis account is not configured')
  const issuerUrl = new URL(issuer)
  const response = await oauth.discoveryRequest(issuerUrl, {
    // The local environment reaches the service over plain HTTP. A production
    // build never does.
    [oauth.allowInsecureRequests]: import.meta.env.DEV,
  })
  return oauth.processDiscoveryResponse(issuerUrl, response)
}

/** Leaves the page for the service's sign-in. */
export async function startIbercivisAccountSignIn(): Promise<void> {
  const as = await discover()
  if (!as.authorization_endpoint) throw new Error('The service names no authorization endpoint')

  const pending: Pending = {
    codeVerifier: oauth.generateRandomCodeVerifier(),
    state: oauth.generateRandomState(),
  }
  sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending))

  const url = new URL(as.authorization_endpoint)
  url.searchParams.set('client_id', clientId!)
  url.searchParams.set('redirect_uri', redirectUri())
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', SCOPE)
  url.searchParams.set('code_challenge', await oauth.calculatePKCECodeChallenge(pending.codeVerifier))
  url.searchParams.set('code_challenge_method', 'S256')
  url.searchParams.set('state', pending.state)
  window.location.assign(url.href)
}

/**
 * Checks the answer the service sent back to the callback page — the `state` this
 * browser kept, and the `iss` the service names itself with — and yields the code.
 * Throws when the person declined, when nothing was started here, or when the
 * answer is not the one asked for. Usable once: the verifier is gone afterwards.
 */
export async function finishIbercivisAccountSignIn(callbackUrl: URL): Promise<IbercivisAccountCode> {
  const stored = sessionStorage.getItem(PENDING_KEY)
  sessionStorage.removeItem(PENDING_KEY)
  if (!stored) throw new Error('No Ibercivis sign-in was started in this browser tab')
  const pending = JSON.parse(stored) as Pending

  const as = await discover()
  const params = oauth.validateAuthResponse(as, { client_id: clientId! }, callbackUrl, pending.state)
  return { code: params.get('code')!, code_verifier: pending.codeVerifier }
}
