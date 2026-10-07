import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { statsApi } from '@/api/stats'
import { useTranslationLang } from '@/hooks/use-translation-lang'
import { Badge } from '@/components/ui/badge'
import { ChartCard } from '@/components/stats/ChartCard'
import { ContributorsChart } from '@/components/stats/ContributorsChart'
import { CountSeriesChart } from '@/components/stats/CountSeriesChart'
import { PlatformDonut } from '@/components/stats/PlatformDonut'
import { usePlatformSeries } from '@/components/stats/use-platform-series'
import { StackedBarChart } from '@/components/stats/StackedBarChart'
import { StatCard } from '@/components/stats/StatCard'
import { StatsErrorState } from '@/components/stats/StatsErrorState'
import { StatsPageShell } from '@/components/stats/StatsPageShell'
import { StatsRangeControls } from '@/components/stats/StatsRangeControls'
import { formatDate, formatNumber, SERIES } from '@/components/stats/format'
import { useStatsRange } from '@/components/stats/use-stats-range'

/** One project. Creator and administrators only (the API answers 403 to anyone else). */
export function ProjectStatsPage() {
  const { id } = useParams<{ id: string }>()
  return <ProjectStatsView projectId={Number(id)} />
}

interface ProjectStatsViewProps {
  projectId: number
  /** Inside a dialog: no page shell or back arrow. */
  embedded?: boolean
}

export function ProjectStatsView({ projectId, embedded = false }: ProjectStatsViewProps) {
  const { t } = useTranslation()
  const lang = useTranslationLang()
  const range = useStatsRange()
  const platformSeries = usePlatformSeries()

  const { data, error, isLoading, isFetching } = useQuery({
    queryKey: ['stats', 'project', projectId, ...range.queryKey],
    queryFn: () => statsApi.project(projectId, range.consumeParams()),
    enabled: Number.isFinite(projectId),
    retry: false,
  })

  const title = data ? data.project.name : t('statsProject')
  const subtitle: ReactNode = data && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {data.project.draft && <Badge variant="outline">{t('draft')}</Badge>}
          {data.project.ended && <Badge variant="secondary">{t('ended')}</Badge>}
          <span>{t('statsCreatedAt')}: {formatDate(data.project.created_at, lang)}</span>
          <span>{t('statsPublishedAt')}: {formatDate(data.project.published_at, lang)}</span>
          {data.span.first_observation && (
            <span>{t('statsFirstObservation')}: {formatDate(data.span.first_observation, lang)}</span>
          )}
          {data.span.last_observation && (
            <span>{t('statsLastObservation')}: {formatDate(data.span.last_observation, lang)}</span>
          )}
        </div>
  )
  const controls = (
    <StatsRangeControls range={range} generatedAt={data?.generated_at} cached={data?.cached} isFetching={isFetching} />
  )

  const body = (
    <>
      {isLoading && <p className="text-sm text-muted-foreground">{t('loading')}</p>}
      {error && <StatsErrorState error={error} />}

      {data && (
        <>
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            <StatCard label={t('statsObservations')} value={data.observations.total} />
            <StatCard label={t('statsObservationsLast30d')} value={data.observations.last_30d} comparison={data.comparison.observations} />
            <StatCard
              label={t('statsContributors')}
              value={data.contributors.total}
              hint={t('statsContributorsHint', { new: formatNumber(data.contributors.new, lang), recurring: formatNumber(data.contributors.recurring, lang) })}
            />
            <StatCard
              label={t('statsWithImages')}
              value={data.observations.with_images}
              hint={t('statsAnonymousObservations', { count: data.observations.anonymous })}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title={t('statsObservations')}>
              <CountSeriesChart data={data.series.observations} granularity={range.granularity} name={t('statsObservations')} />
            </ChartCard>
            <ChartCard title={t('statsObservationsCumulative')}>
              <CountSeriesChart data={data.series.observations_cumulative} granularity={range.granularity} name={t('statsObservationsCumulative')} variant="line" color={SERIES.one} />
            </ChartCard>
          </div>

          <ChartCard title={t('statsContributors')} description={t('statsContributorsDesc')}>
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
    </>
  )

  if (embedded) {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="pr-8">
            <h2 className="text-xl font-bold">{title}</h2>
            {subtitle && <div className="text-sm text-muted-foreground">{subtitle}</div>}
          </div>
          {controls}
        </div>
        {body}
      </div>
    )
  }

  return (
    <StatsPageShell title={title} backTo={`/projects/${projectId}`} subtitle={subtitle} controls={controls}>
      {body}
    </StatsPageShell>
  )
}
