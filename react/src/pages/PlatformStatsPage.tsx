import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { AlertTriangle } from 'lucide-react'
import { statsApi } from '@/api/stats'
import { useAuthStore } from '@/store/auth'
import { useTranslationLang } from '@/hooks/use-translation-lang'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ChartCard } from '@/components/stats/ChartCard'
import { CountSeriesChart } from '@/components/stats/CountSeriesChart'
import { PlatformDonut } from '@/components/stats/PlatformDonut'
import { usePlatformSeries } from '@/components/stats/use-platform-series'
import { StackedBarChart } from '@/components/stats/StackedBarChart'
import { StatCard } from '@/components/stats/StatCard'
import { StatsErrorState } from '@/components/stats/StatsErrorState'
import { StatsPageShell } from '@/components/stats/StatsPageShell'
import { StatsRangeControls } from '@/components/stats/StatsRangeControls'
import { TopTables } from '@/components/stats/TopTables'
import { formatDate, formatNumber, SERIES } from '@/components/stats/format'
import { useStatsRange } from '@/components/stats/use-stats-range'

/** Whole-platform metrics. Staff only: the link is hidden for everyone else and the API answers 403 anyway. */
export function PlatformStatsPage() {
  const { t } = useTranslation()
  const lang = useTranslationLang()
  const user = useAuthStore((s) => s.user)
  const range = useStatsRange()
  const platformSeries = usePlatformSeries()

  const isStaff = user?.is_staff === true

  const { data, error, isLoading, isFetching } = useQuery({
    queryKey: ['stats', 'platform', ...range.queryKey],
    queryFn: () => statsApi.platform(range.consumeParams()),
    enabled: isStaff,
    retry: false,
  })

  return (
    <StatsPageShell
      title={t('statsPlatform')}
      backTo="/"
      controls={isStaff && <StatsRangeControls range={range} generatedAt={data?.generated_at} cached={data?.cached} isFetching={isFetching} />}
    >
      {user && !isStaff && (
        <Alert variant="destructive"><AlertDescription>{t('statsForbidden')}</AlertDescription></Alert>
      )}
      {isStaff && isLoading && <p className="text-sm text-muted-foreground">{t('loading')}</p>}
      {error && <StatsErrorState error={error} />}

      {data && (
        <>
          {data.projects.abandoned > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{t('statsAbandonedWarning', { count: data.projects.abandoned })}</AlertDescription>
            </Alert>
          )}

          {/* Period movement, with the server-computed change vs. the previous period */}
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            <StatCard label={t('statsObservationsLast30d')} value={data.comparison.observations.value} comparison={data.comparison.observations} />
            <StatCard label={t('statsUsersNew')} value={data.comparison.users.value} comparison={data.comparison.users} />
            <StatCard label={t('statsProjectsCreated')} value={data.comparison.projects_created.value} comparison={data.comparison.projects_created} />
            <StatCard label={t('statsProjectsPublished')} value={data.comparison.projects_published.value} comparison={data.comparison.projects_published} />
          </div>

          {/* Totals */}
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            <StatCard
              label={t('statsObservations')}
              value={data.observations.total}
              hint={t('statsAnonymousObservations', { count: data.observations.anonymous })}
            />
            <StatCard
              label={t('statsProjects')}
              value={data.projects.total}
              hint={`${formatNumber(data.projects.published, lang)} ${t('statsProjectsPublished').toLowerCase()} · ${formatNumber(data.projects.draft, lang)} ${t('statsProjectsDraft').toLowerCase()} · ${formatNumber(data.projects.ended, lang)} ${t('ended').toLowerCase()}`}
            />
            <StatCard
              label={t('statsUsers')}
              value={data.users.total}
              hint={t('statsUsersHint', { active: formatNumber(data.users.active, lang), withObs: formatNumber(data.users.with_observations, lang) })}
            />
            <StatCard
              label={t('statsActive30d')}
              value={data.projects.active_30d}
              hint={t('statsActive30dHint', { published: formatNumber(data.projects.active_30d_published, lang) })}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title={t('statsObservations')}>
              <CountSeriesChart data={data.series.observations} granularity={range.granularity} name={t('statsObservations')} />
            </ChartCard>
            <ChartCard title={t('statsObservationsCumulative')}>
              <CountSeriesChart data={data.series.observations_cumulative} granularity={range.granularity} name={t('statsObservationsCumulative')} variant="line" />
            </ChartCard>
            <ChartCard title={t('statsUsersNew')}>
              <CountSeriesChart data={data.series.users} granularity={range.granularity} name={t('statsUsersNew')} color={SERIES.two} />
            </ChartCard>
            <ChartCard title={t('statsUsersCumulative')}>
              <CountSeriesChart data={data.series.users_cumulative} granularity={range.granularity} name={t('statsUsersCumulative')} variant="line" color={SERIES.two} />
            </ChartCard>
            <ChartCard title={t('statsProjectsCreated')}>
              <CountSeriesChart data={data.series.projects_created} granularity={range.granularity} name={t('statsProjectsCreated')} color={SERIES.three} />
            </ChartCard>
            <ChartCard title={t('statsProjectsPublished')} description={t('statsProjectsPublishedDesc')}>
              <CountSeriesChart data={data.series.projects_published} granularity={range.granularity} name={t('statsProjectsPublished')} color={SERIES.three} />
            </ChartCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <ChartCard title={t('statsByPlatform')} className="lg:col-span-2">
              <StackedBarChart data={data.series_by_platform} granularity={range.granularity} series={platformSeries} />
            </ChartCard>
            <ChartCard title={t('statsByPlatform')} description={t('statsPlatformUnknownDesc')}>
              <PlatformDonut byPlatform={data.observations.by_platform} />
            </ChartCard>
          </div>

          <TopTables top={data.top} />

          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            <StatCard label={t('statsOrganizations')} value={data.organizations.total} />
            <StatCard label={t('statsMemberships')} value={data.engagement.memberships} />
            <StatCard label={t('statsInvitationsPending')} value={data.engagement.invitations_pending} />
            <StatCard label={t('statsLikes')} value={data.engagement.likes} />
          </div>

          <p className="text-xs text-muted-foreground">
            {t('statsLastDigest')}: {data.last_digest_sent_at ? formatDate(data.last_digest_sent_at, lang) : t('statsLastDigestNever')}
          </p>
        </>
      )}
    </StatsPageShell>
  )
}
