import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useTranslation } from 'react-i18next'
import { useTranslationLang } from '@/hooks/use-translation-lang'
import { ChartTooltip } from './ChartTooltip'
import { CHART_GRID, CHART_TEXT, formatNumber, formatPeriod, formatPeriodLong, SERIES } from './format'
import type { CountPoint, StatsGranularity } from '@/api/stats'

interface Props {
  data: CountPoint[]
  granularity: StatsGranularity
  /** Series name shown in the tooltip. */
  name: string
  /** Bars for per-period volume, line for cumulative totals. */
  variant?: 'bar' | 'line'
  color?: string
  height?: number
}

/** One series over time. Single hue, thin marks, recessive grid, hover tooltip. */
export function CountSeriesChart({ data, granularity, name, variant = 'bar', color = SERIES.one, height = 220 }: Props) {
  const { t } = useTranslation()
  const lang = useTranslationLang()

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground py-10 text-center">{t('statsNoData')}</p>
  }

  const tick = { fill: CHART_TEXT, fontSize: 11 }
  const tooltip = (
    <Tooltip
      cursor={variant === 'bar' ? { fill: 'hsl(var(--muted))', opacity: 0.6 } : { stroke: CHART_GRID }}
      content={<ChartTooltip formatLabel={(l) => formatPeriodLong(l, granularity, lang)} nameFor={() => name} />}
    />
  )
  const xAxis = (
    <XAxis
      dataKey="period"
      tickFormatter={(v: string) => formatPeriod(v, granularity, lang)}
      tick={tick}
      tickLine={false}
      axisLine={{ stroke: CHART_GRID }}
      minTickGap={24}
    />
  )
  const yAxis = (
    <YAxis
      tick={tick}
      tickLine={false}
      axisLine={false}
      width={44}
      allowDecimals={false}
      tickFormatter={(v: number) => formatNumber(v, lang)}
    />
  )

  return (
    <div style={{ height }} role="img" aria-label={name}>
      <ResponsiveContainer width="100%" height="100%">
        {variant === 'bar' ? (
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="30%">
            <CartesianGrid vertical={false} stroke={CHART_GRID} />
            {xAxis}
            {yAxis}
            {tooltip}
            <Bar dataKey="count" name={name} fill={color} radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
          </BarChart>
        ) : (
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={CHART_GRID} />
            {xAxis}
            {yAxis}
            {tooltip}
            <Line
              type="monotone"
              dataKey="count"
              name={name}
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, stroke: 'hsl(var(--card))', strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}
