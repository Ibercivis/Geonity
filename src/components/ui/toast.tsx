import { XIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ToastProps = {
  open: boolean
  title: string
  description?: string | null
  variant?: 'default' | 'destructive' | 'success'
  onClose: () => void
}

function ToastViewport({ children }: { children: React.ReactNode }) {
  return <div className="pointer-events-none fixed top-4 right-4 z-[70] flex w-full max-w-sm flex-col gap-2 p-4">{children}</div>
}

function Toast({ open, title, description, variant = 'default', onClose }: ToastProps) {
  if (!open) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'pointer-events-auto rounded-xl border bg-background p-4 shadow-lg ring-1 ring-border',
        variant === 'destructive' && 'border-destructive bg-destructive text-destructive-foreground ring-destructive/20',
        variant === 'success' && 'border-emerald-600 bg-emerald-600 text-white ring-emerald-600/20 dark:border-emerald-500 dark:bg-emerald-500 dark:text-emerald-950'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{title}</p>
          {description ? (
            <p className={cn('mt-1 text-sm', variant === 'default' ? 'text-muted-foreground' : 'text-current/90')}>
              {description}
            </p>
          ) : null}
        </div>
        <Button type="button" variant="ghost" size="icon-xs" className="shrink-0" onClick={onClose}>
          <XIcon />
          <span className="sr-only">Cerrar</span>
        </Button>
      </div>
    </div>
  )
}

export { Toast, ToastViewport }
