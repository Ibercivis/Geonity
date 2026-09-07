import { Link, useRouteError } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

/** Friendly fallback for unexpected render errors on public routes. */
export function RouteErrorPage() {
  const { t } = useTranslation()
  const error = useRouteError()
  const message = error instanceof Error ? error.message : String(error ?? '')
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center px-6 gap-3 bg-background">
      <AlertTriangle className="h-10 w-10 text-muted-foreground" />
      <h1 className="text-lg font-semibold">{t('error')}</h1>
      {message && <p className="text-xs text-muted-foreground max-w-sm break-words font-mono">{message}</p>}
      <Button asChild variant="outline" size="sm" className="mt-2">
        <Link to="/">Geonity</Link>
      </Button>
    </div>
  )
}
