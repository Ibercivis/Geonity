import { useTranslation } from 'react-i18next'
import { SERIES } from './format'
import { StackedBarChart } from './StackedBarChart'
import type { ContributorsPoint, StatsGranularity } from '@/api/stats'

/** Distinct people per period, new vs. returning. This is the series that tells retention, not volume. */
export function ContributorsChart({ data, granularity }: { data: ContributorsPoint[]; granularity: StatsGranularity }) {
  const { t } = useTranslation()
  return (
    <StackedBarChart
      data={data}
      granularity={granularity}
      series={[
        { key: 'new', label: t('statsContributorsNew'), color: SERIES.one },
        { key: 'recurring', label: t('statsContributorsRecurring'), color: SERIES.two },
        { key: 'anonymous', label: t('statsContributorsAnonymous'), color: SERIES.three },
      ]}
    />
  )
}
