import { useRef, useState, useEffect } from 'react'
import DOMPurify from 'dompurify'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Camera, MapPin, Heart, Crown, Users, Edit, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { CountrySelect } from '@/components/ui/country-select'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { authApi } from '@/api/auth'
import { projectsApi } from '@/api/projects'
import { orgsApi } from '@/api/organizations'
import type { Organization } from '@/types'
import { useAuthStore } from '@/store/auth'
import { mediaUrl, resolveLocalized } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { useTranslationLang } from '@/hooks/use-translation-lang'
import type { Project, UserProfile } from '@/types'

const EMAIL_LANGUAGES = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'pt', label: 'Português' },
  { code: 'it', label: 'Italiano' },
  { code: 'de', label: 'Deutsch' },
]

// ─── Gradient helpers ─────────────────────────────────────────────────────────

const GRADIENTS = [
  'from-blue-600 to-blue-400',
  'from-violet-600 to-blue-500',
  'from-teal-500 to-blue-600',
  'from-sky-500 to-indigo-600',
  'from-indigo-500 to-purple-600',
  'from-cyan-500 to-teal-600',
  'from-blue-500 to-cyan-400',
  'from-slate-600 to-blue-700',
]

function getCoverUrl(project: Project): string | null {
  const cover = project.cover
  if (!cover) return null
  if (typeof cover === 'string') return mediaUrl(cover)
  if (Array.isArray(cover)) return cover.length > 0 ? mediaUrl(cover[0].image) : null
  return mediaUrl((cover as { image: string }).image)
}

// ─── Mini project card ────────────────────────────────────────────────────────

function ProjectRow({ project, lang }: { project: Project; lang: string }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const name = resolveLocalized(project.name, lang)
  const coverUrl = getCoverUrl(project)
  const gradient = GRADIENTS[project.id % GRADIENTS.length]
  const [imgError, setImgError] = useState(false)

  return (
    <Card
      className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/projects/${project.id}`)}
    >
      <div className="flex items-center gap-3 p-3">
        <div className="h-12 w-16 shrink-0 rounded-md overflow-hidden">
          {coverUrl && !imgError ? (
            <img src={coverUrl} alt={name} className="w-full h-full object-cover" onError={() => setImgError(true)} />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
              <span className="text-white text-xs font-bold">{name.slice(0, 2).toUpperCase()}</span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{name}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {project.observation_count ?? project.contributions ?? 0}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              {project.total_likes ?? project.likes_count ?? 0}
            </span>
          </div>
        </div>
        {project.ended && <Badge variant="secondary" className="shrink-0 text-xs">{t('ended')}</Badge>}
      </div>
    </Card>
  )
}


// ─── Empty state ──────────────────────────────────────────────────────────────

function Empty({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">{label}</div>
  )
}

// ─── Edit profile dialog ──────────────────────────────────────────────────────

function EditProfileDialog({
  profile,
  open,
  onOpenChange,
  lang,
}: {
  profile: UserProfile
  open: boolean
  onOpenChange: (v: boolean) => void
  lang: string
}) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { setProfile, logout } = useAuthStore()
  const coverRef = useRef<HTMLInputElement>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [keepObs, setKeepObs] = useState(true)

  const [form, setForm] = useState({
    first_name: profile.first_name,
    last_name: profile.last_name,
    biography: profile.biography,
    country: typeof profile.country === 'string' ? profile.country : profile.country.code,
    visibility: profile.visibility,
    language: profile.language ?? '',
  })

  const existingCover = profile.cover ? mediaUrl(profile.cover) : null

  useEffect(() => {
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview)
    }
  }, [coverPreview])

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (coverPreview) URL.revokeObjectURL(coverPreview)
    setCoverPreview(URL.createObjectURL(file))
  }

  const updateMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      fd.append('first_name', form.first_name)
      fd.append('last_name', form.last_name)
      fd.append('biography', form.biography)
      fd.append('country', form.country)
      fd.append('visibility', String(form.visibility))
      fd.append('language', form.language)
      if (coverRef.current?.files?.[0]) fd.append('cover', coverRef.current.files[0])
      return authApi.updateProfile(fd)
    },
    onSuccess: (data) => {
      setProfile(data)
      qc.setQueryData(['profile'], data)
      // Keep the UI in the same language the user just chose for emails.
      if (data.language && data.language !== lang) i18n.changeLanguage(data.language)
      toast({ title: t('profileUpdated') })
      onOpenChange(false)
    },
    onError: () => toast({ title: t('error'), variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: () => authApi.deleteAccount(keepObs),
    onSuccess: () => {
      logout()
      navigate('/login')
    },
  })

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('editProfile')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Cover */}
            <div className="space-y-1">
              <Label>{t('cover')}</Label>
              <div
                className="relative h-28 rounded-xl bg-muted overflow-hidden group cursor-pointer"
                onClick={() => coverRef.current?.click()}
              >
                {(coverPreview ?? existingCover) && (
                  <img src={coverPreview ?? existingCover!} alt="" className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm">
                  <Camera className="h-5 w-5 mr-2" /> {t('changeCover')}
                </div>
              </div>
              <input ref={coverRef} type="file" accept="image/*" className="sr-only" onChange={handleCoverChange} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{t('firstName')}</Label>
                <Input value={form.first_name} onChange={(e) => set('first_name', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>{t('lastName')}</Label>
                <Input value={form.last_name} onChange={(e) => set('last_name', e.target.value)} />
              </div>
            </div>

            <div className="space-y-1">
              <Label>{t('biography')}</Label>
              <RichTextEditor value={form.biography} onChange={(v) => set('biography', v)} rows={3} />
            </div>

            <div className="space-y-1">
              <Label>{t('country')}</Label>
              <CountrySelect value={form.country} onChange={(code) => set('country', code)} lang={lang} />
            </div>

            <div className="flex items-center gap-3">
              <Switch id="visibility-edit" checked={form.visibility} onCheckedChange={(v) => set('visibility', v)} />
              <Label htmlFor="visibility-edit">{t('visibility')}</Label>
            </div>

            <div className="space-y-1">
              <Label>{t('emailLanguage')}</Label>
              <Select value={form.language || '__none__'} onValueChange={(v) => set('language', v === '__none__' ? '' : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{t('emailLanguageNone')}</SelectItem>
                  {EMAIL_LANGUAGES.map((l) => <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{t('emailLanguageDesc')}</p>
            </div>

            <Separator />

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-destructive">Danger zone</h3>
              <Button variant="destructive" className="w-full" onClick={() => setDeleteDialog(true)}>
                {t('deleteAccount')}
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>{t('cancel')}</Button>
            <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? t('loading') : t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('deleteAccount')}</DialogTitle></DialogHeader>
          <div className="flex items-center gap-3">
            <Switch id="keep-obs" checked={keepObs} onCheckedChange={setKeepObs} />
            <Label htmlFor="keep-obs">{t('keepObservations')}</Label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>{t('cancel')}</Button>
            <Button variant="destructive" onClick={() => deleteMutation.mutate()}>{t('deleteAccount')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Org row ─────────────────────────────────────────────────────────────────

function OrgRow({ org }: { org: Organization }) {
  const navigate = useNavigate()
  const logoUrl = org.logo ? mediaUrl(org.logo) : null

  return (
    <Card
      className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/organizations/${org.id}`)}
    >
      <div className="flex items-center gap-3 p-3">
        <div className="h-10 w-10 shrink-0 rounded-full overflow-hidden bg-muted flex items-center justify-center">
          {logoUrl ? (
            <img src={logoUrl} alt={org.principalName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-bold text-muted-foreground">
              {org.principalName?.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{org.principalName}</p>
          {org.description && (
            <p className="text-xs text-muted-foreground truncate">{org.description}</p>
          )}
        </div>
        {(org.is_creator || org.is_admin) && (
          <Badge variant="secondary" className="text-xs shrink-0">
            {org.is_creator ? 'Creator' : 'Admin'}
          </Badge>
        )}
      </div>
    </Card>
  )
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ icon, label, count }: { icon: React.ReactNode; label: string; count?: number }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-muted-foreground">{icon}</span>
      <h2 className="text-sm font-semibold">{label}</h2>
      {count !== undefined && (
        <span className="text-xs text-muted-foreground">({count})</span>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ProfilePage() {
  const { t } = useTranslation()
  const lang = useTranslationLang()
  const [editDialog, setEditDialog] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: authApi.getProfile,
  })

  const { data: adminProjects = [], isLoading: adminLoading } = useQuery({
    queryKey: ['my-admin-projects'],
    queryFn: projectsApi.myAdminProjects,
    enabled: activeTab === 'projects',
  })

  const { data: participatingProjects = [], isLoading: participatingLoading } = useQuery({
    queryKey: ['my-participating'],
    queryFn: projectsApi.myParticipating,
    enabled: activeTab === 'projects',
  })

  const { data: likedProjects = [], isLoading: likedLoading } = useQuery({
    queryKey: ['my-liked'],
    queryFn: projectsApi.myLiked,
    enabled: activeTab === 'projects',
  })

  const { data: myOrgs = [], isLoading: orgsLoading } = useQuery({
    queryKey: ['my-orgs'],
    queryFn: orgsApi.mine,
    enabled: activeTab === 'organizations',
  })

  if (isLoading || !profile) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">{t('loading')}</div>
  }

  const coverUrl = profile.cover ? mediaUrl(profile.cover) : null
  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || '—'

  const managedOrgs = myOrgs.filter((o) => o.is_creator || o.is_admin)
  const memberOrgs  = myOrgs.filter((o) => !o.is_creator && !o.is_admin)

  const projectsLoading = adminLoading || participatingLoading || likedLoading

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">

        {/* Tab bar */}
        <div className="px-6 pt-4 border-b shrink-0 bg-background">
          <TabsList className="w-full justify-start rounded-none border-0 bg-transparent p-0 gap-1 h-auto">
            {[
              { value: 'profile',       label: t('profile'),       icon: null },
              { value: 'projects',      label: t('projects'),      icon: <Crown className="h-3.5 w-3.5" /> },
              { value: 'organizations', label: t('organizations'),  icon: <Users className="h-3.5 w-3.5" /> },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2 text-sm flex items-center gap-1.5"
              >
                {tab.icon}{tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* ── Profile ──────────────────────────────────────────────────────── */}
        <TabsContent value="profile" className="flex-1 overflow-y-auto mt-0">
          <div className="max-w-xl mx-auto w-full px-6 py-8 space-y-6">

            {coverUrl && (
              <div className="h-32 rounded-xl overflow-hidden bg-muted">
                <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h1 className="text-xl font-bold">{fullName}</h1>
                {profile.country && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {typeof profile.country === 'string' ? profile.country : profile.country.name}
                  </p>
                )}
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {profile.visibility
                    ? <><Eye className="h-3.5 w-3.5" /> Public profile</>
                    : <><EyeOff className="h-3.5 w-3.5" /> Private profile</>
                  }
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setEditDialog(true)}>
                <Edit className="h-4 w-4 mr-1" /> {t('editProfile')}
              </Button>
            </div>

            {profile.biography && (
              <div
                className="text-sm text-muted-foreground prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(profile.biography) }}
              />
            )}

          </div>
        </TabsContent>

        {/* ── Projects ─────────────────────────────────────────────────────── */}
        <TabsContent value="projects" className="flex-1 overflow-y-auto mt-0">
          <div className="max-w-2xl mx-auto w-full px-6 py-6 space-y-8">
            {projectsLoading ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">{t('loading')}</div>
            ) : (
              <>
                <div>
                  <SectionHeader icon={<Crown className="h-4 w-4" />} label={t('myAdminProjects')} count={adminProjects.length} />
                  {adminProjects.length === 0
                    ? <Empty label={t('noResults')} />
                    : <div className="space-y-3">{adminProjects.map((p) => <ProjectRow key={p.id} project={p} lang={lang} />)}</div>
                  }
                </div>

                <div>
                  <SectionHeader icon={<Users className="h-4 w-4" />} label={t('myParticipating')} count={participatingProjects.length} />
                  {participatingProjects.length === 0
                    ? <Empty label={t('noResults')} />
                    : <div className="space-y-3">{participatingProjects.map((p) => <ProjectRow key={p.id} project={p} lang={lang} />)}</div>
                  }
                </div>

                <div>
                  <SectionHeader icon={<Heart className="h-4 w-4" />} label={t('myLiked')} count={likedProjects.length} />
                  {likedProjects.length === 0
                    ? <Empty label={t('noResults')} />
                    : <div className="space-y-3">{likedProjects.map((p) => <ProjectRow key={p.id} project={p} lang={lang} />)}</div>
                  }
                </div>
              </>
            )}
          </div>
        </TabsContent>

        {/* ── Organizations ────────────────────────────────────────────────── */}
        <TabsContent value="organizations" className="flex-1 overflow-y-auto mt-0">
          <div className="max-w-2xl mx-auto w-full px-6 py-6 space-y-8">
            {orgsLoading ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">{t('loading')}</div>
            ) : (
              <>
                <div>
                  <SectionHeader icon={<Crown className="h-4 w-4" />} label={t('myAdminOrgs') ?? 'Organizations I manage'} count={managedOrgs.length} />
                  {managedOrgs.length === 0
                    ? <Empty label={t('noResults')} />
                    : <div className="space-y-3">{managedOrgs.map((o) => <OrgRow key={o.id} org={o} />)}</div>
                  }
                </div>

                <div>
                  <SectionHeader icon={<Users className="h-4 w-4" />} label={t('myMemberOrgs') ?? 'Organizations I belong to'} count={memberOrgs.length} />
                  {memberOrgs.length === 0
                    ? <Empty label={t('noResults')} />
                    : <div className="space-y-3">{memberOrgs.map((o) => <OrgRow key={o.id} org={o} />)}</div>
                  }
                </div>
              </>
            )}
          </div>
        </TabsContent>

      </Tabs>

      {/* Edit profile dialog */}
      {editDialog && (
        <EditProfileDialog profile={profile} open={editDialog} onOpenChange={setEditDialog} lang={lang} />
      )}

    </div>
  )
}
