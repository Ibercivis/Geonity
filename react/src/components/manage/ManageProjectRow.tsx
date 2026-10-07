import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Clock, Eye, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { projectRole } from '@/api/manage'
import { cn, resolveLocalized } from '@/lib/utils'
import { useTranslationLang } from '@/hooks/use-translation-lang'
import type { Project } from '@/types'
import { projectCoverUrl, projectObservations, relativeTime } from '@/components/home/project-utils'
import { ProjectActionsMenu } from './ProjectActionsMenu'

const pill = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium'

export function ManageProjectRow({ project }: { project: Project }) {
  const { t } = useTranslation()
  const lang = useTranslationLang()
  const cover = projectCoverUrl(project)
  const org = project.organizations?.[0] as { principalName?: string } | undefined
  const last = relativeTime(project.last_activity_at ?? project.last_observation, lang)
  const role = projectRole(project)

  const status = project.draft
    ? { label: t('manageStatusDraft'), cls: 'bg-amber-100 text-amber-800' }
    : project.ended
      ? { label: t('manageStatusEnded'), cls: 'bg-muted text-muted-foreground' }
      : { label: t('manageStatusPublished'), cls: 'bg-green-100 text-green-800' }

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-sm sm:flex-row sm:items-center">
      <Link to={`/projects/${project.id}`} className="flex min-w-0 flex-1 items-center gap-4">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted sm:h-24 sm:w-24">
          {cover && <img src={cover} alt="" loading="lazy" className="h-full w-full object-cover" />}
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold leading-tight">{resolveLocalized(project.name, lang)}</h3>
            <span className={cn(pill, status.cls)}>{status.label}</span>
            <span className={cn(pill, 'bg-blue-100 text-blue-800')}>
              {role === 'owner' ? t('manageRoleOwner') : t('manageRoleAdmin')}
            </span>
          </div>
          <p className="truncate text-sm text-muted-foreground min-h-5">{org?.principalName}</p>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {project.participants_count !== undefined && (
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4" />{t('homeParticipantsCount', { count: project.participants_count })}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Eye className="h-4 w-4" />{t('homeObservationsCount', { count: projectObservations(project) })}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {last ? t('manageLastActivity', { when: last }) : t('manageNoActivity')}
            </span>
          </p>
        </div>
      </Link>

      <div className="flex items-center gap-2 sm:shrink-0">
        <Button asChild className="flex-1 sm:flex-none sm:min-w-44">
          <Link to={`/projects/${project.id}/edit`}>
            {project.draft ? t('manageContinueEditing') : t('editProject')}
          </Link>
        </Button>
        <ProjectActionsMenu project={project} />
      </div>
    </div>
  )
}
