import { useState, useMemo } from 'react'
import DOMPurify from 'dompurify'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Building2, Crown, ShieldCheck, Users, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { orgsApi } from '@/api/organizations'
import { mediaUrl } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import type { Organization } from '@/types'
import { CreateOrgDialog } from '@/components/organizations/CreateOrgDialog'

export function OrganizationsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [tab, setTab] = useState<'all' | 'mine'>('all')
  const [createOpen, setCreateOpen] = useState(false)

  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ['organizations', tab],
    queryFn: tab === 'mine' ? orgsApi.mine : orgsApi.list,
  })

  const { data: pendingInvitations = [] } = useQuery({
    queryKey: ['org-invitations-pending'],
    queryFn: orgsApi.pendingInvitations,
  })

  const acceptMutation = useMutation({
    mutationFn: (invId: number) => orgsApi.acceptInvitation(invId),
    onSuccess: () => {
      toast({ title: t('invitationAccepted') })
      qc.invalidateQueries({ queryKey: ['org-invitations-pending'] })
      qc.invalidateQueries({ queryKey: ['organizations'] })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (invId: number) => orgsApi.rejectInvitation(invId),
    onSuccess: () => {
      toast({ title: t('invitationDeclined') })
      qc.invalidateQueries({ queryKey: ['org-invitations-pending'] })
    },
  })

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 md:gap-3 px-4 md:px-6 py-3 border-b bg-background shrink-0">
        <Tabs value={tab} onValueChange={(v) => setTab(v as 'all' | 'mine')}>
          <TabsList>
            <TabsTrigger value="all">{t('allOrgs')}</TabsTrigger>
            <TabsTrigger value="mine">{t('myOrgs')}</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button onClick={() => setCreateOpen(true)} className="ml-auto shrink-0">
          <Plus className="h-4 w-4 md:mr-1" />
          <span className="hidden sm:inline">{t('newOrg')}</span>
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {/* Pending invitations banner */}
        {pendingInvitations.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {t('pendingInvitations')} ({pendingInvitations.length})
            </p>
            {pendingInvitations.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-muted/40"
              >
                <Building2 className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {inv.organization_name ?? `Organization #${inv.organization}`}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">{inv.role}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-destructive border-destructive hover:bg-destructive/10"
                  disabled={rejectMutation.isPending}
                  onClick={() => rejectMutation.mutate(inv.id)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  className="h-7 px-3"
                  disabled={acceptMutation.isPending}
                  onClick={() => acceptMutation.mutate(inv.id)}
                >
                  <Check className="h-3.5 w-3.5 mr-1" /> {t('accept')}
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground">{t('loading')}</div>
        ) : orgs.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground">{t('noResults')}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {orgs.map((org) => (
              <OrgCard key={org.id} org={org} onOpen={() => navigate(`/organizations/${org.id}`)} />
            ))}
          </div>
        )}
      </div>

      <CreateOrgDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}

function OrgCard({ org, onOpen }: { org: Organization; onOpen: () => void }) {
  const logoUrl = org.logo ? mediaUrl(org.logo) : null
  const coverUrl = org.cover ? mediaUrl(org.cover) : null
  const name = org.principalName || org.principal_name || org.name || ''
  const safeDescription = useMemo(
    () => org.description ? DOMPurify.sanitize(org.description) : '',
    [org.description]
  )

  return (
    <Card className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={onOpen}>
      <div className="relative h-28 bg-muted">
        {coverUrl ? (
          <img src={coverUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
            <Building2 className="h-12 w-12" />
          </div>
        )}
        {logoUrl && (
          <img
            src={logoUrl}
            alt=""
            className="absolute bottom-2 left-3 h-10 w-10 rounded-full border-2 border-background object-cover bg-background"
          />
        )}
        {/* Role icons — top left */}
        <div className="absolute top-2 left-2 flex gap-1">
          {org.is_creator && (
            <span title="Creator" className="flex items-center justify-center h-6 w-6 rounded-full bg-black/60 text-yellow-400 shadow">
              <Crown className="h-3.5 w-3.5" />
            </span>
          )}
          {org.is_admin && (
            <span title="Admin" className="flex items-center justify-center h-6 w-6 rounded-full bg-black/60 text-blue-400 shadow">
              <ShieldCheck className="h-3.5 w-3.5" />
            </span>
          )}
          {org.is_member && (
            <span title="Member" className="flex items-center justify-center h-6 w-6 rounded-full bg-black/60 text-green-400 shadow">
              <Users className="h-3.5 w-3.5" />
            </span>
          )}
        </div>
      </div>
      <CardContent className="p-3">
        <h3 className="font-medium text-sm">{name}</h3>
        {safeDescription && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: safeDescription }} />
        )}
      </CardContent>
    </Card>
  )
}
