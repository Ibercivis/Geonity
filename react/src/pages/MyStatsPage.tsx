import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { AlertTriangle } from 'lucide-react'
import { statsApi } from '@/api/stats'
import { useTranslationLang } from '@/hooks/use-translation-lang'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ChartCard } from '@/components/stats/ChartCard'
import { ContributorsChart } from '@/components/stats/ContributorsChart'
import { CountSeriesChart } from '@/components/stats/CountSeriesChart'
import { PerProjectTable } from '@/components/stats/PerProjectTable'
import { PlatformDonut } from '@/components/stats/PlatformDonut'
import { usePlatformSeries } from '@/components/stats/use-platform-series'
import { StackedBarChart } from '@/components/stats/StackedBarChart'
import { StatCard } from '@/components/stats/StatCard'
import { StatsErrorState } from '@/components/stats/StatsErrorState'
import { StatsPageShell } from '@/components/stats/StatsPageShell'
import { StatsRangeControls } from '@/components/stats/StatsRangeControls'
import { formatNumber } from '@/components/stats/format'
import { useStatsRange } from '@/components/stats/use-stats-range'

/** Everything the current user creates or administers. Any authenticated user; no rankings here. */
export function MyStatsPage() {
  const { t } = useTranslation()
  const lang = useTranslationLang()
  const range = useStatsRange()
  const platformSeries = usePlatformSeries()

  const { data, error, isLoading, isFetching } = useQuery({
    queryKey: ['stats', 'me', ...range.queryKey],
    queryFn: () => statsApi.me(range.consumeParams()),
    retry: false,
  })

  const empty = data && data.projects.total === 0

  return (
    <StatsPageShell
      title={t('statsMine')}
      backTo="/"
      controls={!empty && <StatsRangeControls range={range} generatedAt={data?.generated_at} cached={data?.cached} isFetching={isFetching} />}
    >
      {isLoading && <p className="text-sm text-muted-foreground">{t('loading')}</p>}
      {error && <StatsErrorState error={error} />}
      {empty && <p className="text-sm text-muted-foreground">{t('statsEmptyMine')}</p>}

      {data && !empty && (
        <>
          {data.projects.abandoned > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{t('statsAbandonedWarning', { count: data.projects.abandoned })}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            <StatCard
              label={t('statsProjects')}
              value={data.projects.total}
              hint={`${formatNumber(data.projects.published, lang)} ${t('statsProjectsPublished').toLowerCase()} · ${formatNumber(data.projects.draft, lang)} ${t('statsProjectsDraft').toLowerCase()}`}
            />
            <StatCard
              label={t('statsActive30d')}
              value={data.projects.active_30d}
              hint={t('statsActive30dHint', { published: formatNumber(data.projects.active_30d_published, lang) })}
            />
            <StatCard label={t('statsObservations')} value={data.observations.total} />
            <StatCard label={t('statsObservationsLast30d')} value={data.observations.last_30d} comparison={data.comparison.observations} />
          </div>

          <ChartCard title={t('statsPerProject')}>
            <PerProjectTable rows={data.per_project} />
          </ChartCard>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title={t('statsObservations')}>
              <CountSeriesChart data={data.series.observations} granularity={range.granularity} name={t('statsObservations')} />
            </ChartCard>
            <ChartCard title={t('statsObservationsCumulative')}>
              <CountSeriesChart data={data.series.observations_cumulative} granularity={range.granularity} name={t('statsObservationsCumulative')} variant="line" />
            </ChartCard>
          </div>

          <ChartCard
            title={t('statsContributors')}
            description={t('statsContributorsHint', { new: formatNumber(data.contributors.new, lang), recurring: formatNumber(data.contributors.recurring, lang) })}
          >
            <ContributorsChart data={data.series.contributors} granularity={range.granularity} />
          </ChartCard>

          <div className="grid gap-4 lg:grid-cols-3">
            <ChartCard title={t('statsByPlatform')} className="lg:col-span-2">
              <StackedBarChart data={data.series.by_platform} granularity={range.granularity} series={platformSeries} />
            </ChartCard>
            <ChartCard title={t('statsByPlatform')} description={t('statsPlatformUnknownDesc')}>
              <PlatformDonut byPlatform={data.observations.by_platform} />
            </ChartCard>
          </div>
        </>
      )}
    </StatsPageShell>
  )
}
