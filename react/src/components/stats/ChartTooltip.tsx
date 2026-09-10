import type { ReactNode } from 'react'
import { useTranslationLang } from '@/hooks/use-translation-lang'
import { formatNumber } from './format'

interface TooltipRow {
  dataKey?: string | number
  name?: string | number
  value?: number | string
  color?: string
}

/** The subset of Recharts' tooltip props we read. Recharts injects them when the element is passed as `content`. */
interface Props {
  active?: boolean
  payload?: ReadonlyArray<TooltipRow>
  label?: ReactNode
  /** Turns the raw x value (a period string) into a readable label. */
  formatLabel?: (label: string) => string
  /** Maps a series dataKey to its display name. */
  nameFor?: (key: string) => string
}

/** Themed tooltip shared by every chart. Text uses text tokens; the swatch carries series identity. */
export function ChartTooltip({ active, payload, label, formatLabel, nameFor }: Props) {
  const lang = useTranslationLang()
  if (!active || !payload?.length) return null
  const rows = payload.filter((p) => p.value != null)
  return (
    <div className="rounded-md border bg-card text-card-foreground shadow-md px-3 py-2 text-xs space-y-1">
      <p className="font-medium">{formatLabel ? formatLabel(String(label)) : String(label)}</p>
      {rows.map((p) => {
        const key = String(p.name ?? p.dataKey ?? '')
        return (
          <p key={key} className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: p.color }} aria-hidden />
            <span className="text-muted-foreground">{nameFor ? nameFor(key) : key}</span>
            <span className="ml-auto tabular-nums font-medium">{formatNumber(Number(p.value), lang)}</span>
          </p>
        )
      })}
    </div>
  )
}
