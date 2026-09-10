import { lazy, Suspense, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

// Stats pages pull in Recharts; load them on demand so the main bundle stays as it was.
const ProjectStatsPage = lazy(() => import('@/pages/ProjectStatsPage').then((m) => ({ default: m.ProjectStatsPage })))
const MyStatsPage = lazy(() => import('@/pages/MyStatsPage').then((m) => ({ default: m.MyStatsPage })))
const PlatformStatsPage = lazy(() => import('@/pages/PlatformStatsPage').then((m) => ({ default: m.PlatformStatsPage })))

function Loading({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      }
    >
      {children}
    </Suspense>
  )
}

export function ProjectStatsPageLazy() {
  return <Loading><ProjectStatsPage /></Loading>
}

export function MyStatsPageLazy() {
  return <Loading><MyStatsPage /></Loading>
}

export function PlatformStatsPageLazy() {
  return <Loading><PlatformStatsPage /></Loading>
}
