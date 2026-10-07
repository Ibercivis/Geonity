import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Building2, Check, X } from 'lucide-react'
import { orgsApi } from '@/api/organizations'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'

/** Pending organization invitations. Renders nothing when there are none. */
export function PendingInvitationsBanner() {
  const { t } = useTranslation()
  const qc = useQueryClient()

  const { data: pending = [] } = useQuery({
    queryKey: ['org-invitations-pending'],
    queryFn: orgsApi.pendingInvitations,
  })

  const accept = useMutation({
    mutationFn: (id: number) => orgsApi.acceptInvitation(id),
    onSuccess: () => {
      toast({ title: t('invitationAccepted') })
      qc.invalidateQueries({ queryKey: ['org-invitations-pending'] })
      qc.invalidateQueries({ queryKey: ['pending-count'] })
      qc.invalidateQueries({ queryKey: ['organizations'] })
    },
  })

  const reject = useMutation({
    mutationFn: (id: number) => orgsApi.rejectInvitation(id),
    onSuccess: () => {
      toast({ title: t('invitationDeclined') })
      qc.invalidateQueries({ queryKey: ['org-invitations-pending'] })
      qc.invalidateQueries({ queryKey: ['pending-count'] })
    },
  })

  if (pending.length === 0) return null

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
        {t('pendingInvitations')} ({pending.length})
      </p>
      {pending.map((inv) => (
        <div key={inv.id} className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3">
          <Building2 className="h-5 w-5 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{inv.organization_name ?? `Organization #${inv.organization}`}</p>
            <p className="text-xs capitalize text-muted-foreground">{inv.role}</p>
          </div>
          <Button
            size="sm" variant="outline" aria-label={t('reject')}
            className="h-7 border-destructive px-2 text-destructive hover:bg-destructive/10"
            disabled={reject.isPending} onClick={() => reject.mutate(inv.id)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" className="h-7 px-3" disabled={accept.isPending} onClick={() => accept.mutate(inv.id)}>
            <Check className="mr-1 h-3.5 w-3.5" /> {t('accept')}
          </Button>
        </div>
      ))}
    </div>
  )
}
