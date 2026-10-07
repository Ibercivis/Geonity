import { cn } from '@/lib/utils'

const MAX_TAGS = 2

/** Type labels («Académica», «Gubernamental»…). Shows up to two and a «+N» for the rest. */
export function OrgTypeTags({ names, className }: { names: string[]; className?: string }) {
  if (names.length === 0) return null
  const shown = names.slice(0, MAX_TAGS)
  const extra = names.length - shown.length
  const tag = 'rounded-full bg-blue-50 px-2.5 py-0.5 text-xs text-blue-700'
  return (
    <span className={cn('flex flex-wrap items-center gap-1', className)}>
      {shown.map((n) => <span key={n} className={tag}>{n}</span>)}
      {extra > 0 && <span className={cn(tag, 'bg-muted text-muted-foreground')} title={names.slice(MAX_TAGS).join(', ')}>+{extra}</span>}
    </span>
  )
}
