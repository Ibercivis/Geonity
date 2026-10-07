import { useTranslation } from 'react-i18next'
import { Eye, FileText, Users } from 'lucide-react'
import { formatCompact, type OrgStats } from '@/api/orgExplore'
import { useTranslationLang } from '@/hooks/use-translation-lang'
import { cn } from '@/lib/utils'

/** «28 proyectos · 4.2k participantes». Falls back to observations while participants aren't provided. */
export function OrgStatsLine({ stats, className }: { stats: OrgStats; className?: string }) {
  const { t } = useTranslation()
  const lang = useTranslationLang()
  return (
    <p className={cn('flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground', className)}>
      <span className="inline-flex items-center gap-1.5">
        <FileText className="h-4 w-4 shrink-0 text-primary" />
        {t('orgProjectsCount', { count: stats.projects, formatted: formatCompact(stats.projects, lang) })}
      </span>
      {stats.participants !== undefined ? (
        <span className="inline-flex items-center gap-1.5">
          <Users className="h-4 w-4 shrink-0 text-primary" />
          {t('orgParticipantsCount', { count: stats.participants, formatted: formatCompact(stats.participants, lang) })}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5">
          <Eye className="h-4 w-4 shrink-0 text-primary" />
          {t('orgObservationsCount', { count: stats.observations, formatted: formatCompact(stats.observations, lang) })}
        </span>
      )}
    </p>
  )
}
