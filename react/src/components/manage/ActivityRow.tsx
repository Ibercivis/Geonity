import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { KNOWN_ACTIVITY_TYPES, type ActivityItem } from '@/api/activity'
import { mediaUrl } from '@/lib/utils'
import { useTranslationLang } from '@/hooks/use-translation-lang'
import { relativeTime } from '@/components/home/project-utils'

const isKnown = (type: string) => (KNOWN_ACTIVITY_TYPES as readonly string[]).includes(type)

export function ActivityRow({ item }: { item: ActivityItem }) {
  const { t } = useTranslation()
  const lang = useTranslationLang()
  const cover = item.project.cover_thumb ? mediaUrl(item.project.cover_thumb) : null

  const actor = item.actor ? (item.actor.is_me ? t('activityYou') : item.actor.name) : t('activityAnonymous')
  // Unknown types (added by the server later) get a generic label instead of breaking the list.
  const title = isKnown(item.type)
    ? t(`activityType_${item.type}`, { count: item.meta?.count ?? 1 })
    : t('activityType_unknown')

  return (
    <li>
      <Link
        to={`/projects/${item.project.id}`}
        className="flex items-center gap-3 rounded-lg px-1 py-2 hover:bg-accent/50 transition-colors"
      >
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
          {cover && <img src={cover} alt="" loading="lazy" className="h-full w-full object-cover" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{title}</p>
          <p className="truncate text-xs text-muted-foreground">{actor} · {item.project.name}</p>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">{relativeTime(item.created_at, lang)}</span>
      </Link>
    </li>
  )
}
