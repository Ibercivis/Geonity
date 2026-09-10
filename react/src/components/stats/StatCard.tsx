import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { useTranslationLang } from '@/hooks/use-translation-lang'
import { formatNumber, SERIES } from './format'
import type { Comparison } from '@/api/stats'

interface StatCardProps {
  label: string
  value: number | null | undefined
  /** Small line under the value. */
  hint?: string
  /** Change vs. previous period of the same length, already computed by the server. */
  comparison?: Comparison
}

export function StatCard({ label, value, hint, comparison }: StatCardProps) {
  const { t } = useTranslation()
  const lang = useTranslationLang()

  return (
    <Card>
      <CardContent className="p-4 space-y-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-2xl md:text-3xl font-semibold tabular-nums">{formatNumber(value, lang)}</p>
        {comparison && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {comparison.delta_pct === null ? (
              <span>{t('statsNoPreviousData')}</span>
            ) : (
              <>
                {comparison.direction === 'up' && <ArrowUpRight className="h-3.5 w-3.5" style={{ color: SERIES.three }} aria-hidden />}
                {comparison.direction === 'down' && <ArrowDownRight className="h-3.5 w-3.5 text-destructive" aria-hidden />}
                {comparison.direction === 'flat' && <Minus className="h-3.5 w-3.5" aria-hidden />}
                <span className="tabular-nums">
                  {comparison.delta_pct > 0 ? '+' : ''}{comparison.delta_pct}%
                </span>
                <span>· {t('statsVsPrevious', { value: formatNumber(comparison.previous, lang) })}</span>
              </>
            )}
          </p>
        )}
        {hint && !comparison && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  )
}
