import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Clock, Heart, Users } from 'lucide-react'
import { resolveLocalized } from '@/lib/utils'
import { useTranslationLang } from '@/hooks/use-translation-lang'
import type { Project } from '@/types'
import { projectCoverUrl, projectObservations } from './project-utils'

export function DiscoverProjectCard({ project }: { project: Project }) {
  const { t } = useTranslation()
  const lang = useTranslationLang()
  const cover = projectCoverUrl(project)
  const org = project.organizations?.[0] as { principalName?: string } | undefined

  return (
    <Link
      to={`/projects/${project.id}`}
      className="block h-full rounded-xl border bg-card shadow-sm overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="relative aspect-[16/9] bg-muted">
        {cover && <img src={cover} alt="" loading="lazy" className="h-full w-full object-cover" />}
        {project.ended && (
          <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-background/95 px-2.5 py-1 text-xs font-medium shadow">
            <Clock className="h-3.5 w-3.5" />
            {t('ended')}
          </span>
        )}
      </div>
      <div className="p-3 space-y-1.5">
        <h3 className="font-semibold leading-tight line-clamp-1">{resolveLocalized(project.name, lang)}</h3>
        <p className="text-sm text-muted-foreground truncate min-h-5">{org?.principalName}</p>
        <p className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
          {project.participants_count !== undefined && (
            <>
              <Users className="h-3.5 w-3.5" />
              {t('homeParticipantsCount', { count: project.participants_count })}
              <span aria-hidden>·</span>
            </>
          )}
          {t('homeObservationsCount', { count: projectObservations(project) })}
        </p>
        <p className="text-sm flex items-center gap-1 text-muted-foreground">
          <Heart className="h-4 w-4 text-red-500 fill-red-500" />
          {project.total_likes}
        </p>
      </div>
    </Link>
  )
}
