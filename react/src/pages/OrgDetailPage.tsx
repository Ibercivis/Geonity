import { useState, useMemo } from 'react'
import DOMPurify from 'dompurify'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, UserPlus, LogOut, Trash2, Building2, Crown, ShieldCheck, Mail, Clock, Link, Phone, Edit, Globe, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import countries from 'i18n-iso-countries'
import { orgsApi } from '@/api/organizations'
import { EditOrgDialog } from '@/components/organizations/EditOrgDialog'
import { mediaUrl, resolveLocalized } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { useTranslationLang } from '@/hooks/use-translation-lang'

export function OrgDetailPage() {
  const { id } = useParams<{ id: string }>()
  const orgId = Number(id)
  const { t } = useTranslation()
  const lang = useTranslationLang()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [inviteDialog, setInviteDialog] = useState(false)
  const [editDialog, setEditDialog] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'administrator' | 'member'>('member')
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [leaveDialog, setLeaveDialog] = useState(false)

  const { data: org, isLoading } = useQuery({
    queryKey: ['org', orgId],
    queryFn: () => orgsApi.get(orgId),
  })

  const canManage = org?.is_creator || org?.is_admin

  const { data: orgProjects = [] } = useQuery({
    queryKey: ['org-projects', orgId],
    queryFn: () => orgsApi.projects(orgId),
  })

  const { data: sentInvitations = [] } = useQuery({
    queryKey: ['org-invitations', orgId],
    queryFn: () => orgsApi.invitations(orgId),
    enabled: !!canManage,
  })

  const inviteMutation = useMutation({
    mutationFn: () => orgsApi.invite(orgId, inviteEmail, inviteRole),
    onSuccess: () => {
      toast({ title: t('invitationSent') })
      qc.refetchQueries({ queryKey: ['org-invitations', orgId] })
      setInviteEmail('')
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      toast({ title: msg ?? t('error'), variant: 'destructive' })
    },
  })

  const cancelInvitationMutation = useMutation({
    mutationFn: (invId: number) => orgsApi.cancelInvitation(invId),
    onSuccess: () => {
      qc.refetchQueries({ queryKey: ['org-invitations', orgId] })
      toast({ title: t('invitationCancelled') })
    },
    onError: () => toast({ title: t('error'), variant: 'destructive' }),
  })

  const leaveMutation = useMutation({
    mutationFn: () => orgsApi.leave(orgId),
    onSuccess: () => {
      toast({ title: t('leaveOrg') })
      navigate('/organizations')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => orgsApi.delete(orgId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['organizations'] })
      toast({ title: t('deleteOrg') })
      navigate('/organizations')
    },
  })

  const safeDescription = useMemo(
    () => org?.description ? DOMPurify.sanitize(org.description) : '',
    [org?.description]
  )

  if (isLoading || !org) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">{t('loading')}</div>
  }

  const name = org.principalName || org.principal_name || org.name || ''
  const logoUrl = org.logo ? mediaUrl(org.logo) : null
  const coverUrl = org.cover ? mediaUrl(org.cover) : null

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Cover */}
      <div className="relative h-40 bg-muted shrink-0">
        {coverUrl ? (
          <img src={coverUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
            <Building2 className="h-16 w-16" />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 left-3 bg-background/80"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </div>

      <div className="max-w-2xl mx-auto w-full px-4 md:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          {logoUrl ? (
            <img src={logoUrl} alt="" className="h-16 w-16 rounded-full border-2 border-background object-cover shadow" />
          ) : (
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground">
              {name[0]?.toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold">{name}</h1>
              {org.is_creator && (
                <Badge variant="secondary" className="gap-1">
                  <Crown className="h-3 w-3" /> {t('creator')}
                </Badge>
              )}
              {!org.is_creator && org.is_admin && (
                <Badge variant="secondary" className="gap-1">
                  <ShieldCheck className="h-3 w-3" /> {t('administrator')}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            {canManage && (
              <Button size="sm" variant="outline" onClick={() => setEditDialog(true)}>
                <Edit className="h-4 w-4 mr-1" /> {t('edit')}
              </Button>
            )}
            {canManage && (
              <Button size="sm" onClick={() => setInviteDialog(true)}>
                <UserPlus className="h-4 w-4 mr-1" /> {t('inviteByEmail')}
              </Button>
            )}
            {(org.is_member || org.is_admin) && !org.is_creator && (
              <Button size="sm" variant="outline" onClick={() => setLeaveDialog(true)}>
                <LogOut className="h-4 w-4 mr-1" /> {t('leaveOrg')}
              </Button>
            )}
            {org.is_creator && (
              <Button size="sm" variant="destructive" onClick={() => setDeleteDialog(true)}>
                <Trash2 className="h-4 w-4 mr-1" /> {t('deleteOrg')}
              </Button>
            )}
          </div>
        </div>

        {safeDescription && <div className="text-sm text-muted-foreground prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: safeDescription }} />}

        {(org.url || org.contactName || org.contactMail) && (
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
            {org.url && (
              <a href={org.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                <Link className="h-3.5 w-3.5 shrink-0" />
                {org.url.replace(/^https?:\/\//, '')}
              </a>
            )}
            {org.contactName && (
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                {org.contactName}
              </span>
            )}
            {org.contactMail && (
              <a href={`mailto:${org.contactMail}`} className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                {org.contactMail}
              </a>
            )}
          </div>
        )}

        {org.is_global ? (
          <Badge variant="outline" className="text-xs gap-1 w-fit">
            <Globe className="h-3 w-3" /> {t('global')}
          </Badge>
        ) : org.countries?.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {org.countries.map((c) => {
              const supportedLang = ['en', 'es', 'pt', 'it', 'fr', 'de'].includes(lang) ? lang : 'en'
              const name = countries.getName(c, supportedLang) ?? c
              return (
                <Badge key={c} variant="outline" className="text-xs gap-1">
                  <MapPin className="h-3 w-3" />{name}
                </Badge>
              )
            })}
          </div>
        ) : null}

        <Separator />

        {/* Tabs */}
        <Tabs defaultValue="projects">
          <TabsList>
            <TabsTrigger value="projects">
              {t('projects')} {orgProjects.length > 0 && <span className="ml-1.5 text-xs opacity-60">({orgProjects.length})</span>}
            </TabsTrigger>
            <TabsTrigger value="members">
              {t('members')} {(org.members ?? []).length > 0 && <span className="ml-1.5 text-xs opacity-60">({(org.members ?? []).length})</span>}
            </TabsTrigger>
            {canManage && (
              <TabsTrigger value="invitations">
                {t('sentInvitations')}
                {sentInvitations.length > 0 && (
                  <span className="ml-1.5 text-xs opacity-60">({sentInvitations.length})</span>
                )}
              </TabsTrigger>
            )}
          </TabsList>

          {/* Projects tab */}
          <TabsContent value="projects" className="mt-4 space-y-3">
            {orgProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('noResults')}</p>
            ) : (
              orgProjects.map((p) => {
                const rawCover = p.cover
                const coverUrl2 = !rawCover ? null
                  : typeof rawCover === 'string' ? mediaUrl(rawCover)
                  : Array.isArray(rawCover) ? (rawCover.length > 0 ? mediaUrl(rawCover[0].image) : null)
                  : mediaUrl((rawCover as { image: string }).image)
                return (
                  <button
                    key={p.id}
                    type="button"
                    className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted text-left"
                    onClick={() => navigate(`/projects/${p.id}`)}
                  >
                    {coverUrl2 ? (
                      <img src={coverUrl2} alt="" className="h-10 w-16 rounded object-cover shrink-0" />
                    ) : (
                      <div className="h-10 w-16 rounded bg-muted-foreground/10 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{resolveLocalized(p.name, lang)}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.contributions ?? 0} {t('observations')}
                      </p>
                    </div>
                    {p.ended && <Badge variant="outline" className="text-xs shrink-0">{t('ended')}</Badge>}
                  </button>
                )
              })
            )}
          </TabsContent>

          {/* Members tab */}
          <TabsContent value="members" className="mt-4 space-y-1">
            {(() => {
              const adminIds = org.administrators ?? []
              const creatorId = org.creator
              const allMembers = org.members ?? []
              const adminMembers = allMembers.filter((m) => adminIds.includes(m.id))
              const regularMembers = allMembers.filter((m) => !adminIds.includes(m.id))
              const initials = (name: string) =>
                (name ?? '').split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
              return (
                <>
                  {adminMembers.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">{initials(m.name)}</AvatarFallback>
                      </Avatar>
                      <span className="flex-1 text-sm">{m.name}</span>
                      <Badge variant="secondary" className="text-xs gap-1 shrink-0">
                        {m.id === creatorId
                          ? <><Crown className="h-3 w-3" /> {t('creator')}</>
                          : <><ShieldCheck className="h-3 w-3" /> {t('administrator')}</>
                        }
                      </Badge>
                    </div>
                  ))}
                  {regularMembers.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">{initials(m.name)}</AvatarFallback>
                      </Avatar>
                      <span className="flex-1 text-sm">{m.name}</span>
                      <Badge variant="outline" className="text-xs shrink-0">{t('member')}</Badge>
                    </div>
                  ))}
                  {allMembers.length === 0 && (
                    <p className="text-sm text-muted-foreground">{t('noResults')}</p>
                  )}
                </>
              )
            })()}
          </TabsContent>

          {/* Invitations tab */}
          {canManage && (
            <TabsContent value="invitations" className="mt-4 space-y-2">
              {sentInvitations.map((inv) => (
                <div key={inv.id} className="flex items-center gap-3 p-2 rounded-md bg-muted/40">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{inv.email}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(inv.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="outline" className="text-xs capitalize">{inv.role}</Badge>
                      <StatusBadge status={inv.status} />
                    </div>
                    {(['pending', 'rejected'].includes(typeof inv.status === 'string' ? inv.status : (inv.status as { code: string }).code ?? '')) && (
                      <Button
                        variant="ghost" size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        disabled={cancelInvitationMutation.isPending}
                        onClick={() => cancelInvitationMutation.mutate(inv.id)}
                        title={t('cancelInvitation')}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {sentInvitations.length === 0 && (
                <p className="text-sm text-muted-foreground">{t('noResults')}</p>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Invite dialog */}
      <Dialog open={inviteDialog} onOpenChange={setInviteDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('inviteByEmail')}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>{t('email')}</Label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && inviteMutation.mutate()}
              />
            </div>
            <div className="space-y-1">
              <Label>{t('role')}</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as 'administrator' | 'member')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">{t('member')}</SelectItem>
                  <SelectItem value="administrator">{t('administrator')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {sentInvitations.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t('sentInvitations')} ({sentInvitations.length})
                </p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {sentInvitations.map((inv) => (
                    <div key={inv.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/50">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="flex-1 text-sm truncate">{inv.email}</span>
                      <Badge variant="outline" className="text-xs capitalize shrink-0">{inv.role}</Badge>
                      <StatusBadge status={inv.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialog(false)}>{t('cancel')}</Button>
            <Button
              onClick={() => inviteMutation.mutate()}
              disabled={inviteMutation.isPending || !inviteEmail.trim()}
            >
              {t('inviteByEmail')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {editDialog && (
        <EditOrgDialog org={org} open={editDialog} onOpenChange={setEditDialog} />
      )}

      {/* Leave confirm */}
      <Dialog open={leaveDialog} onOpenChange={setLeaveDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('leaveOrg')}</DialogTitle></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeaveDialog(false)}>{t('cancel')}</Button>
            <Button variant="destructive" onClick={() => leaveMutation.mutate()} disabled={leaveMutation.isPending}>
              {t('confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('deleteOrg')}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">{t('cannotUndo')}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>{t('cancel')}</Button>
            <Button variant="destructive" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
              {t('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatusBadge({ status }: { status?: unknown }) {
  // API may return status as a string OR as {code, name} object
  const code = !status
    ? ''
    : typeof status === 'string'
    ? status
    : (status as Record<string, unknown>).code as string
      ?? (status as Record<string, unknown>).name as string
      ?? ''

  if (!code) return null

  const styles: Record<string, string> = {
    pending:  'bg-amber-100 text-amber-700 border-amber-200',
    accepted: 'bg-green-100 text-green-700 border-green-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
    expired:  'bg-muted text-muted-foreground border-border',
  }
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border capitalize ${styles[code] ?? styles.pending}`}>
      {code}
    </span>
  )
}
