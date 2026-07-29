import axios from 'axios'

/**
 * Extracts a human-readable error message from a DRF error response.
 *
 * DRF can return errors in several formats:
 *   { detail: "Not found." }
 *   { non_field_errors: ["Invalid credentials."] }
 *   { email: ["This field is required."], name: ["..."] }
 *   { field_form: { questions: [...] } }  ← nested
 */
export function getApiError(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : 'Unexpected error'
  }

  const status = error.response?.status
  const data = error.response?.data

  if (!data) return `Error ${status ?? ''}: ${error.message}`

  if (typeof data === 'string') return data

  // { detail: "..." }
  if (data.detail) return String(data.detail)

  // { non_field_errors: ["..."] }
  if (Array.isArray(data.non_field_errors)) return data.non_field_errors.join(' ')

  // Field-level errors: { email: ["..."], name: ["..."] }
  const fieldErrors = Object.entries(data as Record<string, unknown>)
    .flatMap(([field, msgs]) => {
      if (Array.isArray(msgs)) return msgs.map((m) => `${field}: ${m}`)
      if (typeof msgs === 'string') return [`${field}: ${msgs}`]
      return []
    })

  if (fieldErrors.length > 0) return fieldErrors.join('\n')

  return `Error ${status ?? ''}`
}
