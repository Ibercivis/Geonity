import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Heart, Search, Filter, Lock, Crown, Shield, MapPin, Globe, UserPlus, EyeOff, Archive } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { projectsApi } from '@/api/projects'
import { resolveLocalized, mediaUrl } from '@/lib/utils'
import type { Project } from '@/types'
import { toast } from '@/hooks/use-toast'
import { useTranslationLang } from '@/hooks/use-translation-lang'

export function ProjectsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const lang = useTranslationLang()

  const [tab, setTab] = useState<'mine' | 'explore' | 'drafts'>('mine')
  const [search, setSearch] = useState('')
  const [topicFilter, setTopicFilter] = useState<string>('__all__')
  const [countryFilter, setCountryFilter] = useState<string>('__all__')
  const [sortBy, setSortBy] = useState<'last_observation' | 'updated_at' | 'created_at' | 'contributions'>('last_observation')

  // Map UI sort key → Django ordering param (descending = -)
  const ordering = `-${sortBy}` as const

  const { data: allProjects = [], isLoading } = useQuery({
    queryKey: ['projects', tab, sortBy],
    queryFn: () =>
      tab === 'mine'   ? projectsApi.myProjects(ordering)
      : tab === 'drafts' ? projectsApi.drafts(ordering)
      : projectsApi.list({ ordering }),
  })

  // Client-side filtering
  const projects = allProjects.filter((p) => {
    if (search) {
      const name = typeof p.name === 'string' ? p.name : JSON.stringify(p.name)
      if (!name.toLowerCase().includes(search.toLowerCase())) return false
    }
    if (topicFilter !== '__all__') {
      const topicId = Number(topicFilter)
      const topics = Array.isArray(p.topic) ? p.topic : [p.topic]
      if (!topics.includes(topicId)) return false
    }
    if (countryFilter !== '__all__') {
      if (!p.is_global) {
        const countries = typeof p.countries === 'string'
          ? JSON.parse(p.countries || '[]')
          : (p.countries ?? [])
        if (!countries.includes(countryFilter)) return false
      }
    }
    return true
  })

  // Ordering is handled server-side; no client-side sort needed
  const sortedProjects = projects

  const { data: topicsRaw = [] } = useQuery({
    queryKey: ['topics', lang],
    queryFn: () => projectsApi.topics(),
    staleTime: Infinity,
  })
  const topics = (Array.isArray(topicsRaw)
    ? topicsRaw
    : ((topicsRaw as { results?: unknown[] }).results ?? [])) as { id: number; topic: string; project_count: number }[]

  const { data: countriesRaw = [] } = useQuery({
    queryKey: ['countries'],
    queryFn: projectsApi.countries,
    staleTime: Infinity,
  })
  const countries = countriesRaw.map((c) => c.country)

  const likeMutation = useMutation({
    mutationFn: (id: number) => projectsApi.toggleLike(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
    onError: () => toast({ title: t('error'), variant: 'destructive' }),
  })

  const getCoverUrl = (project: Project) => {
    const cover = project.cover
    if (!cover) return null
    if (typeof cover === 'string') return mediaUrl(cover)
    if (Array.isArray(cover)) return cover.length > 0 ? mediaUrl(cover[0].image) : null
    return mediaUrl(cover.image)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="border-b bg-background shrink-0">
        {/* Row 1: tabs + actions */}
        <div className="flex items-center gap-2 md:gap-3 px-4 md:px-6 py-3 overflow-x-auto">
          <Tabs value={tab} onValueChange={(v) => setTab(v as 'mine' | 'explore' | 'drafts')}>
            <TabsList>
              <TabsTrigger value="mine">{t('myProjects')}</TabsTrigger>
              <TabsTrigger value="explore">{t('exploreProjects')}</TabsTrigger>
              <TabsTrigger value="drafts">{t('draftProjects')}</TabsTrigger>
            </TabsList>
          </Tabs>

          <Button className="ml-auto shrink-0" onClick={() => navigate('/projects/new')}>
            <Plus className="h-4 w-4 md:mr-1" />
            <span className="hidden sm:inline">{t('newProject')}</span>
          </Button>
        </div>

        {/* Row 2: filters */}
        <div className="flex items-center gap-2 px-4 md:px-6 pb-3 flex-wrap">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('searchProjects')}
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Select value={topicFilter} onValueChange={setTopicFilter}>
            <SelectTrigger className="w-32 md:w-40">
              <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder={t('filterByTopic')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">— {t('filterByTopic')} —</SelectItem>
              {topics.map((topic) => (
                <SelectItem key={topic.id} value={String(topic.id)}>
                  {topic.topic}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="w-32 md:w-40">
              <SelectValue placeholder={t('filterByCountry')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">— {t('filterByCountry')} —</SelectItem>
              {countries.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="w-40 md:w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_observation">{t('sortLastObservation')}</SelectItem>
              <SelectItem value="updated_at">{t('sortLastUpdate')}</SelectItem>
              <SelectItem value="created_at">{t('sortCreatedAt')}</SelectItem>
              <SelectItem value="contributions">{t('sortMostObservations')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground">{t('loading')}</div>
        ) : sortedProjects.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground">{t('noResults')}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                lang={lang}
                coverUrl={getCoverUrl(project)}
                onOpen={() => navigate(`/projects/${project.id}`)}
                onLike={() => likeMutation.mutate(project.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface ProjectCardProps {
  project: Project
  lang: string
  coverUrl: string | null
  onOpen: () => void
  onLike: () => void
}

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

function ProjectCard({ project, lang, coverUrl, onOpen, onLike }: ProjectCardProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const name = resolveLocalized(project.name, lang)
  const gradient = GRADIENTS[project.id % GRADIENTS.length]
  const [imgError, setImgError] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)

  useEffect(() => { setImgError(false) }, [coverUrl])
  const [inviteEmail, setInviteEmail] = useState('')

  const { data: pendingInvitations = [], isLoading: invLoading } = useQuery({
    queryKey: ['project-invitations', project.id],
    queryFn: () => projectsApi.invitations(project.id),
    enabled: inviteOpen,
  })

  const inviteMutation = useMutation({
    mutationFn: (email: string) => projectsApi.invite(project.id, email),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project-invitations', project.id] })
      toast({ title: t('invitationSent') })
      setInviteEmail('')
    },
    onError: () => toast({ title: t('error'), variant: 'destructive' }),
  })

  return (
    <>
    <Card className="overflow-hidden group cursor-pointer hover:shadow-md transition-shadow" onClick={onOpen}>
      {/* Cover */}
      <div className="relative h-36 bg-muted">
        {coverUrl && !imgError ? (
          <img
            src={coverUrl}
            alt={name}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            <span className="text-white/90 text-4xl font-bold select-none tracking-wide">
              {name.slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}

        {/* Top-left: role badges */}
        <div className="absolute top-2 left-2 flex gap-1">
          {project.is_creator && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="flex items-center justify-center h-6 w-6 rounded-full bg-amber-500 text-white shadow hover:bg-amber-600 transition-colors"
                  onClick={(e) => { e.stopPropagation(); navigate(`/projects/${project.id}/edit`) }}
                >
                  <Crown className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{t('editProject')}</TooltipContent>
            </Tooltip>
          )}
          {!project.is_creator && project.is_admin && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-500 text-white shadow hover:bg-blue-600 transition-colors"
                  onClick={(e) => { e.stopPropagation(); navigate(`/projects/${project.id}/edit`) }}
                >
                  <Shield className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{t('editProject')}</TooltipContent>
            </Tooltip>
          )}
          {(project.is_creator || project.is_admin) && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="flex items-center justify-center h-6 w-6 rounded-full bg-green-600 text-white shadow hover:bg-green-700 transition-colors"
                  onClick={(e) => { e.stopPropagation(); setInviteOpen(true) }}
                >
                  <UserPlus className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{t('inviteAdmin')}</TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Top-right: status badges */}
        <div className="absolute top-2 right-2 flex gap-1">
          {project.draft && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-amber-500 text-white shadow">
                  <EyeOff className="h-3.5 w-3.5" />
                </span>
              </TooltipTrigger>
              <TooltipContent>{t('draft')}</TooltipContent>
            </Tooltip>
          )}
          {project.ended && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-slate-500 text-white shadow">
                  <Archive className="h-3.5 w-3.5" />
                </span>
              </TooltipTrigger>
              <TooltipContent>{t('ended')}</TooltipContent>
            </Tooltip>
          )}
          {project.is_private && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-red-600 text-white shadow">
                  <Lock className="h-3.5 w-3.5" />
                </span>
              </TooltipTrigger>
              <TooltipContent>{t('private')}</TooltipContent>
            </Tooltip>
          )}
          {(project.fuzzy || project.is_fuzzy) && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-black/60 text-white shadow backdrop-blur-sm">
                  <MapPin className="h-3.5 w-3.5" />
                </span>
              </TooltipTrigger>
              <TooltipContent>{t('fuzzyLocations')}</TooltipContent>
            </Tooltip>
          )}
          {project.is_global && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-black/60 text-white shadow backdrop-blur-sm">
                  <Globe className="h-3.5 w-3.5" />
                </span>
              </TooltipTrigger>
              <TooltipContent>{t('global')}</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      <CardContent className="p-3">
        <h3 className="font-medium text-sm line-clamp-2 mb-2">{name}</h3>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {project.observation_count ?? project.contributions ?? 0}
          </span>
          <button
            className="flex items-center gap-1 hover:text-red-500 transition-colors"
            onClick={(e) => { e.stopPropagation(); onLike() }}
          >
            <Heart className={`h-3 w-3 ${project.is_liked_by_user ? 'fill-red-500 text-red-500' : ''}`} />
            {project.total_likes ?? project.likes_count ?? 0}
          </button>
        </div>
      </CardContent>
    </Card>

    {/* Invite admin dialog */}
    <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
      <DialogContent className="max-w-md" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            {t('inviteByEmail')} — {name}
          </DialogTitle>
        </DialogHeader>

        {/* Send invite */}
        <div className="space-y-1">
          <Label>{t('email')}</Label>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="user@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && inviteEmail && inviteMutation.mutate(inviteEmail)}
            />
            <Button
              onClick={() => inviteMutation.mutate(inviteEmail)}
              disabled={!inviteEmail || inviteMutation.isPending}
            >
              {inviteMutation.isPending ? t('loading') : t('inviteByEmail')}
            </Button>
          </div>
        </div>

        {/* Pending invitations */}
        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs uppercase tracking-wide">
            {t('pendingInvitations')}
          </Label>
          {invLoading ? (
            <p className="text-sm text-muted-foreground">{t('loading')}</p>
          ) : pendingInvitations.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('noResults')}</p>
          ) : (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {pendingInvitations.map((inv: { id: number; email?: string; invited_user?: { email?: string }; created_at?: string }) => (
                <div key={inv.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <span className="text-muted-foreground truncate">
                    {inv.email ?? inv.invited_user?.email ?? `#${inv.id}`}
                  </span>
                  <Badge variant="outline" className="text-xs shrink-0 ml-2">Pending</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setInviteOpen(false)}>{t('cancel')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
