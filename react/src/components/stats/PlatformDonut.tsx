import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { useTranslation } from 'react-i18next'
import { useTranslationLang } from '@/hooks/use-translation-lang'
import { ChartTooltip } from './ChartTooltip'
import { formatNumber, SERIES } from './format'
import { ChartLegend } from './StackedBarChart'
import { usePlatformSeries } from './use-platform-series'

interface Props {
  byPlatform: { mobile: number; web: number; unknown: number }
}

export function PlatformDonut({ byPlatform }: Props) {
  const { t } = useTranslation()
  const lang = useTranslationLang()
  const series = usePlatformSeries()
  const total = byPlatform.mobile + byPlatform.web + byPlatform.unknown

  if (total === 0) {
    return <p className="text-sm text-muted-foreground py-10 text-center">{t('statsNoData')}</p>
  }

  const data = series.map((s) => ({ key: s.key, name: s.label, value: byPlatform[s.key as keyof typeof byPlatform] }))

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <div className="h-[180px] w-[180px] shrink-0" role="img" aria-label={t('statsByPlatform')}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <defs>
              <pattern id="stats-donut-hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
                <rect width="6" height="6" fill={SERIES.neutral} opacity={0.35} />
                <line x1="0" y1="0" x2="0" y2="6" stroke={SERIES.neutral} strokeWidth="2" />
              </pattern>
            </defs>
            <Tooltip content={<ChartTooltip nameFor={(k) => series.find((s) => s.key === k)?.label ?? k} formatLabel={() => t('statsByPlatform')} />} />
            <Pie
              data={data}
              dataKey="value"
              nameKey="key"
              innerRadius={52}
              outerRadius={80}
              paddingAngle={2}
              stroke="hsl(var(--card))"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {data.map((d, i) => (
                <Cell key={d.key} fill={series[i].hatched ? 'url(#stats-donut-hatch)' : series[i].color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2 min-w-0">
        <table className="text-xs">
          <tbody>
            {data.map((d, i) => (
              <tr key={d.key}>
                <td className="pr-3 py-0.5">
                  <ChartLegend series={[series[i]]} />
                </td>
                <td className="pr-3 py-0.5 text-right tabular-nums font-medium">{formatNumber(d.value, lang)}</td>
                <td className="py-0.5 text-right tabular-nums text-muted-foreground">{Math.round((d.value / total) * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
