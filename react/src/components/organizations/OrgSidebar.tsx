import { useTranslation } from 'react-i18next'
import { Bell, ChevronRight, Layers, Search, ShieldCheck, Star, type LucideIcon } from 'lucide-react'
import type { OrgType } from '@/api/organizations'
import { typeIcon } from './org-meta'
import { cn } from '@/lib/utils'

const REASONS: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Search, title: 'orgWhyDiscoverTitle', text: 'orgWhyDiscoverText' },
  { icon: ShieldCheck, title: 'orgWhyTrustTitle', text: 'orgWhyTrustText' },
  { icon: Bell, title: 'orgWhyActivityTitle', text: 'orgWhyActivityText' },
]

/** Informational only: following organizations isn't a feature yet. */
export function WhyFollowCard() {
  const { t } = useTranslation()
  return (
    <div className="space-y-4 rounded-xl border bg-blue-50/60 p-4">
      <h2 className="flex items-center gap-3 font-semibold">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-background text-primary shadow-sm">
          <Star className="h-5 w-5" />
        </span>
        {t('orgWhyTitle')}
      </h2>
      <ul className="space-y-3">
        {REASONS.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background text-primary shadow-sm">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold">{t(title)}</p>
              <p className="text-sm text-muted-foreground">{t(text)}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

interface OrgTypesCardProps {
  counts: { type: OrgType; count: number }[]
  selected: string
  onSelect: (typeId: string) => void
}

export function OrgTypesCard({ counts, selected, onSelect }: OrgTypesCardProps) {
  const { t } = useTranslation()
  if (counts.length === 0) return null
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <h2 className="mb-3 flex items-center gap-3 font-semibold">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Layers className="h-5 w-5" />
        </span>
        {t('orgTypesTitle')}
      </h2>
      <ul className="space-y-1">
        {counts.map(({ type, count }) => {
          const Icon = typeIcon(type.type)
          const isSelected = selected === String(type.id)
          return (
            <li key={type.id}>
              <button
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelect(isSelected ? '' : String(type.id))}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent',
                  isSelected && 'bg-accent font-medium',
                )}
              >
                <Icon className="h-4 w-4 shrink-0 text-primary" />
                <span className="flex-1 truncate">{type.type}</span>
                <span className="tabular-nums text-muted-foreground">{count}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
