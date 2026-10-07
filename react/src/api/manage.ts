import type { Project } from '@/types'

/**
 * «Manage» list helpers over `GET /project/my_admin_projects/`.
 * Replace with `GET /manage/projects/` when it exists (docs/API_PENDIENTE_REACT.md §7c.2).
 */

export type ManageTab = 'active' | 'draft' | 'ended'
export const MANAGE_TABS: ManageTab[] = ['active', 'draft', 'ended']

export function manageTabOf(p: Project): ManageTab {
  if (p.draft) return 'draft'
  return p.ended ? 'ended' : 'active'
}

export function splitByTab(projects: Project[]): Record<ManageTab, Project[]> {
  const out: Record<ManageTab, Project[]> = { active: [], draft: [], ended: [] }
  for (const p of projects) out[manageTabOf(p)].push(p)
  const time = (p: Project) => new Date(p.last_observation ?? p.updated_at ?? p.created_at ?? 0).getTime()
  for (const tab of MANAGE_TABS) out[tab].sort((a, b) => time(b) - time(a))
  return out
}

export const projectRole = (p: Project): 'owner' | 'admin' => (p.is_creator ? 'owner' : 'admin')
