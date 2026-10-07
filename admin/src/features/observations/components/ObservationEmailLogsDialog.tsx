import * as React from 'react'
import { useTranslation } from 'react-i18next'

import { ChevronDown, ChevronUp, History } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LOCALE_MAP, type Language } from '@/i18n'
import type { ObservationEmailLog } from '@/types/observation'

type LogCardProps = {
  log: ObservationEmailLog
  formatDateTime: (value?: string | null) => string
}

function LogCard({ log, formatDateTime }: LogCardProps) {
  const { t } = useTranslation()
  const [open, setOpen] = React.useState(false)
  const hasBody = Boolean(log.body)
  const hasDetail = Boolean(log.message && log.message !== log.body)

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{log.status ?? log.event ?? 'log'}</Badge>
          {log.subject ? <span className="text-sm font-medium">{log.subject}</span> : null}
        </div>

        <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{t('emailLogs.date')}</div>
            <div>{formatDateTime(log.sent_at ?? log.created_at ?? log.updated_at)}</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{t('emailLogs.sentBy')}</div>
            <div>{log.sent_by_username ?? (log.sent_by != null ? String(log.sent_by) : '—')}</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{t('emailLogs.attachedData')}</div>
            <div>{log.include_observation_data === null ? '—' : log.include_observation_data ? t('emailLogs.yes') : t('emailLogs.no')}</div>
          </div>
        </div>

        {(hasBody || hasDetail) ? (
          <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors">
              {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {t('emailLogs.body')}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-1.5 space-y-2">
                {hasBody ? (
                  <p className="max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-md border bg-muted/30 p-3 text-sm">{log.body}</p>
                ) : null}
                {hasDetail ? (
                  <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">{log.message}</p>
                ) : null}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ) : null}
      </CardContent>
    </Card>
  )
}

type ObservationEmailLogsDialogProps = {
  open: boolean
  observationId: string | null
  logs: ObservationEmailLog[]
  isLoading: boolean
  error: string | null
  onClose: () => void
}

export function ObservationEmailLogsDialog({
  open,
  observationId,
  logs,
  isLoading,
  error,
  onClose,
}: ObservationEmailLogsDialogProps) {
  const { t, i18n } = useTranslation()
  const locale = LOCALE_MAP[i18n.language as Language] ?? 'es-ES'

  const sortedLogs = React.useMemo(
    () =>
      [...logs].sort((a, b) => {
        const ta = new Date(a.sent_at ?? a.created_at ?? a.updated_at ?? 0).getTime()
        const tb = new Date(b.sent_at ?? b.created_at ?? b.updated_at ?? 0).getTime()
        return tb - ta
      }),
    [logs]
  )

  function formatDateTime(value?: string | null): string {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (!nextOpen ? onClose() : null)}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden p-0 sm:max-w-2xl" showCloseButton>
        <div className="flex max-h-[85vh] flex-col overflow-hidden">
          <div className="bg-brand-900 px-6 py-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-white">
                <History className="h-4 w-4 text-white/70" />
                {t('emailLogs.title')}
              </DialogTitle>
              <DialogDescription className="text-white/80">
                {t('emailLogs.observation', { id: observationId ?? '—' })}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex-1 space-y-3 overflow-auto px-6 py-5">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">{t('emailLogs.loading')}</p>
            ) : null}

            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            {!isLoading && !error && logs.length === 0 ? (
              <Alert>
                <AlertDescription>{t('emailLogs.empty')}</AlertDescription>
              </Alert>
            ) : null}

            {!isLoading && !error
              ? sortedLogs.map((log, index) => (
                  <LogCard
                    key={String(log.id ?? `${log.created_at ?? 'log'}-${index}`)}
                    log={log}
                    formatDateTime={formatDateTime}
                  />
                ))
              : null}
          </div>

          <div className="flex justify-end border-t bg-muted/20 px-6 py-3">
            <Button type="button" size="sm" variant="outline" onClick={onClose}>
              {t('emailLogs.close')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
