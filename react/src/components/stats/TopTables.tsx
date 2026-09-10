import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { useTranslationLang } from '@/hooks/use-translation-lang'
import { ChartCard } from './ChartCard'
import { formatNumber } from './format'
import type { PlatformStats } from '@/api/stats'

/** Rankings exist only at platform level, on purpose: the other endpoints never compare projects. */
export function TopTables({ top }: { top: PlatformStats['top'] }) {
  const { t } = useTranslation()
  const lang = useTranslationLang()

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ChartCard title={t('statsTopProjects')}>
        {top.projects_by_observations.length === 0
          ? <p className="text-sm text-muted-foreground">{t('statsNoData')}</p>
          : (
            <ol className="text-sm divide-y">
              {top.projects_by_observations.map((p, i) => (
                <li key={p.id} className="flex items-center gap-3 py-2">
                  <span className="w-5 text-xs text-muted-foreground tabular-nums">{i + 1}</span>
                  <Link to={`/projects/${p.id}/stats`} className="flex-1 min-w-0 truncate font-medium hover:underline">{p.name}</Link>
                  {!p.published && <Badge variant="outline" className="text-[10px] px-1.5 py-0">{t('draft')}</Badge>}
                  <span className="tabular-nums">{formatNumber(p.observations, lang)}</span>
                </li>
              ))}
            </ol>
          )}
      </ChartCard>

      <ChartCard title={t('statsTopCreators')}>
        {top.creators_by_observations.length === 0
          ? <p className="text-sm text-muted-foreground">{t('statsNoData')}</p>
          : (
            <ol className="text-sm divide-y">
              {top.creators_by_observations.map((c, i) => (
                <li key={c.id} className="flex items-center gap-3 py-2">
                  <span className="w-5 text-xs text-muted-foreground tabular-nums">{i + 1}</span>
                  <span className="flex-1 min-w-0 truncate font-medium">{c.username}</span>
                  <span className="text-xs text-muted-foreground">{t('statsProjectsCount', { count: c.projects })}</span>
                  <span className="tabular-nums">{formatNumber(c.observations, lang)}</span>
                </li>
              ))}
            </ol>
          )}
      </ChartCard>
    </div>
  )
}
