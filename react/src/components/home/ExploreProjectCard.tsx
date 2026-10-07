import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Clock, Eye, Heart, Lock, Users } from 'lucide-react'
import { projectsApi } from '@/api/projects'
import { toast } from '@/hooks/use-toast'
import { useTranslationLang } from '@/hooks/use-translation-lang'
import { cn, resolveLocalized } from '@/lib/utils'
import type { Project } from '@/types'
import { projectCoverUrl, projectObservations } from './project-utils'

const badge = 'absolute top-2 inline-flex items-center gap-1 rounded-full bg-background/95 px-2.5 py-1 text-xs font-medium shadow'

export function ExploreProjectCard({ project }: { project: Project }) {
  const { t } = useTranslation()
  const lang = useTranslationLang()
  const qc = useQueryClient()
  const cover = projectCoverUrl(project)
  const org = project.organizations?.[0] as { principalName?: string } | undefined

  const like = useMutation({
    mutationFn: () => projectsApi.toggleLike(project.id),
    onSuccess: () => {
      qc.setQueryData<Project[]>(['explore', 'all'], (list) =>
        list?.map((p) =>
          p.id === project.id
            ? { ...p, is_liked_by_user: !p.is_liked_by_user, total_likes: p.total_likes + (p.is_liked_by_user ? -1 : 1) }
            : p,
        ),
      )
    },
    onError: () => toast({ title: t('error'), variant: 'destructive' }),
  })

  return (
    <div className="relative h-full rounded-xl border bg-card shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <Link to={`/projects/${project.id}`} className="block">
        <div className="relative aspect-[16/9] bg-muted">
          {cover && <img src={cover} alt="" loading="lazy" className="h-full w-full object-cover" />}
          {project.is_private && (
            <span className={cn(badge, 'left-2')}><Lock className="h-3.5 w-3.5" />{t('exploreProtected')}</span>
          )}
          {project.ended && (
            <span className={cn(badge, 'right-2')}><Clock className="h-3.5 w-3.5" />{t('ended')}</span>
          )}
        </div>
        <div className="p-3 pr-16 space-y-1">
          <h3 className="font-semibold leading-tight line-clamp-1">{resolveLocalized(project.name, lang)}</h3>
          <p className="text-sm text-muted-foreground truncate min-h-5">{org?.principalName}</p>
          <div className="text-xs text-muted-foreground space-y-0.5">
            {project.participants_count !== undefined && (
              <p className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />{t('homeParticipantsCount', { count: project.participants_count })}
              </p>
            )}
            <p className="flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" />{t('homeObservationsCount', { count: projectObservations(project) })}
            </p>
          </div>
        </div>
      </Link>
      <button
        type="button"
        onClick={() => like.mutate()}
        disabled={like.isPending}
        aria-pressed={project.is_liked_by_user}
        aria-label={t('like')}
        className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-sm hover:bg-accent transition-colors"
      >
        <Heart className={cn('h-4 w-4 text-red-500', project.is_liked_by_user && 'fill-red-500')} />
        {project.total_likes}
      </button>
    </div>
  )
}
