import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { UserPlus } from 'lucide-react'
import { projectsApi } from '@/api/projects'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'

interface InviteAdminDialogProps {
  projectId: number
  projectName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InviteAdminDialog({ projectId, projectName, open, onOpenChange }: InviteAdminDialogProps) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [email, setEmail] = useState('')

  const { data: pending = [], isLoading } = useQuery({
    queryKey: ['project-invitations', projectId],
    queryFn: () => projectsApi.invitations(projectId),
    enabled: open,
  })

  const invite = useMutation({
    mutationFn: (value: string) => projectsApi.invite(projectId, value),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project-invitations', projectId] })
      toast({ title: t('invitationSent') })
      setEmail('')
    },
    onError: () => toast({ title: t('error'), variant: 'destructive' }),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            {t('inviteByEmail')} — {projectName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-1">
          <Label>{t('email')}</Label>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && email && invite.mutate(email)}
            />
            <Button onClick={() => invite.mutate(email)} disabled={!email || invite.isPending}>
              {invite.isPending ? t('loading') : t('inviteByEmail')}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs uppercase tracking-wide">{t('pendingInvitations')}</Label>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">{t('loading')}</p>
          ) : pending.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('noResults')}</p>
          ) : (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {pending.map((inv: { id: number; email?: string; invited_user?: { email?: string } }) => (
                <div key={inv.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <span className="text-muted-foreground truncate">{inv.email ?? inv.invited_user?.email ?? `#${inv.id}`}</span>
                  <Badge variant="outline" className="text-xs shrink-0 ml-2">Pending</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('cancel')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
