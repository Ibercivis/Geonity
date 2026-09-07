import { lazy, Suspense } from 'react'
import { Loader2 } from 'lucide-react'

// Anonymous QR contribution page: public and lazy-loaded so its chunk doesn't
// pull in the authenticated app (Tiptap, dnd-kit, project management…).
const ContributePage = lazy(() => import('@/pages/ContributePage').then((m) => ({ default: m.ContributePage })))

export function ContributePageLazy() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      }
    >
      <ContributePage />
    </Suspense>
  )
}
