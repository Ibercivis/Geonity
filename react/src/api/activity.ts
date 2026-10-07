import { api } from '@/lib/axios'

/**
 * Activity feed for the projects the user creates or administers.
 * Contract: docs/API_PENDIENTE_REACT.md §7c.1. The endpoint may not be deployed yet (404).
 */

export type ActivityScope = 'all' | 'others' | 'mine'

/** Known types; the server may send others, which are shown with a generic label. */
export const KNOWN_ACTIVITY_TYPES = [
  'observation_created',
  'participant_joined',
  'project_created',
  'project_published',
  'project_unpublished',
  'project_ended',
  'project_reopened',
  'admin_invited',
  'observation_admin_fields_edited',
  'observation_email_sent',
] as const

export interface ActivityItem {
  /** Stable key of the row (grouped rows have a composite key). */
  id: string | number
  type: string
  created_at: string
  /** Null for anonymous (QR) contributors and deleted users. */
  actor: { id: number; name: string; is_me: boolean } | null
  project: { id: number; name: string; cover_thumb?: string | null }
  target?: { observation_id?: number } | null
  /** `count`: how many events were grouped into this row (observations, edits, emails). */
  meta?: { count?: number; anonymous?: boolean; status?: string } & Record<string, unknown>
}

export interface ActivityPage {
  count: number
  next: string | null
  previous: string | null
  results: ActivityItem[]
}

export interface ActivityParams {
  scope?: ActivityScope
  project?: number
  page?: number
  page_size?: number
}

export const activityApi = {
  list: (params?: ActivityParams) =>
    api.get<ActivityPage>('/users/me/activity/', { params }).then((r) => r.data),
}

/** True when the feed endpoint isn't available on this server yet. */
export const isActivityUnavailable = (err: unknown) =>
  (err as { response?: { status?: number } })?.response?.status === 404
