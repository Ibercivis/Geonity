import DOMPurify from 'dompurify'
import type { Organization, Project } from '@/types'
import { normalize } from '@/api/explore'
import type { OrgType } from '@/api/organizations'

/**
 * Organizations screen data, derived in the client from `GET /organization/` (no counters) and the project list.
 *
 * When the backend exposes `GET /organizations/explore/`, `/featured/`, `/type-counts/` and `/suggest/`
 * (docs/API_PENDIENTE_REACT.md §5), replace this module; the page keeps the `OrgFilters` shape.
 */

export type OrgActivity = 'active' | 'all'
export type OrgSort = 'relevant' | 'projects' | 'name'

export interface OrgFilters {
  search: string
  type: string
  country: string
  activity: OrgActivity
  mine: boolean
  sort: OrgSort
}

export const DEFAULT_ORG_FILTERS: OrgFilters = {
  search: '',
  type: '',
  country: '',
  activity: 'all',
  mine: false,
  sort: 'relevant',
}

export const ORG_ACTIVITY_VALUES: OrgActivity[] = ['active', 'all']
export const ORG_SORT_VALUES: OrgSort[] = ['relevant', 'projects', 'name']
export const FEATURED_LIMIT = 6

export interface OrgStats {
  /** Published, non-private projects. */
  projects: number
  /** Of those, not ended. */
  activeProjects: number
  observations: number
  /** Not available from the project list; the API will provide it. */
  participants?: number
}

/** Type ids of an organization. The list returns ids; tolerate nested `{ id }` objects too. */
export function orgTypeIds(o: Organization): number[] {
  return ((o.type ?? []) as unknown[]).map((t) => Number(typeof t === 'object' && t ? (t as { id: number }).id : t))
}

export const orgName = (o: Organization) => o.principalName || o.principal_name || o.name || ''

/** Description arrives as sanitized rich text; cards want plain text. */
export function orgDescriptionText(o: Organization): string {
  if (!o.description) return ''
  const clean = DOMPurify.sanitize(o.description, { ALLOWED_TAGS: [] })
  return clean.replace(/\s+/g, ' ').trim()
}

export function buildOrgStats(projects: Project[]): Map<number, OrgStats> {
  const stats = new Map<number, OrgStats>()
  for (const p of projects) {
    if (p.draft || p.is_private) continue
    for (const org of p.organizations ?? []) {
      const s = stats.get(org.id) ?? { projects: 0, activeProjects: 0, observations: 0 }
      s.projects++
      if (!p.ended) s.activeProjects++
      s.observations += p.observation_count ?? p.contributions ?? 0
      stats.set(org.id, s)
    }
  }
  return stats
}

const EMPTY: OrgStats = { projects: 0, activeProjects: 0, observations: 0 }
const statsOf = (stats: Map<number, OrgStats>, o: Organization) => stats.get(o.id) ?? EMPTY

function relevance(a: OrgStats, b: OrgStats) {
  return b.activeProjects - a.activeProjects || (b.participants ?? 0) - (a.participants ?? 0)
    || b.observations - a.observations || b.projects - a.projects
}

export function filterOrgs(orgs: Organization[], f: OrgFilters, stats: Map<number, OrgStats>): Organization[] {
  const q = normalize(f.search)
  return orgs.filter((o) => {
    if (f.mine && !(o.is_creator || o.is_admin || o.is_member)) return false
    if (f.activity === 'active' && statsOf(stats, o).activeProjects === 0) return false
    if (f.type && !orgTypeIds(o).includes(Number(f.type))) return false
    if (f.country && !o.is_global && !(o.countries ?? []).includes(f.country)) return false
    return !q || normalize(orgName(o)).includes(q)
  })
}

export function sortOrgs(orgs: Organization[], sort: OrgSort, stats: Map<number, OrgStats>): Organization[] {
  const list = [...orgs]
  const byName = (a: Organization, b: Organization) => orgName(a).localeCompare(orgName(b))
  switch (sort) {
    case 'name':
      return list.sort(byName)
    case 'projects':
      return list.sort((a, b) => statsOf(stats, b).projects - statsOf(stats, a).projects || byName(a, b))
    default:
      return list.sort((a, b) => relevance(statsOf(stats, a), statsOf(stats, b)) || byName(a, b))
  }
}

/** The most relevant organizations with projects; if none has any, the most relevant overall. */
export function featuredOrgs(orgs: Organization[], stats: Map<number, OrgStats>): Organization[] {
  const withProjects = orgs.filter((o) => statsOf(stats, o).projects > 0)
  return sortOrgs(withProjects.length > 0 ? withProjects : orgs, 'relevant', stats).slice(0, FEATURED_LIMIT)
}

export function orgStatsOf(stats: Map<number, OrgStats>, o: Organization): OrgStats {
  return statsOf(stats, o)
}

export function typeCounts(orgs: Organization[], types: OrgType[]): { type: OrgType; count: number }[] {
  return types
    .map((type) => ({ type, count: orgs.filter((o) => orgTypeIds(o).includes(type.id)).length }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count)
}

export function suggestOrgs(orgs: Organization[], query: string, limit = 8): Organization[] {
  const q = normalize(query)
  if (q.length < 2) return []
  const starts: Organization[] = []
  const contains: Organization[] = []
  for (const o of orgs) {
    const n = normalize(orgName(o))
    if (!n.includes(q)) continue
    ;(n.startsWith(q) ? starts : contains).push(o)
  }
  return [...starts, ...contains].slice(0, limit)
}

/** Compact numbers: 4200 → «4.2k» (locale-aware). */
export function formatCompact(n: number, lang: string): string {
  return new Intl.NumberFormat(lang, { notation: 'compact', maximumFractionDigits: 1 }).format(n)
}
