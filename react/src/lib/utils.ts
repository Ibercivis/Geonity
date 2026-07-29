import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { LocalizedString, MultiLang } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Resolve a multilingual field from the backend to the current language string.
 *  Handles: plain string, parsed object, or JSON-encoded string like '{"es":"...","default":"..."}' */
export function resolveLocalized(value: LocalizedString, lang: string): string {
  if (!value) return ''

  let dict: MultiLang | null = null

  if (typeof value === 'string') {
    // Try to parse as JSON object
    const trimmed = value.trim()
    if (trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed)
        if (parsed && typeof parsed === 'object') dict = parsed as MultiLang
      } catch {
        // Not JSON — plain string
      }
    }
    if (!dict) return value
  } else {
    dict = value as MultiLang
  }

  const shortLang = lang.slice(0, 2)
  return (
    dict[shortLang] ??
    dict[lang] ??
    dict['en'] ??
    dict['es'] ??
    dict['default'] ??
    Object.values(dict).find((v) => v) ??
    ''
  )
}

/** Parse WKT geoposition "POINT (lon lat)" → [lon, lat] */
export function parseGeoposition(geo: string): [number, number] | null {
  if (!geo) return null
  const match = geo.match(/POINT\s*\(([^)]+)\)/)
  if (!match) return null
  const [lon, lat] = match[1].split(' ').map(Number)
  return [lon, lat]
}

const MEDIA_BASE = import.meta.env.VITE_MEDIA_URL as string
const PROD_MEDIA_ORIGIN = 'http://geonity.ibercivis.es:10003'

/** Build full media URL, rewriting absolute backend URLs through the dev proxy */
export function mediaUrl(path: string | null | undefined): string {
  if (!path) return ''
  // If it's an absolute URL pointing to the backend origin, rewrite through proxy
  if (path.startsWith(PROD_MEDIA_ORIGIN)) {
    return path.replace(PROD_MEDIA_ORIGIN, MEDIA_BASE)
  }
  // Already a full URL to somewhere else (e.g. production https)
  if (path.startsWith('http')) return path
  // Relative path
  return `${MEDIA_BASE}${path.startsWith('/') ? '' : '/'}${path}`
}
