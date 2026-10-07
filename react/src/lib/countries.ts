import countries from 'i18n-iso-countries'
import enLocale from 'i18n-iso-countries/langs/en.json'
import esLocale from 'i18n-iso-countries/langs/es.json'
import ptLocale from 'i18n-iso-countries/langs/pt.json'
import itLocale from 'i18n-iso-countries/langs/it.json'
import frLocale from 'i18n-iso-countries/langs/fr.json'
import deLocale from 'i18n-iso-countries/langs/de.json'
import nlLocale from 'i18n-iso-countries/langs/nl.json'

for (const locale of [enLocale, esLocale, ptLocale, itLocale, frLocale, deLocale, nlLocale]) {
  countries.registerLocale(locale)
}

/** Country name in the UI language; falls back to the ISO code if unknown. */
export function countryName(code: string, lang: string): string {
  return countries.getName(code, lang) ?? code
}

const EU_NAMES: Record<string, string> = {
  es: 'Unión Europea', en: 'European Union', pt: 'União Europeia', it: 'Unione Europea',
  fr: 'Union européenne', de: 'Europäische Union', nl: 'Europese Unie',
}

/** Like `countryName`, but also knows «EU», which organizations use and ISO 3166 doesn't list. */
export function regionName(code: string, lang: string): string {
  return code.toUpperCase() === 'EU' ? (EU_NAMES[lang] ?? EU_NAMES.en) : countryName(code, lang)
}
