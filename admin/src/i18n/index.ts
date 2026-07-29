import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import { de } from './locales/de'
import { en } from './locales/en'
import { es } from './locales/es'
import { fr } from './locales/fr'
import { it } from './locales/it'
import { pt } from './locales/pt'

export const LANGUAGES = ['es', 'en', 'it', 'fr', 'pt', 'de'] as const
export type Language = (typeof LANGUAGES)[number]

const STORAGE_KEY = 'geonity.lang'

function getSavedLanguage(): Language {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && (LANGUAGES as readonly string[]).includes(saved)) return saved as Language
  } catch {
    // ignore
  }
  return 'es'
}

export function setLanguage(lang: Language): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    // ignore
  }
  void i18n.changeLanguage(lang)
}

/** Maps i18n language codes to BCP-47 locale strings for Intl / toLocaleString */
export const LOCALE_MAP: Record<Language, string> = {
  es: 'es-ES',
  en: 'en-US',
  it: 'it-IT',
  fr: 'fr-FR',
  pt: 'pt-PT',
  de: 'de-DE',
}

void i18n.use(initReactI18next).init({
  resources: {
    es: { translation: es },
    en: { translation: en },
    it: { translation: it },
    fr: { translation: fr },
    pt: { translation: pt },
    de: { translation: de },
  },
  lng: getSavedLanguage(),
  fallbackLng: 'es',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
