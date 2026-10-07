import { useQuery } from '@tanstack/react-query'
import { fetchAppVersion, formatAppVersion } from '@/lib/app-version'
import { cn } from '@/lib/utils'

/** The deployed version, read from /version.json. Renders nothing when there is no version file (dev). */
export function VersionLabel({ className }: { className?: string }) {
  const { data } = useQuery({ queryKey: ['app-version'], queryFn: fetchAppVersion, staleTime: Infinity, retry: false })
  if (!data) return null
  return (
    <span
      className={cn('tabular-nums', className)}
      title={`Built ${data.builtAt}\ncommit ${data.commit}${data.dirty ? '\n(built with uncommitted changes)' : ''}`}
    >
      {formatAppVersion(data)}
    </span>
  )
}
