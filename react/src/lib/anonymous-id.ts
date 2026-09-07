// Pseudonymous identifier for anonymous (QR) contributions.
//
// This is NOT a device id — the web has none. It's a random UUID stored in the
// browser's localStorage the first time it's needed, sent as `X-Anonymous-Id`
// with every anonymous request so the backend can group observations from the
// same browser and rate-limit abuse. It's lost when the user clears site data,
// in private mode, or (Safari) after 7 days without visiting the site.

const STORAGE_KEY = 'geonity_anonymous_id'

let memoryFallback: string | null = null

function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  // Very old browsers: RFC4122-ish fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Returns the browser's anonymous id, creating it on first call.
 * `persisted` is false when localStorage is unavailable (e.g. strict private
 * mode): the id then lives only for this page session.
 */
export function getAnonymousId(): { id: string; persisted: boolean } {
  try {
    const existing = localStorage.getItem(STORAGE_KEY)
    if (existing) return { id: existing, persisted: true }
    const fresh = generateId()
    localStorage.setItem(STORAGE_KEY, fresh)
    return { id: fresh, persisted: true }
  } catch {
    if (!memoryFallback) memoryFallback = generateId()
    return { id: memoryFallback, persisted: false }
  }
}

/** Forget the local id (e.g. after the user claims their observations into an account). */
export function clearAnonymousId(): void {
  memoryFallback = null
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
