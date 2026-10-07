import { Link, useSearchParams } from 'react-router-dom'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { activityApi, isActivityUnavailable, type ActivityScope } from '@/api/activity'
import { Button } from '@/components/ui/button'
import { PageHero } from '@/components/shared/PageHero'
import { ActivityRow } from '@/components/manage/ActivityRow'
import { cn } from '@/lib/utils'

const SCOPES: ActivityScope[] = ['all', 'others', 'mine']
const PAGE_SIZE = 20

export function ActivityPage() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const requested = params.get('scope')
  const scope: ActivityScope = SCOPES.includes(requested as ActivityScope) ? (requested as ActivityScope) : 'all'
  const projectParam = Number(params.get('project')) || undefined

  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['activity', 'page', scope, projectParam],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      activityApi.list({ scope, project: projectParam, page: pageParam, page_size: PAGE_SIZE }),
    getNextPageParam: (last, pages) => (last.next ? pages.length + 1 : undefined),
    retry: (count, err) => !isActivityUnavailable(err) && count < 2,
  })

  const items = data?.pages.flatMap((p) => p.results) ?? []
  const scopeLabels: Record<ActivityScope, string> = {
    all: t('activityScopeAll'),
    others: t('activityScopeOthers'),
    mine: t('activityScopeMine'),
  }

  const setScope = (next: ActivityScope) => {
    const out = new URLSearchParams(params)
    if (next === 'all') out.delete('scope')
    else out.set('scope', next)
    setParams(out, { replace: true })
  }

  return (
    <div className="h-full overflow-y-auto">
      <PageHero
        title={t('activityPageTitle')}
        subtitle={t('activityPageSubtitle')}
        action={
          <Button asChild variant="outline">
            <Link to="/gestionar"><ArrowLeft className="mr-2 h-4 w-4" />{t('navManage')}</Link>
          </Button>
        }
      />

      <div className="max-w-3xl space-y-4 px-4 py-6 md:px-8">
        <div role="tablist" className="inline-flex gap-1 rounded-xl border bg-muted/40 p-1">
          {SCOPES.map((s) => (
            <button
              key={s}
              role="tab"
              type="button"
              aria-selected={s === scope}
              onClick={() => setScope(s)}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                s === scope ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:bg-background',
              )}
            >
              {scopeLabels[s]}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-2" aria-hidden>
            {[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-14 animate-pulse rounded bg-muted" />)}
          </div>
        ) : error ? (
          <p className="py-10 text-center text-muted-foreground">
            {isActivityUnavailable(error) ? t('activityEmpty') : t('homeSectionError')}
          </p>
        ) : items.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground">{t('activityEmpty')}</p>
        ) : (
          <>
            <ul className="divide-y rounded-xl border bg-card px-3">
              {items.map((item) => <ActivityRow key={item.id} item={item} />)}
            </ul>
            {hasNextPage && (
              <div className="flex justify-center pb-6">
                <Button variant="outline" disabled={isFetchingNextPage} onClick={() => fetchNextPage()}>
                  {t('exploreShowMore')}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
