import { ArrowDownRight, ArrowUpRight, BarChart3, CalendarDays, Flame, MapPin, Users, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatNumber } from '@/components/stats/format'
import { useTranslationLang } from '@/hooks/use-translation-lang'
import { relativeTime } from './project-utils'
import type { Impact } from '@/api/home'

function Row({ icon: Icon, color, value, label, extra }: {
  icon: LucideIcon; color: string; value: string; label: string; extra?: React.ReactNode
}) {
  return (
    <li className="flex items-center gap-3">
      <Icon className={`h-5 w-5 shrink-0 ${color}`} aria-hidden />
      <span className="font-semibold tabular-nums min-w-8">{value}</span>
      <span className="text-sm text-muted-foreground flex-1">{label}</span>
      {extra}
    </li>
  )
}

export function ImpactCard({ impact }: { impact?: Impact }) {
  const { t } = useTranslation()
  const lang = useTranslationLang()
  const n = (v: number) => formatNumber(v, lang)
  const last = relativeTime(impact?.lastObservation, lang)

  return (
    <div className="rounded-xl border bg-card p-4 space-y-4 shadow-sm">
      <h2 className="font-semibold flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-muted-foreground" /> {t('homeImpactTitle')}
      </h2>
      {impact ? (
        <ul className="space-y-3">
          <Row icon={MapPin} color="text-green-600" value={n(impact.observations)} label={t('homeImpactObservations')} />
          <Row icon={Users} color="text-blue-600" value={n(impact.projectsParticipating)} label={t('homeImpactProjects')} />
          <Row
            icon={CalendarDays}
            color="text-violet-600"
            value={n(impact.thisMonth.value)}
            label={t('homeImpactThisMonth')}
            extra={impact.thisMonth.deltaPct !== null && impact.thisMonth.direction !== 'flat' && (
              <span className={`text-xs flex items-center tabular-nums ${impact.thisMonth.direction === 'up' ? 'text-green-600' : 'text-destructive'}`}>
                {impact.thisMonth.direction === 'up' ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                {Math.abs(impact.thisMonth.deltaPct)}%
              </span>
            )}
          />
          {impact.streakWeeks > 0 ? (
            <Row icon={Flame} color="text-orange-500" value={n(impact.streakWeeks)} label={t('homeImpactStreak')} />
          ) : last ? (
            <li className="text-sm text-muted-foreground">{t('homeLastContribution', { when: last })}</li>
          ) : null}
        </ul>
      ) : (
        <div className="space-y-3" aria-hidden>
          {[0, 1, 2].map((i) => <div key={i} className="h-5 rounded bg-muted animate-pulse" />)}
        </div>
      )}
    </div>
  )
}
