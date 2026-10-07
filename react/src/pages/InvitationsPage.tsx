import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Check, X, User, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { orgsApi } from '@/api/organizations'
import { projectsApi } from '@/api/projects'
import { toast } from '@/hooks/use-toast'
import type { OrgInvitation, ProjectInvitation } from '@/types'

// ─── Org invitation card ──────────────────────────────────────────────────────

function OrgInvitationCard({ inv }: { inv: OrgInvitation }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const acceptMutation = useMutation({
    mutationFn: () => orgsApi.acceptInvitation(inv.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pending-org-invitations'] })
      qc.invalidateQueries({ queryKey: ['pending-count'] })
      toast({ title: t('invitationAccepted') })
      navigate(`/organizations/${inv.organization}`)
    },
    onError: () => toast({ title: t('error'), variant: 'destructive' }),
  })

  const rejectMutation = useMutation({
    mutationFn: () => orgsApi.rejectInvitation(inv.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pending-org-invitations'] })
      qc.invalidateQueries({ queryKey: ['pending-count'] })
      toast({ title: t('invitationRejected') })
    },
    onError: () => toast({ title: t('error'), variant: 'destructive' }),
  })

  return (
    <Card className={inv.is_expired ? 'opacity-60' : ''}>
      <CardContent className="flex items-start gap-4 p-4">
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">Organization</Badge>
            {inv.is_expired && <Badge variant="destructive" className="text-xs">Expired</Badge>}
          </div>
          <p className="font-medium text-sm truncate">
            {inv.organization_name ?? `Organization #${inv.organization}`}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-xs capitalize">{inv.role}</Badge>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            {inv.invited_by_name && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" /> {inv.invited_by_name}
              </span>
            )}
            {inv.expires_at && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {t('expires')} {new Date(inv.expires_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        {!inv.is_expired && (
          <div className="flex gap-2 shrink-0">
            <Button size="sm" onClick={() => acceptMutation.mutate()} disabled={acceptMutation.isPending}>
              <Check className="h-4 w-4 mr-1" /> {t('accept')}
            </Button>
            <Button size="sm" variant="outline" onClick={() => rejectMutation.mutate()} disabled={rejectMutation.isPending}>
              <X className="h-4 w-4 mr-1" /> {t('reject')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Project invitation card ──────────────────────────────────────────────────

function ProjectInvitationCard({ inv }: { inv: ProjectInvitation }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const acceptMutation = useMutation({
    mutationFn: () => projectsApi.acceptInvitation(inv.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pending-project-invitations'] })
      qc.invalidateQueries({ queryKey: ['pending-count'] })
      toast({ title: t('invitationAccepted') })
      navigate(`/projects/${inv.project}`)
    },
    onError: () => toast({ title: t('error'), variant: 'destructive' }),
  })

  const rejectMutation = useMutation({
    mutationFn: () => projectsApi.rejectInvitation(inv.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pending-project-invitations'] })
      qc.invalidateQueries({ queryKey: ['pending-count'] })
      toast({ title: t('invitationRejected') })
    },
    onError: () => toast({ title: t('error'), variant: 'destructive' }),
  })

  return (
    <Card className={inv.is_expired ? 'opacity-60' : ''}>
      <CardContent className="flex items-start gap-4 p-4">
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">Project</Badge>
            {inv.is_expired && <Badge variant="destructive" className="text-xs">Expired</Badge>}
          </div>
          <p className="font-medium text-sm truncate">
            {inv.project_name ?? `Project #${inv.project}`}
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            {inv.invited_by_name && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" /> {inv.invited_by_name}
              </span>
            )}
            {inv.expires_at && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {t('expires')} {new Date(inv.expires_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        {!inv.is_expired && (
          <div className="flex gap-2 shrink-0">
            <Button size="sm" onClick={() => acceptMutation.mutate()} disabled={acceptMutation.isPending}>
              <Check className="h-4 w-4 mr-1" /> {t('accept')}
            </Button>
            <Button size="sm" variant="outline" onClick={() => rejectMutation.mutate()} disabled={rejectMutation.isPending}>
              <X className="h-4 w-4 mr-1" /> {t('reject')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function InvitationsPage() {
  const { t } = useTranslation()

  const { data: orgInvitations = [], isLoading: orgLoading, isError: orgError } = useQuery({
    queryKey: ['pending-org-invitations'],
    queryFn: orgsApi.pendingInvitations,
  })

  const { data: projectInvitations = [], isLoading: projectLoading, isError: projectError } = useQuery({
    queryKey: ['pending-project-invitations'],
    queryFn: projectsApi.pendingInvitations,
  })

  const isLoading = orgLoading || projectLoading
  const total = orgInvitations.length + projectInvitations.length

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="max-w-xl mx-auto w-full px-4 md:px-6 py-8 space-y-6">
        <h1 className="text-xl font-bold">{t('pendingInvitations')}</h1>

        {isLoading && <p className="text-muted-foreground">{t('loading')}</p>}

        {projectError && (
          <p className="text-xs text-destructive">Error loading project invitations</p>
        )}
        {orgError && (
          <p className="text-xs text-destructive">Error loading organization invitations</p>
        )}

        {!isLoading && total === 0 && !projectError && !orgError && (
          <div className="text-center py-16 text-muted-foreground">
            <p>No pending invitations.</p>
          </div>
        )}

        {projectInvitations.length > 0 && (
          <div className="space-y-3">
            {projectInvitations.map((inv) => (
              <ProjectInvitationCard key={inv.id} inv={inv} />
            ))}
          </div>
        )}

        {orgInvitations.length > 0 && (
          <div className="space-y-3">
            {orgInvitations.map((inv) => (
              <OrgInvitationCard key={inv.id} inv={inv} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
