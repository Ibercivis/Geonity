import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { SUPPORTED_LANGS, DEFAULT_LANG, type SupportedLang } from '@/lib/languages'
import en from '@/locales/en.json'
import es from '@/locales/es.json'
import pt from '@/locales/pt.json'
import it from '@/locales/it.json'
import fr from '@/locales/fr.json'
import de from '@/locales/de.json'
import nl from '@/locales/nl.json'

const translations: Record<SupportedLang, Record<string, string>> = { en, es, pt, it, fr, de, nl }

const resources = Object.fromEntries(
  SUPPORTED_LANGS.map((lang) => [lang, { translation: translations[lang] }]),
)

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: DEFAULT_LANG,
    supportedLngs: [...SUPPORTED_LANGS],
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    interpolation: { escapeValue: false },
  })

export default i18n
