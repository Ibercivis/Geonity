import type { Project, Topic } from '@/types'
import { resolveLocalized } from '@/lib/utils'

/**
 * Explore filtering, sorting and autocomplete, done in the client over `GET /project/`.
 *
 * When the backend gets `GET /explore/projects/` and `/explore/projects/suggest/`
 * (see docs/API_PENDIENTE_REACT.md §1–§2), replace these functions with API calls; the page keeps the same
 * `ExploreFilters` shape.
 */

export type ExploreStatus = 'active' | 'ended' | 'all'
export type ExploreAccess = 'all' | 'public' | 'protected'
export type ExploreSort = 'recommended' | 'last_observation' | 'created_at' | 'observations' | 'likes'

export interface ExploreFilters {
  search: string
  topic: string
  country: string
  status: ExploreStatus
  access: ExploreAccess
  sort: ExploreSort
}

export const DEFAULT_FILTERS: ExploreFilters = {
  search: '',
  topic: '',
  country: '',
  status: 'active',
  access: 'all',
  sort: 'recommended',
}

export const STATUS_VALUES: ExploreStatus[] = ['active', 'ended', 'all']
export const ACCESS_VALUES: ExploreAccess[] = ['all', 'public', 'protected']
export const SORT_VALUES: ExploreSort[] = ['recommended', 'last_observation', 'created_at', 'observations', 'likes']

const RECENT_MS = 30 * 24 * 3600 * 1000
const time = (iso?: string | null) => (iso ? new Date(iso).getTime() : 0)

/** Lowercase and strip accents so «agua» matches «Água». */
export function normalize(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim()
}

function projectCountries(p: Project): string[] {
  if (typeof p.countries === 'string') {
    try {
      return JSON.parse(p.countries || '[]')
    } catch {
      return []
    }
  }
  return p.countries ?? []
}

/** The list endpoint returns topics as `{ id, topic }` objects; the detail one as plain ids. Accept both. */
function projectTopicIds(p: Project): number[] {
  const raw = (Array.isArray(p.topic) ? p.topic : p.topic != null ? [p.topic] : []) as (number | { id: number })[]
  return raw.map((t) => (typeof t === 'object' ? t.id : t))
}

function matchesSearch(p: Project, query: string, lang: string, topics: Topic[]): boolean {
  const q = normalize(query)
  if (!q) return true
  const haystack = [
    resolveLocalized(p.name, lang),
    ...projectTopicIds(p).map((id) => topics.find((t) => t.id === id)?.topic ?? ''),
  ]
  return haystack.some((s) => normalize(s).includes(q))
}

export function filterProjects(projects: Project[], f: ExploreFilters, lang: string, topics: Topic[]): Project[] {
  return projects.filter((p) => {
    if (p.draft) return false
    if (f.status === 'active' && p.ended) return false
    if (f.status === 'ended' && !p.ended) return false
    if (f.access === 'public' && p.is_private) return false
    if (f.access === 'protected' && !p.is_private) return false
    if (f.topic && !projectTopicIds(p).includes(Number(f.topic))) return false
    if (f.country && !p.is_global && !projectCountries(p).includes(f.country)) return false
    return matchesSearch(p, f.search, lang, topics)
  })
}

const observationsOf = (p: Project) => p.observation_count ?? p.contributions ?? 0

export function sortProjects(projects: Project[], sort: ExploreSort): Project[] {
  const byRecent = (a: Project, b: Project) => time(b.last_observation) - time(a.last_observation)
  const list = [...projects]
  switch (sort) {
    case 'last_observation':
      return list.sort(byRecent)
    case 'created_at':
      return list.sort((a, b) => time(b.created_at) - time(a.created_at))
    case 'observations':
      return list.sort((a, b) => observationsOf(b) - observationsOf(a))
    case 'likes':
      return list.sort((a, b) => b.total_likes - a.total_likes)
    default: {
      // Recommended: active first, then recent activity, then likes.
      const now = Date.now()
      const rank = (p: Project) => (p.ended ? 0 : 2) + (now - time(p.last_observation) < RECENT_MS ? 1 : 0)
      return list.sort((a, b) => rank(b) - rank(a) || b.total_likes - a.total_likes || byRecent(a, b))
    }
  }
}

export interface ProjectSuggestion {
  id: number
  name: string
  organization?: string
  ended: boolean
}

const MAX_SUGGESTIONS = 8

/** Autocomplete: names starting with the query first, then names containing it. */
export function suggestProjects(projects: Project[], query: string, lang: string): ProjectSuggestion[] {
  const q = normalize(query)
  if (q.length < 2) return []
  const starts: ProjectSuggestion[] = []
  const contains: ProjectSuggestion[] = []
  for (const p of projects) {
    if (p.draft) continue
    const name = resolveLocalized(p.name, lang)
    const n = normalize(name)
    if (!n.includes(q)) continue
    const org = (p.organizations?.[0] as { principalName?: string } | undefined)?.principalName
    ;(n.startsWith(q) ? starts : contains).push({ id: p.id, name, organization: org, ended: !!p.ended })
  }
  return [...starts, ...contains].slice(0, MAX_SUGGESTIONS)
}
