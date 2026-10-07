import type { StatsGranularity } from '@/api/stats'

export function formatNumber(n: number | null | undefined, lang: string): string {
  if (n == null) return '—'
  return new Intl.NumberFormat(lang).format(n)
}

/** Short label for a series bucket: "sep 2026" for months, "15 sep" for weeks. */
export function formatPeriod(period: string, granularity: StatsGranularity, lang: string): string {
  const d = new Date(`${period}T00:00:00`)
  if (Number.isNaN(d.getTime())) return period
  return granularity === 'week'
    ? new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short' }).format(d)
    : new Intl.DateTimeFormat(lang, { month: 'short', year: '2-digit' }).format(d)
}

/** Full label for tooltips: "septiembre de 2026" or "semana del 15 sep 2026". */
export function formatPeriodLong(period: string, granularity: StatsGranularity, lang: string): string {
  const d = new Date(`${period}T00:00:00`)
  if (Number.isNaN(d.getTime())) return period
  return granularity === 'week'
    ? new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short', year: 'numeric' }).format(d)
    : new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric' }).format(d)
}

export function formatDate(iso: string | null | undefined, lang: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short', year: 'numeric' }).format(d)
}

export function formatDateTime(iso: string | null | undefined, lang: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(d)
}

/** Series colors. Defined in index.css for light and dark; SVG fills resolve CSS vars fine. */
export const SERIES = {
  one: 'var(--stats-1)',
  two: 'var(--stats-2)',
  three: 'var(--stats-3)',
  neutral: 'var(--stats-neutral)',
} as const

export const CHART_TEXT = 'hsl(var(--muted-foreground))'
export const CHART_GRID = 'hsl(var(--border))'
