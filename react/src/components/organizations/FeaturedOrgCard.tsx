import { Link } from 'react-router-dom'
import { Building2 } from 'lucide-react'
import { mediaUrl } from '@/lib/utils'
import { orgDescriptionText, orgName, type OrgStats } from '@/api/orgExplore'
import type { OrgType } from '@/api/organizations'
import type { Organization } from '@/types'
import { orgTypeNames } from './org-meta'
import { OrgTypeTags } from './OrgTypeTags'
import { OrgStatsLine } from './OrgStatsLine'

export function FeaturedOrgCard({ org, stats, types }: { org: Organization; stats: OrgStats; types: OrgType[] }) {
  const cover = org.cover ? mediaUrl(org.cover) : null
  const logo = org.logo ? mediaUrl(org.logo) : null
  const typeNames = orgTypeNames(org, types)
  const description = orgDescriptionText(org)

  return (
    <Link
      to={`/organizations/${org.id}`}
      className="block h-full overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative h-28 bg-gradient-to-br from-sky-100 to-blue-200">
        {cover && <img src={cover} alt="" loading="lazy" className="h-full w-full object-cover" />}
        <div className="absolute -bottom-6 left-4 flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border bg-background shadow">
          {logo ? <img src={logo} alt="" className="h-full w-full object-contain p-1" /> : <Building2 className="h-6 w-6 text-muted-foreground" />}
        </div>
      </div>
      <div className="space-y-2 p-4 pt-9">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight line-clamp-2">{orgName(org)}</h3>
        </div>
        <OrgTypeTags names={typeNames} />
        <p className="line-clamp-2 min-h-10 text-sm text-muted-foreground">{description}</p>
        <OrgStatsLine stats={stats} className="pt-1 text-sm" />
      </div>
    </Link>
  )
}
