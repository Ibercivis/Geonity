import { useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, FileText, MapPin, Plus, type LucideIcon } from 'lucide-react'
import { MANAGE_PAGE_SIZE, MANAGE_TABS, loadManagePage, type ManageTab } from '@/api/manage'
import { Button } from '@/components/ui/button'
import { PageHero } from '@/components/shared/PageHero'
import { Pagination } from '@/components/shared/Pagination'
import { ManageProjectRow } from '@/components/manage/ManageProjectRow'
import { ManageToolsCard } from '@/components/manage/ManageToolsCard'
import { RecentActivityCard } from '@/components/manage/RecentActivityCard'
import { cn } from '@/lib/utils'

const TAB_ICONS: Record<ManageTab, LucideIcon> = { active: MapPin, draft: FileText, ended: CheckCircle2 }

export function ManagePage() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const requested = params.get('tab')
  const tab: ManageTab = MANAGE_TABS.includes(requested as ManageTab) ? (requested as ManageTab) : 'active'

  const listRef = useRef<HTMLDivElement>(null)
  const page = Math.max(1, Number(params.get('page')) || 1)

  // One request per tab and page; the response always carries the counters of the three tabs.
  const { data, isLoading, isError } = useQuery({
    queryKey: ['manage', 'projects', tab, page],
    queryFn: () => loadManagePage(tab, page),
    placeholderData: keepPreviousData,
  })
  const counts = data?.counts
  const list = data?.results ?? []
  const pageCount = Math.max(1, Math.ceil((data?.count ?? 0) / MANAGE_PAGE_SIZE))
  const totalProjects = counts ? counts.active + counts.draft + counts.ended : undefined

  const goToTab = (next: ManageTab) => setParams(next === 'active' ? {} : { tab: next }, { replace: true })
  const goToPage = (next: number) => {
    const out = new URLSearchParams(params)
    if (next <= 1) out.delete('page')
    else out.set('page', String(next))
    setParams(out, { replace: true })
    listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const tabLabels: Record<ManageTab, string> = {
    active: t('manageTabActive'),
    draft: t('manageTabDraft'),
    ended: t('manageTabEnded'),
  }

  return (
    <div className="h-full overflow-y-auto">
      <PageHero
        title={t('manageTitle')}
        subtitle={t('manageSubtitle')}
        action={
          <Button asChild size="lg">
            <Link to="/projects/new"><Plus className="mr-2 h-5 w-5" />{t('newProject')}</Link>
          </Button>
        }
      />

      <div className="grid max-w-[100rem] gap-6 px-4 py-6 md:px-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-4">
          <div role="tablist" className="grid grid-cols-3 gap-1 rounded-xl border bg-muted/40 p-1">
            {MANAGE_TABS.map((key) => {
              const Icon = TAB_ICONS[key]
              const selected = key === tab
              return (
                <button
                  key={key}
                  role="tab"
                  type="button"
                  aria-selected={selected}
                  onClick={() => goToTab(key)}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-lg px-2 py-2.5 text-sm font-medium transition-colors',
                    selected ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:bg-background',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{tabLabels[key]}{counts ? ` (${counts[key]})` : ''}</span>
                </button>
              )
            })}
          </div>

          {isLoading ? (
            <div className="space-y-3" aria-hidden>
              {[0, 1, 2].map((i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />)}
            </div>
          ) : isError ? (
            <p className="py-10 text-center text-muted-foreground">{t('homeSectionError')}</p>
          ) : totalProjects === 0 ? (
            <div className="space-y-3 rounded-xl border border-dashed p-8 text-center">
              <p className="text-muted-foreground">{t('manageEmptyAll')}</p>
              <Button asChild><Link to="/projects/new">{t('manageCreateFirst')}</Link></Button>
            </div>
          ) : list.length === 0 ? (
            <p className="py-10 text-center text-muted-foreground">{t(`manageEmpty_${tab}`)}</p>
          ) : (
            <div ref={listRef} className="scroll-mt-4 space-y-3">
              {list.map((p) => <ManageProjectRow key={p.id} project={p} />)}
              <Pagination page={Math.min(page, pageCount)} pageCount={pageCount} onChange={goToPage} />
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <ManageToolsCard />
          <RecentActivityCard />
        </aside>
      </div>
    </div>
  )
}
