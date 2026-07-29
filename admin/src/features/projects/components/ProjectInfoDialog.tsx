import { CheckCircle2, Clock, Info, Lock, LockOpen, Mail, RefreshCw, Send, ShieldCheck, UserMinus, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { LOCALE_MAP, type Language } from '@/i18n'
import type { ProjectInvitation, ProjectOption, ProjectParticipant } from '@/types/project'

function initials(label: string) {
  return label.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

function ParticipantList({
  participants,
  emptyLabel,
  canRemove,
  removingParticipantId,
  onRemove,
}: {
  participants: ProjectParticipant[]
  emptyLabel: string
  canRemove?: boolean
  removingParticipantId?: string | null
  onRemove?: (participant: ProjectParticipant) => void
}) {
  if (participants.length === 0) {
    return <p className="text-sm text-muted-foreground italic">{emptyLabel}</p>
  }

  return (
    <div className="space-y-1.5">
      {participants.map((participant, index) => (
        <div key={`${participant.id ?? participant.label}-${index}`} className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {initials(participant.label || '?')}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{participant.label}</div>
            {participant.email ? (
              <div className="truncate text-xs text-muted-foreground">{participant.email}</div>
            ) : null}
          </div>
          {canRemove && participant.id !== undefined && onRemove ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => onRemove(participant)}
              disabled={removingParticipantId === String(participant.id)}
            >
              <UserMinus className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      ))}
    </div>
  )
}

type ProjectInfoDialogProps = {
  open: boolean
  project: ProjectOption | null
  canManageParticipants: boolean
  canRemoveAdministrators: boolean
  invitations: ProjectInvitation[]
  isLoadingInvitations: boolean
  invitationsError: string | null
  inviteEmail: string
  onInviteEmailChange: (value: string) => void
  isSendingInvitation: boolean
  removingAdministratorId: string | null
  onRemoveAdministrator: (participant: ProjectParticipant) => void
  onSendInvitation: () => void
  onRefreshInvitations: () => void
  onClose: () => void
}

export function ProjectInfoDialog({
  open,
  project,
  canManageParticipants,
  canRemoveAdministrators,
  invitations,
  isLoadingInvitations,
  invitationsError,
  inviteEmail,
  onInviteEmailChange,
  isSendingInvitation,
  removingAdministratorId,
  onRemoveAdministrator,
  onSendInvitation,
  onRefreshInvitations,
  onClose,
}: ProjectInfoDialogProps) {
  const { t, i18n } = useTranslation()
  const locale = LOCALE_MAP[i18n.language as Language] ?? 'es-ES'

  function formatDate(value?: string | null): string {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const creatorParticipants = project?.creator ? [project.creator] : []
  const administrators = Array.isArray(project?.administrators) ? project.administrators : []

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (!nextOpen ? onClose() : null)}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden p-0 sm:max-w-2xl" showCloseButton>
        <div className="flex max-h-[85vh] flex-col overflow-hidden">

          {/* Header — dark band matching topbar */}
          <div className="bg-brand-900 px-6 py-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-white">
                <Info className="h-4 w-4 text-white/70" />
                {t('projectInfo.title')}
              </DialogTitle>
              <DialogDescription className="text-white/80">
                {project?.name ?? t('projectInfo.selectProject')}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex-1 space-y-6 overflow-auto px-6 py-5">
            {!project ? (
              <Alert>
                <AlertDescription>{t('projectInfo.noProject')}</AlertDescription>
              </Alert>
            ) : null}

            {/* Privacy flags */}
            {project ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3">
                  {project.isPrivate
                    ? <Lock className="h-4 w-4 shrink-0 text-amber-500" />
                    : <LockOpen className="h-4 w-4 shrink-0 text-emerald-500" />}
                  <div>
                    <div className="text-xs font-medium text-muted-foreground">{t('projectInfo.privacyProject')}</div>
                    <div className="text-sm font-semibold">
                      {project.isPrivate ? t('projectInfo.privateProject') : t('projectInfo.publicProject')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3">
                  {project.privateData
                    ? <Lock className="h-4 w-4 shrink-0 text-amber-500" />
                    : <LockOpen className="h-4 w-4 shrink-0 text-emerald-500" />}
                  <div>
                    <div className="text-xs font-medium text-muted-foreground">{t('projectInfo.privacyDb')}</div>
                    <div className="text-sm font-semibold">
                      {project.privateData ? t('projectInfo.privateDb') : t('projectInfo.publicDb')}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Participants */}
            {project && canManageParticipants ? (
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">{t('projectInfo.creator')}</h3>
                  </div>
                  <ParticipantList participants={creatorParticipants} emptyLabel={t('projectInfo.noCreator')} />
                </div>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">{t('projectInfo.administrators')}</h3>
                    {administrators.length > 0 ? (
                      <Badge variant="secondary" className="ml-auto">{administrators.length}</Badge>
                    ) : null}
                  </div>
                  <ParticipantList
                    participants={administrators}
                    emptyLabel={t('projectInfo.noAdministrators')}
                    canRemove={canRemoveAdministrators}
                    removingParticipantId={removingAdministratorId}
                    onRemove={onRemoveAdministrator}
                  />
                </div>
              </div>
            ) : project ? (
              <Alert>
                <AlertDescription>{t('projectInfo.adminOnly')}</AlertDescription>
              </Alert>
            ) : null}

            {/* Invitations */}
            {project && canManageParticipants ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">{t('projectInfo.invitations')}</h3>
                  </div>
                  <Button type="button" variant="ghost" size="sm" className="h-7 gap-1.5 px-2 text-muted-foreground hover:text-foreground" onClick={onRefreshInvitations} disabled={isLoadingInvitations}>
                    <RefreshCw className={isLoadingInvitations ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} />
                    {t('projectInfo.reload')}
                  </Button>
                </div>

                {/* Invite form */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="project-invite-email"
                      value={inviteEmail}
                      onChange={(event) => onInviteEmailChange(event.target.value)}
                      placeholder={t('projectInfo.emailPlaceholder')}
                      className="pl-9"
                      disabled={isSendingInvitation}
                    />
                  </div>
                  <Button type="button" size="sm" className="gap-2" onClick={onSendInvitation} disabled={isSendingInvitation || !inviteEmail.trim()}>
                    <Send className="h-4 w-4" />
                    {isSendingInvitation ? t('projectInfo.inviting') : t('projectInfo.invite')}
                  </Button>
                </div>

                {invitationsError ? (
                  <Alert variant="destructive">
                    <AlertDescription>{invitationsError}</AlertDescription>
                  </Alert>
                ) : null}

                {isLoadingInvitations ? (
                  <div className="space-y-1.5">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : invitations.length > 0 ? (
                  <div className="space-y-1.5">
                    {invitations.map((invitation) => (
                      <div key={invitation.id} className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                          {invitation.acceptedAt
                            ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            : <Clock className="h-4 w-4 text-amber-500" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">{invitation.email}</div>
                          <div className="text-xs text-muted-foreground">
                            {invitation.acceptedAt
                              ? t('projectInfo.acceptedAt', { date: formatDate(invitation.acceptedAt) })
                              : t('projectInfo.createdAt', { date: formatDate(invitation.createdAt) })}
                          </div>
                        </div>
                        <Badge
                          variant={invitation.acceptedAt ? 'default' : 'outline'}
                          className={invitation.acceptedAt ? 'bg-emerald-500/10 text-emerald-700 border-emerald-200' : 'text-amber-600 border-amber-200'}
                        >
                          {invitation.status ?? (invitation.acceptedAt ? t('projectInfo.accepted') : t('projectInfo.pending'))}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm italic text-muted-foreground">{t('projectInfo.noInvitations')}</p>
                )}
              </div>
            ) : null}
          </div>

          <div className="flex justify-end border-t bg-muted/20 px-6 py-3">
            <Button type="button" size="sm" variant="outline" onClick={onClose}>
              {t('projectInfo.close')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
