import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ArrowRight } from 'lucide-react'
import { loadContinue, loadImpact, loadManageSummary } from '@/api/home'
import { sortProjects } from '@/api/explore'
import { useAllProjects } from '@/hooks/use-all-projects'
import { Button } from '@/components/ui/button'
import { HomeHero } from '@/components/home/HomeHero'
import { ProjectSlider } from '@/components/home/ProjectSlider'
import { ContinueProjectCard } from '@/components/home/ContinueProjectCard'
import { DiscoverProjectCard } from '@/components/home/DiscoverProjectCard'
import { ManageCard } from '@/components/home/ManageCard'
import { ImpactCard } from '@/components/home/ImpactCard'

const DISCOVER_LIMIT = 20

function SectionHeader({ title, subtitle, action }: {
  title: string
  subtitle: string
  action?: { to: string; label: string }
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-xl md:text-2xl font-bold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {action && (
        <Link to={action.to} className="shrink-0 text-sm font-medium text-primary hover:underline inline-flex items-center gap-1">
          {action.label} <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  )
}

function SliderSkeleton({ slideClassName }: { slideClassName: string }) {
  return (
    <div className="flex gap-4 overflow-hidden" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={`h-56 shrink-0 rounded-xl bg-muted animate-pulse ${slideClassName}`} />
      ))}
    </div>
  )
}

export function HomePage() {
  const { t } = useTranslation()

  // Each of these uses its dedicated endpoint and falls back to the older ones until it is deployed (api/home.ts).
  const continueQuery = useQuery({ queryKey: ['home', 'continue'], queryFn: loadContinue })
  const manageQuery = useQuery({ queryKey: ['home', 'manage-summary'], queryFn: loadManageSummary })
  const impactQuery = useQuery({ queryKey: ['home', 'impact'], queryFn: loadImpact })
  // Same cached request as Explore and the search autocomplete.
  const discover = useAllProjects()

  const continueProjects = continueQuery.data
  const manage = manageQuery.data
  const impact = impactQuery.data
  // Don't repeat in «Discover» what is already shown under «Keep contributing».
  const discoverProjects = useMemo(() => {
    const mine = new Set(continueProjects?.map((p) => p.id))
    if (!discover.data) return undefined
    const candidates = discover.data.filter((p) => !p.draft && !mine.has(p.id))
    return sortProjects(candidates, 'recommended').slice(0, DISCOVER_LIMIT)
  }, [discover.data, continueProjects])

  const continueFailed = continueQuery.isError
  const continueSlide = 'w-[85%] sm:w-[calc(50%-0.5rem)] xl:w-[calc(33.333%-0.7rem)]'
  const discoverSlide = 'w-[75%] sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.7rem)] 2xl:w-[calc(25%-0.75rem)]'

  return (
    <div className="h-full overflow-y-auto">
      <HomeHero />
      <div className="px-4 md:px-8 py-6 md:py-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] max-w-[100rem]">
        <div className="space-y-10 min-w-0 lg:px-4">
          {!continueFailed && continueProjects?.length !== 0 && (
            <section>
              <SectionHeader title={t('homeContinueTitle')} subtitle={t('homeContinueSubtitle')} />
              {continueProjects ? (
                <ProjectSlider slideClassName={continueSlide}>
                  {continueProjects.map((p) => <ContinueProjectCard key={p.id} project={p} />)}
                </ProjectSlider>
              ) : (
                <SliderSkeleton slideClassName={continueSlide} />
              )}
            </section>
          )}
          {!continueFailed && continueProjects?.length === 0 && (
            <section className="rounded-xl border border-dashed p-6 text-center space-y-3">
              <p className="text-muted-foreground">{t('homeEmptyContinue')}</p>
              <Button asChild><Link to="/explorar">{t('homeExploreCta')}</Link></Button>
            </section>
          )}

          <section>
            <SectionHeader
              title={t('homeDiscoverTitle')}
              subtitle={t('homeDiscoverSubtitle')}
              action={{ to: '/explorar', label: t('homeSeeAllProjects') }}
            />
            {discover.isError ? (
              <p className="text-sm text-muted-foreground">{t('homeSectionError')}</p>
            ) : discoverProjects && discover.data ? (
              <ProjectSlider slideClassName={discoverSlide}>
                {discoverProjects.map((p) => <DiscoverProjectCard key={p.id} project={p} />)}
              </ProjectSlider>
            ) : (
              <SliderSkeleton slideClassName={discoverSlide} />
            )}
          </section>
        </div>

        <aside className="space-y-4 lg:pt-1">
          <ManageCard summary={manage} />
          <ImpactCard impact={impact} />
        </aside>
      </div>
    </div>
  )
}
