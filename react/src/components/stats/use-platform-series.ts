import { useTranslation } from 'react-i18next'
import { SERIES } from './format'
import type { StackedSeries } from './StackedBarChart'

/** Fixed series order and colors for platform breakdowns, shared by the donut and the stacked bars. */
export function usePlatformSeries(): StackedSeries[] {
  const { t } = useTranslation()
  return [
    { key: 'mobile', label: t('statsPlatformMobile'), color: SERIES.one },
    { key: 'web', label: t('statsPlatformWeb'), color: SERIES.two },
    // 29% of production observations predate the platform field. Label them honestly, never hide them in "other".
    { key: 'unknown', label: t('statsPlatformUnknown'), color: SERIES.neutral, hatched: true },
  ]
}
