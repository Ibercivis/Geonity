import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Building2, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslationLang } from '@/hooks/use-translation-lang'
import { mediaUrl } from '@/lib/utils'
import { orgName, type OrgStats } from '@/api/orgExplore'
import type { OrgType } from '@/api/organizations'
import type { Organization } from '@/types'
import { orgCountryLabel, orgTypeNames } from './org-meta'
import { OrgTypeTags } from './OrgTypeTags'
import { OrgStatsLine } from './OrgStatsLine'

export function OrgRowCard({ org, stats, types }: { org: Organization; stats: OrgStats; types: OrgType[] }) {
  const { t } = useTranslation()
  const lang = useTranslationLang()
  const logo = org.logo ? mediaUrl(org.logo) : null
  const typeNames = orgTypeNames(org, types)
  const country = orgCountryLabel(org, lang, t('orgGlobal'))

  return (
    <div className="flex h-full items-center gap-3 rounded-xl border bg-card p-3 shadow-sm">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-background">
        {logo ? <img src={logo} alt="" loading="lazy" className="h-full w-full object-contain p-1" /> : <Building2 className="h-7 w-7 text-muted-foreground" />}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <h3 className="truncate font-semibold leading-tight">{orgName(org)}</h3>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <OrgTypeTags names={typeNames} />
          {country && (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />{country}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <OrgStatsLine stats={stats} className="text-xs" />
          <Button asChild variant="outline" size="sm" className="h-7 text-primary">
            <Link to={`/organizations/${org.id}`}>{t('orgViewProfile')} <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
