import { useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowUpDown, Building2, CircleDot, Layers, MapPin, Plus, RotateCcw, User } from 'lucide-react'
import {
  DEFAULT_ORG_FILTERS, FEATURED_LIMIT, ORG_ACTIVITY_VALUES, ORG_SORT_VALUES,
  featuredOrgs, filterOrgs, orgStatsOf, sortOrgs, typeCounts, type OrgFilters,
} from '@/api/orgExplore'
import { projectsApi } from '@/api/projects'
import type { OrgType } from '@/api/organizations'
import type { Organization } from '@/types'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Pagination } from '@/components/shared/Pagination'
import { PageHero } from '@/components/shared/PageHero'
import { ProjectSlider } from '@/components/home/ProjectSlider'
import { CreateOrgDialog } from '@/components/organizations/CreateOrgDialog'
import { FeaturedOrgCard } from '@/components/organizations/FeaturedOrgCard'
import { OrgRowCard } from '@/components/organizations/OrgRowCard'
import { OrgSearchBox } from '@/components/organizations/OrgSearchBox'
import { OrgTypesCard, WhyFollowCard } from '@/components/organizations/OrgSidebar'
import { PendingInvitationsBanner } from '@/components/organizations/PendingInvitationsBanner'
import { useOrgsData } from '@/hooks/use-orgs-data'
import { useTranslationLang } from '@/hooks/use-translation-lang'
import { regionName } from '@/lib/countries'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'

const NO_ORGS: Organization[] = []
const NO_TYPES: OrgType[] = []
const PAGE_SIZE = 12
const ALL = '__all__'
const featuredSlide = 'w-[85%] sm:w-[calc(50%-0.5rem)] xl:w-[calc(33.333%-0.7rem)]'

const oneOf = <T extends string>(value: string | null, allowed: readonly T[], fallback: T): T =>
  allowed.includes(value as T) ? (value as T) : fallback

export function OrganizationsPage() {
  const { t } = useTranslation()
  const lang = useTranslationLang()
  const [params, setParams] = useSearchParams()
  const [createOpen, setCreateOpen] = useState(false)
  const listRef = useRef<HTMLElement>(null)

  const { orgs, types, projects, stats } = useOrgsData()
  const { data: countriesRaw = [] } = useQuery({ queryKey: ['project-countries'], queryFn: projectsApi.countries })

  const filters: OrgFilters = {
    search: params.get('search') ?? '',
    type: params.get('type') ?? '',
    country: params.get('country') ?? '',
    activity: oneOf(params.get('activity'), ORG_ACTIVITY_VALUES, DEFAULT_ORG_FILTERS.activity),
    mine: params.get('mine') === '1',
    sort: oneOf(params.get('sort'), ORG_SORT_VALUES, DEFAULT_ORG_FILTERS.sort),
  }
  const [searchText, setSearchText] = useState(filters.search)

  const setFilter = (patch: Partial<OrgFilters>) => {
    const next = { ...filters, ...patch }
    const out = new URLSearchParams()
    for (const key of Object.keys(next) as (keyof OrgFilters)[]) {
      if (next[key] === DEFAULT_ORG_FILTERS[key]) continue
      out.set(key, next[key] === true ? '1' : String(next[key]))
    }
    setParams(out, { replace: true })
  }

  const clearFilters = () => {
    setSearchText('')
    setParams({}, { replace: true })
  }

  const allOrgs = orgs.data ?? NO_ORGS
  const types_ = types.data ?? NO_TYPES
  const isFiltered = (Object.keys(DEFAULT_ORG_FILTERS) as (keyof OrgFilters)[]).some(
    (k) => k !== 'sort' && filters[k] !== DEFAULT_ORG_FILTERS[k],
  )

  const setPage = (n: number) => {
    const out = new URLSearchParams(params)
    if (n <= 1) out.delete('page')
    else out.set('page', String(n))
    setParams(out, { replace: true })
    listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const results = useMemo(
    () => sortOrgs(filterOrgs(allOrgs, filters, stats), filters.sort, stats),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allOrgs, params, stats],
  )
  // Featured only on the unfiltered view, so it never contradicts what the filters say.
  const featured = useMemo(() => (isFiltered ? [] : featuredOrgs(allOrgs, stats)), [isFiltered, allOrgs, stats])
  const pageCount = Math.max(1, Math.ceil(results.length / PAGE_SIZE))
  const page = Math.min(Math.max(1, Number(params.get('page')) || 1), pageCount)
  const counts = useMemo(() => typeCounts(allOrgs, types_), [allOrgs, types_])

  // Counters need the project list; wait for it so cards don't show «0 projects» and then jump.
  const loading = orgs.isLoading || projects.isLoading
  const failed = orgs.isError

  const sortLabels: Record<OrgFilters['sort'], string> = {
    relevant: t('orgSortRelevant'),
    projects: t('orgSortProjects'),
    name: t('orgSortName'),
  }
  const trigger = 'w-auto min-w-32 bg-background'

  return (
    <div className="h-full overflow-y-auto">
      <PageHero
        title={t('orgPageTitle')}
        subtitle={t('orgPageSubtitle')}
        action={
          <Button size="lg" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-5 w-5" />{t('newOrg')}
          </Button>
        }
      >
        <OrgSearchBox
          value={searchText}
          onValueChange={setSearchText}
          onSubmit={(q) => setFilter({ search: q })}
          placeholder={t('orgSearchPlaceholder')}
          orgs={allOrgs}
          types={types_}
        />
      </PageHero>

      <div className="max-w-[100rem] space-y-6 px-4 py-5 md:px-8">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={filters.type || ALL} onValueChange={(v) => setFilter({ type: v === ALL ? '' : v })}>
            <SelectTrigger className={trigger} aria-label={t('orgFilterType')}>
              <Layers className="mr-1.5 h-4 w-4 text-muted-foreground" /><SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t('orgFilterType')}</SelectItem>
              {types_.map((ty) => <SelectItem key={ty.id} value={String(ty.id)}>{ty.type}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filters.country || ALL} onValueChange={(v) => setFilter({ country: v === ALL ? '' : v })}>
            <SelectTrigger className={trigger} aria-label={t('country')}>
              <MapPin className="mr-1.5 h-4 w-4 text-muted-foreground" /><SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t('country')}</SelectItem>
              {countriesRaw.map((c) => <SelectItem key={c.country} value={c.country}>{regionName(c.country, lang)}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filters.activity} onValueChange={(v) => setFilter({ activity: v as OrgFilters['activity'] })}>
            <SelectTrigger className={trigger} aria-label={t('orgFilterActivity')}>
              <CircleDot className={cn('mr-1.5 h-4 w-4', filters.activity === 'active' ? 'text-green-500' : 'text-muted-foreground')} />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">{t('orgActivityActive')}</SelectItem>
              <SelectItem value="all">{t('orgActivityAll')}</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant={filters.mine ? 'default' : 'outline'}
            aria-pressed={filters.mine}
            onClick={() => setFilter({ mine: !filters.mine })}
            className={cn('font-normal', !filters.mine && 'bg-background')}
          >
            <User className="mr-1.5 h-4 w-4" />{t('orgOnlyMine')}
          </Button>

          {isFiltered && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-primary">
              <RotateCcw className="mr-1.5 h-4 w-4" />{t('exploreClearFilters')}
            </Button>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_21rem]">
          <div className="min-w-0 space-y-10">
            <PendingInvitationsBanner />

            {failed ? (
              <p className="py-10 text-center text-muted-foreground">{t('homeSectionError')}</p>
            ) : loading ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-hidden>
                {Array.from({ length: 6 }, (_, i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />)}
              </div>
            ) : (
              <>
                {featured.length > 0 && (
                  <section>
                    <div className="mb-4 flex items-end justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-bold tracking-tight md:text-2xl">{t('orgFeaturedTitle')}</h2>
                        <p className="text-sm text-muted-foreground">{t('orgFeaturedSubtitle')}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                        className="shrink-0 text-sm font-medium text-primary hover:underline"
                      >
                        {t('orgSeeAll')} →
                      </button>
                    </div>
                    <ProjectSlider slideClassName={featuredSlide}>
                      {featured.slice(0, FEATURED_LIMIT).map((o) => (
                        <FeaturedOrgCard key={o.id} org={o} stats={orgStatsOf(stats, o)} types={types_} />
                      ))}
                    </ProjectSlider>
                  </section>
                )}

                <section ref={listRef} className="scroll-mt-4">
                  <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold tracking-tight md:text-2xl">{t('orgAllTitle')}</h2>
                      <p className="text-sm text-muted-foreground">
                        {t('orgAllSubtitle')} · {t('orgCount', { count: results.length })}
                      </p>
                    </div>
                    <Select value={filters.sort} onValueChange={(v) => setFilter({ sort: v as OrgFilters['sort'] })}>
                      <SelectTrigger className="w-auto min-w-40 border-0 bg-transparent text-primary shadow-none" aria-label={t('exploreSortBy')}>
                        <ArrowUpDown className="mr-1.5 h-4 w-4" />
                        <span className="truncate">{sortLabels[filters.sort]}</span>
                      </SelectTrigger>
                      <SelectContent>
                        {ORG_SORT_VALUES.map((s) => <SelectItem key={s} value={s}>{sortLabels[s]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {results.length === 0 ? (
                    <div className="space-y-3 py-12 text-center">
                      <Building2 className="mx-auto h-10 w-10 text-muted-foreground/40" />
                      <p className="text-muted-foreground">{t('noResults')}</p>
                      {isFiltered && <Button variant="outline" onClick={clearFilters}>{t('exploreClearFilters')}</Button>}
                    </div>
                  ) : (
                    <>
                      <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                        {results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((o) => (
                          <OrgRowCard key={o.id} org={o} stats={orgStatsOf(stats, o)} types={types_} />
                        ))}
                      </div>
                      <Pagination page={page} pageCount={pageCount} onChange={setPage} />
                    </>
                  )}
                </section>
              </>
            )}
          </div>

          <aside className="space-y-4">
            <WhyFollowCard />
            <OrgTypesCard counts={counts} selected={filters.type} onSelect={(id) => setFilter({ type: id })} />
          </aside>
        </div>
      </div>

      <CreateOrgDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
