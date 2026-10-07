import { api } from '@/lib/axios'
import { tryEndpoint } from '@/api/endpoint-fallback'
import { projectsApi } from '@/api/projects'
import { projectCoverUrl, projectObservations } from '@/components/home/project-utils'
import type { LocalizedString, Project } from '@/types'

/**
 * Data for the Manage screen.
 *
 * `loadManagePage` uses `GET /manage/projects/` (light rows, tab counters and pagination computed by the server) and, if the
 * server answers 404 because it isn't deployed, falls back to splitting `GET /project/my_admin_projects/` in the client.
 */

export type ManageTab = 'active' | 'draft' | 'ended'
export const MANAGE_TABS: ManageTab[] = ['active', 'draft', 'ended']
export const MANAGE_PAGE_SIZE = 20

/** One row of the Manage list. */
export interface ManageProject {
  id: number
  name: LocalizedString
  cover: string | null
  organization?: string
  role: 'owner' | 'admin'
  draft: boolean
  ended: boolean
  /** Distinct people who contributed; not available from the fallback endpoint. */
  participants?: number
  observations: number
  lastActivity: string | null
}

export interface ManagePageData {
  counts: Record<ManageTab, number>
  /** Total rows in the requested tab. */
  count: number
  results: ManageProject[]
}

interface ManageResponse {
  counts: Record<ManageTab, number>
  count: number
  results: {
    id: number
    name: string
    cover: string | null
    organizations: { principalName?: string }[]
    role: 'owner' | 'admin'
    draft: boolean
    ended: boolean
    participants_count: number
    observations_count: number
    last_activity_at: string | null
  }[]
}

export async function loadManagePage(tab: ManageTab, page: number): Promise<ManagePageData> {
  const fresh = await tryEndpoint('manage/projects', () =>
    api
      .get<ManageResponse>('/manage/projects/', { params: { status: tab, page, page_size: MANAGE_PAGE_SIZE } })
      .then((r) => r.data),
  )
  if (fresh) {
    return {
      counts: fresh.counts,
      count: fresh.count,
      results: fresh.results.map((p) => ({
        id: p.id,
        name: p.name,
        cover: p.cover,
        organization: p.organizations?.[0]?.principalName,
        role: p.role,
        draft: p.draft,
        ended: p.ended,
        participants: p.participants_count,
        observations: p.observations_count,
        lastActivity: p.last_activity_at,
      })),
    }
  }
  return legacyManagePage(await projectsApi.myAdminProjects(), tab, page)
}

// ─── Fallback over the older endpoint ────────────────────────────────────────

function tabOf(p: Project): ManageTab {
  if (p.draft) return 'draft'
  return p.ended ? 'ended' : 'active'
}

function projectToManageProject(p: Project): ManageProject {
  const org = p.organizations?.[0] as { principalName?: string } | undefined
  return {
    id: p.id,
    name: p.name,
    cover: projectCoverUrl(p),
    organization: org?.principalName,
    role: p.is_creator ? 'owner' : 'admin',
    draft: !!p.draft,
    ended: !!p.ended,
    observations: projectObservations(p),
    lastActivity: p.last_activity_at ?? p.last_observation ?? null,
  }
}

export function legacyManagePage(projects: Project[], tab: ManageTab, page: number): ManagePageData {
  const groups: Record<ManageTab, Project[]> = { active: [], draft: [], ended: [] }
  for (const p of projects) groups[tabOf(p)].push(p)
  const time = (p: Project) => new Date(p.last_observation ?? p.updated_at ?? p.created_at ?? 0).getTime()
  for (const key of MANAGE_TABS) groups[key].sort((a, b) => time(b) - time(a))
  const start = (page - 1) * MANAGE_PAGE_SIZE
  return {
    counts: { active: groups.active.length, draft: groups.draft.length, ended: groups.ended.length },
    count: groups[tab].length,
    results: groups[tab].slice(start, start + MANAGE_PAGE_SIZE).map(projectToManageProject),
  }
}
