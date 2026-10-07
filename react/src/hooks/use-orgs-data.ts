import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { orgsApi } from '@/api/organizations'
import { buildOrgStats } from '@/api/orgExplore'
import { useAllProjects } from '@/hooks/use-all-projects'

/** Organizations, their types and per-organization project counters (derived from the project list). */
export function useOrgsData() {
  const orgs = useQuery({ queryKey: ['organizations', 'all'], queryFn: orgsApi.list })
  const types = useQuery({ queryKey: ['organization-types'], queryFn: orgsApi.types, staleTime: 5 * 60_000 })
  const projects = useAllProjects()
  const stats = useMemo(() => buildOrgStats(projects.data ?? []), [projects.data])
  return { orgs, types, projects, stats }
}
