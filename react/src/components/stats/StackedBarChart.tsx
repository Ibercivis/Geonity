import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useTranslation } from 'react-i18next'
import { useTranslationLang } from '@/hooks/use-translation-lang'
import { ChartTooltip } from './ChartTooltip'
import { CHART_GRID, CHART_TEXT, formatNumber, formatPeriod, formatPeriodLong } from './format'
import type { StatsGranularity } from '@/api/stats'

export interface StackedSeries {
  key: string
  label: string
  color: string
  /** Hatched fill for "unknown / not recorded" so it never reads as a real category. */
  hatched?: boolean
}

interface Props<T extends { period: string }> {
  data: T[]
  granularity: StatsGranularity
  /** Fixed order: colors follow the entity, never its rank. */
  series: StackedSeries[]
  height?: number
}

/** Stacked bars with a legend. Used for contributors (new / recurring / anonymous) and platform (mobile / web / unknown). */
export function StackedBarChart<T extends { period: string }>({ data, granularity, series, height = 220 }: Props<T>) {
  const { t } = useTranslation()
  const lang = useTranslationLang()
  const nameFor = (key: string) => series.find((s) => s.key === key)?.label ?? key

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground py-10 text-center">{t('statsNoData')}</p>
  }

  const tick = { fill: CHART_TEXT, fontSize: 11 }
  const hatchId = 'stats-hatch'

  return (
    <div className="space-y-2">
      <div style={{ height }} role="img" aria-label={series.map((s) => s.label).join(', ')}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="30%">
            <defs>
              {series.filter((s) => s.hatched).map((s) => (
                <pattern key={s.key} id={`${hatchId}-${s.key}`} patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
                  <rect width="6" height="6" fill={s.color} opacity={0.35} />
                  <line x1="0" y1="0" x2="0" y2="6" stroke={s.color} strokeWidth="2" />
                </pattern>
              ))}
            </defs>
            <CartesianGrid vertical={false} stroke={CHART_GRID} />
            <XAxis
              dataKey="period"
              tickFormatter={(v: string) => formatPeriod(v, granularity, lang)}
              tick={tick}
              tickLine={false}
              axisLine={{ stroke: CHART_GRID }}
              minTickGap={24}
            />
            <YAxis tick={tick} tickLine={false} axisLine={false} width={44} allowDecimals={false} tickFormatter={(v: number) => formatNumber(v, lang)} />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted))', opacity: 0.6 }}
              content={<ChartTooltip formatLabel={(l) => formatPeriodLong(l, granularity, lang)} nameFor={nameFor} />}
            />
            {series.map((s, i) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.label}
                stackId="a"
                fill={s.hatched ? `url(#${hatchId}-${s.key})` : s.color}
                stroke="hsl(var(--card))"
                strokeWidth={1}
                radius={i === series.length - 1 ? [4, 4, 0, 0] : 0}
                maxBarSize={28}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ChartLegend series={series} />
    </div>
  )
}

export function ChartLegend({ series }: { series: StackedSeries[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {series.map((s) => (
        <li key={s.key} className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm shrink-0"
            style={{
              background: s.hatched
                ? `repeating-linear-gradient(45deg, ${s.color} 0 2px, transparent 2px 4px)`
                : s.color,
            }}
            aria-hidden
          />
          {s.label}
        </li>
      ))}
    </ul>
  )
}
