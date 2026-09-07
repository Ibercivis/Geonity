// Anonymous (QR) contribution API client.
//
// Deliberately NOT built on `@/lib/axios`: that instance attaches the user's
// auth token and force-redirects to /login on any 401. Anonymous requests must
// never carry a session and must surface errors to the page instead.
//
// Backend contract (see api/ANONYMOUS_CONTRIBUTION_PLAN.md):
//   GET  /anonymous/<token>/?raw=true          → AnonymousProject
//   POST /anonymous/<token>/observations/      → multipart, header X-Anonymous-Id
// Both return 404 when the project doesn't exist, has the flag off, is ended or draft.

import i18n from '@/lib/i18n'
import { config } from '@/config/env'
import { getAnonymousId } from '@/lib/anonymous-id'
import type { LocalizedString, ObservationQuestion, Organization } from '@/types'

export interface AnonymousProject {
  id: number
  name: LocalizedString
  description: LocalizedString
  cover: string | { image: string } | { image: string }[] | null
  organizations?: Pick<Organization, 'id' | 'principalName' | 'logo'>[]
  field_form: number
  questions: ObservationQuestion[]
  post_observation_message?: LocalizedString
  show_post_message?: boolean
}

export interface AnonymousObservationResult {
  id: number
}

export class AnonymousApiError extends Error {
  status: number
  data: unknown
  constructor(status: number, data: unknown) {
    super(`Anonymous API error ${status}`)
    this.name = 'AnonymousApiError'
    this.status = status
    this.data = data
  }
  /** Best-effort human message from a DRF error body. */
  get detail(): string | null {
    const d = this.data as { detail?: unknown; geoposition?: unknown; data?: unknown } | null
    if (!d || typeof d !== 'object') return null
    if (typeof d.detail === 'string') return d.detail
    for (const v of Object.values(d)) {
      if (typeof v === 'string') return v
      if (Array.isArray(v) && typeof v[0] === 'string') return v[0]
    }
    return null
  }
}

function baseHeaders(): Record<string, string> {
  return {
    'Accept-Language': i18n.resolvedLanguage ?? i18n.language ?? 'en',
    'X-Anonymous-Id': getAnonymousId().id,
  }
}

async function handle<T>(res: Response): Promise<T> {
  if (res.ok) {
    if (res.status === 204) return undefined as T
    return (await res.json()) as T
  }
  let data: unknown = null
  try {
    data = await res.json()
  } catch {
    // non-JSON body
  }
  throw new AnonymousApiError(res.status, data)
}

type Loose = Record<string, unknown>

function asObj(v: unknown): Loose | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Loose) : null
}

/**
 * Accepts the payload shapes the backend may reasonably produce and returns the
 * flat AnonymousProject the page expects:
 *   flat:    { id, name, ..., field_form: 12, questions: [...] }
 *   nested:  { project: { id, name, ... }, field_form: 12 | { id, questions }, questions?: [...] }
 *   PublicMapView-like organizations: [{ id, name, logo }] → principalName
 */
export function normalizeAnonymousProject(raw: unknown): AnonymousProject {
  const root = asObj(raw) ?? {}
  const meta = asObj(root.project) ?? root
  const ff = root.field_form ?? meta.field_form ?? meta.fieldform
  const ffObj = asObj(ff)

  const questionsRaw =
    root.questions ?? meta.questions ?? ffObj?.questions ?? []
  const questions = (Array.isArray(questionsRaw) ? questionsRaw : []) as ObservationQuestion[]

  const fieldFormId = Number(
    typeof ff === 'number' || typeof ff === 'string' ? ff : ffObj?.id ?? root.field_form_id ?? meta.field_form_id ?? 0,
  )

  const orgsRaw = root.organizations ?? meta.organizations
  const organizations = (Array.isArray(orgsRaw) ? orgsRaw : [])
    .map((o) => asObj(o))
    .filter((o): o is Loose => !!o)
    .map((o) => ({
      id: Number(o.id ?? 0),
      principalName: String(o.principalName ?? o.principal_name ?? o.name ?? ''),
      logo: (o.logo as string | null) ?? null,
    }))

  if (!fieldFormId || questions.length === 0) {
    // Surface the mismatch instead of crashing the page
    console.warn('[anonymous] unexpected project payload', raw)
  }

  return {
    id: Number(meta.id ?? root.id ?? 0),
    name: (meta.name ?? '') as AnonymousProject['name'],
    description: (meta.description ?? '') as AnonymousProject['description'],
    cover: (meta.cover ?? null) as AnonymousProject['cover'],
    organizations,
    field_form: fieldFormId,
    questions,
    post_observation_message: (meta.post_observation_message ?? root.post_observation_message) as AnonymousProject['post_observation_message'],
    show_post_message: Boolean(meta.show_post_message ?? root.show_post_message ?? false),
  }
}

export const anonymousApi = {
  /** Project meta + form definition. `raw=true` keeps multilingual dicts so the language picker works without refetching. */
  getProject: (token: string) =>
    fetch(`${config.apiUrl}/anonymous/${encodeURIComponent(token)}/?raw=true`, {
      headers: baseHeaders(),
    })
      .then((r) => handle<unknown>(r))
      .then((data) => {
        const project = normalizeAnonymousProject(data)
        // A project we can't render (no form) behaves like an inactive link
        if (!project.field_form || project.questions.length === 0) throw new AnonymousApiError(404, data)
        return project
      }),

  /**
   * Submit an observation. `formData` comes from buildObservationFormData();
   * `source` is the optional poster label carried in the QR URL (?src=).
   */
  createObservation: (token: string, formData: FormData, source?: string | null) => {
    if (source) formData.append('source', source.slice(0, 64))
    // The shared builder emits a GeoJSON Point; the anonymous endpoint documents WKT "POINT (lon lat)".
    const geo = formData.get('geoposition')
    if (typeof geo === 'string' && geo.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(geo) as { coordinates?: [number, number] }
        if (parsed.coordinates) formData.set('geoposition', `POINT (${parsed.coordinates[0]} ${parsed.coordinates[1]})`)
      } catch {
        // leave as-is
      }
    }
    return fetch(`${config.apiUrl}/anonymous/${encodeURIComponent(token)}/observations/`, {
      method: 'POST',
      headers: baseHeaders(),
      body: formData,
    }).then((r) => handle<AnonymousObservationResult>(r))
  },
}
