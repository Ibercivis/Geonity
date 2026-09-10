import { RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTranslationLang } from '@/hooks/use-translation-lang'
import { formatDateTime } from './format'
import { RANGE_PRESETS, type useStatsRange } from './use-stats-range'
import type { StatsGranularity } from '@/api/stats'

interface Props {
  range: ReturnType<typeof useStatsRange>
  generatedAt?: string
  cached?: boolean
  isFetching?: boolean
}

export function StatsRangeControls({ range, generatedAt, cached, isFetching }: Props) {
  const { t } = useTranslation()
  const lang = useTranslationLang()

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={range.preset} onValueChange={(v) => range.setPreset(v as typeof range.preset)}>
        <SelectTrigger className="h-9 w-[150px]" aria-label={t('statsRange')}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {RANGE_PRESETS.map((p) => (
            <SelectItem key={p} value={p}>{t(`statsRange_${p}`)}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Tabs value={range.granularity} onValueChange={(v) => range.setGranularity(v as StatsGranularity)}>
        <TabsList className="h-9">
          <TabsTrigger value="month" className="text-xs">{t('statsByMonth')}</TabsTrigger>
          <TabsTrigger value="week" className="text-xs">{t('statsByWeek')}</TabsTrigger>
        </TabsList>
      </Tabs>

      <Button variant="outline" size="sm" className="h-9" onClick={range.refresh} disabled={isFetching}>
        <RefreshCw className={`h-4 w-4 md:mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
        <span className="hidden md:inline">{t('statsRefresh')}</span>
      </Button>

      {generatedAt && (
        <span className="text-xs text-muted-foreground ml-auto">
          {t('statsGeneratedAt', { when: formatDateTime(generatedAt, lang) })}
          {cached ? ` · ${t('statsCached')}` : ''}
        </span>
      )}
    </div>
  )
}
