import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

interface Props {
  title: string
  subtitle?: ReactNode
  /** Where the back arrow goes. Defaults to history back. */
  backTo?: string
  controls?: ReactNode
  children: ReactNode
}

export function StatsPageShell({ title, subtitle, backTo, controls, children }: Props) {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto w-full px-4 md:px-6 py-6 space-y-6">
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <Button variant="ghost" size="icon" className="-ml-2 shrink-0" onClick={() => (backTo ? navigate(backTo) : navigate(-1))} aria-label="Back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-xl font-bold truncate">{title}</h1>
              {subtitle && <div className="text-sm text-muted-foreground">{subtitle}</div>}
            </div>
          </div>
          {controls}
        </div>
        {children}
      </div>
    </div>
  )
}
