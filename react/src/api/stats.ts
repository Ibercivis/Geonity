import { api } from '@/lib/axios'

// ─── Params ──────────────────────────────────────────────────────────────────

export type StatsGranularity = 'month' | 'week'

export interface StatsParams {
  /** YYYY-MM-DD, inclusive. Defaults to 12 months before `to`. */
  from?: string
  /** YYYY-MM-DD, EXCLUSIVE. Defaults to now. */
  to?: string
  granularity?: StatsGranularity
  /** Skip the 10-minute server cache. */
  refresh?: boolean
}

// ─── Shared shapes ───────────────────────────────────────────────────────────

export interface StatsPeriod {
  from: string
  to: string
  granularity: StatsGranularity
}

export interface CountPoint {
  period: string
  count: number
}

export interface PlatformPoint {
  period: string
  mobile: number
  web: number
  unknown: number
}

export interface ContributorsPoint {
  period: string
  total: number
  registered: number
  anonymous: number
  new: number
  recurring: number
}

export interface Comparison {
  value: number
  previous: number
  /** null when the previous period was 0 — show "no previous data", never +100%. */
  delta_pct: number | null
  direction: 'up' | 'down' | 'flat'
}

export interface ObservationsBlock {
  total: number
  last_30d: number
  anonymous: number
  by_platform: { mobile: number; web: number; unknown: number }
  with_images: number
  with_audio: number
}

export interface ContributorsBlock {
  registered: number
  anonymous: number
  total: number
  new: number
  recurring: number
}

export interface ProjectsBlock {
  total: number
  published: number
  draft: number
  ended: number
  private: number
  anonymous_enabled: number
  public_map: number
  with_observations: number
  /** Includes drafts on purpose: drafts collect data via QR. */
  active_30d: number
  active_30d_published: number
  /** Published and >90 days without observations. */
  abandoned: number
}

// ─── /stats/platform/ ────────────────────────────────────────────────────────

export interface PlatformStats {
  generated_at: string
  period: StatsPeriod
  projects: ProjectsBlock
  observations: ObservationsBlock
  users: { total: number; active: number; new_30d: number; with_observations: number }
  organizations: { total: number }
  engagement: { memberships: number; invitations_pending: number; likes: number }
  series: {
    projects_created: CountPoint[]
    projects_created_cumulative: CountPoint[]
    projects_published: CountPoint[]
    projects_published_cumulative: CountPoint[]
    observations: CountPoint[]
    observations_cumulative: CountPoint[]
    users: CountPoint[]
    users_cumulative: CountPoint[]
  }
  series_by_platform: PlatformPoint[]
  comparison: {
    observations: Comparison
    users: Comparison
    projects_created: Comparison
    projects_published: Comparison
  }
  top: {
    projects_by_observations: { id: number; name: string; observations: number; published: boolean }[]
    creators_by_observations: { id: number; username: string; observations: number; projects: number }[]
  }
  last_digest_sent_at: string | null
  cached: boolean
}

// ─── /stats/me/ ──────────────────────────────────────────────────────────────

export interface PerProjectStats {
  id: number
  name: string
  published: boolean
  draft: boolean
  ended: boolean
  created_at: string
  published_at: string | null
  observations: number
  last_observation: string | null
  active_30d: boolean
}

export interface MyStats {
  generated_at: string
  period: StatsPeriod
  projects: ProjectsBlock
  observations: ObservationsBlock
  contributors: ContributorsBlock
  series: {
    observations: CountPoint[]
    observations_cumulative: CountPoint[]
    contributors: ContributorsPoint[]
    by_platform: PlatformPoint[]
  }
  comparison: { observations: Comparison }
  per_project: PerProjectStats[]
  cached: boolean
}

// ─── /project/<pk>/stats/ ────────────────────────────────────────────────────

export interface ProjectStats {
  generated_at: string
  period: StatsPeriod
  project: {
    id: number
    name: string
    published: boolean
    draft: boolean
    ended: boolean
    created_at: string
    published_at: string | null
  }
  observations: ObservationsBlock
  contributors: ContributorsBlock
  span: { first_observation: string | null; last_observation: string | null }
  series: {
    observations: CountPoint[]
    observations_cumulative: CountPoint[]
    contributors: ContributorsPoint[]
    by_platform: PlatformPoint[]
  }
  comparison: { observations: Comparison }
  cached: boolean
}

// ─── API ─────────────────────────────────────────────────────────────────────

function toQuery(params?: StatsParams) {
  if (!params) return undefined
  const q: Record<string, string> = {}
  if (params.from) q.from = params.from
  if (params.to) q.to = params.to
  if (params.granularity) q.granularity = params.granularity
  if (params.refresh) q.refresh = '1'
  return q
}

export const statsApi = {
  /** Staff only (403 otherwise). */
  platform: (params?: StatsParams) =>
    api.get<PlatformStats>('/stats/platform/', { params: toQuery(params) }).then((r) => r.data),

  /** Projects the current user creates or administers. 200 with empty blocks if none. */
  me: (params?: StatsParams) =>
    api.get<MyStats>('/stats/me/', { params: toQuery(params) }).then((r) => r.data),

  /** Creator and administrators of the project only. */
  project: (id: number, params?: StatsParams) =>
    api.get<ProjectStats>(`/project/${id}/stats/`, { params: toQuery(params) }).then((r) => r.data),
}
