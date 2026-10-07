import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ArrowUpDown, Lock, MapPin, RotateCcw, Layers, CircleDot } from 'lucide-react'
import { projectsApi } from '@/api/projects'
import {
  ACCESS_VALUES, DEFAULT_FILTERS, SORT_VALUES, STATUS_VALUES,
  filterProjects, sortProjects, type ExploreFilters,
} from '@/api/explore'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHero } from '@/components/shared/PageHero'
import { ProjectSearchBox } from '@/components/shared/ProjectSearchBox'
import { ExploreProjectCard } from '@/components/home/ExploreProjectCard'
import { useAllProjects } from '@/hooks/use-all-projects'
import { useTranslationLang } from '@/hooks/use-translation-lang'
import { countryName } from '@/lib/countries'

const PAGE_SIZE = 12
const ALL = '__all__'

const oneOf = <T extends string>(value: string | null, allowed: readonly T[], fallback: T): T =>
  allowed.includes(value as T) ? (value as T) : fallback

export function ExplorePage() {
  const { t } = useTranslation()
  const lang = useTranslationLang()
  const [params, setParams] = useSearchParams()
  const [visible, setVisible] = useState(PAGE_SIZE)

  // Filters live in the URL so a filtered view can be shared and survives going back.
  const filters: ExploreFilters = {
    search: params.get('search') ?? '',
    topic: params.get('topic') ?? '',
    country: params.get('country') ?? '',
    status: oneOf(params.get('status'), STATUS_VALUES, DEFAULT_FILTERS.status),
    access: oneOf(params.get('access'), ACCESS_VALUES, DEFAULT_FILTERS.access),
    sort: oneOf(params.get('sort'), SORT_VALUES, DEFAULT_FILTERS.sort),
  }
  // The box is edited freely; the URL only changes on submit.
  const [searchText, setSearchText] = useState(filters.search)

  const setFilter = (patch: Partial<ExploreFilters>) => {
    const next = { ...filters, ...patch }
    const out = new URLSearchParams()
    for (const key of Object.keys(next) as (keyof ExploreFilters)[]) {
      if (next[key] !== DEFAULT_FILTERS[key]) out.set(key, next[key])
    }
    setParams(out, { replace: true })
    setVisible(PAGE_SIZE)
  }

  const clearFilters = () => {
    setSearchText('')
    setParams({}, { replace: true })
    setVisible(PAGE_SIZE)
  }

  const { data: all, isLoading, isError } = useAllProjects()
  const { data: topics = [] } = useQuery({ queryKey: ['topics', lang], queryFn: projectsApi.topics })
  const { data: countriesRaw = [] } = useQuery({ queryKey: ['project-countries'], queryFn: projectsApi.countries })

  const results = useMemo(
    () => (all ? sortProjects(filterProjects(all, filters, lang, topics), filters.sort) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [all, params, lang, topics],
  )

  const isFiltered = (Object.keys(DEFAULT_FILTERS) as (keyof ExploreFilters)[]).some(
    (k) => filters[k] !== DEFAULT_FILTERS[k],
  )

  const trigger = 'w-auto min-w-32 bg-background'
  const sortLabels: Record<ExploreFilters['sort'], string> = {
    recommended: t('exploreSortRecommended'),
    last_observation: t('sortLastObservation'),
    created_at: t('sortCreatedAt'),
    observations: t('sortMostObservations'),
    likes: t('exploreSortLikes'),
  }

  return (
    <div className="h-full overflow-y-auto">
      <PageHero title={t('exploreTitle')} subtitle={t('exploreSubtitle')}>
        <ProjectSearchBox
          value={searchText}
          onValueChange={setSearchText}
          onSubmit={(q) => setFilter({ search: q })}
          placeholder={t('exploreSearchPlaceholder')}
        />
      </PageHero>

      <div className="px-4 md:px-8 py-5 max-w-[100rem] space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={filters.topic || ALL} onValueChange={(v) => setFilter({ topic: v === ALL ? '' : v })}>
            <SelectTrigger className={trigger} aria-label={t('exploreFilterTopic')}>
              <Layers className="h-4 w-4 mr-1.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t('exploreFilterTopic')}</SelectItem>
              {topics.map((topic) => (
                <SelectItem key={topic.id} value={String(topic.id)}>{topic.topic}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.country || ALL} onValueChange={(v) => setFilter({ country: v === ALL ? '' : v })}>
            <SelectTrigger className={trigger} aria-label={t('country')}>
              <MapPin className="h-4 w-4 mr-1.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t('country')}</SelectItem>
              {countriesRaw.map((c) => (
                <SelectItem key={c.country} value={c.country}>{countryName(c.country, lang)}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.status} onValueChange={(v) => setFilter({ status: v as ExploreFilters['status'] })}>
            <SelectTrigger className={trigger} aria-label={t('exploreFilterStatus')}>
              <CircleDot className={`h-4 w-4 mr-1.5 ${filters.status === 'active' ? 'text-green-500' : 'text-muted-foreground'}`} />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">{t('exploreStatusActive')}</SelectItem>
              <SelectItem value="ended">{t('exploreStatusEnded')}</SelectItem>
              <SelectItem value="all">{t('exploreStatusAll')}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.access} onValueChange={(v) => setFilter({ access: v as ExploreFilters['access'] })}>
            <SelectTrigger className={trigger} aria-label={t('exploreFilterAccess')}>
              <Lock className="h-4 w-4 mr-1.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('exploreAccessAll')}</SelectItem>
              <SelectItem value="public">{t('exploreAccessPublic')}</SelectItem>
              <SelectItem value="protected">{t('exploreAccessProtected')}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.sort} onValueChange={(v) => setFilter({ sort: v as ExploreFilters['sort'] })}>
            <SelectTrigger className={trigger} aria-label={t('exploreSortBy')}>
              <ArrowUpDown className="h-4 w-4 mr-1.5 text-muted-foreground" />
              <span className="truncate">{t('exploreSortBy')}: {sortLabels[filters.sort]}</span>
            </SelectTrigger>
            <SelectContent>
              {SORT_VALUES.map((s) => <SelectItem key={s} value={s}>{sortLabels[s]}</SelectItem>)}
            </SelectContent>
          </Select>

          {isFiltered && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-primary">
              <RotateCcw className="h-4 w-4 mr-1.5" />
              {t('exploreClearFilters')}
            </Button>
          )}
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{t('exploreShowing')}</span>
          {all && <span className="font-medium">{t('exploreProjectsCount', { count: results.length })}</span>}
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-hidden>
            {Array.from({ length: 8 }, (_, i) => <div key={i} className="h-64 rounded-xl bg-muted animate-pulse" />)}
          </div>
        ) : isError ? (
          <p className="py-10 text-center text-muted-foreground">{t('homeSectionError')}</p>
        ) : results.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <p className="text-muted-foreground">{t('noResults')}</p>
            {isFiltered && <Button variant="outline" onClick={clearFilters}>{t('exploreClearFilters')}</Button>}
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {results.slice(0, visible).map((p) => <ExploreProjectCard key={p.id} project={p} />)}
            </div>
            {visible < results.length && (
              <div className="flex justify-center pt-2 pb-6">
                <Button variant="outline" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
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
