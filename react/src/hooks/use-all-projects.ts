import { useQuery } from '@tanstack/react-query'
import { projectsApi } from '@/api/projects'

/** Every published project, shared by Explore and the search autocomplete (single request, cached). */
export function useAllProjects() {
  return useQuery({ queryKey: ['explore', 'all'], queryFn: () => projectsApi.list() })
}
