import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Clock } from 'lucide-react'
import { activityApi, isActivityUnavailable } from '@/api/activity'
import { ActivityRow } from './ActivityRow'

const WIDGET_SIZE = 5

export function RecentActivityCard() {
  const { t } = useTranslation()
  const { data, isLoading, error } = useQuery({
    queryKey: ['activity', 'widget'],
    queryFn: () => activityApi.list({ scope: 'all', page_size: WIDGET_SIZE }),
    retry: (count, err) => !isActivityUnavailable(err) && count < 2,
  })

  // Endpoint not deployed yet (404): behave as an empty feed rather than as an error.
  const unavailable = !!error && isActivityUnavailable(error)

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-semibold">
          <Clock className="h-5 w-5 text-primary" /> {t('activityTitle')}
        </h2>
        <Link to="/gestionar/actividad" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          {t('activitySeeAll')} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-2" aria-hidden>
          {[0, 1, 2].map((i) => <div key={i} className="h-12 animate-pulse rounded bg-muted" />)}
        </div>
      ) : error && !unavailable ? (
        <p className="py-3 text-sm text-muted-foreground">{t('homeSectionError')}</p>
      ) : data && data.results.length > 0 ? (
        <ul className="divide-y">
          {data.results.map((item) => <ActivityRow key={item.id} item={item} />)}
        </ul>
      ) : (
        <p className="py-3 text-sm text-muted-foreground">{t('activityEmpty')}</p>
      )}
    </div>
  )
}
