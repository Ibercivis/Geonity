import { mediaUrl } from '@/lib/utils'
import type { Project } from '@/types'

export function projectCoverUrl(project: Project): string | null {
  const cover = project.cover
  if (!cover) return null
  if (typeof cover === 'string') return mediaUrl(cover)
  if (Array.isArray(cover)) return cover.length > 0 ? mediaUrl(cover[0].image) : null
  return mediaUrl(cover.image)
}

export function projectObservations(project: Project): number {
  return project.observation_count ?? project.contributions ?? 0
}

/** «hace 3 días» in the UI language. Null when there is no date. */
export function relativeTime(iso: string | null | undefined, lang: string): string | null {
  if (!iso) return null
  const seconds = (new Date(iso).getTime() - Date.now()) / 1000
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' })
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31_536_000], ['month', 2_592_000], ['week', 604_800], ['day', 86_400], ['hour', 3_600], ['minute', 60],
  ]
  for (const [unit, size] of steps) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit)
  }
  return rtf.format(0, 'second')
}
