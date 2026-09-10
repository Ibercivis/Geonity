import { useState, useCallback, useMemo } from 'react'
import DOMPurify from 'dompurify'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Heart, Download, Plus, Trash2, Edit, Lock, Users, ArrowLeft, Filter, EyeOff, Archive, MapPin, Globe, Loader2, QrCode, BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { ProjectMap } from '@/components/map/ProjectMap'
import { ObservationPanel } from '@/components/map/ObservationPanel'
import { AnonymousQrDialog } from '@/components/project/AnonymousQrDialog'
import { projectsApi } from '@/api/projects'
import { resolveLocalized, mediaUrl, parseGeoposition } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { useTranslationLang } from '@/hooks/use-translation-lang'

import type { Observation } from '@/types'

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const projectId = Number(id)
  const { t } = useTranslation()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const lang = useTranslationLang()


  const [myObsOnly, setMyObsOnly] = useState(false)
  const [hexZoom, setHexZoom] = useState(2)
  const [passwordDialog, setPasswordDialog] = useState(false)
  const [qrDialog, setQrDialog] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [inviteDialog, setInviteDialog] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [selectedObsId, setSelectedObsId] = useState<number | null>(null)
  const [tempSelectedObs, setTempSelectedObs] = useState<Observation | null>(null)
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null)
  const [infoSheetOpen, setInfoSheetOpen] = useState(false)

  const selectObs = useCallback((obs: Observation | null) => {
    if (!obs) { setSelectedObsId(null); setTempSelectedObs(null); return }
    setTempSelectedObs(obs)   // show panel immediately with position
    setSelectedObsId(obs.id)  // trigger full detail fetch
    const coords = parseGeoposition(obs.geoposition)
    if (coords) setFlyTo(coords)
  }, [])

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.get(projectId),
  })

  const isFuzzy = !!(project?.fuzzy || project?.is_fuzzy)

  // Lightweight points for map rendering
  const { data: mapPoints = [], isLoading: isLoadingPoints } = useQuery({
    queryKey: ['map-points', project?.field_form],
    queryFn: () => projectsApi.getMapPoints(project!.field_form!),
    enabled: !!project?.field_form && !isFuzzy,
  })

  // Full observations only when "mine only" filter is active
  const { data: myObservations = [] } = useQuery({
    queryKey: ['my-observations', project?.field_form],
    queryFn: () => projectsApi.getMyObservations(project!.field_form!),
    enabled: !!project?.field_form && !isFuzzy && myObsOnly,
  })

  // Full detail for selected observation, fetched on demand
  const { data: fetchedSelectedObs } = useQuery({
    queryKey: ['observation-detail', selectedObsId],
    queryFn: () => projectsApi.getObservationDetail(selectedObsId!),
    enabled: selectedObsId !== null,
    staleTime: 0,
  })
  const selectedObs = fetchedSelectedObs ?? tempSelectedObs

  const { data: fieldForm } = useQuery({
    queryKey: ['field-form', project?.field_form],
    queryFn: () => projectsApi.getFieldForm(project!.field_form!, lang),
    enabled: !!project?.field_form,
  })

  const { data: hexObs = [] } = useQuery({
    queryKey: ['hex-observations', project?.field_form, hexZoom],
    queryFn: () => projectsApi.getHexObservations(project!.field_form!, hexZoom),
    enabled: !!project?.field_form && isFuzzy,
  })

  const { data: myFuzzyObs = [] } = useQuery({
    queryKey: ['my-fuzzy-observations', project?.field_form],
    queryFn: () => projectsApi.getMyObservations(project!.field_form!),
    enabled: !!project?.field_form && isFuzzy,
  })

  const { data: sentInvitations = [] } = useQuery({
    queryKey: ['project-invitations', projectId],
    queryFn: () => projectsApi.invitations(projectId),
    enabled: !!(project?.is_creator || project?.is_admin),
  })

  const likeMutation = useMutation({
    mutationFn: () => projectsApi.toggleLike(projectId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project', projectId] }),
  })

  const deleteMutation = useMutation({
    mutationFn: () => projectsApi.delete(projectId),
    onSuccess: () => {
      toast({ title: t('projectDeleted') })
      navigate('/')
    },
  })

  const inviteMutation = useMutation({
    mutationFn: () => projectsApi.invite(projectId, inviteEmail),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project-invitations', projectId] })
      toast({ title: t('invitationSent') })
      setInviteEmail('')
      setInviteDialog(false)
    },
    onError: () => toast({ title: t('error'), variant: 'destructive' }),
  })

  const cancelInviteMutation = useMutation({
    mutationFn: (invId: number) => projectsApi.cancelInvitation(invId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project-invitations', projectId] }),
    onError: () => toast({ title: t('error'), variant: 'destructive' }),
  })

  const validatePasswordMutation = useMutation({
    mutationFn: (pw: string) => projectsApi.validatePassword(projectId, pw),
    onSuccess: (data) => {
      if (!data.valid) {
        toast({ title: t('wrongPassword'), variant: 'destructive' })
        return
      }
      setUnlocked(true)
      setPasswordDialog(false)
      // User is now a member — refresh project data
      qc.invalidateQueries({ queryKey: ['project', projectId] })
    },
  })

  const handleDownload = async (format: 'csv' | 'xlsx' | 'ods') => {
    try {
      const blob = await projectsApi.downloadObservations(projectId, format)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `project-${projectId}-observations.${format}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status
      const description =
        status === 404 || status === 400
          ? t('downloadFormatUnsupported', { format: format.toUpperCase() })
          : t('downloadFailed')
      toast({ title: t('error'), description, variant: 'destructive' })
    }
  }

  const rawDescription = project ? resolveLocalized(project.description, lang) : null
  const description = useMemo(
    () => rawDescription ? DOMPurify.sanitize(rawDescription) : '',
    [rawDescription]
  )

  // Synthetic Observation objects from lightweight map points (position only, no data)
  // Must be declared BEFORE any early returns to satisfy Rules of Hooks
  const syntheticObs = useMemo<Observation[]>(() => {
    const fid = project?.field_form
    if (!fid) return []
    return mapPoints.map((p) => ({
      id: p.id,
      geoposition: `POINT (${p.lon} ${p.lat})`,
      created_at: '',
      timestamp: '',
      field_form: fid,
      data: [],
      images: [],
      admin_values: [],
      is_mine: false,
    }))
  }, [mapPoints, project?.field_form])

  if (isLoading || !project) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">{t('loading')}</div>
  }

  // Gate private projects
  if (project.is_private && !unlocked && !project.is_member) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <Lock className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">{t('privateProject')}</p>
        <Button onClick={() => setPasswordDialog(true)}>
          <Lock className="h-4 w-4 mr-2" /> {t('enterPassword')}
        </Button>
        <Dialog open={passwordDialog} onOpenChange={setPasswordDialog}>
          <DialogContent>
            <DialogHeader><DialogTitle>{t('privateProject')}</DialogTitle></DialogHeader>
            <Input
              type="password"
              placeholder={t('projectPassword')}
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
            />
            <DialogFooter>
              <Button onClick={() => validatePasswordMutation.mutate(passwordInput)}>
                {t('confirm')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  const name = resolveLocalized(project.name, lang)
  const cover = project.cover
  const coverUrl = !cover
    ? null
    : typeof cover === 'string'
    ? mediaUrl(cover)
    : Array.isArray(cover)
    ? (cover.length > 0 ? mediaUrl(cover[0].image) : null)
    : mediaUrl(cover.image)

  // For fuzzy: show mine (exact) or hex. For normal: synthetic all or real mine-only
  const filteredObs: Observation[] = isFuzzy
    ? (myObsOnly ? myFuzzyObs : [])
    : myObsOnly
      ? myObservations
      : syntheticObs

  const activeHexObs = isFuzzy && !myObsOnly ? hexObs : []

  const isAdmin = project.is_creator || project.is_admin

  const infoContent = (
    <>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {coverUrl && (
          <div className="h-32 rounded-lg overflow-hidden bg-muted">
            <img src={coverUrl} alt={name} className="w-full h-full object-cover" />
          </div>
        )}

        <div>
          <h1 className="font-bold text-base leading-tight">{name}</h1>
          <div className="flex flex-wrap gap-1 mt-2">
            {project.draft && <Badge variant="outline" className="border-amber-400 text-amber-600"><EyeOff className="h-3 w-3 mr-1" /> {t('draft')}</Badge>}
            {project.ended && <Badge variant="outline" className="border-slate-400 text-slate-500"><Archive className="h-3 w-3 mr-1" /> {t('ended')}</Badge>}
            {project.is_private && <Badge variant="secondary"><Lock className="h-3 w-3 mr-1" /> {t('private')}</Badge>}
            {(project.fuzzy || project.is_fuzzy) && <Badge variant="outline">{t('fuzzyLocations')}</Badge>}
            {project.is_global && <Badge variant="outline"><Globe className="h-3 w-3 mr-1" /> {t('global')}</Badge>}
            {project.anonymous_contribution && (
              project.anonymous_token ? (
                <button
                  type="button"
                  onClick={() => setQrDialog(true)}
                  title={t('anonymousContribution')}
                  className="inline-flex"
                >
                  <Badge variant="outline" className="border-cyan-400 text-cyan-700 cursor-pointer hover:bg-cyan-50">
                    <QrCode className="h-3 w-3 mr-1" /> {t('anonymous')}
                  </Badge>
                </button>
              ) : (
                <Badge variant="outline" className="border-cyan-400 text-cyan-700" title={t('anonymousContribution')}>
                  <QrCode className="h-3 w-3 mr-1" /> {t('anonymous')}
                </Badge>
              )
            )}
          </div>
        </div>
        {project.anonymous_token && (
          <AnonymousQrDialog open={qrDialog} onOpenChange={setQrDialog} token={project.anonymous_token} projectName={name} />
        )}

        <div className="flex gap-4 text-sm">
          <span className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {project.observation_count ?? project.contributions ?? 0}
          </span>
          <button
            className={`flex items-center gap-1 ${project.is_liked_by_user ? 'text-red-500' : 'text-muted-foreground'} hover:text-red-500`}
            onClick={() => likeMutation.mutate()}
          >
            <Heart className={`h-4 w-4 ${project.is_liked_by_user ? 'fill-current' : ''}`} />
            {project.total_likes ?? project.likes_count ?? 0}
          </button>
        </div>

        <Separator />

        {description && <div className="text-sm text-muted-foreground prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: description }} />}

        {project.organizations?.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Organizations</p>
            {project.organizations.map((org) => (
              <button
                key={org.id}
                className="text-sm hover:underline text-primary block"
                onClick={() => navigate(`/organizations/${org.id}`)}
              >
                {org.principalName || org.principal_name || org.name}
              </button>
            ))}
          </div>
        )}

        <Separator />

        <div className="flex items-center gap-2">
          <Switch id="my-obs" checked={myObsOnly} onCheckedChange={setMyObsOnly} />
          <Label htmlFor="my-obs" className="text-sm cursor-pointer">
            <Filter className="h-3 w-3 inline mr-1" />
            {t('myObservations')}
          </Label>
        </div>

        <Separator />

        <div className="space-y-2">
          {project.field_form && (
            <Button
              className="w-full"
              onClick={() => navigate(`/projects/${projectId}/observations/new`)}
              disabled={!!project.ended}
              title={project.ended ? 'This project has ended' : undefined}
            >
              <Plus className="h-4 w-4 mr-2" /> {t('addObservation')}
            </Button>
          )}
          {(project.is_creator || project.is_admin || (!project.is_private && !project.private_data && !project.fuzzy && !project.is_fuzzy)) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" /> {t('download')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuItem onClick={() => handleDownload('xlsx')} className="flex flex-col items-start gap-0.5 py-2">
                  <span className="font-medium">Excel (.xlsx)</span>
                  <span className="text-xs text-muted-foreground">{t('downloadHintXlsx')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownload('ods')} className="flex flex-col items-start gap-0.5 py-2">
                  <span className="font-medium">OpenDocument (.ods)</span>
                  <span className="text-xs text-muted-foreground">{t('downloadHintOds')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownload('csv')} className="flex flex-col items-start gap-0.5 py-2">
                  <span className="font-medium">CSV (.csv)</span>
                  <span className="text-xs text-muted-foreground">{t('downloadHintCsv')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Admin zone — pinned to bottom */}
      {isAdmin && (
        <div className="shrink-0 border-t p-4 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('admin')}</p>
          <Button variant="outline" className="w-full" onClick={() => navigate(`/projects/${projectId}/edit`)}>
            <Edit className="h-4 w-4 mr-2" /> {t('edit')}
          </Button>
          <Button variant="outline" className="w-full" onClick={() => navigate(`/projects/${projectId}/stats`)}>
            <BarChart3 className="h-4 w-4 mr-2" /> {t('stats')}
          </Button>
          <Button variant="outline" className="w-full" onClick={() => setInviteDialog(true)}>
            <Users className="h-4 w-4 mr-2" /> {t('invite')}
            {sentInvitations.filter((i) => {
              const s = typeof i.status === 'string' ? i.status : i.status.code
              return s === 'pending'
            }).length > 0 && (
              <span className="ml-1 text-xs opacity-60">
                ({sentInvitations.filter((i) => {
                  const s = typeof i.status === 'string' ? i.status : i.status.code
                  return s === 'pending'
                }).length})
              </span>
            )}
          </Button>
          {project.is_creator && (
            <Button variant="destructive" className="w-full" onClick={() => setDeleteDialog(true)}>
              <Trash2 className="h-4 w-4 mr-2" /> {t('delete')}
            </Button>
          )}
        </div>
      )}
    </>
  )

  return (
    <div className="flex h-full overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex w-72 shrink-0 flex-col border-r">
        <div className="shrink-0 px-4 pt-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="-ml-2">
            <ArrowLeft className="h-4 w-4 mr-1" /> {t('back')}
          </Button>
        </div>
        {infoContent}
      </div>

      {/* Map */}
      <div className="flex-1 relative min-w-0">
        {isLoadingPoints && (
          <div className="absolute inset-x-0 top-0 z-10 pointer-events-none">
            <div className="h-1 w-full bg-primary/20 overflow-hidden">
              <div
                className="h-full bg-primary"
                style={{
                  width: '40%',
                  animation: 'obs-indeterminate 1.4s ease-in-out infinite',
                }}
              />
            </div>
            <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-background/90 backdrop-blur-sm text-xs text-muted-foreground rounded-full px-3 py-1 shadow-sm border">
              <Loader2 className="h-3 w-3 animate-spin" />
              {t('loadingObservations')}
            </div>
          </div>
        )}
        <ProjectMap
          observations={filteredObs}
          hexObservations={activeHexObs}
          fuzzy={isFuzzy && !myObsOnly}
          onObservationClick={selectObs}
          onZoomChange={setHexZoom}
          selectedObsId={selectedObs?.id ?? null}
          flyTo={flyTo}
        />

        {/* Mobile floating controls */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="md:hidden absolute top-3 left-3 z-10 flex items-center justify-center h-10 w-10 rounded-full bg-background/95 backdrop-blur-sm shadow-md border"
          aria-label={t('back')}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => setInfoSheetOpen(true)}
          className="md:hidden absolute top-3 left-16 right-3 z-10 flex items-center gap-2 h-10 px-3 rounded-full bg-background/95 backdrop-blur-sm shadow-md border text-sm font-medium text-left"
        >
          <span className="truncate flex-1">{name}</span>
        </button>
        {project.field_form && !project.ended && (
          <Button
            className="md:hidden absolute right-4 z-10 h-14 w-14 rounded-full shadow-lg p-0"
            onClick={() => navigate(`/projects/${projectId}/observations/new`)}
            aria-label={t('addObservation')}
            style={{ bottom: `calc(1rem + env(safe-area-inset-bottom))` }}
          >
            <Plus className="h-6 w-6" />
          </Button>
        )}
      </div>

      {/* Mobile info bottom sheet */}
      <Sheet open={infoSheetOpen} onOpenChange={setInfoSheetOpen}>
        <SheetContent side="bottom" className="flex flex-col h-[80dvh] p-0">
          <div className="mx-auto mt-2 mb-1 h-1 w-10 rounded-full bg-muted-foreground/30 shrink-0" />
          {infoContent}
        </SheetContent>
      </Sheet>

      <ObservationPanel
        open={selectedObsId !== null}
        observation={selectedObs ?? null}
        fieldForm={fieldForm}
        projectId={projectId}
        onClose={() => { setSelectedObsId(null); setTempSelectedObs(null) }}
        observations={isFuzzy ? [] : filteredObs}
        onNavigate={selectObs}
      />

      {/* Delete project confirm */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('delete')} project?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">{t('cannotUndo')}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>{t('cancel')}</Button>
            <Button variant="destructive" onClick={() => deleteMutation.mutate()}>{t('delete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite dialog */}
      <Dialog open={inviteDialog} onOpenChange={setInviteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{t('invite')}</DialogTitle></DialogHeader>

          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="email@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && inviteEmail && inviteMutation.mutate()}
              />
              <Button onClick={() => inviteMutation.mutate()} disabled={!inviteEmail || inviteMutation.isPending}>
                {t('invite')}
              </Button>
            </div>

            {sentInvitations.length > 0 && (
              <div className="space-y-1 pt-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('sentInvitations')}</p>
                {sentInvitations.map((inv) => {
                  const statusCode = typeof inv.status === 'string' ? inv.status : inv.status.code
                  return (
                    <div key={inv.id} className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted">
                      <span className="flex-1 text-sm truncate">{inv.email}</span>
                      <span className={`text-xs capitalize ${
                        statusCode === 'accepted' ? 'text-green-600' :
                        statusCode === 'rejected' ? 'text-destructive' :
                        'text-muted-foreground'
                      }`}>{statusCode}</span>
                      {statusCode === 'pending' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                          onClick={() => cancelInviteMutation.mutate(inv.id)}
                          disabled={cancelInviteMutation.isPending}
                        >
                          {t('cancel')}
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
