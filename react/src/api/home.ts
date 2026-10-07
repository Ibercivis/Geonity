import { differenceInCalendarMonths, startOfWeek, subWeeks } from 'date-fns'
import { api } from '@/lib/axios'
import { isNotFoundError } from '@/lib/api-error'
import { projectsApi } from '@/api/projects'
import { orgsApi } from '@/api/organizations'
import { projectCoverUrl, projectObservations } from '@/components/home/project-utils'
import type { LocalizedString, Observation, Project } from '@/types'

/**
 * Home-page data.
 *
 * Each `load…` function tries the dedicated endpoint first (docs/API_REFERENCE.md: `home/continue/`,
 * `users/me/impact/`, `users/me/pending-count/`, `manage/projects/`) and, if the server answers 404 because
 * it isn't deployed yet, falls back to deriving the same data from the older endpoints. Components consume
 * the shapes below and don't care which path produced them.
 */

/** What a «Keep contributing» card needs. */
export interface ContinueItem {
  id: number
  name: LocalizedString
  cover: string | null
  organization?: string
  observations: number
  lastObservation: string | null
  ended: boolean
}

export interface Impact {
  observations: number
  projectsParticipating: number
  thisMonth: { value: number; previous: number; deltaPct: number | null; direction: 'up' | 'down' | 'flat' }
  lastObservation: string | null
  streakWeeks: number
}

export interface ManageSummary {
  active: number
  drafts: number
}

const time = (iso?: string | null) => (iso ? new Date(iso).getTime() : 0)

/** Projects the user takes part in (own, administered or contributed to), most recent activity first. */
export function buildContinue(participating: Project[], admin: Project[]): Project[] {
  const byId = new Map<number, Project>()
  for (const p of [...admin, ...participating]) {
    if (!p.draft) byId.set(p.id, p)
  }
  return [...byId.values()].sort((a, b) => time(b.last_observation) - time(a.last_observation))
}

export function buildManage(admin: Project[]): ManageSummary {
  return {
    active: admin.filter((p) => !p.draft && !p.ended).length,
    drafts: admin.filter((p) => p.draft).length,
  }
}

export function buildImpact(observations: Observation[], participating: Project[], admin: Project[]): Impact {
  const now = new Date()

  let thisMonth = 0
  let prevMonth = 0
  let last = 0
  const weeks = new Set<number>()
  const projectIds = new Set<number>(participating.map((p) => p.id))
  for (const o of observations) {
    if (o.project_id) projectIds.add(o.project_id)
    const ts = time(o.timestamp)
    if (ts > last) last = ts
    const gap = differenceInCalendarMonths(now, ts)
    if (gap === 0) thisMonth++
    else if (gap === 1) prevMonth++
    weeks.add(startOfWeek(ts, { weekStartsOn: 1 }).getTime())
  }

  // Consecutive weeks with a contribution; an empty current week doesn't break the streak yet.
  let cursor = startOfWeek(now, { weekStartsOn: 1 })
  if (!weeks.has(cursor.getTime())) cursor = subWeeks(cursor, 1)
  let streakWeeks = 0
  while (weeks.has(cursor.getTime())) {
    streakWeeks++
    cursor = subWeeks(cursor, 1)
  }

  const deltaPct = prevMonth === 0 ? null : Math.round(((thisMonth - prevMonth) * 100) / prevMonth)
  const direction = thisMonth > prevMonth ? 'up' : thisMonth < prevMonth ? 'down' : 'flat'

  // Administered projects with no contribution of the user still count as participation.
  for (const p of admin) if (!p.draft) projectIds.add(p.id)

  return {
    observations: observations.length,
    projectsParticipating: projectIds.size,
    thisMonth: { value: thisMonth, previous: prevMonth, deltaPct, direction },
    lastObservation: last ? new Date(last).toISOString() : null,
    streakWeeks,
  }
}

// ─── Dedicated endpoints with fallback ───────────────────────────────────────

/** Endpoints that answered 404 in this session: not retried on every poll. */
const unavailable = new Set<string>()

async function tryEndpoint<T>(key: string, call: () => Promise<T>): Promise<T | undefined> {
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

function projectToContinueItem(p: Project): ContinueItem {
  const org = p.organizations?.[0] as { principalName?: string } | undefined
  return {
    id: p.id,
    name: p.name,
    cover: projectCoverUrl(p),
    organization: org?.principalName,
    observations: projectObservations(p),
    lastObservation: p.last_observation ?? null,
    ended: !!p.ended,
  }
}

interface ContinueResponse {
  id: number
  name: string
  cover: string | null
  organizations: { principalName?: string }[]
  observations_count: number
  last_observation: string | null
  ended: boolean
}

export async function loadContinue(): Promise<ContinueItem[]> {
  const fresh = await tryEndpoint('home/continue', () =>
    api.get<ContinueResponse[]>('/home/continue/').then((r) => r.data),
  )
  if (fresh) {
    return fresh.map((p) => ({
      id: p.id,
      name: p.name,
      cover: p.cover,
      organization: p.organizations?.[0]?.principalName,
      observations: p.observations_count,
      lastObservation: p.last_observation,
      ended: p.ended,
    }))
  }
  const [participating, admin] = await Promise.all([projectsApi.myParticipating(), projectsApi.myAdminProjects()])
  return buildContinue(participating, admin).map(projectToContinueItem)
}

interface ImpactResponse {
  observations: number
  projects_participating: number
  this_month: { value: number; previous: number; delta_pct: number | null; direction: 'up' | 'down' | 'flat' }
  last_observation: string | null
  streak_weeks: number
}

export async function loadImpact(): Promise<Impact> {
  const fresh = await tryEndpoint('users/me/impact', () =>
    api.get<ImpactResponse>('/users/me/impact/').then((r) => r.data),
  )
  if (fresh) {
    return {
      observations: fresh.observations,
      projectsParticipating: fresh.projects_participating,
      thisMonth: {
        value: fresh.this_month.value,
        previous: fresh.this_month.previous,
        deltaPct: fresh.this_month.delta_pct,
        direction: fresh.this_month.direction,
      },
      lastObservation: fresh.last_observation,
      streakWeeks: fresh.streak_weeks,
    }
  }
  const [observations, participating, admin] = await Promise.all([
    projectsApi.myObservations(),
    projectsApi.myParticipating(),
    projectsApi.myAdminProjects(),
  ])
  return buildImpact(observations, participating, admin)
}

export async function loadManageSummary(): Promise<ManageSummary> {
  const fresh = await tryEndpoint('manage/projects', () =>
    api
      .get<{ counts: { active: number; draft: number; ended: number } }>('/manage/projects/', { params: { page_size: 1 } })
      .then((r) => r.data),
  )
  if (fresh) return { active: fresh.counts.active, drafts: fresh.counts.draft }
  return buildManage(await projectsApi.myAdminProjects())
}

/** Pending invitations (projects + organizations) for the bell. */
export async function loadPendingCount(): Promise<number> {
  const fresh = await tryEndpoint('users/me/pending-count', () =>
    api.get<{ invitations: number }>('/users/me/pending-count/').then((r) => r.data),
  )
  if (fresh) return fresh.invitations
  const [orgs, projects] = await Promise.all([orgsApi.pendingInvitations(), projectsApi.pendingInvitations()])
  return orgs.length + projects.length
}

