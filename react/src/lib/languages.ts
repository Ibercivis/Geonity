/**
 * Single source of truth for the UI languages the app supports.
 *
 * To add a language: add its code here, its label in LANGUAGE_LABELS,
 * a `src/locales/<code>.json` file (registered in `src/lib/i18n.ts`) and
 * the matching `i18n-iso-countries` locale in `country-select.tsx`.
 */
export const SUPPORTED_LANGS = ['en', 'es', 'pt', 'it', 'fr', 'de', 'nl'] as const

export type SupportedLang = (typeof SUPPORTED_LANGS)[number]

export const DEFAULT_LANG: SupportedLang = 'en'

/** Native name of each language, for pickers and selects. */
export const LANGUAGE_LABELS: Record<SupportedLang, string> = {
  en: 'English',
  es: 'Español',
  pt: 'Português',
  it: 'Italiano',
  fr: 'Français',
  de: 'Deutsch',
  nl: 'Nederlands',
}

export function isSupportedLang(lang: string): lang is SupportedLang {
  return (SUPPORTED_LANGS as readonly string[]).includes(lang)
}

/**
 * Normalises any language tag (`'es-ES'`, `'pt-BR'`, `undefined`…) to one of
 * SUPPORTED_LANGS, falling back to DEFAULT_LANG.
 */
export function toSupportedLang(lang?: string | null): SupportedLang {
  const base = lang?.split('-')[0]?.toLowerCase() ?? ''
  return isSupportedLang(base) ? base : DEFAULT_LANG
}

/** Tabs of a localized content field: the neutral default value plus one per supported language. */
export const LOCALIZED_LANGS = ['default', ...SUPPORTED_LANGS] as const

export type LocalizedLang = (typeof LOCALIZED_LANGS)[number]
