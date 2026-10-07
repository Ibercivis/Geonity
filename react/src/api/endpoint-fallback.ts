import { isNotFoundError } from '@/lib/api-error'

/** Endpoints that answered 404 in this session: not retried on every poll. */
const unavailable = new Set<string>()

/**
 * Calls a dedicated endpoint; if the server answers 404 (not deployed yet) returns `undefined` so the caller can fall back
 * to older endpoints. Any other error is thrown.
 */
export async function tryEndpoint<T>(key: string, call: () => Promise<T>): Promise<T | undefined> {
  if (unavailable.has(key)) return undefined
  try {
    return await call()
  } catch (error) {
    if (isNotFoundError(error)) {
      unavailable.add(key)
      return undefined
    }
    throw error
  }
}
