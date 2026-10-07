import * as React from 'react'
import { useTranslation } from 'react-i18next'

import { Mail } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type ObservationEmailDraft = {
  subject: string
  includeObservationData: boolean
  allowReply: boolean
  introText: string
  body: string
}

type SendObservationEmailDialogProps = {
  open: boolean
  observationId: string | null
  initialDraft: ObservationEmailDraft
  isSending: boolean
  error: string | null
  onClose: () => void
  onSubmit: (draft: ObservationEmailDraft) => void
}

export function SendObservationEmailDialog({
  open,
  observationId,
  initialDraft,
  isSending,
  error,
  onClose,
  onSubmit,
}: SendObservationEmailDialogProps) {
  const { t } = useTranslation()
  const [draft, setDraft] = React.useState<ObservationEmailDraft>(initialDraft)

  React.useEffect(() => {
    if (!open) return
    setDraft(initialDraft)
  }, [initialDraft, open, observationId])

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (!nextOpen ? onClose() : null)}>
      <DialogContent className="max-h-[85vh] max-w-xl overflow-hidden p-0 sm:max-w-xl" showCloseButton>
        <div className="flex max-h-[85vh] flex-col overflow-hidden">

          {/* Header */}
          <div className="bg-brand-900 px-6 py-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-white">
                <Mail className="h-4 w-4 text-white/70" />
                {t('emailDialog.title')}
              </DialogTitle>
              <DialogDescription className="text-white/80">
                {t('emailDialog.observation', { id: observationId ?? '—' })}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex-1 space-y-4 overflow-auto px-6 py-5">
            <div className="space-y-1.5">
              <Label htmlFor="email-subject" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {t('emailDialog.subject')}
              </Label>
              <Input
                id="email-subject"
                value={draft.subject}
                onChange={(event) => setDraft((current) => ({ ...current, subject: event.target.value }))}
                placeholder={t('emailDialog.subjectPlaceholder')}
                disabled={isSending}
              />
            </div>

            <div className="flex cursor-pointer items-center justify-between rounded-lg border bg-muted/30 px-4 py-3 hover:bg-muted/50 transition-colors" onClick={() => !isSending && setDraft((c) => ({ ...c, includeObservationData: !c.includeObservationData }))}>
              <div className="space-y-0.5 pr-4">
                <span className="text-sm font-medium">{t('emailDialog.includeData')}</span>
                <p className="text-xs text-muted-foreground">{t('emailDialog.includeDataHelp')}</p>
              </div>
              <Switch
                checked={draft.includeObservationData}
                onCheckedChange={(checked) => setDraft((current) => ({ ...current, includeObservationData: checked }))}
                disabled={isSending}
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            <div className="flex cursor-pointer items-center justify-between rounded-lg border bg-muted/30 px-4 py-3 hover:bg-muted/50 transition-colors" onClick={() => !isSending && setDraft((c) => ({ ...c, allowReply: !c.allowReply }))}>
              <div className="space-y-0.5 pr-4">
                <span className="text-sm font-medium">{t('emailDialog.allowReply')}</span>
                <p className="text-xs text-muted-foreground">{t('emailDialog.allowReplyHelp')}</p>
              </div>
              <Switch
                checked={draft.allowReply}
                onCheckedChange={(checked) => setDraft((current) => ({ ...current, allowReply: checked }))}
                disabled={isSending}
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {draft.includeObservationData ? (
              <div className="space-y-1.5">
                <Label htmlFor="email-intro" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t('emailDialog.intro')}
                </Label>
                <Textarea
                  id="email-intro"
                  value={draft.introText}
                  onChange={(event) => setDraft((current) => ({ ...current, introText: event.target.value }))}
                  placeholder={t('emailDialog.introPlaceholder')}
                  disabled={isSending}
                  className="min-h-40"
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="email-body" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t('emailDialog.body')}
                </Label>
                <Textarea
                  id="email-body"
                  value={draft.body}
                  onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))}
                  placeholder={t('emailDialog.bodyPlaceholder')}
                  disabled={isSending}
                  className="min-h-40"
                />
              </div>
            )}

            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
          </div>

          <div className="flex justify-between border-t bg-muted/20 px-6 py-3">
            <Button type="button" size="sm" variant="outline" onClick={onClose} disabled={isSending}>
              {t('emailDialog.cancel')}
            </Button>
            <Button type="button" size="sm" className="gap-2" onClick={() => onSubmit(draft)} disabled={isSending || !draft.subject.trim()}>
              <Mail className="h-3.5 w-3.5" />
              {isSending ? t('emailDialog.sending') : t('emailDialog.send')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
