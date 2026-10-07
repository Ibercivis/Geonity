import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Clock, MapPin, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { mediaUrl, resolveLocalized } from '@/lib/utils'
import { useTranslationLang } from '@/hooks/use-translation-lang'
import type { ContinueItem } from '@/api/home'
import { relativeTime } from './project-utils'

export function ContinueProjectCard({ project }: { project: ContinueItem }) {
  const { t } = useTranslation()
  const lang = useTranslationLang()
  const navigate = useNavigate()
  const cover = project.cover ? mediaUrl(project.cover) : null
  const last = relativeTime(project.lastObservation, lang)

  return (
    <div className="h-full rounded-xl border bg-card p-3 shadow-sm flex flex-col gap-3">
      <Link to={`/projects/${project.id}`} className="flex gap-3 min-w-0">
        <div className="h-24 w-24 shrink-0 rounded-lg overflow-hidden bg-muted">
          {cover && <img src={cover} alt="" loading="lazy" className="h-full w-full object-cover" />}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="font-semibold leading-tight line-clamp-2">{resolveLocalized(project.name, lang)}</h3>
          {project.organization && <p className="text-sm text-muted-foreground truncate">{project.organization}</p>}
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {t('homeObservationsCount', { count: project.observations })}
          </p>
        </div>
      </Link>
      <p className="rounded-md bg-muted/60 px-2.5 py-1.5 text-xs text-muted-foreground flex items-center gap-1.5 mt-auto">
        {last ? <TrendingUp className="h-3.5 w-3.5 shrink-0" /> : <Clock className="h-3.5 w-3.5 shrink-0" />}
        <span className="truncate">{last ? t('homeLastObservation', { when: last }) : t('homeNoObservationsYet')}</span>
      </p>
      <Button
        disabled={project.ended}
        onClick={() => navigate(`/projects/${project.id}/observations/new`)}
      >
        {t('addObservation')}
      </Button>
    </div>
  )
}
